export const LIGHT_SOURCE_TYPE = Object.freeze({ CAMPFIRE: 'Campfire', TORCH: 'Torch', LANTERN: 'Lantern', HOLY_LANTERN: 'Holy Lantern' })
export const LIGHT_SOURCE_CONFIG = Object.freeze({
  [LIGHT_SOURCE_TYPE.CAMPFIRE]: Object.freeze({ durationMinutes: null, isPortable: false, protectionTier: 1, maximumDemonTierBlocked: 1 }),
  [LIGHT_SOURCE_TYPE.TORCH]: Object.freeze({ durationMinutes: 120, isPortable: true, protectionTier: 1, maximumDemonTierBlocked: 1 }),
  [LIGHT_SOURCE_TYPE.LANTERN]: Object.freeze({ durationMinutes: null, isPortable: true, protectionTier: 1, maximumDemonTierBlocked: 1 }),
  [LIGHT_SOURCE_TYPE.HOLY_LANTERN]: Object.freeze({ durationMinutes: null, isPortable: true, protectionTier: 99, maximumDemonTierBlocked: 99 }),
})
export const LIGHT_SOURCES = LIGHT_SOURCE_CONFIG

export const isLightActive = (state) => Boolean(state?.isActive ?? state?.enabled) && (state?.remainingDurationMinutes == null || state.remainingDurationMinutes > 0)

export function createActiveLightSource(type, { sourceItemInstanceId = null, startedAt = null, remainingDurationMinutes, position = null } = {}) {
  const definition = LIGHT_SOURCE_CONFIG[type]
  if (!definition) return null
  const remaining = remainingDurationMinutes ?? definition.durationMinutes
  return { type, sourceItemInstanceId, startedAt, remainingDurationMinutes: remaining, remainingDuration: remaining, isPortable: definition.isPortable, isActive: true, enabled: true, protectionTier: definition.protectionTier, maximumDemonTierBlocked: definition.maximumDemonTierBlocked, position }
}

export function activateLightSource(character, type, options = {}) {
  if (!LIGHT_SOURCE_CONFIG[type]) return { ok: false, code: 'UNKNOWN_LIGHT_SOURCE' }
  if (isLightActive(character.activeLightSource) && character.activeLightSource.type !== type) return { ok: false, code: 'LIGHT_SOURCE_ALREADY_ACTIVE' }
  character.activeLightSource = createActiveLightSource(type, options)
  return { ok: true, lightSource: character.activeLightSource }
}
export function deactivateLightSource(character) { character.activeLightSource = null; if (character.lanternState) character.lanternState.isLit = false; if (character.holyLanternState) character.holyLanternState.enabled = false; return { ok: true } }
export function toggleHolyLantern(character, enabled) {
  if (isLightActive(character.activeLightSource) && character.activeLightSource.type !== LIGHT_SOURCE_TYPE.HOLY_LANTERN) return { ok: false, code: 'LIGHT_SOURCE_ALREADY_ACTIVE' }
  const next = enabled ?? !character.holyLanternState?.enabled
  character.holyLanternState = { ...(character.holyLanternState ?? {}), enabled: next }
  character.activeLightSource = next ? createActiveLightSource(LIGHT_SOURCE_TYPE.HOLY_LANTERN, { sourceItemInstanceId: character.holyLanternState.itemInstanceId }) : null
  return { ok: true, enabled: next }
}
export function consumeLightDuration(character, minutes) {
  const light = character.activeLightSource
  if (!isLightActive(light) || light.type === LIGHT_SOURCE_TYPE.CAMPFIRE || light.type === LIGHT_SOURCE_TYPE.HOLY_LANTERN) return { expired: false, lightSource: light }
  const current = light.type === LIGHT_SOURCE_TYPE.LANTERN ? character.lanternState.remainingFuelMinutes : light.remainingDurationMinutes
  const remaining = Math.max(0, current - Math.max(0, minutes))
  if (light.type === LIGHT_SOURCE_TYPE.LANTERN) character.lanternState.remainingFuelMinutes = remaining
  light.remainingDurationMinutes = remaining; light.remainingDuration = remaining
  if (!remaining) { if (light.type === LIGHT_SOURCE_TYPE.LANTERN) character.lanternState.isLit = false; character.activeLightSource = null; return { expired: true, type: light.type, message: light.type === LIGHT_SOURCE_TYPE.TORCH ? 'Your Wardwood torch has burned out.' : 'Your lantern has run out of fuel.' } }
  return { expired: false, lightSource: light }
}
export function canWaitUntilMorning(character) { return character.activeLightSource?.type === LIGHT_SOURCE_TYPE.CAMPFIRE && isLightActive(character.activeLightSource) }
