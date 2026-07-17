import { KNOWLEDGE } from '../data/knowledge.js'

export function hasKnowledge(character, knowledgeId) { return character.discoveredKnowledge.includes(knowledgeId) }
export function getKnowledge(knowledgeId, { includeSecret = false, character = null } = {}) {
  const definition = KNOWLEDGE[knowledgeId] ?? null
  if (!definition || (definition.isSecret && !includeSecret && (!character || !hasKnowledge(character, knowledgeId)))) return null
  return definition
}
export function getDiscoveredKnowledge(character) {
  return character.knowledgeRecords.map((record) => ({ ...record, definition: getKnowledge(record.knowledgeId, { character }) })).filter(({ definition }) => definition)
}
export function grantKnowledge(character, knowledgeId, { discoveredDay = null, sourceType = 'unknown', sourceId = null } = {}) {
  const definition = getKnowledge(knowledgeId, { includeSecret: true })
  if (!definition) return { ok: false, code: 'KNOWLEDGE_NOT_FOUND' }
  if (hasKnowledge(character, knowledgeId)) return { ok: false, code: 'KNOWLEDGE_ALREADY_DISCOVERED', knowledge: definition }
  character.discoveredKnowledge.push(knowledgeId)
  const record = { knowledgeId, discoveredDay, sourceType, sourceId }
  character.knowledgeRecords.push(record)
  return { ok: true, code: 'KNOWLEDGE_GRANTED', knowledge: definition, record }
}
export function removeKnowledge(character, knowledgeId) {
  if (!hasKnowledge(character, knowledgeId)) return { ok: false, code: 'KNOWLEDGE_NOT_DISCOVERED' }
  character.discoveredKnowledge = character.discoveredKnowledge.filter((id) => id !== knowledgeId)
  character.knowledgeRecords = character.knowledgeRecords.filter((record) => record.knowledgeId !== knowledgeId)
  return { ok: true }
}
export function resetKnowledge(character) { character.discoveredKnowledge = []; character.knowledgeRecords = []; return { ok: true } }
export function grantAllKnowledge(character, context = {}) { return Object.keys(KNOWLEDGE).map((id) => grantKnowledge(character, id, context)).filter(({ ok }) => ok) }
