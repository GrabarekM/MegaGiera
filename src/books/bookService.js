import { hasKnowledge } from '../game/knowledgeService.js'
import { ITEM_QUALITY } from '../items/itemConstants.js'
import { synchronizeLegacyProficiency } from '../skills/proficiencySystem.js'
import { SKILL_RANK_DEFINITIONS } from '../skills/skillRankDefinitions.js'
import { BOOK_KIND } from './bookDefinitions.js'
import { BOOK_STATUS } from './bookDefinitions.js'
import { markKnowledgeBookKnown, recordFoundBook, setLibraryBookStatus } from './bookCollectionService.js'
import { RewardService } from '../rewards/rewardService.js'
import { NotificationService } from '../ui/notificationService.js'

export const BOOK_MESSAGE = Object.freeze({ CANNOT_UNDERSTAND: 'You cannot understand this book yet.' })
const qualityGain = Object.freeze({ [ITEM_QUALITY.POOR]: 0.5, [ITEM_QUALITY.NORMAL]: 1, [ITEM_QUALITY.EXCELLENT]: 1.5 })
const result = (ok, code, data = {}) => ({ ok, code, messages: data.message ? [data.message] : [], ...data })
const rankIndex = (rank) => SKILL_RANK_DEFINITIONS.findIndex(({ name }) => name === rank)

export const getManualSkillGain = (definition) => definition.bookData.skillGain * (qualityGain[definition.quality] ?? 1)
export function canUseSkillManual(character, definition) {
  const data = definition?.bookData
  if (!data || data.kind !== BOOK_KIND.SKILL_MANUAL) return { ok: false, code: 'ITEM_IS_NOT_SKILL_MANUAL' }
  if (!data.repeatable && character.libraryRecords?.some(({ bookId, status }) => bookId === definition.id && status === BOOK_STATUS.CONSUMED)) return { ok: false, code: 'BOOK_ALREADY_STUDIED' }
  const progress = synchronizeLegacyProficiency(character, data.affectedSkill)
  if (progress.baseValue < data.minimumBaseSkill || progress.baseValue >= data.maximumBaseSkill) return { ok: false, code: 'MANUAL_TIER_INVALID' }
  return progress.baseValue + getManualSkillGain(definition) <= Math.min(progress.currentRankCap, progress.maximumCap) ? { ok: true } : { ok: false, code: 'CURRENT_RANK_CAP_REACHED' }
}

export class BookService {
  constructor({ character, inventoryManager, rewardService = null, notificationService = null }) { this.character = character; this.inventory = inventoryManager; this.rewards = rewardService ?? new RewardService({ character, inventoryManager }); this.notifications = notificationService ?? new NotificationService() }

  evaluateRequirements(requirements = []) {
    const failed = requirements.filter((requirement) => {
      if (requirement.type === 'wisdom') return (this.character.stats?.wisdom ?? 0) < requirement.minimum
      if (requirement.type === 'knowledge') return !hasKnowledge(this.character, requirement.knowledgeId)
      if (requirement.type === 'skill_rank') return rankIndex(synchronizeLegacyProficiency(this.character, requirement.skill).currentRank) < rankIndex(requirement.rank)
      if (requirement.type === 'language') return !(this.character.knownLanguages ?? this.character.flags?.languages ?? []).includes(requirement.language)
      if (requirement.type === 'quest' || requirement.type === 'quest_flag') return !this.character.flags?.[requirement.flag ?? requirement.questId]
      return true
    })
    return { met: failed.length === 0, failed }
  }

