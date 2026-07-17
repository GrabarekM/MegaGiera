import { ENCOUNTER_MOVEMENT_LOCK, ENCOUNTER_SELECTION_RESULT, TRAVEL_TRIGGER_RESULT } from './encounterConstants.js'
const absoluteMinutes = (day, time) => (day - 1) * 1440 + (typeof time === 'object' ? (time.hour ?? 0) * 60 + (time.minute ?? 0) : time * 60)
export class EncounterTriggerService {
  constructor({ selectionService, meterService }) { this.selectionService = selectionService; this.meterService = meterService }
  execute(context, state, profile, randomSource) {
    const now = absoluteMinutes(context.worldDay, context.worldTime)
    state.lastEncounterCheckWorldDay = context.worldDay; state.lastEncounterCheckWorldTime = structuredClone(context.worldTime); state.distanceSinceLastEncounterCheck = 0
    this.meterService.reset(state); state.encounterCheckCooldownUntil = now + profile.checkCooldownWorldMinutes; state.encounterMeterThreshold = this.meterService.rollThreshold(profile, randomSource)
    const selectionContext = { ...context, currentSafeZoneStatus: context.isInSafeZone, triggerSource: 'Travel', randomSource }
    const selection = this.selectionService.selectEncounter(selectionContext)
    if (!selection.success || [ENCOUNTER_SELECTION_RESULT.NO_TABLE, ENCOUNTER_SELECTION_RESULT.NO_ELIGIBLE].includes(selection.resultCode)) return { ok: true, code: selection.resultCode, selection, movementBlocked: false }
    if (selection.resultCode === ENCOUNTER_SELECTION_RESULT.NONE) return { ok: true, code: ENCOUNTER_SELECTION_RESULT.NONE, selection, movementBlocked: false }
    const instance = selection.encounterInstance; instance.currentPhase = 'PendingTrigger'; this.selectionService.stateRepository.instances.save(instance)
    const stopped = context.stopMovement?.({ reason: ENCOUNTER_MOVEMENT_LOCK, encounterInstanceId: instance.instanceId }) !== false
    if (!stopped) return { ok: false, code: 'MOVEMENT_LOCK_FAILED', selection }
    state.pendingEncounterInstanceId = instance.instanceId; state.movementBlockedByEncounter = true; state.movementLockReason = ENCOUNTER_MOVEMENT_LOCK; state.distanceSinceLastTriggeredEncounter = 0; state.lastTriggeredEncounterInstanceId = instance.instanceId; state.globalEncounterCooldownUntil = now + profile.encounterCooldownWorldMinutes
    state.pendingTriggerState = { encounterInstanceId: instance.instanceId, selectedAtPosition: { ...context.currentPosition }, selectedWorldDay: context.worldDay, selectedWorldTime: structuredClone(context.worldTime), sourceTableId: instance.sourceTableId, triggerSource: instance.triggerSource, movementLockId: `${ENCOUNTER_MOVEMENT_LOCK}:${instance.instanceId}`, presentationReady: true, detectionPending: true, cancellationReason: null, createdByTravelSequence: state.travelSequenceCounter }
    return { ok: true, code: TRAVEL_TRIGGER_RESULT.PENDING, selection, encounterInstance: instance, pendingTriggerState: state.pendingTriggerState, movementBlocked: true }
  }
  clearPending(state, reason = null) { if (state.pendingTriggerState) state.pendingTriggerState.cancellationReason = reason; state.pendingEncounterInstanceId = null; state.movementBlockedByEncounter = false; state.movementLockReason = null; state.pendingTriggerState = null }
}
