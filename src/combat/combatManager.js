import { COMBAT_SKILLS, PLAYER_COMBAT_SKILLS } from '../data/combatSkills.js'
import { ENEMY_TEMPLATES } from '../data/enemyTemplates.js'
import { createEnemyCombatant, createPlayerCombatant } from './combatant.js'
import { chooseInitiativeAttribute, selectEnemyAction } from './enemyDecisionSystem.js'
import { compareOpeningInitiative, orderFirstRoundActions, resolveInitiative as buildInitiativeQueue } from './initiativeSystem.js'
import { COMBAT_ERROR, COMBAT_INITIATOR, COMBAT_PHASE, COMBAT_RESULT, COMBAT_STATUS, INITIATIVE_ATTRIBUTES } from './combatConstants.js'
import { DiceService } from './diceService.js'
import { resolveDamage } from './damageResolver.js'
import { applyDamage } from './damageApplication.js'
import { resolveBlock } from './blockResolver.js'
import { isWeaponSkillAvailable, resolveHitCheck, resolveWeaponRequirements } from './weaponRequirementResolver.js'
import { calculateCharacterStats } from '../character/characterStatCalculator.js'

const success = (data = {}) => ({ ok: true, ...data })
const failure = (error, details = {}) => ({ ok: false, error, ...details })
let combatSequence = 0

export class CombatManager {
  constructor({ skillCatalog = COMBAT_SKILLS, enemyTemplates = ENEMY_TEMPLATES, diceService = new DiceService(), statCalculator = calculateCharacterStats, practiceGainService = null } = {}) {
    this.skillCatalog = skillCatalog
    this.enemyTemplates = enemyTemplates
    this.diceService = diceService
    this.statCalculator = statCalculator
    this.practiceGainService = practiceGainService
    this.characterRef = null
    this.activeCombat = null
    this.lastCombat = null
    this.listeners = new Set()
  }

