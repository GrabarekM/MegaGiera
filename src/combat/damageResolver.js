export function resolveDamage({ actor, skill, diceService, weapon = null, damageMultiplier = 1 }) {
  const roll = diceService.roll(skill.dice)
  const statValue = Number(actor.stats?.[skill.usedStat] ?? 0) * Number(skill.statScaling ?? 1)
  const baseDamage = Number(skill.baseDamage ?? 0) + Number(weapon?.baseDamage ?? 0)
  const rawDamage = baseDamage + statValue + roll
  const damage = Math.max(0, Math.floor(rawDamage * damageMultiplier))
  const parts = [baseDamage, statValue, roll].filter((value, index) => value !== 0 || index === 2)
  const calculation = damageMultiplier === 1 ? `${parts.join(' + ')} = ${damage}` : `(${parts.join(' + ')}) × ${damageMultiplier.toFixed(4)} = ${damage}`
  return {
    roll, damage, die: skill.dice, stat: skill.usedStat, statValue, baseDamage, calculation,
    ...(damageMultiplier !== 1 ? { rawDamage, damageMultiplier } : {}),
  }
}