  useBook(instance, definition, context = {}) {
    const data = definition.bookData
    if (!data) return result(false, 'BOOK_DEFINITION_MISSING')
    recordFoundBook(this.character, definition, { foundDate: instance.acquiredAt ?? null, source: instance.state?.source ?? 'inventory' })
    const requirements = this.evaluateRequirements(data.requirements)
    if (!requirements.met) { setLibraryBookStatus(this.character, definition.id, BOOK_STATUS.UNAVAILABLE); return this.finish(result(false, 'BOOK_REQUIREMENTS_NOT_MET', { message: BOOK_MESSAGE.CANNOT_UNDERSTAND, requirements }), definition) }
    if ([BOOK_KIND.MAP_SCROLL, BOOK_KIND.RITUAL_SCROLL].includes(data.kind)) return result(false, 'BOOK_EFFECT_NOT_IMPLEMENTED', { message: 'This scroll cannot be used yet.' })
    const libraryRecord = this.character.libraryRecords?.find(({ bookId }) => bookId === definition.id)
    if (!data.repeatable && (instance.state?.known || [BOOK_STATUS.KNOWN, BOOK_STATUS.CONSUMED].includes(libraryRecord?.status))) return this.finish(result(false, 'BOOK_ALREADY_STUDIED', { message: 'Book already studied.' }), definition)
    if (data.kind === BOOK_KIND.SKILL_MANUAL) { const validation = canUseSkillManual(this.character, definition); if (!validation.ok) return this.finish(result(false, validation.code, { message: validation.code === 'MANUAL_TIER_INVALID' ? 'This manual is not suitable for your current skill level.' : `You must unlock the next ${data.affectedSkill} rank first.` }), definition) }
    const progress = data.affectedSkill ? synchronizeLegacyProficiency(this.character, data.affectedSkill) : null
    if (data.kind === BOOK_KIND.MASTER_TREATISE && progress.maximumCap !== 100) return this.finish(result(false, 'MASTER_TREATISE_ALREADY_APPLIED', { message: 'This treatise can no longer expand your skill cap.' }), definition)
    if (data.kind === BOOK_KIND.LEGENDARY_TOME && progress.maximumCap < 105) return this.finish(result(false, 'LEGENDARY_TOME_REQUIRES_MASTER_TREATISE', { message: 'A Master Treatise must be understood first.' }), definition)
    const effects = data.effects.map((effect) => effect.type === 'grant_skill' && data.kind === BOOK_KIND.SKILL_MANUAL ? { ...effect, amount: getManualSkillGain(definition) } : effect)
    const applied = this.rewards.applyMany(effects, { day: context.time?.day ?? null, sourceType: definition.itemType === 'Scroll' ? 'scroll' : 'book', sourceId: definition.id })
    if (!applied.ok) { setLibraryBookStatus(this.character, definition.id, BOOK_STATUS.UNAVAILABLE); const blocker = applied.validations?.find(({ ok }) => !ok)?.code; return this.finish(result(false, blocker ?? applied.code, { message: blocker === 'KNOWLEDGE_ALREADY_DISCOVERED' ? 'Book already studied.' : 'This book cannot be used right now.' }), definition) }
    if (data.kind === BOOK_KIND.KNOWLEDGE_BOOK) { this.inventory.replace(instance.instanceId, { state: { ...instance.state, known: true, protected: Boolean(data.protected) } }); markKnowledgeBookKnown(this.character, definition.id) }
    else if (data.destroyOnUse) { this.inventory.remove(instance.instanceId, 1); setLibraryBookStatus(this.character, definition.id, BOOK_STATUS.CONSUMED) }
    if (data.kind === BOOK_KIND.MASTER_TREATISE) this.character.usedTreatiseIds.push(definition.id)
    if (data.kind === BOOK_KIND.LEGENDARY_TOME) this.character.usedLegendaryTomeIds.push(definition.id)
    if (data.kind === BOOK_KIND.SKILL_MANUAL) this.character.usedManualIds.push(definition.id)
    return this.finish(result(true, 'BOOK_USED', { used: definition.displayName, rewards: applied.results, messages: applied.messages }), definition)
  }

  finish(value, definition) { for (const message of value.messages ?? []) this.notifications.notify(message, { sourceType: 'book', sourceId: definition.id, code: value.code }); return value }
}
