import assert from 'node:assert/strict'
import test from 'node:test'
import { CombatManager } from '../src/combat/combatManager.js'
import { COMBAT_ERROR, COMBAT_INITIATOR, COMBAT_PHASE, COMBAT_RESULT, COMBAT_STATUS, COMBATANT_TYPE } from '../src/combat/combatConstants.js'
import { compareOpeningInitiative, resolveInitiative } from '../src/combat/initiativeSystem.js'
import { chooseInitiativeAttribute } from '../src/combat/chooseInitiativeAttribute.js'
import { PLAYER_GUARD, PLAYER_HEAVY_STRIKE, PLAYER_QUICK_STRIKE, PLAYER_STRIKE } from '../src/data/combatSkills.js'
import { createCharacterState } from '../src/game/characterState.js'
import { createNewRun } from '../src/game/gameState.js'
import { validateSave } from '../src/game/saveService.js'
import { DiceService } from '../src/combat/diceService.js'
import { resolveDamage } from '../src/combat/damageResolver.js'
import { applyDamage } from '../src/combat/damageApplication.js'
import { buildCombatFeed, buildDetailedCombatLog } from '../src/combat/combatLogPresenter.js'
import { resolveBlock } from '../src/combat/blockResolver.js'
import { PROFICIENCY_NAMES } from '../src/data/characterCreation.js'
import { WEAPONS } from '../src/data/weapons.js'

const threeStats = { might: 3, defense: 3, vitality: 3, agility: 3, magicPower: 3, wisdom: 3, perception: 3, luck: 3 }
const character = createCharacterState({ id: 'combat-hero', name: 'Hero', attributes: threeStats })
const start = () => {
  const manager = new CombatManager({ diceService: new DiceService(() => 0) })
  const result = manager.startCombat({ character, initiator: COMBAT_INITIATOR.PLAYER })
  manager.selectInitiativeAttribute('might')
  return { manager, result }
}

test('starts one test combat with correct state, round and world lock', () => {
  const { manager, result } = start()
  assert.equal(result.ok, true)
  assert.equal(result.combat.status, COMBAT_STATUS.ACTIVE)
  assert.equal(result.combat.round, 1)
  assert.equal(result.combat.phase, COMBAT_PHASE.PLAYER_SELECTION)
  assert.equal(result.combat.enemies[0].name, 'Grey Wolf')
  assert.equal(manager.getSnapshot().worldBlocked, true)
  assert.equal(manager.startCombat({ character }).error, COMBAT_ERROR.COMBAT_ALREADY_ACTIVE)
})

test('commands advance through every phase in order', () => {
  const { manager } = start()
  assert.equal(manager.selectPlayerSkill('player_strike').ok, true)
  assert.equal(manager.activeCombat.phase, COMBAT_PHASE.ENEMY_SELECTION)
  assert.equal(manager.resolveEnemySelection().ok, true)
  assert.equal(manager.activeCombat.enemySelections[0].skillId, 'enemy_bite')
  assert.equal(manager.activeCombat.phase, COMBAT_PHASE.INITIATIVE_RESOLUTION)
  assert.equal(manager.resolveInitiative().ok, true)
  assert.equal(manager.activeCombat.phase, COMBAT_PHASE.ACTION_RESOLUTION)
  assert.equal(manager.resolveActions().ok, true)
  assert.equal(manager.activeCombat.phase, COMBAT_PHASE.ROUND_END)
  assert.equal(manager.endRound().ok, true)
  assert.equal(manager.activeCombat.round, 2)
  assert.equal(manager.activeCombat.phase, COMBAT_PHASE.PLAYER_SELECTION)
})

test('invalid skill and command in the wrong phase return controlled errors', () => {
  const { manager } = start()
  assert.equal(manager.selectPlayerSkill('missing').error, COMBAT_ERROR.INVALID_SKILL)
  assert.equal(manager.resolveActions().error, COMBAT_ERROR.INVALID_PHASE)
  assert.equal(manager.resolveEnemySelection().error, COMBAT_ERROR.INVALID_PHASE)
})

