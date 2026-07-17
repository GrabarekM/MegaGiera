const outcomeIdsFor = (action) => [action.defaultOutcomeId, action.successOutcomeId, action.failureOutcomeId].filter(Boolean)

export function validatePoiData({ definitions = [], actions = {}, outcomes = {}, encounterIds = [], lootTableIds = [] } = {}) {
  const errors = []
  const warnings = []
  const knownEncounters = new Set(encounterIds)
  const knownLootTables = new Set(lootTableIds)
  const addError = (code, details = {}) => errors.push({ code, ...details })

  for (const definition of definitions) {
    const stateIds = new Set(definition.stateDefinitions.map(({ id }) => id))
    if (!stateIds.has(definition.initialStateId)) addError('INVALID_INITIAL_STATE', { poiId: definition.id, stateId: definition.initialStateId })
    for (const state of definition.stateDefinitions) {
      const actionIds = new Set()
      for (const actionId of state.availableActionIds ?? []) {
        if (actionIds.has(actionId)) addError('DUPLICATE_STATE_ACTION', { poiId: definition.id, stateId: state.id, actionId })
        actionIds.add(actionId)
        const action = actions[actionId]
        if (!action) { addError('MISSING_ACTION', { poiId: definition.id, stateId: state.id, actionId }); continue }
        for (const outcomeId of outcomeIdsFor(action)) if (!outcomes[outcomeId]) addError('MISSING_OUTCOME', { poiId: definition.id, actionId, outcomeId })
      }
    }
  }

  for (const outcome of Object.values(outcomes)) {
    for (const encounter of outcome.encounters ?? []) if (knownEncounters.size && !knownEncounters.has(encounter.encounterId)) addError('MISSING_ENCOUNTER', { outcomeId: outcome.id, encounterId: encounter.encounterId })
    for (const reward of outcome.randomRewardTableIds ?? []) if (knownLootTables.size && !knownLootTables.has(reward.lootTableId)) addError('MISSING_LOOT_TABLE', { outcomeId: outcome.id, lootTableId: reward.lootTableId })
    if (outcome.markExhausted && !outcome.markCompleted) warnings.push({ code: 'EXHAUSTED_WITHOUT_COMPLETED', outcomeId: outcome.id })
  }
  return { valid: errors.length === 0, errors, warnings }
}
