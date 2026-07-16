import { COMBAT_TARGET } from '../combat/combatConstants.js'

export const PLAYER_QUICK_STRIKE = Object.freeze({
  id: 'player_quick_strike', name: 'Quick Strike', description: 'A fast attack.', initiative: 8,
  usedStat: 'agility', dice: 4, baseDamage: 0, statScaling: 1,
  targetType: COMBAT_TARGET.SINGLE_ENEMY, tags: ['melee', 'quick'], proficiencyTier: 'basic', available: true,
})

export const PLAYER_STRIKE = Object.freeze({
  id: 'player_strike', name: 'Strike', description: 'A standard attack.', initiative: 5,
  usedStat: 'might', dice: 6, baseDamage: 0, statScaling: 1,
  targetType: COMBAT_TARGET.SINGLE_ENEMY, tags: ['melee'], proficiencyTier: 'basic', available: true,
})

export const PLAYER_HEAVY_STRIKE = Object.freeze({
  id: 'player_heavy_strike', name: 'Heavy Strike', description: 'A slow but very powerful attack.', initiative: 2,
  usedStat: 'might', dice: 10, baseDamage: 0, statScaling: 1,
  targetType: COMBAT_TARGET.SINGLE_ENEMY, tags: ['melee', 'heavy'], proficiencyTier: 'basic', available: true,
})

export const PLAYER_GUARD = Object.freeze({
  id: 'player_guard', name: 'Guard', description: 'Prepare a temporary defense for this round.', initiative: 7,
  usedStat: 'defense', dice: 4, actionType: 'guard',
  targetType: COMBAT_TARGET.SINGLE_PLAYER, tags: ['defense', 'guard'], proficiencyTier: 'basic', available: true,
})

export const ENEMY_BITE = Object.freeze({
  id: 'enemy_bite', name: 'Bite', description: 'The wolf tears into its target.',
  initiative: 6, usedStat: 'agility', dice: 4, baseDamage: 1, statScaling: 0,
  targetType: COMBAT_TARGET.SINGLE_PLAYER, tags: ['melee'], available: true,
})

const enemyAttack = (id, name, description, initiative, usedStat, dice, baseDamage = 0, statScaling = 0, tags = []) => Object.freeze({
  id, name, description, initiative, usedStat, dice, baseDamage, statScaling,
  targetType: COMBAT_TARGET.SINGLE_PLAYER, tags: Object.freeze(['enemy', ...tags]), available: true,
})

export const DOG_QUICK_BITE = enemyAttack('dog_quick_bite', 'Quick Bite', 'A quick, weak bite.', 8, 'agility', 4)
export const DOG_GROWL = Object.freeze({ id: 'dog_growl', name: 'Growl', description: 'A fearful defensive display.', initiative: 7, usedStat: 'defense', dice: 4, actionType: 'guard', targetType: COMBAT_TARGET.SINGLE_PLAYER, tags: Object.freeze(['enemy', 'guard']), available: true })
export const WOLF_HEAVY_BITE = Object.freeze({
  ...enemyAttack('wolf_heavy_bite', 'Heavy Bite', 'A committed, powerful bite.', 3, 'might', 6, 1, 0, ['heavy']),
  cooldown: 2,
  conditions: Object.freeze([{ fact: 'enemyHpPercent', operator: 'gt', value: 30 }]),
})
export const PEASANT_CLUB_SWING = enemyAttack('peasant_club_swing', 'Club Swing', 'A crude swing with a farm tool.', 5, 'might', 4, 0, 1)
export const PEASANT_DESPERATE_STRIKE = enemyAttack('peasant_desperate_strike', 'Desperate Strike', 'A reckless overhead blow.', 3, 'might', 6, 1, 0, ['heavy'])
export const RAT_BITE = enemyAttack('rat_bite', 'Bite', 'A small but fast bite.', 8, 'agility', 4)
export const RAT_SCRATCH = enemyAttack('rat_scratch', 'Scratch', 'A frantic claw attack.', 7, 'agility', 4, 1)
export const MONGBAT_BITE = enemyAttack('mongbat_bite', 'Bite', 'A snapping aerial bite.', 8, 'agility', 4, 1)
export const MONGBAT_DIVE = enemyAttack('mongbat_dive', 'Dive', 'A dangerous diving attack.', 7, 'agility', 6, 1, 0, ['mobile'])

export const PLAYER_COMBAT_SKILLS = Object.freeze([PLAYER_QUICK_STRIKE, PLAYER_STRIKE, PLAYER_HEAVY_STRIKE, PLAYER_GUARD])
export const ENEMY_COMBAT_SKILLS = Object.freeze([
  ENEMY_BITE, DOG_QUICK_BITE, DOG_GROWL, WOLF_HEAVY_BITE, PEASANT_CLUB_SWING,
  PEASANT_DESPERATE_STRIKE, RAT_BITE, RAT_SCRATCH, MONGBAT_BITE, MONGBAT_DIVE,
])
export const COMBAT_SKILLS = Object.freeze(Object.fromEntries([...PLAYER_COMBAT_SKILLS, ...ENEMY_COMBAT_SKILLS].map((skill) => [skill.id, skill])))
