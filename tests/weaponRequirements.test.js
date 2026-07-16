import assert from 'node:assert/strict'
import test from 'node:test'
import { buildCombatFeed, buildDetailedCombatLog } from '../src/combat/combatLogPresenter.js'
import { resolveDamage } from '../src/combat/damageResolver.js'
import { resolveHitCheck, resolveWeaponRequirements } from '../src/combat/weaponRequirementResolver.js'
import { WEAPON_LIST, WEAPONS } from '../src/data/weapons.js'

const noviceCharacter = {
  stats: { might: 2, agility: 3 },
  proficiencies: { 'Mace Fighting': 'Novice', Fencing: 'Novice' },
}

test('every weapon defines complete attribute and proficiency requirements', () => {
  for (const weapon of WEAPON_LIST) {
    assert.equal(typeof weapon.requiredAttribute, 'string')
    assert.ok(Number.isInteger(weapon.requiredAttributeValue))
    assert.equal(typeof weapon.requiredProficiency, 'string')
    assert.ok(Array.isArray(weapon.combatSkills) && weapon.combatSkills.length > 0)
    for (const field of ['id', 'displayName', 'weaponType', 'baseDamage', 'description', 'rarity', 'value']) assert.ok(field in weapon)
  }
  assert.equal(WEAPONS.wooden_club.requiredAttribute, 'might')
  assert.equal(WEAPONS.wooden_club.requiredProficiency, 'Mace Fighting')
})

test('missing required attribute applies a 15% final damage penalty', () => {
  const requirements = resolveWeaponRequirements({ stats: { might: 1 }, proficiencies: { 'Mace Fighting': 'Novice' } }, WEAPONS.wooden_club)
  assert.equal(requirements.attributeMet, false)
  assert.equal(requirements.damageMultiplier, 0.85)
  const damage = resolveDamage({ actor: { stats: { might: 3 } }, skill: { dice: 4, usedStat: 'might', statScaling: 1 }, weapon: WEAPONS.wooden_club, damageMultiplier: requirements.damageMultiplier, diceService: { roll: () => 4 } })
  assert.equal(damage.rawDamage, 7)
  assert.equal(damage.damage, 5)
})

test('Untrained adds miss chance and hit damage penalty while Novice removes both', () => {
  const untrained = resolveWeaponRequirements({ stats: { agility: 2 }, proficiencies: { Fencing: 'Untrained' } }, WEAPONS.rusty_dagger)
  const novice = resolveWeaponRequirements(noviceCharacter, WEAPONS.rusty_dagger)
  assert.equal(untrained.missChance, 0.3)
  assert.equal(untrained.proficiencyDamageMultiplier, 0.85)
  assert.equal(untrained.advancedSkills, false)
  assert.equal(novice.missChance, 0)
  assert.equal(novice.proficiencyDamageMultiplier, 1)
})

test('Hit Check uses miss chance without preventing weapon use', () => {
  const requirements = resolveWeaponRequirements({ stats: { agility: 2 }, proficiencies: { Fencing: 'Untrained' } }, WEAPONS.rusty_dagger)
  assert.equal(resolveHitCheck(requirements, () => 0.29).hit, false)
  assert.equal(resolveHitCheck(requirements, () => 0.3).hit, true)
})

test('miss appears in Combat Feed and detailed log exposes full requirement data', () => {
  const requirementData = { ...resolveWeaponRequirements({ stats: { agility: 2 }, proficiencies: { Fencing: 'Untrained' } }, WEAPONS.rusty_dagger), hitRoll: 0.1, hit: false, result: 'Miss' }
  const log = [
    { id: '1', round: 1, type: 'skill_used', text: 'Player uses Strike.', data: { actorType: 'player' } },
    { id: '2', round: 1, type: 'weapon_check', text: 'Player misses due to insufficient proficiency.', data: requirementData },
    { id: '3', round: 1, type: 'attack_missed', text: 'Miss.', data: { reason: 'insufficient proficiency' } },
  ]
  assert.equal(buildCombatFeed(log).at(-1).text, 'Miss')
  const details = buildDetailedCombatLog(log)[0]
  assert.equal(details.kind, 'miss')
  assert.equal(details.weaponCheck.weaponName, 'Rusty Dagger')
  assert.equal(details.weaponCheck.requiredAttributeValue, 2)
  assert.equal(details.weaponCheck.currentRank, 'Untrained')
  assert.equal(details.weaponCheck.missChance, 0.3)
})

test('Character Sheet renders proficiency rank, weapon types and description', async () => {
  const { readFile } = await import('node:fs/promises')
  const source = await readFile(new URL('../src/views/MenuThree.vue', import.meta.url), 'utf8')
  assert.match(source, /characterState\.proficiencies\[proficiency\]/)
  assert.match(source, /proficiencyWeaponTypes\(proficiency\)/)
  assert.match(source, /PROFICIENCY_DESCRIPTIONS/)
})
