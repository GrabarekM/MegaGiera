export const ATTRIBUTE_DEFINITIONS = Object.freeze([
  ['might', 'Might'], ['defense', 'Defense'], ['vitality', 'Vitality'], ['agility', 'Agility'],
  ['magicPower', 'Magic Power'], ['wisdom', 'Wisdom'], ['perception', 'Perception'], ['luck', 'Luck'],
].map(([id, name]) => Object.freeze({ id, name })))

export const PROFICIENCY_NAMES = Object.freeze([
  'Alchemy', 'Animal Lore', 'Archery', 'Arms Lore', 'Bardic', 'Camping', 'Scouting', 'Chivalry',
  'Cooking', 'Detect Hidden', 'Fishing', 'Healing', 'Fleeing', 'Inscription', 'Lockpicking', 'Magery',
  'Evaluate Intelligence', 'Meditation', 'Mace Fighting', 'Mysticism', 'Necromancy', 'Parry', 'Poisoning',
  'Remove Trap', 'Fencing', 'Swordsmanship', 'Perception',
])

export const PROFICIENCY_RANKS = Object.freeze(['Untrained', 'Novice', 'Apprentice', 'Adept', 'Expert', 'Master', 'Grandmaster'])

export const PROFICIENCY_DESCRIPTIONS = Object.freeze({
  'Mace Fighting': 'Training with clubs, axes and fighting staves.', Fencing: 'Training with fast thrusting weapons and daggers.',
  Swordsmanship: 'Training with knives and bladed weapons.', Magery: 'Training with wands, spellbooks and arcane focuses.',
  Mysticism: 'Training with mystical staves and spiritual totems.', Parry: 'Training with shields and defensive weapons.',
})

export const PROFICIENCY_CATEGORIES = Object.freeze([
  Object.freeze({ id: 'combat', name: 'Combat', proficiencies: Object.freeze(['Archery', 'Mace Fighting', 'Fencing', 'Swordsmanship', 'Parry', 'Fleeing']) }),
  Object.freeze({ id: 'magic', name: 'Magic & Spiritual', proficiencies: Object.freeze(['Magery', 'Mysticism', 'Necromancy', 'Meditation', 'Inscription', 'Chivalry']) }),
  Object.freeze({ id: 'exploration', name: 'Exploration & Survival', proficiencies: Object.freeze(['Camping', 'Scouting', 'Fishing', 'Animal Lore', 'Perception', 'Detect Hidden']) }),
  Object.freeze({ id: 'crafting', name: 'Crafting & Knowledge', proficiencies: Object.freeze(['Alchemy', 'Arms Lore', 'Cooking', 'Healing', 'Evaluate Intelligence', 'Bardic']) }),
  Object.freeze({ id: 'subterfuge', name: 'Subterfuge', proficiencies: Object.freeze(['Lockpicking', 'Remove Trap', 'Poisoning']) }),
])

export const EQUIPMENT_SLOTS = Object.freeze([
  ['head', 'Head'], ['earrings', 'Earrings'], ['neck', 'Neck'], ['chest', 'Chest'], ['gloves', 'Gloves'],
  ['bracelet', 'Bracelet'], ['ringLeft', 'Ring'], ['ringRight', 'Ring'], ['belt', 'Belt'], ['legs', 'Legs'],
  ['feet', 'Feet'], ['cloak', 'Cloak'], ['robe', 'Robe'],
].map(([id, name]) => Object.freeze({ id, name })))

export { WEAPON_LIST as STARTING_WEAPONS } from './weapons.js'

export const FANTASY_NAMES = Object.freeze(['Aldren', 'Brina', 'Caelan', 'Daria', 'Eryndor', 'Fiora', 'Garrick', 'Lyra', 'Marek', 'Seraphine'])