test('skill initiative uses its value and gives exact ties to the player', () => {
  const player = { id: 'player', type: COMBATANT_TYPE.PLAYER, stats: { agility: 3 } }
  const enemy = { id: 'enemy', type: COMBATANT_TYPE.ENEMY, stats: { agility: 4 } }
  const actions = [
    { combatantId: player.id, skillId: 'p', skill: { ...PLAYER_STRIKE, initiative: 5 } },
    { combatantId: enemy.id, skillId: 'e', skill: { ...PLAYER_STRIKE, initiative: 5 } },
  ]
  assert.equal(resolveInitiative(actions, new Map([[player.id, player], [enemy.id, enemy]]))[0].combatantId, player.id)
  actions[1].skill.initiative = 6
  assert.equal(resolveInitiative(actions, new Map([[player.id, player], [enemy.id, enemy]]))[0].combatantId, enemy.id)
})

test('enemy chooses the highest current preferred initiative attribute', () => {
  const enemy = { stats: { agility: 4, vitality: 7, might: 12 }, preferredInitiativeStats: ['agility', 'vitality'] }
  assert.equal(chooseInitiativeAttribute(enemy), 'vitality')
})

test('enemy falls back to its highest attribute when preferences are empty', () => {
  const enemy = { stats: { might: 3, defense: 8, vitality: 2, agility: 4, magicPower: 1, wisdom: 5 }, preferredInitiativeStats: [] }
  assert.equal(chooseInitiativeAttribute(enemy), 'defense')
})

test('opening initiative compares the same attribute and initiator wins a tie', () => {
  const player = { stats: { agility: 5 } }
  const enemy = { stats: { agility: 5 } }
  assert.deepEqual(compareOpeningInitiative({ player, enemy, attribute: 'agility', initiator: COMBAT_INITIATOR.ENEMY }), {
    attribute: 'agility', winner: COMBAT_INITIATOR.ENEMY, playerValue: 5, enemyValue: 5,
  })
  enemy.stats.agility = 4
  assert.equal(compareOpeningInitiative({ player, enemy, attribute: 'agility', initiator: COMBAT_INITIATOR.ENEMY }).winner, COMBAT_INITIATOR.PLAYER)
})

test('enemy initiator resolves its preference automatically and records combat state and logs', () => {
  const manager = new CombatManager()
  const result = manager.startCombat({ character, initiator: COMBAT_INITIATOR.ENEMY })
  assert.equal(result.combat.initiativeAttribute, 'agility')
  assert.equal(result.combat.initiativeWinner, COMBAT_INITIATOR.ENEMY)
  assert.deepEqual(result.combat.initiativeComparison, { player: 3, enemy: 7 })
  assert.equal(result.combat.phase, COMBAT_PHASE.PLAYER_SELECTION)
  assert.ok(result.combat.log.some((entry) => entry.text === 'Grey Wolf selected Agility.'))
  assert.ok(result.combat.log.some((entry) => entry.text === 'Grey Wolf acts first.'))
})

test('player initiator chooses the attribute and wins equal comparisons', () => {
  const manager = new CombatManager()
  const result = manager.startCombat({ character, initiator: COMBAT_INITIATOR.PLAYER })
  assert.equal(result.combat.phase, COMBAT_PHASE.INITIATIVE_SELECTION)
  assert.equal(manager.selectInitiativeAttribute('might').ok, true)
  assert.equal(manager.activeCombat.initiativeAttribute, 'might')
  assert.equal(manager.activeCombat.initiativeWinner, COMBAT_INITIATOR.PLAYER)
  assert.deepEqual(manager.activeCombat.initiativeComparison, { player: 3, enemy: 3 })
})

test('combat subscriptions receive a new reactive snapshot after initiative selection', () => {
  const manager = new CombatManager()
  const snapshots = []
  manager.subscribe((snapshot) => snapshots.push(snapshot))
  manager.startCombat({ character, initiator: COMBAT_INITIATOR.PLAYER })
  const selectionSnapshot = snapshots.at(-1)
  assert.equal(selectionSnapshot.activeCombat.phase, COMBAT_PHASE.INITIATIVE_SELECTION)

  manager.selectInitiativeAttribute('defense')
  const playerTurnSnapshot = snapshots.at(-1)
  assert.notEqual(playerTurnSnapshot.activeCombat, selectionSnapshot.activeCombat)
  assert.equal(playerTurnSnapshot.activeCombat.phase, COMBAT_PHASE.PLAYER_SELECTION)
  assert.equal(playerTurnSnapshot.activeCombat.initiativeAttribute, 'defense')
})

