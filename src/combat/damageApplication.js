export function applyDamage(target, damage) {
  const previousHealth = target.currentHealth
  target.currentHealth = Math.max(0, previousHealth - Math.max(0, damage))
  target.alive = target.currentHealth > 0
  return { previousHealth, currentHealth: target.currentHealth, defeated: !target.alive }
}
