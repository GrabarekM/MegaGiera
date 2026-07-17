<script setup>
import { computed } from 'vue'
import { COMBAT_SKILLS } from '../data/combatSkills.js'
import { PROFICIENCY_RANKS } from '../data/characterCreation.js'
import { canTrain } from '../npc/trainerSystem.js'
import { getTrainerCompletionState } from '../npc/trainerSystem.js'
import { isLessonRevealed } from '../npc/lessonVisibilityService.js'

const props = defineProps({ trainer: { type: Object, required: true }, character: { type: Object, required: true } })
defineEmits(['train', 'close'])

const lessonCards = computed(() => props.trainer.lessons.filter((lesson) => isLessonRevealed(props.character, lesson)).map((lesson) => {
  const validation = canTrain(props.character, lesson, props.trainer)
  const reward = lesson.rewards[0]
  let currentValue = '—'; let targetValue = '—'
  if (reward?.type === 'increase_attribute') { currentValue = props.character.stats[reward.attribute]; targetValue = Math.min(10, currentValue + reward.amount) }
  if (reward?.type === 'upgrade_proficiency') { currentValue = props.character.proficiencies[reward.proficiency]; targetValue = PROFICIENCY_RANKS[PROFICIENCY_RANKS.indexOf(currentValue) + 1] ?? 'Maximum' }
  if (reward?.type === 'unlock_combat_skill') { currentValue = props.character.startingSkills.includes(reward.skillId) ? 'Known' : 'Not known'; targetValue = COMBAT_SKILLS[reward.skillId]?.name ?? reward.skillId }
  return { lesson, validation, currentValue, targetValue }
}))
const hiddenLessons = computed(() => props.trainer.lessons.filter((lesson) => !isLessonRevealed(props.character, lesson)))
const completion = computed(() => getTrainerCompletionState(props.character, props.trainer))
const isMentor = computed(() => props.trainer.teacherType?.includes('Mentor'))
const personalQuestState = computed(() => props.character.mentorProgress?.[props.trainer.id]?.personalQuestState ?? 'unavailable')
const lessonSections = computed(() => [
  { id: 'attribute', name: 'Attributes' }, { id: 'proficiency', name: 'Proficiencies' }, { id: 'combat_skill', name: 'Combat Skills' },
  { id: 'unique_combat_skill', name: 'Unique Combat Skills' }, { id: 'passive_skill', name: 'Passive Skills' }, { id: 'specialization_unlock', name: 'Specializations' }, { id: 'mastery_preparation', name: 'Mastery Preparation' },
].map((section) => ({ ...section, cards: lessonCards.value.filter((card) => card.lesson.lessonType === section.id) })))
</script>