  subscribe(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener) }
  notify() { for (const listener of this.listeners) listener(this.getSnapshot()) }
  getSnapshot() {
    return {
      activeCombat: this.activeCombat ? { ...this.activeCombat } : null,
      lastCombat: this.lastCombat ? { ...this.lastCombat } : null,
      worldBlocked: Boolean(this.activeCombat?.worldBlocked),
    }
  }

  addLog(type, text, data = {}) {
    const state = this.activeCombat
    const order = state.log.length + 1
    state.log.push({ id: `${state.id}:log:${order}`, type, round: state.round, order, actor: data.combatantId ?? null, data, text })
  }

  requirePhase(phase) {
    if (!this.activeCombat) return failure(COMBAT_ERROR.NO_ACTIVE_COMBAT)
    if (this.activeCombat.phase !== phase) return failure(COMBAT_ERROR.INVALID_PHASE, { expected: phase, actual: this.activeCombat.phase })
    return success()
  }

  startCombat({ character, enemyTemplateId = 'grey_wolf', initiator = COMBAT_INITIATOR.PLAYER, source = { type: 'developer', id: 'test-combat' }, preparationModifiers = null }) {
    if (this.activeCombat) return failure(COMBAT_ERROR.COMBAT_ALREADY_ACTIVE)
    if (!Object.values(COMBAT_INITIATOR).includes(initiator)) return failure(COMBAT_ERROR.INVALID_INITIATOR)
    const template = this.enemyTemplates[enemyTemplateId]
    if (!template) return failure(COMBAT_ERROR.INVALID_COMBATANT)
    combatSequence += 1
    const id = `combat-${combatSequence}`
    const calculatedCharacter = this.statCalculator(character)
    this.characterRef = character
    const weaponRequirements = resolveWeaponRequirements({ ...character, stats: calculatedCharacter.finalStats }, calculatedCharacter.equippedWeapon)
    const configuredSkillIds = character.startingSkills?.length ? character.startingSkills : PLAYER_COMBAT_SKILLS.map((skill) => skill.id)
    const playerSkills = configuredSkillIds.map((skillId) => this.skillCatalog[skillId]).filter(Boolean)
      .filter((skill) => isWeaponSkillAvailable(skill, weaponRequirements))
    const player = createPlayerCombatant(character, playerSkills, weaponRequirements, calculatedCharacter)
    const enemy = createEnemyCombatant(template, `${id}:enemy:1`, this.skillCatalog)
    this.activeCombat = {
      id, status: COMBAT_STATUS.PREPARING, round: 1, phase: COMBAT_PHASE.SETUP,
      player, enemies: [enemy], playerSelection: null, enemySelections: [], initiativeQueue: [],
      initiator, initiativeAttribute: null, initiativeWinner: null, initiativeComparison: null,
      openingInitiativeApplied: false, openingInitiativeModifiers: { player: preparationModifiers?.playerInitiativeModifier ?? 0, enemy: preparationModifiers?.enemyInitiativeModifier ?? 0 }, lastAction: null, enemyAiDebug: [], log: [], result: null, source: { ...source }, worldBlocked: true,
    }
    this.addLog('combat_started', 'Combat started.')
    this.addLog('combat_initiated', `${initiator === COMBAT_INITIATOR.PLAYER ? player.name : enemy.name} initiated combat.`, { initiator })
    this.activeCombat.status = COMBAT_STATUS.ACTIVE
    if (initiator === COMBAT_INITIATOR.ENEMY) {
      this.resolveOpeningInitiative(chooseInitiativeAttribute(enemy))
    } else {
      this.activeCombat.phase = COMBAT_PHASE.INITIATIVE_SELECTION
    }
    this.notify()
    return success({ combat: this.activeCombat })
  }

  selectInitiativeAttribute(attribute) {
    const phase = this.requirePhase(COMBAT_PHASE.INITIATIVE_SELECTION)
    if (!phase.ok) return phase
    if (!INITIATIVE_ATTRIBUTES.includes(attribute)) return failure(COMBAT_ERROR.INVALID_INITIATIVE_ATTRIBUTE)
    return this.resolveOpeningInitiative(attribute)
  }

  resolveOpeningInitiative(attribute) {
    const state = this.activeCombat
    const enemy = state.enemies[0]
    const baseComparison = compareOpeningInitiative({ player: state.player, enemy, attribute, initiator: state.initiator })
    const playerValue = baseComparison.playerValue + state.openingInitiativeModifiers.player
    const enemyValue = baseComparison.enemyValue + state.openingInitiativeModifiers.enemy
    const comparison = { ...baseComparison, playerValue, enemyValue, winner: playerValue === enemyValue ? state.initiator : playerValue > enemyValue ? COMBAT_INITIATOR.PLAYER : COMBAT_INITIATOR.ENEMY }
    state.initiativeAttribute = attribute
    state.initiativeWinner = comparison.winner
    state.initiativeComparison = { player: comparison.playerValue, enemy: comparison.enemyValue }
    const selector = state.initiator === COMBAT_INITIATOR.PLAYER ? state.player : enemy
    const winner = comparison.winner === COMBAT_INITIATOR.PLAYER ? state.player : enemy
    const label = attribute.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase())
    this.addLog('initiative_attribute_selected', `${selector.name} selected ${label}.`, { attribute })
    this.addLog('initiative_compared', `${state.player.name} ${label}: ${comparison.playerValue}`, { combatantId: state.player.id, attribute, value: comparison.playerValue })
    this.addLog('initiative_compared', `${enemy.name} ${label}: ${comparison.enemyValue}`, { combatantId: enemy.id, attribute, value: comparison.enemyValue })
    this.addLog('opening_initiative_resolved', `${winner.name} acts first.`, { winner: comparison.winner, attribute })
    state.phase = COMBAT_PHASE.PLAYER_SELECTION
    this.addLog('round_started', 'Round 1 started.')
    this.prepareEnemyIntent()
    this.notify()
    return success({ comparison, winner: comparison.winner })
  }

  prepareEnemyIntent() {
    const state = this.activeCombat
    if (!state || state.phase !== COMBAT_PHASE.PLAYER_SELECTION) return failure(COMBAT_ERROR.INVALID_PHASE)
    state.enemySelections = state.enemies.map((enemy) => selectEnemyAction(enemy, state.player, this.diceService.random, { round: state.round })).filter(Boolean)
    state.enemyAiDebug = state.enemySelections.map((selection) => ({ combatantId: selection.combatantId, ...selection.aiDecision }))
    for (const selection of state.enemySelections) {
      const enemy = state.enemies.find((item) => item.id === selection.combatantId)
      this.addLog('enemy_ai_selected', `Enemy AI selected: ${selection.skill.name}. Reason: ${selection.aiDecision.reason}`, {
        combatantId: enemy.id, skillId: selection.skillId, ...selection.aiDecision,
      })
      this.addLog('enemy_intent', `${enemy.name} prepares ${selection.skill.name}.`, {
        combatantId: enemy.id, skillId: selection.skillId, initiative: selection.skill.initiative, usedStat: selection.skill.usedStat,
      })
    }
    return success({ selections: state.enemySelections })
  }

  selectPlayerSkill(skillId) {
    const phase = this.requirePhase(COMBAT_PHASE.PLAYER_SELECTION)
    if (!phase.ok) return phase
    const skill = this.activeCombat.player.skills.find((item) => item.id === skillId && item.available)
    if (!skill) return failure(COMBAT_ERROR.INVALID_SKILL)
    this.activeCombat.initiativeQueue = []
    const targetIds = skill.actionType === 'guard' ? [this.activeCombat.player.id] : [this.activeCombat.enemies[0].id]
    this.activeCombat.playerSelection = { combatantId: this.activeCombat.player.id, skillId, skill, targetIds }
    this.addLog('player_selection', `Player selected ${skill.name}.`, { skillId })
    this.activeCombat.phase = COMBAT_PHASE.ENEMY_SELECTION
    this.notify()
    return success({ selection: this.activeCombat.playerSelection })
  }

  resolveEnemySelection() {
    const phase = this.requirePhase(COMBAT_PHASE.ENEMY_SELECTION)
    if (!phase.ok) return phase
    if (this.activeCombat.enemySelections.length === 0) {
      this.activeCombat.enemySelections = this.activeCombat.enemies.map((enemy) => selectEnemyAction(enemy, this.activeCombat.player, this.diceService.random, { round: this.activeCombat.round })).filter(Boolean)
    }
    for (const selection of this.activeCombat.enemySelections) {
      const enemy = this.activeCombat.enemies.find((item) => item.id === selection.combatantId)
      this.addLog('enemy_selection', `${enemy.name} commits to ${selection.skill.name}.`, { combatantId: enemy.id, skillId: selection.skillId })
    }
    this.activeCombat.phase = COMBAT_PHASE.INITIATIVE_RESOLUTION
    this.notify()
    return success({ selections: this.activeCombat.enemySelections })
  }

  resolveInitiative() {
    const phase = this.requirePhase(COMBAT_PHASE.INITIATIVE_RESOLUTION)
    if (!phase.ok) return phase
    const combatants = new Map([[this.activeCombat.player.id, this.activeCombat.player], ...this.activeCombat.enemies.map((enemy) => [enemy.id, enemy])])
    const actions = [this.activeCombat.playerSelection, ...this.activeCombat.enemySelections]
    this.activeCombat.initiativeQueue = this.activeCombat.round === 1 && !this.activeCombat.openingInitiativeApplied
      ? orderFirstRoundActions(actions, this.activeCombat.initiativeWinner, combatants)
      : buildInitiativeQueue(actions, combatants)
    if (this.activeCombat.round === 1) this.activeCombat.openingInitiativeApplied = true
    const first = combatants.get(this.activeCombat.initiativeQueue[0].combatantId)
    this.addLog('initiative_resolved', `${first.name} acts first.`, { queue: this.activeCombat.initiativeQueue.map((action) => action.combatantId) })
    this.activeCombat.phase = COMBAT_PHASE.ACTION_RESOLUTION
    this.notify()
    return success({ queue: this.activeCombat.initiativeQueue })
  }

  resolveActions() {
    const phase = this.requirePhase(COMBAT_PHASE.ACTION_RESOLUTION)
    if (!phase.ok) return phase
    const combatants = new Map([[this.activeCombat.player.id, this.activeCombat.player], ...this.activeCombat.enemies.map((enemy) => [enemy.id, enemy])])
    for (const action of this.activeCombat.initiativeQueue) {
      const actor = combatants.get(action.combatantId)
      if (!actor?.alive) continue
      const target = combatants.get(action.targetIds[0])
      if (!target?.alive) continue
      this.addLog('skill_used', `${actor.name} uses ${action.skill.name}.`, { combatantId: actor.id, actorType: actor.type, skillId: action.skillId, targetIds: action.targetIds })
      const actorSkill = actor.skills.find((skill) => skill.id === action.skillId)
      if (actorSkill?.cooldown > 0) actorSkill.remainingCooldown = actorSkill.cooldown
      if (action.skill.actionType === 'guard') {
        const roll = this.diceService.roll(action.skill.dice)
        const statValue = Number(actor.stats?.[action.skill.usedStat] ?? 0)
        const gainedBlock = statValue + roll
        const previousBlock = actor.currentBlock
        actor.currentBlock += gainedBlock
        this.addLog('dice_rolled', `Roll d${action.skill.dice} = ${roll}`, { combatantId: actor.id, skillId: action.skillId, die: action.skill.dice, roll })
        this.addLog('block_gained', `${actor.name} gains ${gainedBlock} Block.`, {
          combatantId: actor.id, targetName: actor.name, skillId: action.skillId, stat: action.skill.usedStat, statValue,
          die: action.skill.dice, roll, calculation: `${statValue} + ${roll} = ${gainedBlock}`,
          gainedBlock, previousBlock, currentBlock: actor.currentBlock,
        })
        this.activeCombat.lastAction = { actorId: actor.id, actorName: actor.name, skillId: action.skillId, skillName: action.skill.name, initiative: action.skill.initiative, die: action.skill.dice, roll, block: gainedBlock }
        continue
      }
      const requirements = actor.type === 'player' ? resolveWeaponRequirements(actor, actor.weapon) : resolveWeaponRequirements(actor, null)
      if (requirements.applies) {
        const hitCheck = resolveHitCheck(requirements, this.diceService.random)
        this.addLog('weapon_check', hitCheck.hit ? `${actor.name}'s attack hits.` : `${actor.name} misses due to insufficient proficiency.`, {
          combatantId: actor.id, ...requirements, hitRoll: hitCheck.roll, hit: hitCheck.hit, result: hitCheck.hit ? 'Hit' : 'Miss',
        })
        if (!hitCheck.hit) {
          this.addLog('attack_missed', 'Miss.', { combatantId: actor.id, actorName: actor.name, reason: hitCheck.reason })
          this.activeCombat.lastAction = { actorId: actor.id, actorName: actor.name, skillId: action.skillId, skillName: action.skill.name, missed: true }
          continue
        }
      }
      const resolved = resolveDamage({ actor, skill: action.skill, diceService: this.diceService, weapon: actor.weapon, damageMultiplier: requirements.damageMultiplier })
      if (actor.type === 'player' && actor.weapon?.requiredProficiency && this.practiceGainService) this.practiceGainService.processSuccessfulAction(this.characterRef, actor.weapon.requiredProficiency, { actionId: `${this.activeCombat.id}:round:${this.activeCombat.round}:action:${action.skillId}`, successful: true, context: { combatId: this.activeCombat.id, round: this.activeCombat.round, targetType: target.type } })
      this.addLog('dice_rolled', `Roll d${resolved.die} = ${resolved.roll}`, { combatantId: actor.id, skillId: action.skillId, die: resolved.die, roll: resolved.roll })
      this.addLog('damage_resolved', `Damage = ${resolved.damage}`, {
        combatantId: actor.id, actorName: actor.name, targetName: target.name, skillId: action.skillId, damage: resolved.damage, stat: resolved.stat,
        statValue: resolved.statValue, baseDamage: resolved.baseDamage, rawDamage: resolved.rawDamage,
        damageMultiplier: resolved.damageMultiplier, calculation: resolved.calculation,
      })
      const blocked = resolveBlock(target, resolved.damage)
      if (blocked.absorbed > 0) {
        this.addLog('block_absorbed', `Block absorbs ${blocked.absorbed} damage.`, {
          combatantId: target.id, targetName: target.name, ...blocked,
        })
      }
      const applied = applyDamage(target, blocked.remainingDamage)
      this.addLog('health_changed', `${target.name} HP: ${applied.previousHealth} → ${applied.currentHealth}`, {
        combatantId: actor.id, targetId: target.id, targetName: target.name, damage: blocked.remainingDamage,
        previousHealth: applied.previousHealth, currentHealth: applied.currentHealth,
      })
      this.activeCombat.lastAction = {
        actorId: actor.id, actorName: actor.name, targetId: target.id, targetName: target.name,
        skillId: action.skillId, skillName: action.skill.name, initiative: action.skill.initiative,
        die: resolved.die, roll: resolved.roll, damage: resolved.damage,
      }
      if (applied.defeated) {
        const result = target.type === 'enemy' ? COMBAT_RESULT.VICTORY : COMBAT_RESULT.DEFEAT
        this.activeCombat.status = result === COMBAT_RESULT.VICTORY ? COMBAT_STATUS.VICTORY : COMBAT_STATUS.DEFEAT
        this.activeCombat.phase = COMBAT_PHASE.COMBAT_END
        this.activeCombat.result = { type: result, round: this.activeCombat.round }
        this.addLog('combat_result', result === COMBAT_RESULT.VICTORY ? 'Victory.' : 'Defeat.', { result, defeatedId: target.id, defeatedName: target.name })
        this.notify()
        return success({ actions: this.activeCombat.initiativeQueue.length, combatEnded: true, result })
      }
    }
    this.activeCombat.phase = COMBAT_PHASE.ROUND_END
    this.notify()
    return success({ actions: this.activeCombat.initiativeQueue.length, combatEnded: false })
  }

  endRound() {
    const phase = this.requirePhase(COMBAT_PHASE.ROUND_END)
    if (!phase.ok) return phase
    this.addLog('round_ended', `Round ${this.activeCombat.round} ended.`)
    for (const combatant of [this.activeCombat.player, ...this.activeCombat.enemies]) {
      if (combatant.currentBlock > 0) {
        this.addLog('block_expired', `${combatant.name}'s remaining Block expires.`, { combatantId: combatant.id, expiredBlock: combatant.currentBlock })
        combatant.currentBlock = 0
      }
      for (const skill of combatant.skills) {
        if ((skill.remainingCooldown ?? 0) > 0) skill.remainingCooldown -= 1
      }
    }
    this.activeCombat.round += 1
    this.activeCombat.playerSelection = null
    this.activeCombat.enemySelections = []
    this.activeCombat.phase = COMBAT_PHASE.PLAYER_SELECTION
    this.addLog('round_started', `Round ${this.activeCombat.round} started.`)
    this.prepareEnemyIntent()
    this.notify()
    return success({ round: this.activeCombat.round })
  }

  finishCombat(result = COMBAT_RESULT.VICTORY) {
    if (!this.activeCombat) return failure(COMBAT_ERROR.NO_ACTIVE_COMBAT)
    const status = { victory: COMBAT_STATUS.VICTORY, defeat: COMBAT_STATUS.DEFEAT, escaped: COMBAT_STATUS.ESCAPED, cancelled: COMBAT_STATUS.CANCELLED }[result]
    if (!status) return failure(COMBAT_ERROR.COMBAT_ALREADY_FINISHED)
    this.activeCombat.phase = COMBAT_PHASE.COMBAT_END
    this.activeCombat.status = status
    this.activeCombat.result = { type: result, round: this.activeCombat.round }
    this.activeCombat.worldBlocked = false
    this.addLog('combat_finished', `Combat ended: ${result}.`, { result })
    const completed = this.activeCombat
    this.lastCombat = completed
    this.activeCombat = null
    this.notify()
    return success({ combat: completed, result: completed.result })
  }

  cancelCombat() { return this.finishCombat(COMBAT_RESULT.CANCELLED) }

  setPlayerBlock(value) {
    if (!this.activeCombat) return failure(COMBAT_ERROR.NO_ACTIVE_COMBAT)
    this.activeCombat.player.currentBlock = Math.max(0, Math.trunc(Number(value) || 0))
    this.notify()
    return success({ currentBlock: this.activeCombat.player.currentBlock })
  }
}
