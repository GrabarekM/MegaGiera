import { grantKnowledge } from '../game/knowledgeService.js'
import { RewardService } from '../rewards/rewardService.js'
import { REWARD_TYPE } from '../rewards/rewardDefinitions.js'
import { unlockNextProficiencyRank } from '../skills/proficiencySystem.js'

export function gainAttribute(character, attribute, amount = 1) {
  if (!(attribute in character.stats)) return { ok: false, reason: 'unknown-attribute' }
  character.stats[attribute] = Math.min(10, character.stats[attribute] + Math.max(0, Math.trunc(amount)))
  return { ok: true, value: character.stats[attribute] }
}

export function upgradeProficiency(character, proficiency) {
  if (!(proficiency in character.proficiencies)) return { ok: false, reason: 'unknown-proficiency' }
  const result = unlockNextProficiencyRank(character, proficiency)
  return result.ok ? result : { ok: false, reason: result.code }
}

export function unlockCombatSkill(character, skillId) {
  if (character.startingSkills.includes(skillId)) return { ok: false, reason: 'skill-known' }
  character.startingSkills.push(skillId)
  return { ok: true, skillId }
}

const addUnique = (list, id) => list.includes(id) ? false : Boolean(list.push(id))

const handlers = Object.freeze({
  increase_attribute: (character, reward) => gainAttribute(character, reward.attribute, reward.amount),
  upgrade_proficiency: (character, reward) => upgradeProficiency(character, reward.proficiency),
  unlock_combat_skill: (character, reward) => unlockCombatSkill(character, reward.skillId),
  unlock_passive_skill: (character, reward) => addUnique(character.passiveSkills, reward.passiveSkillId) ? { ok: true, passiveSkillId: reward.passiveSkillId } : { ok: false, reason: 'passive-known' },
  unlock_specialization: (character, reward) => addUnique(character.specializations, reward.specializationId) ? { ok: true, specializationId: reward.specializationId } : { ok: false, reason: 'specialization-known' },
  set_character_flag: (character, reward) => { character.flags[reward.flag] = reward.value ?? true; return { ok: true, flag: reward.flag } },
  add_mentor_journal_entry: (character, reward) => { if (character.mentorJournalEntries.some((entry) => entry.id === reward.entry?.id)) return { ok: false, reason: 'journal-entry-exists' }; character.mentorJournalEntries.push({ ...reward.entry }); return { ok: true } },
  grant_knowledge: (character, reward, context) => grantKnowledge(character, reward.knowledgeId, { discoveredDay: context?.day ?? reward.discoveredDay ?? null, sourceType: context?.sourceType ?? reward.sourceType ?? 'lesson', sourceId: context?.sourceId ?? reward.sourceId ?? null }),
})

export function applyReward(character, reward, context = {}) {
  if (Object.values(REWARD_TYPE).includes(reward.type)) return new RewardService({ character, inventoryManager: context.inventoryManager ?? null }).apply(reward, context)
  const handler = handlers[reward.type]
  return handler ? handler(character, reward, context) : { ok: false, reason: 'unsupported-reward' }
}
