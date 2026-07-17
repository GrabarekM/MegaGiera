import { revealAllLessons } from './lessonVisibilityService.js'

export const TEACHER_TYPE = Object.freeze({ TRAINER: 'Trainer', MENTOR: 'Mentor', LEGENDARY_MENTOR: 'Legendary Mentor' })
export const MENTOR_TIER = Object.freeze({ MENTOR: 'Mentor', MASTER: 'Master Mentor', LEGENDARY: 'Legendary Mentor' })
export const MENTOR_DISCOVERY = Object.freeze({ UNKNOWN: 'Unknown', RUMORED: 'Rumored', DISCOVERED: 'Discovered', MET: 'Met' })
export const PERSONAL_QUEST_STATE = Object.freeze({ UNAVAILABLE: 'unavailable', AVAILABLE: 'available', ACTIVE: 'active', COMPLETED: 'completed' })
const discoveryOrder = Object.values(MENTOR_DISCOVERY)

function ensureMentorState(character) {
  character.mentorProgress ??= {}
  character.mentorJournalEntries ??= []
  return character.mentorProgress
}

export function getMentorProgress(character, mentor) {
  const progress = ensureMentorState(character)
  progress[mentor.id] ??= { discoveryState: mentor.discoveryState ?? MENTOR_DISCOVERY.UNKNOWN, personalQuestState: mentor.personalQuestId ? PERSONAL_QUEST_STATE.UNAVAILABLE : null }
  return progress[mentor.id]
}

export function advanceMentorDiscovery(character, mentor, targetState) {
  if (!discoveryOrder.includes(targetState)) return { ok: false, code: 'INVALID_DISCOVERY_STATE' }
  const state = getMentorProgress(character, mentor)
  if (discoveryOrder.indexOf(targetState) < discoveryOrder.indexOf(state.discoveryState)) return { ok: false, code: 'DISCOVERY_STATE_CANNOT_REGRESS', state: state.discoveryState }
  const firstMeeting = state.discoveryState !== MENTOR_DISCOVERY.MET && targetState === MENTOR_DISCOVERY.MET
  state.discoveryState = targetState
  if (firstMeeting) {
    state.personalQuestState = mentor.personalQuestId ? PERSONAL_QUEST_STATE.AVAILABLE : null
    if (!character.metMentorIds.includes(mentor.id)) character.metMentorIds.push(mentor.id)
    if (!character.mentorJournalEntries.some((entry) => entry.mentorId === mentor.id)) character.mentorJournalEntries.push({ id: mentor.journalEntryId, mentorId: mentor.id, name: mentor.displayName, description: mentor.description, location: mentor.locationId, hint: mentor.discoveryHints?.[0] ?? '', specializations: [...mentor.specializations], hasActiveLessons: mentor.lessons.length > 0 })
  }
  return { ok: true, state: state.discoveryState, journalEntryAdded: firstMeeting }
}

export function getMentorPresentation(character, mentor) {
  const state = getMentorProgress(character, mentor).discoveryState
  if (state === MENTOR_DISCOVERY.UNKNOWN) return null
  if (state === MENTOR_DISCOVERY.RUMORED) return { id: mentor.id, displayName: mentor.rumorName ?? mentor.displayName, discoveryState: state, hints: mentor.discoveryHints, canOpen: false }
  return { ...mentor, discoveryState: state, canOpen: state === MENTOR_DISCOVERY.MET }
}

export function canOpenMentor(character, mentor) {
  const state = getMentorProgress(character, mentor).discoveryState
  if (state === MENTOR_DISCOVERY.UNKNOWN) return { ok: false, code: 'MENTOR_NOT_DISCOVERED' }
  if (state !== MENTOR_DISCOVERY.MET) return { ok: false, code: 'MENTOR_NOT_MET' }
  return { ok: true }
}

export function setPersonalQuestState(character, mentor, questState) {
  if (!mentor.personalQuestId) return { ok: false, code: 'PERSONAL_QUEST_NOT_AVAILABLE' }
  if (!Object.values(PERSONAL_QUEST_STATE).includes(questState)) return { ok: false, code: 'INVALID_QUEST_STATE' }
  getMentorProgress(character, mentor).personalQuestState = questState
  return { ok: true, state: questState }
}

export function revealMentorLessons(character, mentor, options) { return revealAllLessons(character, [mentor], options) }
export function resetMentorProgress(character, mentors) {
  const ids = new Set(mentors.map(({ id }) => id)); const lessonIds = new Set(mentors.flatMap(({ lessons }) => lessons.map(({ id }) => id)))
  for (const id of ids) delete character.mentorProgress[id]
  character.metMentorIds = character.metMentorIds.filter((id) => !ids.has(id))
  character.mentorJournalEntries = character.mentorJournalEntries.filter((entry) => !ids.has(entry.mentorId))
  character.revealedLessonIds = character.revealedLessonIds.filter((id) => !lessonIds.has(id))
  return { ok: true }
}
