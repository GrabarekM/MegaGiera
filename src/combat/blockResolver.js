export function resolveBlock(target, incomingDamage) {
  const damage = Math.max(0, Number(incomingDamage) || 0)
  const previousBlock = Math.max(0, Number(target.currentBlock) || 0)
  const absorbed = Math.min(previousBlock, damage)
  const remainingDamage = Math.max(0, damage - absorbed)
  target.currentBlock = previousBlock - absorbed
  return { incomingDamage: damage, previousBlock, absorbed, currentBlock: target.currentBlock, remainingDamage }
}
