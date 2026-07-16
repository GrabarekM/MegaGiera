import assert from 'node:assert/strict'
import test from 'node:test'
import { CombatManager } from '../src/combat/combatManager.js'
import { COMBAT_INITIATOR } from '../src/combat/combatConstants.js'
import { createEnemyCombatant } from '../src/combat/combatant.js'
import { evaluateBehaviorRules, selectEnemyAction } from '../src/combat/enemyDecisionSystem.js'
import { COMBAT_SKILLS } from '../src/data/combatSkills.js'
import { ENEMY_TEMPLATE_LIST, ENEMY_TEMPLATES } from '../src/data/enemyTemplates.js'
import { createCharacterState } from '../src/game/characterState.js'

const REQUIRED_STATS = ['might', 'defense', 'vitality', 'agility', 'magicPower', 'wisdom']
const character = createCharacterState({ id: 'enemy-test-hero', name: 'Hero', characterClass: 'warrior' })

test('registry contains exactly the five early-game enemy templates', () => {
  assert.deepEqual(ENEMY_TEMPLATE_LIST.map((enemy) => enemy.id), [
    'starved_wild_dog', 'grey_wolf', 'desperate_peasant', 'giant_rat', 'mongbat',
  ])
})

for (const template of ENEMY_TEMPLATE_LIST) {
  test(`${template.name} defines a complete data-driven combatant`, () => {
    assert.deepEqual(Object.keys(template.stats), REQUIRED_STATS)
    assert.ok(Number.isInteger(template.maxHealth) && template.maxHealth > 0)
    assert.ok(template.preferredInitiativeStats.length > 0)
    assert.ok(template.skillIds.length > 0)
    assert.ok(template.skillIds.every((id) => COMBAT_SKILLS[id]))
    assert.equal(typeof template.behaviorProfile, 'string')
    assert.ok(Number.isInteger(template.threatRating) && template.threatRating >= 1 && template.threatRating <= 10)
    assert.equal(typeof template.temperament, 'string')
    assert.ok(Array.isArray(template.behaviorRules))
    assert.ok(template.skillIds.every((id) => template.skillWeights[id] > 0))
    const combatant = createEnemyCombatant(template, `test:${template.id}`, COMBAT_SKILLS)
    assert.equal(combatant.name, template.name)
    assert.equal(combatant.maxHealth, template.maxHealth)
    assert.equal(combatant.skills.length, template.skillIds.length)
  })

  test(`test combat can start with ${template.name} and exposes its intent`, () => {
    const manager = new CombatManager()
    const result = manager.startCombat({ character, enemyTemplateId: template.id, initiator: COMBAT_INITIATOR.PLAYER })
    manager.selectInitiativeAttribute('might')
    assert.equal(result.ok, true)
    assert.equal(manager.activeCombat.enemies[0].sourceRef.id, template.id)
    assert.ok(template.skillIds.includes(manager.activeCombat.enemySelections[0].skillId))
  })
}

test('Enemy AI selects skills using template weights rather than enemy-specific branches', () => {
  const template = ENEMY_TEMPLATES.starved_wild_dog
  const enemy = createEnemyCombatant(template, 'weighted-dog', COMBAT_SKILLS)
  const player = { id: 'player' }
  assert.equal(selectEnemyAction(enemy, player, () => 0).skillId, 'dog_quick_bite')
  assert.equal(selectEnemyAction(enemy, player, () => 0.9999).skillId, 'dog_growl')
})

const behaviorCases = [
  ['starved_wild_dog', 50, { dog_quick_bite: 40, dog_growl: 60 }, 'dog_growl'],
  ['grey_wolf', 50, { enemy_bite: 40, wolf_heavy_bite: 60 }, 'wolf_heavy_bite'],
  ['desperate_peasant', 30, { peasant_club_swing: 20, peasant_desperate_strike: 80 }, 'peasant_desperate_strike'],
  ['mongbat', 30, { mongbat_bite: 20, mongbat_dive: 80 }, 'mongbat_dive'],
]

for (const [templateId, hpPercent, expectedWeights, preferredSkill] of behaviorCases) {
  test(`${templateId} applies its low-HP behavior rule from template data`, () => {
    const enemy = createEnemyCombatant(ENEMY_TEMPLATES[templateId], `behavior:${templateId}`, COMBAT_SKILLS)
    enemy.currentHealth = enemy.maxHealth * (hpPercent / 100)
    const evaluated = evaluateBehaviorRules(enemy, { currentHealth: 18, maxHealth: 18 })
    assert.deepEqual(evaluated.finalWeights, expectedWeights)
    assert.ok(evaluated.activeRules.length > 0)
    assert.equal(selectEnemyAction(enemy, { id: 'player', currentHealth: 18, maxHealth: 18 }, () => 0.9999).skillId, preferredSkill)
  })
}

test('Giant Rat always weights Scratch above Bite and has no heavy skill', () => {
  const enemy = createEnemyCombatant(ENEMY_TEMPLATES.giant_rat, 'fast-rat', COMBAT_SKILLS)
  const evaluated = evaluateBehaviorRules(enemy, { currentHealth: 18, maxHealth: 18 })
  assert.equal(evaluated.finalWeights.rat_scratch, 70)
  assert.equal(evaluated.finalWeights.rat_bite, 30)
  assert.ok(enemy.skills.every((skill) => !/heavy/i.test(skill.name)))
})