test('opening initiative only controls round one; later rounds use skill initiative', () => {
  const { manager } = start()
  manager.selectPlayerSkill('player_strike'); manager.resolveEnemySelection(); manager.resolveInitiative()
  assert.equal(manager.activeCombat.initiativeQueue[0].combatantId, manager.activeCombat.player.id)
  manager.resolveActions(); manager.endRound()
  manager.selectPlayerSkill('player_strike'); manager.resolveEnemySelection(); manager.resolveInitiative()
  assert.equal(manager.activeCombat.initiativeQueue[0].combatantId, manager.activeCombat.enemies[0].id)
})

test('action resolution deals damage and creates structured roll and HP logs', () => {
  const { manager } = start()
  manager.diceService.setFixedRoll(2)
  const playerHp = manager.activeCombat.player.currentHealth
  const enemyHp = manager.activeCombat.enemies[0].currentHealth
  manager.selectPlayerSkill('player_strike'); manager.resolveEnemySelection(); manager.resolveInitiative(); manager.resolveActions()
  const rolls = manager.activeCombat.log.filter((entry) => entry.type === 'dice_rolled')
  assert.equal(rolls.length, 2)
  assert.ok(rolls.every((entry) => entry.id && entry.round === 1 && Number.isInteger(entry.order) && entry.actor))
  assert.equal(manager.activeCombat.player.currentHealth, playerHp - 3)
  assert.equal(manager.activeCombat.enemies[0].currentHealth, enemyHp - 5)
})

test('Strike uses d6 and Might while Bite uses d4 and a base of one', () => {
  const dice = new DiceService(() => 0)
  const actor = { stats: { might: 3 } }
  assert.deepEqual(resolveDamage({ actor, skill: { dice: 6, baseDamage: 0, usedStat: 'might', statScaling: 1 }, diceService: dice }), {
    roll: 1, damage: 4, die: 6, stat: 'might', statValue: 3, baseDamage: 0, calculation: '3 + 1 = 4',
  })
  assert.deepEqual(resolveDamage({ actor, skill: { dice: 4, baseDamage: 1, usedStat: 'agility', statScaling: 0 }, diceService: dice }), {
    roll: 1, damage: 2, die: 4, stat: 'agility', statValue: 0, baseDamage: 1, calculation: '1 + 1 = 2',
  })
})

test('Combat Feed is a simplified projection of the structured Combat Log', () => {
  const { manager } = start()
  manager.diceService.setFixedRoll(2)
  manager.selectPlayerSkill('player_strike'); manager.resolveEnemySelection(); manager.resolveInitiative(); manager.resolveActions()
  const feed = buildCombatFeed(manager.activeCombat.log)
  assert.ok(feed.some((entry) => entry.text === '⚔ Hero uses Strike.'))
  assert.ok(feed.some((entry) => entry.text === 'Hero deals 5 damage'))
  assert.ok(feed.some((entry) => entry.text === 'Grey Wolf loses 5 HP'))
  assert.ok(feed.every((entry) => !/roll|d6|calculation|\d+ \+ \d+/i.test(entry.text)))
})

test('detailed Combat Logs show calculations and reference the same source entries as Feed', () => {
  const { manager } = start()
  manager.diceService.setFixedRoll(2)
  manager.selectPlayerSkill('player_strike'); manager.resolveEnemySelection(); manager.resolveInitiative(); manager.resolveActions()
  const details = buildDetailedCombatLog(manager.activeCombat.log)
  assert.equal(details[0].stat, 'might')
  assert.equal(details[0].dice, 'd6')
  assert.equal(details[0].roll, 2)
  assert.equal(details[0].calculation, '3 + 2 = 5')
  assert.ok(details[0].sourceLogIds.every((id) => manager.activeCombat.log.some((entry) => entry.id === id)))
})

