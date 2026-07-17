export const ENCOUNTER_UI_MESSAGES = Object.freeze({
  ENCOUNTER_PRESENTATION_READY: 'An encounter interrupts your journey.', ENCOUNTER_INVALID_PHASE: 'That action is not available now.',
  DETECTION_SUCCESS: 'You noticed the encounter in time.', DETECTION_FAILURE: 'The threat caught you unaware.', DETECTION_CRITICAL_SUCCESS: 'You read the situation perfectly.', DETECTION_CRITICAL_FAILURE: 'You were completely surprised.',
  CHOICE_LOCKED: 'You do not meet the requirements.', CHOICE_EXHAUSTED: 'This choice has already been attempted.', CHOICE_COST_PAYMENT_FAILED: 'You cannot pay the required cost.',
  ENCOUNTER_COMBAT_STARTED: 'Combat begins.', ENCOUNTER_COMBAT_ALREADY_PENDING: 'Combat is already active.', ENCOUNTER_LOOT_PENDING: 'Rewards are waiting to be claimed.',
  ENCOUNTER_RESOLUTION_PENDING: 'The encounter is still being resolved.', ENCOUNTER_FINALIZED: 'The encounter has ended.', ENCOUNTER_CANCELLED: 'The encounter was cancelled.',
})
export const getEncounterUiMessage = (result) => ENCOUNTER_UI_MESSAGES[result?.code] ?? result?.message ?? 'The encounter state was updated.'