test('AI never selects unavailable or nonexistent skills', () => {
  const enemy = createEnemyCombatant(ENEMY_TEMPLATES.grey_wolf, 'filtered-wolf', COMBAT_SKILLS)
  enemy.skills[0].available = false
  enemy.skillWeights.missing_skill = 9999
  assert.equal(selectEnemyAction(enemy, { id: 'player', currentHealth: 18, maxHealth: 18 }, () => 0).skillId, 'wolf_heavy_bite')
})

test('cooldown and skill conditions remove skills from the AI candidate pool', () => {
  const enemy = createEnemyCombatant(ENEMY_TEMPLATES.grey_wolf, 'filtered-wolf', COMBAT_SKILLS)
  const player = { id: 'player', currentHealth: 18, maxHealth: 18 }
  const heavyBite = enemy.skills.find((skill) => skill.id === 'wolf_heavy_bite')
  heavyBite.remainingCooldown = 1
  let selection = selectEnemyAction(enemy, player, () => 0.9999, { round: 1 })
  assert.equal(selection.skillId, 'enemy_bite')
  assert.match(selection.aiDecision.rejectedSkills[0].reason, /Cooldown/)
  heavyBite.remainingCooldown = 0
  enemy.currentHealth = enemy.maxHealth * 0.3
  selection = selectEnemyAction(enemy, player, () => 0.9999, { round: 1 })
  assert.equal(selection.skillId, 'enemy_bite')
  assert.match(selection.aiDecision.rejectedSkills[0].reason, /conditions/)
})

test('temperament changes final weights without enemy-specific branches', () => {
  const enemy = createEnemyCombatant(ENEMY_TEMPLATES.grey_wolf, 'temperament-wolf', COMBAT_SKILLS)
  const player = { id: 'player', currentHealth: 18, maxHealth: 18 }
  const aggressive = selectEnemyAction(enemy, player, () => 0, { round: 1 }).aiDecision.finalWeights
  enemy.temperament = 'Defensive'
  const defensive = selectEnemyAction(enemy, player, () => 0, { round: 1 }).aiDecision.finalWeights
  assert.ok(aggressive.wolf_heavy_bite > defensive.wolf_heavy_bite)
})

test('used cooldown decreases once at round end and blocks the next intent', () => {
  const manager = new CombatManager({ diceService: { random: () => 0.9999, roll: () => 1 } })
  manager.startCombat({ character, enemyTemplateId: 'grey_wolf', initiator: COMBAT_INITIATOR.PLAYER })
  manager.selectInitiativeAttribute('might')
  manager.selectPlayerSkill('player_guard')
  manager.resolveEnemySelection(); manager.resolveInitiative(); manager.resolveActions()
  const heavyBite = manager.activeCombat.enemies[0].skills.find((skill) => skill.id === 'wolf_heavy_bite')
  assert.equal(heavyBite.remainingCooldown, 2)
  manager.endRound()
  assert.equal(heavyBite.remainingCooldown, 1)
  assert.equal(manager.activeCombat.enemySelections[0].skillId, 'enemy_bite')
})

test('Enemy Intent and Combat Log use the final AI decision and its reason', () => {
  const manager = new CombatManager()
  manager.startCombat({ character, enemyTemplateId: 'grey_wolf', initiator: COMBAT_INITIATOR.PLAYER })
  manager.selectInitiativeAttribute('might')
  manager.activeCombat.enemies[0].currentHealth = 7
  manager.prepareEnemyIntent()
  const intent = manager.activeCombat.enemySelections[0]
  const decision = manager.activeCombat.log.filter((entry) => entry.type === 'enemy_ai_selected').at(-1)
  assert.equal(intent.skillId, decision.data.selectedSkillId)
  assert.match(decision.data.reason, /Enemy HP at or below 50%\./)
  assert.match(decision.data.reason, /Cooldown ready\./)
  assert.match(decision.data.reason, /Temperament: Aggressive\./)
})

test('CombatManager source contains no enemy-specific behavior branches', async () => {
  const { readFile } = await import('node:fs/promises')
  const source = await readFile(new URL('../src/combat/combatManager.js', import.meta.url), 'utf8')
  assert.doesNotMatch(source, /behaviorRules|behaviorProfile|skillWeights/)
  assert.match(source, /selectEnemyAction\(enemy, state\.player/)
})

test('CombatManager accepts a newly registered template without implementation changes', () => {
  const custom = { ...ENEMY_TEMPLATES.giant_rat, id: 'custom_rat', name: 'Custom Rat' }
  const manager = new CombatManager({ enemyTemplates: { custom_rat: custom } })
  assert.equal(manager.startCombat({ character, enemyTemplateId: 'custom_rat' }).combat.enemies[0].name, 'Custom Rat')
})

test('developer UI offers every registered enemy and displays template diagnostics', async () => {
  const { readFile } = await import('node:fs/promises')
  const source = await readFile(new URL('../src/views/MenuThree.vue', import.meta.url), 'utf8')
  assert.match(source, /v-for="enemy in ENEMY_TEMPLATE_LIST"/)
  assert.match(source, /selectedEnemyTemplate\.preferredInitiativeStats/)
  assert.match(source, /selectedEnemyTemplate\.skillIds/)
})