test('opening and closing Logs only changes local UI state', async () => {
  const { readFile } = await import('node:fs/promises')
  const source = await readFile(new URL('../src/components/CombatView.vue', import.meta.url), 'utf8')
  assert.match(source, /const showLogs = ref\(false\)/)
  assert.match(source, /@click="showLogs = true">Logs/)
  assert.match(source, /@click="showLogs = false"/)
  assert.doesNotMatch(source, /showLogs[^\n]*(combat|round|health)\s*=/)
})

test('the three player skills expose their stat, die and initiative in data', () => {
  assert.deepEqual(
    [PLAYER_QUICK_STRIKE, PLAYER_STRIKE, PLAYER_HEAVY_STRIKE].map(({ name, usedStat, dice, initiative }) => ({ name, usedStat, dice, initiative })),
    [
      { name: 'Quick Strike', usedStat: 'agility', dice: 4, initiative: 8 },
      { name: 'Strike', usedStat: 'might', dice: 6, initiative: 5 },
      { name: 'Heavy Strike', usedStat: 'might', dice: 10, initiative: 2 },
    ],
  )
  assert.ok(PLAYER_QUICK_STRIKE.initiative > PLAYER_STRIKE.initiative)
  assert.ok(PLAYER_HEAVY_STRIKE.initiative < PLAYER_STRIKE.initiative)
})

test('Guard uses Defense and d4 without defining damage', () => {
  assert.equal(PLAYER_GUARD.usedStat, 'defense')
  assert.equal(PLAYER_GUARD.dice, 4)
  assert.equal(PLAYER_GUARD.initiative, 7)
  assert.equal(PLAYER_GUARD.actionType, 'guard')
  assert.equal('baseDamage' in PLAYER_GUARD, false)
})

test('Guard creates Defense plus d4 Block and deals no damage', () => {
  const { manager } = start()
  manager.diceService.setFixedRoll(2)
  const enemyHp = manager.activeCombat.enemies[0].currentHealth
  manager.selectPlayerSkill('player_guard'); manager.resolveEnemySelection(); manager.resolveInitiative()
  const resolved = manager.resolveActions()
  const guard = manager.activeCombat.log.find((entry) => entry.type === 'block_gained')
  assert.equal(resolved.combatEnded, false)
  assert.equal(guard.data.gainedBlock, 5)
  assert.equal(guard.data.calculation, '3 + 2 = 5')
  assert.equal(manager.activeCombat.enemies[0].currentHealth, enemyHp)
})

test('BlockResolver absorbs damage, consumes Block and never returns negative damage', () => {
  const target = { currentBlock: 5 }
  assert.deepEqual(resolveBlock(target, 8), { incomingDamage: 8, previousBlock: 5, absorbed: 5, currentBlock: 0, remainingDamage: 3 })
  target.currentBlock = 9
  assert.deepEqual(resolveBlock(target, 4), { incomingDamage: 4, previousBlock: 9, absorbed: 4, currentBlock: 5, remainingDamage: 0 })
  assert.equal(resolveBlock({ currentBlock: 2 }, -4).remainingDamage, 0)
})

test('Guard prevents HP loss when Block absorbs the full Bite', () => {
  const { manager } = start()
  manager.diceService.setMode('minimum')
  manager.selectPlayerSkill('player_guard'); manager.resolveEnemySelection(); manager.resolveInitiative(); manager.resolveActions()
  assert.equal(manager.activeCombat.player.currentHealth, 18)
  assert.ok(manager.activeCombat.log.some((entry) => entry.type === 'block_absorbed' && entry.data.remainingDamage === 0))
})

test('unused Block expires at round end and never enters CharacterState', () => {
  const { manager } = start()
  manager.diceService.setMode('maximum')
  manager.selectPlayerSkill('player_guard'); manager.resolveEnemySelection(); manager.resolveInitiative(); manager.resolveActions()
  assert.ok(manager.activeCombat.player.currentBlock > 0)
  manager.endRound()
  assert.equal(manager.activeCombat.player.currentBlock, 0)
  assert.equal('currentBlock' in character, false)
})

