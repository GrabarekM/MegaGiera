import { INITIATIVE_ATTRIBUTES } from './combatConstants.js'

const valueOf = (combatant, attribute) => Number(combatant.stats?.[attribute] ?? 0)

export function chooseInitiativeAttribute(enemy) {
  const preferred = enemy.preferredInitiativeStats?.filter((attribute) => INITIATIVE_ATTRIBUTES.includes(attribute)) ?? []
  const candidates = preferred.length > 0 ? preferred : INITIATIVE_ATTRIBUTES

  return candidates.reduce((best, attribute) => (
    valueOf(enemy, attribute) > valueOf(enemy, best) ? attribute : best
  ), candidates[0])
}
