import { interpolateMultiplier } from './encounterFrequencyProfiles.js'
export class EncounterMeterService {
  calculateGain(context, profile) { const terrainMultiplier = context.locationTags.includes('Road') ? profile.roadMeterGainMultiplier : context.locationTags.includes('Wilderness') ? profile.wildernessMeterGainMultiplier : 0; const timeMultiplier = context.isNight ? profile.nightMeterGainMultiplier : profile.dayMeterGainMultiplier; const nightThreatMultiplier = context.isNight ? interpolateMultiplier(profile.nightThreatMultiplierCurve, context.nightThreatPercent) : 1; const regionThreatMultiplier = interpolateMultiplier(profile.regionThreatMultiplierCurve, context.regionThreatLevel); return { gain: context.travelDistance * terrainMultiplier * timeMultiplier * nightThreatMultiplier * regionThreatMultiplier, terrainMultiplier, timeMultiplier, nightThreatMultiplier, regionThreatMultiplier } }
  add(state, amount) { state.encounterMeterValue = Math.max(0, state.encounterMeterValue + amount); return state.encounterMeterValue }
  reset(state) { state.encounterMeterValue = 0 }
  rollThreshold(profile, randomSource) { const minimum = profile.baseMeterThresholdMinimum; const maximum = profile.baseMeterThresholdMaximum; return minimum + Math.floor(Math.min(.999999, Math.max(0, randomSource())) * (maximum - minimum + 1)) }
}