test('Combat Feed and detailed Logs derive Guard and Block from structured entries', () => {
  const { manager } = start()
  manager.diceService.setFixedRoll(2)
  manager.selectPlayerSkill('player_guard'); manager.resolveEnemySelection(); manager.resolveInitiative(); manager.resolveActions()
  const feed = buildCombatFeed(manager.activeCombat.log)
  const logs = buildDetailedCombatLog(manager.activeCombat.log)
  assert.ok(feed.some((entry) => entry.text === 'Hero gains 5 Block'))
  assert.ok(feed.some((entry) => entry.text === 'Block absorbs all damage'))
  const guard = logs.find((entry) => entry.kind === 'guard')
  assert.equal(guard.stat, 'defense')
  assert.equal(guard.dice, 'd4')
  assert.equal(guard.calculation, '3 + 2 = 5')
})

test('enemy intent is prepared before player selection and contains no predicted result', () => {
  const { manager } = start()
  const intent = manager.activeCombat.enemySelections[0]
  assert.equal(manager.activeCombat.phase, COMBAT_PHASE.PLAYER_SELECTION)
  assert.equal(intent.skill.name, 'Bite')
  assert.equal(intent.skill.initiative, 6)
  const intentLog = manager.activeCombat.log.find((entry) => entry.type === 'enemy_intent')
  assert.equal(intentLog.text, 'Grey Wolf prepares Bite.')
  assert.equal('roll' in intentLog.data, false)
  assert.equal('damage' in intentLog.data, false)
})

