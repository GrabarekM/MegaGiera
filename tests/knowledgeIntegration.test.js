import assert from 'node:assert/strict'
import test from 'node:test'
import { PROFICIENCY_NAMES } from '../src/data/characterCreation.js'
import { KNOWLEDGE } from '../src/data/knowledge.js'
import { MENTOR_LESSONS, MENTORS } from '../src/data/mentors.js'
import { LESSONS, TRAINERS } from '../src/data/trainers.js'
import { createCharacterState, restoreCharacterState } from '../src/game/characterState.js'
import { getDiscoveredKnowledge, getKnowledge, grantKnowledge, hasKnowledge, resetKnowledge } from '../src/game/knowledgeService.js'
import { isLessonRevealed, revealEligibleLessons } from '../src/npc/lessonVisibilityService.js'
import { evaluateRequirement } from '../src/npc/trainingRequirementSystem.js'
import { applyReward } from '../src/npc/trainingRewardSystem.js'

const hero = () => createCharacterState({ id: 'knowledge-hero', name: 'Hero', proficiencies: Object.fromEntries(PROFICIENCY_NAMES.map((name) => [name, ['Camping', 'Swordsmanship'].includes(name) ? 'Novice' : 'Untrained'])), startingSkills: ['player_strike'] })

test('KnowledgeService grants, finds and lists one immutable discovery record', () => {
  const character = hero()
  const result = grantKnowledge(character, 'hunters_legacy', { discoveredDay: 4, sourceType: 'trainer', sourceId: 'village_hunter' })
  assert.equal(result.ok, true); assert.equal(hasKnowledge(character, 'hunters_legacy'), true)
  assert.equal(grantKnowledge(character, 'hunters_legacy').code, 'KNOWLEDGE_ALREADY_DISCOVERED')
  assert.equal(getKnowledge('hunters_legacy').displayName, "Hunter's Legacy")
  assert.deepEqual(getDiscoveredKnowledge(character)[0].record, undefined)
  assert.deepEqual(character.knowledgeRecords[0], { knowledgeId: 'hunters_legacy', discoveredDay: 4, sourceType: 'trainer', sourceId: 'village_hunter' })
})

test('GrantKnowledge reward delegates to KnowledgeService and records context', () => {
  const character = hero()
  const result = applyReward(character, { type: 'grant_knowledge', knowledgeId: 'old_kingdom_history' }, { day: 2, sourceType: 'mentor', sourceId: 'sword_master' })
  assert.equal(result.code, 'KNOWLEDGE_GRANTED')
  assert.deepEqual(character.knowledgeRecords[0], { knowledgeId: 'old_kingdom_history', discoveredDay: 2, sourceType: 'mentor', sourceId: 'sword_master' })
})

test('Knowledge requirement supports one, all and any without exposing secret names', () => {
  const character = hero()
  assert.equal(evaluateRequirement(character, { type: 'knowledge', knowledgeId: 'forbidden_arts' }).met, false)
  assert.equal(evaluateRequirement(character, { type: 'knowledge', knowledgeId: 'forbidden_arts' }).required, 'Required Knowledge')
  grantKnowledge(character, 'forbidden_arts')
  assert.equal(evaluateRequirement(character, { type: 'knowledge', knowledgeId: 'forbidden_arts' }).met, true)
  assert.equal(evaluateRequirement(character, { type: 'knowledge', knowledgeIds: ['forbidden_arts', 'ancient_shrine'] }).met, false)
  assert.equal(evaluateRequirement(character, { type: 'knowledge', knowledgeIds: ['forbidden_arts', 'ancient_shrine'], match: 'any' }).met, true)
})

test('Knowledge reveals Trainer and Mentor hidden lessons only on explicit reevaluation', () => {
  const character = hero()
  assert.equal(isLessonRevealed(character, LESSONS.hunter_legacy_technique), false)
  assert.equal(isLessonRevealed(character, MENTOR_LESSONS.forbidden_preparation), false)
  grantKnowledge(character, 'hunters_legacy'); grantKnowledge(character, 'forbidden_arts')
  assert.equal(isLessonRevealed(character, LESSONS.hunter_legacy_technique), false)
  const revealed = revealEligibleLessons(character, [TRAINERS.village_hunter, MENTORS.necromancer]).map(({ id }) => id)
  assert.deepEqual(revealed.sort(), ['hunter_legacy_technique', 'mentor_forbidden_preparation'])
})

test('secret Knowledge is absent before discovery and visible afterwards', () => {
  const character = hero()
  assert.equal(KNOWLEDGE.forbidden_arts.isSecret, true)
  assert.equal(getKnowledge('forbidden_arts', { character }), null)
  assert.equal(getDiscoveredKnowledge(character).some(({ knowledgeId }) => knowledgeId === 'forbidden_arts'), false)
  grantKnowledge(character, 'forbidden_arts')
  assert.equal(getKnowledge('forbidden_arts', { character }).displayName, 'Forbidden Arts')
})

test('Knowledge persists, legacy saves migrate, and a new run starts empty', () => {
  const character = hero(); grantKnowledge(character, 'ancient_shrine', { discoveredDay: 5 })
  const restored = restoreCharacterState(JSON.parse(JSON.stringify(character)), hero())
  assert.deepEqual(restored.discoveredKnowledge, ['ancient_shrine']); assert.equal(restored.knowledgeRecords[0].discoveredDay, 5)
  const legacy = { ...character }; delete legacy.discoveredKnowledge; delete legacy.knowledgeRecords
  const migrated = restoreCharacterState(legacy, hero())
  assert.deepEqual(migrated.discoveredKnowledge, []); assert.deepEqual(migrated.knowledgeRecords, [])
  assert.deepEqual(hero().discoveredKnowledge, [])
  resetKnowledge(restored); assert.deepEqual(restored.knowledgeRecords, [])
})

test('Knowledge UI, one-time notification and developer tools are connected', async () => {
  const { readFile } = await import('node:fs/promises')
  const menu = await readFile(new URL('../src/views/MenuThree.vue', import.meta.url), 'utf8')
  const panels = await readFile(new URL('../src/ui/panelManager.js', import.meta.url), 'utf8')
  assert.match(panels, /id: 'knowledge'/)
  assert.match(menu, /New Knowledge Discovered/); assert.match(menu, /getDiscoveredKnowledge\(characterState\)/)
  assert.match(menu, /Knowledge: Grant All/); assert.match(menu, /Knowledge: Re-evaluate Lessons/)
})
