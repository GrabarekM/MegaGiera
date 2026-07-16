import { COMBATANT_TYPE } from './combatConstants.js'

export function compareOpeningInitiative({ player, enemy, attribute, initiator }) {
  const playerValue = Number(player.stats?.[attribute] ?? 0)
  const enemyValue = Number(enemy.stats?.[attribute] ?? 0)
  const winner = playerValue === enemyValue
    ? initiator
    : playerValue > enemyValue ? COMBATANT_TYPE.PLAYER : COMBATANT_TYPE.ENEMY
  return { attribute, winner, playerValue, enemyValue }
}

export function orderFirstRoundActions(actions, initiativeWinner, combatantsById) {
  return [...actions]
    .sort((left, right) => {
      const leftWins = combatantsById.get(left.combatantId)?.type === initiativeWinner
      const rightWins = combatantsById.get(right.combatantId)?.type === initiativeWinner
      if (leftWins !== rightWins) return leftWins ? -1 : 1
      return left.combatantId.localeCompare(right.combatantId)
    })
    .map((action, index) => ({ ...action, position: index + 1, finalInitiative: null }))
}

export function resolveInitiative(actions, combatantsById) {
  return [...actions].sort((left, right) => {
    if (right.skill.initiative !== left.skill.initiative) return right.skill.initiative - left.skill.initiative
    const leftPlayer = combatantsById.get(left.combatantId).type === COMBATANT_TYPE.PLAYER
    const rightPlayer = combatantsById.get(right.combatantId).type === COMBATANT_TYPE.PLAYER
    if (leftPlayer !== rightPlayer) return leftPlayer ? -1 : 1
    return left.combatantId.localeCompare(right.combatantId)
  }).map((action, index) => ({ ...action, position: index + 1, finalInitiative: action.skill.initiative }))
}