test('combat UI renders all skills and only public enemy intent information', async () => {
  const { readFile } = await import('node:fs/promises')
  const source = await readFile(new URL('../src/components/CombatView.vue', import.meta.url), 'utf8')
  assert.match(source, /v-for="skill in combat\.player\.skills"/)
  assert.match(source, /skill\.usedStat/)
  assert.match(source, /skill\.initiative/)
  assert.match(source, /skill\.dice/)
  const intentSection = source.match(/<section v-if="showEnemyIntent[\s\S]*?<\/section>/)?.[0] ?? ''
  assert.match(intentSection, /Enemy Intent/)
  assert.doesNotMatch(intentSection, /damage|roll/i)
})

test('DiceService supports valid d4 and d6 ranges and deterministic debug modes', () => {
  const minimum = new DiceService(() => 0)
  const maximum = new DiceService(() => 0.999999)
  assert.equal(minimum.roll(4), 1)
  assert.equal(minimum.roll(6), 1)
  assert.equal(maximum.roll(4), 4)
  assert.equal(maximum.roll(6), 6)
  minimum.setMode('maximum'); assert.equal(minimum.roll(6), 6)
  minimum.setFixedRoll(3); assert.equal(minimum.roll(4), 3)
})

test('damage application never lowers HP below zero', () => {
  const target = { currentHealth: 3, alive: true }
  assert.deepEqual(applyDamage(target, 99), { previousHealth: 3, currentHealth: 0, defeated: true })
  assert.equal(target.currentHealth, 0)
})

test('a defeated target does not perform its queued action and victory ends combat', () => {
  const manager = new CombatManager({ diceService: new DiceService(() => 0.999999) })
  manager.startCombat({ character, initiator: COMBAT_INITIATOR.PLAYER })
  manager.selectInitiativeAttribute('might')
  manager.activeCombat.enemies[0].currentHealth = 1
  manager.selectPlayerSkill('player_strike'); manager.resolveEnemySelection(); manager.resolveInitiative()
  const resolved = manager.resolveActions()
  assert.equal(resolved.result, COMBAT_RESULT.VICTORY)
  assert.equal(manager.activeCombat.enemies[0].currentHealth, 0)
  assert.equal(manager.activeCombat.player.currentHealth, 18)
  assert.equal(manager.activeCombat.log.filter((entry) => entry.type === 'skill_used').length, 1)
})

test('player reaching zero HP produces defeat', () => {
  const weakCharacter = createCharacterState({ id: 'weak', name: 'Weak Hero', characterClass: 'warrior' })
  weakCharacter.health.current = 1
  const manager = new CombatManager({ diceService: new DiceService(() => 0.999999) })
  manager.startCombat({ character: weakCharacter, initiator: COMBAT_INITIATOR.ENEMY })
  manager.selectPlayerSkill('player_strike'); manager.resolveEnemySelection(); manager.resolveInitiative()
  const resolved = manager.resolveActions()
  assert.equal(resolved.result, COMBAT_RESULT.DEFEAT)
  assert.equal(manager.activeCombat.player.currentHealth, 0)
})

test('defeat UI only offers returning to the main menu', async () => {
  const { readFile } = await import('node:fs/promises')
  const source = await readFile(new URL('../src/components/CombatView.vue', import.meta.url), 'utf8')
  assert.match(source, /<h1 id="combat-title">You died<\/h1>/)
  assert.match(source, /Return to Main Menu/)
  assert.doesNotMatch(source, /@click="\$emit\('defeat'\)">Return to Map/)
})

test('finishing combat exposes remaining player HP for CharacterState persistence', () => {
  const { manager } = start()
  manager.diceService.setMode('maximum')
  manager.selectPlayerSkill('player_strike'); manager.resolveEnemySelection(); manager.resolveInitiative(); manager.resolveActions()
  const remainingHp = manager.activeCombat.player.currentHealth
  const finished = manager.finishCombat(COMBAT_RESULT.VICTORY)
  assert.equal(finished.combat.player.currentHealth, remainingHp)
})

for (const [result, status] of [[COMBAT_RESULT.VICTORY, COMBAT_STATUS.VICTORY], [COMBAT_RESULT.DEFEAT, COMBAT_STATUS.DEFEAT]]) {
  test(`developer ${result} finishes combat and unlocks exploration`, () => {
    const { manager } = start()
    const finished = manager.finishCombat(result)
    assert.equal(finished.ok, true)
    assert.equal(finished.combat.status, status)
    assert.equal(finished.combat.phase, COMBAT_PHASE.COMBAT_END)
    assert.equal(manager.getSnapshot().activeCombat, null)
    assert.equal(manager.getSnapshot().worldBlocked, false)
  })
}

test('cancelling combat records result and unlocks exploration', () => {
  const { manager } = start()
  const cancelled = manager.cancelCombat()
  assert.equal(cancelled.result.type, COMBAT_RESULT.CANCELLED)
  assert.equal(cancelled.combat.status, COMBAT_STATUS.CANCELLED)
  assert.equal(manager.getSnapshot().worldBlocked, false)
})

test('map movement, waiting, resting and autosave are guarded during combat', async () => {
  const { readFile } = await import('node:fs/promises')
  const source = await readFile(new URL('../src/views/MenuThree.vue', import.meta.url), 'utf8')
  assert.match(source, /function movePlayerTo\(index\) \{\s*if \(eventSnapshot\.value\.movementBlocked \|\| combatSnapshot\.value\.worldBlocked\) return/)
  assert.match(source, /function performWaitHours\(hours\) \{\s*if \(eventSnapshot\.value\.movementBlocked \|\| combatSnapshot\.value\.worldBlocked\) return/)
  assert.match(source, /function performRest\(\) \{\s*if \(eventSnapshot\.value\.movementBlocked \|\| combatSnapshot\.value\.worldBlocked\) return/)
  assert.match(source, /function saveProgress\(\) \{\s*if \(combatSnapshot\.value\.worldBlocked\) return false/)
})

test('starting developer combat closes Dev Tools so initiative controls remain available', async () => {
  const { readFile } = await import('node:fs/promises')
  const source = await readFile(new URL('../src/views/MenuThree.vue', import.meta.url), 'utf8')
  assert.match(source, /if \(started\.ok\) showDevTools\.value = false/)
})

test('normal save contains no active combat and remains safe to restore during a test combat', () => {
  const proficiencies = Object.fromEntries(PROFICIENCY_NAMES.map((name) => [name, ['Mace Fighting', 'Camping'].includes(name) ? 'Novice' : 'Untrained']))
  const weapon = WEAPONS.wooden_club
  const run = createNewRun({ name: 'Hero', attributes: threeStats, proficiencies, startingWeapon: weapon, startingSkills: [...weapon.combatSkills], equipment: {} }, { seed: 'combat-refresh-save', runId: 'combat-refresh' })
  const manager = new CombatManager()
  manager.startCombat({ character: run.characterState })
  assert.equal('combatState' in run, false)
  assert.equal(validateSave(JSON.parse(JSON.stringify(run))).valid, true)
  assert.equal(manager.getSnapshot().worldBlocked, true)
})
