export const COMBAT_STATUS = Object.freeze({
  PREPARING: 'preparing', ACTIVE: 'active', VICTORY: 'victory', DEFEAT: 'defeat',
  ESCAPED: 'escaped', CANCELLED: 'cancelled',
})

export const COMBAT_PHASE = Object.freeze({
  SETUP: 'setup', INITIATIVE_SELECTION: 'initiative_selection', PLAYER_SELECTION: 'player_selection', ENEMY_SELECTION: 'enemy_selection',
  INITIATIVE_RESOLUTION: 'initiative_resolution', ACTION_RESOLUTION: 'action_resolution',
  ROUND_END: 'round_end', COMBAT_END: 'combat_end',
})

export const COMBATANT_TYPE = Object.freeze({ PLAYER: 'player', ENEMY: 'enemy', ALLY: 'ally' })
export const COMBAT_INITIATOR = Object.freeze({ PLAYER: 'player', ENEMY: 'enemy' })
export const INITIATIVE_ATTRIBUTE = Object.freeze({
  MIGHT: 'might', DEFENSE: 'defense', VITALITY: 'vitality', AGILITY: 'agility',
  MAGIC_POWER: 'magicPower', WISDOM: 'wisdom',
})
export const INITIATIVE_ATTRIBUTES = Object.freeze(Object.values(INITIATIVE_ATTRIBUTE))
export const COMBAT_TARGET = Object.freeze({ SINGLE_ENEMY: 'single_enemy', SINGLE_PLAYER: 'single_player' })

export const COMBAT_ERROR = Object.freeze({
  COMBAT_ALREADY_ACTIVE: 'COMBAT_ALREADY_ACTIVE', NO_ACTIVE_COMBAT: 'NO_ACTIVE_COMBAT',
  INVALID_PHASE: 'INVALID_PHASE', INVALID_SKILL: 'INVALID_SKILL',
  INVALID_INITIATOR: 'INVALID_INITIATOR', INVALID_INITIATIVE_ATTRIBUTE: 'INVALID_INITIATIVE_ATTRIBUTE',
  COMBAT_ALREADY_FINISHED: 'COMBAT_ALREADY_FINISHED', INVALID_COMBATANT: 'INVALID_COMBATANT',
})

export const COMBAT_RESULT = Object.freeze({ VICTORY: 'victory', DEFEAT: 'defeat', ESCAPED: 'escaped', CANCELLED: 'cancelled' })
