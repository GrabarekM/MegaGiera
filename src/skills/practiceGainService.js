import { attemptPracticeGain } from './proficiencySystem.js'

export class PracticeGainService {
  constructor({ random = Math.random, antiGrindHooks = {} } = {}) { this.random = random; this.antiGrindHooks = antiGrindHooks; this.processedActions = new Set() }

  processSuccessfulAction(character, proficiency, { actionId, successful, context = {} } = {}) {
    if (!actionId) return { ok: false, code: 'ACTION_ID_REQUIRED' }
    if (this.processedActions.has(actionId)) return { ok: false, code: 'PRACTICE_ALREADY_ROLLED_FOR_ACTION' }
    this.processedActions.add(actionId)
    return attemptPracticeGain(character, proficiency, { successful, random: this.random, antiGrindContext: context, antiGrindHooks: this.antiGrindHooks })
  }

  clearActionHistory() { this.processedActions.clear() }
}
