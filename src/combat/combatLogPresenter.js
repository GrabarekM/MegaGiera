export function buildCombatFeed(log) {
  return log.flatMap((entry) => {
    if (entry.type === 'round_started') return [{ id: entry.id, round: entry.round, text: `Round ${entry.round}`, kind: 'round' }]
    if (entry.type === 'skill_used') {
      const icon = entry.data.actorType === 'enemy' ? '🐺' : '⚔'
      return [{ id: entry.id, round: entry.round, text: `${icon} ${entry.text}`, kind: 'action' }]
    }
    if (entry.type === 'attack_missed') return [{ id: entry.id, round: entry.round, text: 'Miss', kind: 'miss' }]
    if (entry.type === 'block_gained') return [{ id: entry.id, round: entry.round, text: `${entry.data.targetName ?? 'Player'} gains ${entry.data.gainedBlock} Block`, kind: 'block' }]
    if (entry.type === 'damage_resolved') return [{ id: entry.id, round: entry.round, text: `${entry.data.actorName} deals ${entry.data.damage} damage`, kind: 'damage' }]
    if (entry.type === 'block_absorbed') {
      const text = entry.data.remainingDamage === 0 ? 'Block absorbs all damage' : `Block absorbs ${entry.data.absorbed} damage`
      return [{ id: entry.id, round: entry.round, text, kind: 'block' }]
    }
    if (entry.type === 'health_changed') {
      return entry.data.damage > 0 ? [{ id: entry.id, round: entry.round, text: `${entry.data.targetName} loses ${entry.data.damage} HP`, kind: 'damage' }] : []
    }
    if (entry.type === 'combat_result') {
      return [{ id: entry.id, round: entry.round, text: `${entry.data.defeatedName} was defeated`, kind: 'result' }]
    }
    return []
  })
}

export function buildDetailedCombatLog(log) {
  const actions = []
  for (let index = 0; index < log.length; index += 1) {
    const used = log[index]
    if (used.type !== 'skill_used') continue
    const details = []
    for (let cursor = index + 1; cursor < log.length && log[cursor].type !== 'skill_used'; cursor += 1) {
      details.push(log[cursor])
      if (log[cursor].type === 'health_changed') break
    }
    const roll = details.find((entry) => entry.type === 'dice_rolled')
    const blockGained = details.find((entry) => entry.type === 'block_gained')
    const damage = details.find((entry) => entry.type === 'damage_resolved')
    const health = details.find((entry) => entry.type === 'health_changed')
    const block = details.find((entry) => entry.type === 'block_absorbed')
    const weaponCheck = details.find((entry) => entry.type === 'weapon_check')
    if (blockGained && roll) {
      actions.push({
        id: used.id, round: used.round, kind: 'guard', title: used.text,
        stat: blockGained.data.stat, statValue: blockGained.data.statValue,
        dice: `d${roll.data.die}`, roll: roll.data.roll, calculation: blockGained.data.calculation,
        gainedBlock: blockGained.data.gainedBlock, previousBlock: blockGained.data.previousBlock,
        currentBlock: blockGained.data.currentBlock, sourceLogIds: [used.id, roll.id, blockGained.id],
      })
      continue
    }
    if (weaponCheck && !weaponCheck.data.hit) {
      actions.push({
        id: used.id, round: used.round, kind: 'miss', title: used.text,
        weaponCheck: { ...weaponCheck.data }, result: 'Miss',
        dice: 'Hit check', roll: 'Failed', calculation: 'Miss due to insufficient proficiency.',
        targetName: 'Result', previousHealth: '', currentHealth: 'Miss',
        sourceLogIds: [used.id, weaponCheck.id, ...details.filter((entry) => entry.type === 'attack_missed').map((entry) => entry.id)],
      })
      continue
    }
    if (!roll || !damage || !health) continue
    actions.push({
      id: used.id,
      round: used.round,
      title: used.text,
      stat: damage.data.stat,
      statValue: damage.data.statValue,
      dice: `d${roll.data.die}`,
      roll: roll.data.roll,
      calculation: damage.data.calculation,
      damage: damage.data.damage,
      targetName: health.data.targetName,
      previousHealth: health.data.previousHealth,
      currentHealth: health.data.currentHealth,
      block: block ? { previousBlock: block.data.previousBlock, currentBlock: block.data.currentBlock, absorbed: block.data.absorbed } : null,
      weaponCheck: weaponCheck ? { ...weaponCheck.data } : null,
      sourceLogIds: [used.id, roll.id, damage.id, ...(block ? [block.id] : []), health.id],
    })
  }
  return actions
}

export function buildEnemyDecisionLogs(log) {
  return log.filter((entry) => entry.type === 'enemy_ai_selected').map((entry) => ({
    id: entry.id,
    round: entry.round,
    selectedSkillName: entry.data.selectedSkillName,
    reason: entry.data.reason,
    sourceLogId: entry.id,
  }))
}
