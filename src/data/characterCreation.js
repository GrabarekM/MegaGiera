export const ATTRIBUTE_DEFINITIONS = Object.freeze([
  ['strength', 'Strength'], ['defense', 'Defense'], ['vitality', 'Vitality'], ['agility', 'Agility'],
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
  Alchemy: 'Experiment with ingredients and discover what useful mixtures can become.',
  'Animal Lore': 'Read tracks, habits and weaknesses hidden in the behavior of beasts.',
  Archery: 'Learn how distance, timing and a clear line of sight change a fight.',
  'Arms Lore': 'Recognize the purpose, quality and secrets of weapons and armor.',
  Bardic: 'Explore how stories, rhythm and presence can influence people and situations.',
  Camping: 'Turn an unsafe stretch of wilderness into a place where you can recover.',
  Scouting: 'Notice routes, danger and opportunities before they become obvious.',
  Chivalry: 'Test what discipline, conviction and honorable action can unlock.',
  Cooking: 'Transform ordinary supplies into something more useful for the road.',
  'Detect Hidden': 'Look beyond the visible and uncover what others tried to conceal.',
  Fishing: 'Learn what rivers and lakes can offer to a patient traveler.',
  Healing: 'Understand wounds and find ways to survive when supplies are scarce.',
  Fleeing: 'Discover when escape is the smartest victory and how to make it possible.',
  Inscription: 'Explore the power stored in symbols, notes and carefully written knowledge.',
  Lockpicking: 'Open paths and containers that would otherwise remain mysteries.',
  Magery: 'Experiment with wands, spellbooks and arcane focuses.',
  'Evaluate Intelligence': 'Read intentions and recognize when knowledge matters more than force.',
  Meditation: 'Find control and clarity when pressure would break an unprepared mind.',
  'Mace Fighting': 'Experiment with clubs, axes and fighting staves.',
  Mysticism: 'Explore mystical staves, spiritual totems and unfamiliar forces.',
  Necromancy: 'Investigate forbidden knowledge and the risks carried by death magic.',
  Parry: 'Discover how shields and defensive weapons can change the rhythm of combat.',
  Poisoning: 'Learn how dangerous substances alter tools, enemies and difficult choices.',
  'Remove Trap': 'Understand mechanisms well enough to make hidden danger harmless.',
  Fencing: 'Experiment with fast thrusting weapons and daggers.',
  Swordsmanship: 'Learn the possibilities of knives and bladed weapons.',
  Perception: 'Notice details that reveal hidden paths, threats and opportunities.',
})

export const PROFICIENCY_CATEGORIES = Object.freeze([
  Object.freeze({ id: 'combat', name: 'Combat', proficiencies: Object.freeze(['Archery', 'Mace Fighting', 'Fencing', 'Swordsmanship', 'Parry', 'Fleeing']) }),
  Object.freeze({ id: 'magic', name: 'Magic & Spiritual', proficiencies: Object.freeze(['Magery', 'Mysticism', 'Necromancy', 'Meditation', 'Inscription', 'Chivalry']) }),
  Object.freeze({ id: 'exploration', name: 'Exploration & Survival', proficiencies: Object.freeze(['Camping', 'Scouting', 'Fishing', 'Animal Lore', 'Perception', 'Detect Hidden']) }),
  Object.freeze({ id: 'crafting', name: 'Crafting & Knowledge', proficiencies: Object.freeze(['Alchemy', 'Arms Lore', 'Cooking', 'Healing', 'Evaluate Intelligence', 'Bardic']) }),
  Object.freeze({ id: 'subterfuge', name: 'Subterfuge', proficiencies: Object.freeze(['Lockpicking', 'Remove Trap', 'Poisoning']) }),
])

export const EQUIPMENT_SLOTS = Object.freeze([
  ['mainHand', 'Main Hand'], ['offHand', 'Off Hand'], ['head', 'Head'], ['neck', 'Neck'], ['chest', 'Chest'],
  ['gloves', 'Gloves'], ['legs', 'Legs'], ['feet', 'Feet'], ['cloak', 'Cloak'], ['robe', 'Robe'],
  ['ringLeft', 'Ring'], ['ringRight', 'Ring'], ['bracelet', 'Bracelet'],
].map(([id, name]) => Object.freeze({ id, name })))

export { WEAPON_LIST as STARTING_WEAPONS } from './weapons.js'

export const FANTASY_NAMES = Object.freeze(['Aldren', 'Brina', 'Caelan', 'Daria', 'Eryndor', 'Fiora', 'Garrick', 'Lyra', 'Marek', 'Seraphine'])
