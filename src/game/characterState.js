export const CHARACTER_DEFAULTS = Object.freeze({
  level: 1,
  experience: 0,
  maxHealth: 18,
  gold: 0,
  stats: Object.freeze({ might: 3, agility: 3, wits: 3, will: 3 }),
})

export function createCharacterState({ id, name = 'Hero', characterClass }) {
  if (!id || !characterClass) throw new Error('Character id and class are required.')
  return {
    id,
    name,
    class: characterClass,
    level: CHARACTER_DEFAULTS.level,
    experience: CHARACTER_DEFAULTS.experience,
    health: { current: CHARACTER_DEFAULTS.maxHealth, max: CHARACTER_DEFAULTS.maxHealth },
    gold: CHARACTER_DEFAULTS.gold,
    stats: { ...CHARACTER_DEFAULTS.stats },
    equipment: { weapon: null, armor: null, accessory: null },
    inventory: [],
    statuses: [],
    flags: {},
  }
}

export function cloneCharacterState(character) {
  return {
    ...character,
    health: { ...character.health },
    stats: { ...character.stats },
    equipment: { ...character.equipment },
    inventory: [...character.inventory],
    statuses: character.statuses.map((status) => typeof status === 'object' ? { ...status } : status),
    flags: { ...character.flags },
  }
}

export function restoreCharacterState(saved, fallback) {
  if (!saved) return cloneCharacterState(fallback)
  return cloneCharacterState({
    ...fallback,
    ...saved,
    health: { ...fallback.health, ...saved.health },
    stats: { ...fallback.stats, ...saved.stats },
    equipment: { ...fallback.equipment, ...saved.equipment },
    inventory: Array.isArray(saved.inventory) ? saved.inventory : [],
    statuses: Array.isArray(saved.statuses) ? saved.statuses : [],
    flags: saved.flags && typeof saved.flags === 'object' ? saved.flags : {},
  })
}

export function isValidCharacterState(character) {
  return Boolean(character && typeof character.id === 'string' && typeof character.name === 'string'
    && typeof character.class === 'string' && Number.isInteger(character.level) && character.level >= 1
    && Number.isInteger(character.experience) && character.experience >= 0
    && character.health?.current >= 0 && character.health?.current <= character.health?.max
    && Number.isInteger(character.gold) && character.gold >= 0
    && ['might', 'agility', 'wits', 'will'].every((stat) => Number.isInteger(character.stats?.[stat]))
    && character.equipment && ['weapon', 'armor', 'accessory'].every((slot) => slot in character.equipment)
    && Array.isArray(character.inventory) && Array.isArray(character.statuses)
    && character.flags && typeof character.flags === 'object')
}