<template>
  <div class="trainer-backdrop" @click.self="$emit('close')">
    <section class="trainer-screen" :class="{ 'trainer-screen--mentor': isMentor }" role="dialog" aria-modal="true" aria-labelledby="trainer-title">
      <header><div class="trainer-portrait" aria-hidden="true">♟</div><div><small>{{ trainer.trainerType }} Trainer · {{ trainer.trainerTier }}</small><h2 id="trainer-title">{{ trainer.displayName }}</h2><p>{{ trainer.description }}</p><p>Specializations: {{ Object.keys(trainer.attributeLimits ?? {}).concat(Object.keys(trainer.proficiencyLimits ?? {})).join(', ') || trainer.trainerType }}</p></div><button type="button" aria-label="Close trainer" @click="$emit('close')">×</button></header>
      <div class="trainer-lessons">
        <aside v-if="isMentor" class="mentor-summary"><strong>{{ trainer.title }} · {{ trainer.mentorTier }}</strong><p>Specializations: {{ trainer.specializations.join(', ') }}</p><p>Personal Quest: {{ personalQuestState }}</p></aside>
        <template v-for="section in lessonSections" :key="section.id"><section v-if="section.cards.length" class="lesson-section"><h3>{{ section.name }}</h3><article v-for="card in section.cards" :key="card.lesson.id" class="lesson-card">
          <div><small>{{ card.lesson.lessonType }} <span v-if="card.lesson.unique">· Unique</span></small><h3>{{ card.lesson.displayName }}</h3><p>{{ card.lesson.description }}</p><p v-if="card.lesson.mechanicImplemented === false" class="lesson-blocked">Mechanic not yet implemented</p></div>
          <dl><div><dt>Current</dt><dd>{{ card.currentValue }}</dd></div><div><dt>Target</dt><dd>{{ card.targetValue }}</dd></div><div><dt>LP Cost</dt><dd>{{ card.lesson.learningPointCost }}</dd></div><div><dt>Gold Cost</dt><dd>{{ card.lesson.goldCost }}</dd></div></dl>
          <ul class="lesson-requirements"><li v-for="(requirement, index) in card.validation.requirements" :key="index" :class="{ met: requirement.met }"><span>{{ requirement.required }}</span><small>Current: {{ requirement.current }}</small></li></ul>
          <button type="button" :disabled="!card.validation.met" @click="$emit('train', card.lesson)">{{ isMentor ? 'Learn' : 'Train' }}</button>
          <p v-if="!card.validation.met" class="lesson-blocked">Blocked: {{ card.validation.blockers.map((item) => `${item.required} (${item.current})`).join(', ') }}</p>
        </article></section></template>
        <section v-if="hiddenLessons.length" class="lesson-section hidden-lessons"><h3>Hidden Lessons</h3><article v-for="lesson in hiddenLessons" :key="lesson.id" class="lesson-card lesson-card--hidden"><small>Hidden</small><h3>???</h3><p>Unknown Lesson</p><p v-if="lesson.visibilityHint">{{ lesson.visibilityHint }}</p></article></section>
        <aside v-if="completion.limitReachedLessons" class="trainer-limit"><strong>This trainer cannot teach you beyond this level.</strong><p v-for="hint in trainer.nextTrainerHints" :key="hint">{{ hint }}</p></aside>
        <p v-if="lessonCards.length === 0" class="trainer-empty">This trainer has no lessons available yet.</p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.trainer-backdrop{position:fixed;z-index:250;inset:0;display:grid;place-items:center;padding:1rem;background:rgb(2 6 23 / 80%);backdrop-filter:blur(5px)}.trainer-screen{width:min(64rem,100%);max-height:calc(100vh - 2rem);overflow:hidden;border:1px solid #a16207;border-radius:.8rem;background:#0b1220;color:#e2e8f0;box-shadow:0 2rem 6rem #000}.trainer-screen>header{display:grid;grid-template-columns:auto 1fr auto;gap:1rem;padding:1rem;border-bottom:1px solid #334155;background:#111827}.trainer-screen>header small,.lesson-card>div>small{color:#fbbf24;text-transform:uppercase}.trainer-screen>header h2{font-size:1.5rem;font-weight:900}.trainer-screen>header button{align-self:start;padding:.4rem .65rem;border:1px solid #64748b;border-radius:.35rem;background:#1e293b;color:#fff}.trainer-portrait{display:grid;width:4rem;height:4rem;place-items:center;border:1px solid #a16207;background:#020617;font-size:2rem}.trainer-lessons{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.8rem;max-height:calc(100vh - 9rem);overflow:auto;padding:1rem}.lesson-card{padding:1rem;border:1px solid #475569;border-radius:.55rem;background:#0f172a}.lesson-card h3{font-size:1.1rem;font-weight:900}.lesson-card dl{display:grid;grid-template-columns:repeat(2,1fr);gap:.4rem;margin-top:.8rem}.lesson-card dl div{padding:.45rem;background:#020617}.lesson-card dt{color:#94a3b8;font-size:.7rem}.lesson-requirements{margin-top:.75rem}.lesson-requirements li{display:flex;justify-content:space-between;color:#fca5a5}.lesson-requirements li.met{color:#86efac}.lesson-card>button{width:100%;margin-top:.8rem;padding:.6rem;border:1px solid #fbbf24;border-radius:.35rem;background:#78350f;color:#fff;font-weight:900}.lesson-card>button:disabled{border-color:#475569;background:#1e293b;opacity:.45}.lesson-blocked{margin-top:.45rem;color:#fca5a5;font-size:.75rem}.trainer-empty{grid-column:1/-1;text-align:center}@media(max-width:700px){.trainer-lessons{grid-template-columns:1fr}}
.trainer-screen--mentor{border-color:#a78bfa;box-shadow:0 2rem 6rem #000,0 0 2rem rgb(124 58 237 / 30%)}.trainer-screen--mentor>header{background:linear-gradient(120deg,#1e1b4b,#111827)}.mentor-summary{grid-column:1/-1;padding:.75rem;border:1px solid #7c3aed;background:#1e1b4b}.lesson-section{grid-column:1/-1;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.8rem}.lesson-section>h3{grid-column:1/-1;color:#c4b5fd}
</style>
