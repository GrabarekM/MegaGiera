<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import EncounterPreparationBadge from './EncounterPreparationBadge.vue'
const props = defineProps({ model: { type: Object, required: true }, busy: Boolean, message: { type: String, default: '' } })
const emit = defineEmits(['execute-choice', 'continue'])
const selectedId = ref(null); const confirmation = ref(null); const dialog = ref(null)
const selected = computed(() => props.model.choices.find(({ choice }) => choice.id === selectedId.value) ?? null)
watch(() => props.model.instanceId, () => { selectedId.value = null; confirmation.value = null })
watch(confirmation, async (value) => { if (value) { await nextTick(); dialog.value?.focus() } })
const requiresConfirmation = (entry) => entry.choice.requiresConfirmation || entry.choice.startCombat || ['Fight', 'Flee', 'Take'].includes(entry.choice.actionType) || entry.choice.costs.some(({ type, quantity }) => type === 'Wardwood' || type === 'Gold' && quantity >= 10)
function choose(entry) { selectedId.value = entry.choice.id; if (!entry.available || props.busy) return; if (requiresConfirmation(entry)) confirmation.value = entry; else emit('execute-choice', entry.choice.id) }
function confirm() { const id = confirmation.value?.choice.id; confirmation.value = null; if (id) emit('execute-choice', id) }
const detectionLabel = computed(() => props.model.detectionResult?.resultType?.replace('DETECTION_', '').replaceAll('_', ' ') ?? 'Automatic')
</script>
<template>
  <div class="encounter-overlay" role="dialog" aria-modal="true" aria-labelledby="encounter-title" @keydown.esc.prevent>
    <section class="encounter-window">
      <header><small>{{ model.phaseLabel }}</small><h2 id="encounter-title">{{ model.displayName }}</h2><span>{{ model.locationLabel }}</span></header>
      <div class="encounter-columns">
        <main>
          <p>{{ model.description }}</p>
          <section v-if="model.detectionResult" class="encounter-panel"><h3>Detection</h3><p>{{ model.detectionNarrative }}</p><strong>{{ detectionLabel }}</strong><span v-if="model.detectionPublicStat">{{ model.detectionPublicStat }}</span></section>
          <section v-if="model.isAmbush" class="encounter-panel"><h3>Ambush</h3><p>{{ model.ambushText }}</p></section>
          <EncounterPreparationBadge :state="model.preparationState" />
          <section v-if="model.revealedInformationLabels.length" class="encounter-panel"><h3>Revealed information</h3><ul><li v-for="entry in model.revealedInformationLabels" :key="entry">{{ entry }}</li></ul></section>
          <section v-if="model.outcome" class="encounter-panel"><h3>{{ model.outcome.title }}</h3><p>{{ model.outcome.description }}</p></section>
          <p v-if="message" role="status">{{ message }}</p>
        </main>
        <aside>
          <template v-if="model.showChoices"><h3>Choose your action</h3><div class="encounter-choices"><button v-for="entry in model.choices" :key="entry.choice.id" type="button" :disabled="busy || !entry.available" :aria-describedby="`choice-${entry.choice.id}`" @click="choose(entry)"><strong>{{ entry.choice.displayName }}</strong><small>{{ entry.status === 'Exhausted' ? 'Already attempted' : entry.available ? entry.choice.description : entry.lockReason }}</small></button></div></template>
          <section v-if="selected" class="encounter-choice-details"><h3>{{ selected.choice.displayName }}</h3><p>{{ selected.choice.description }}</p><p>Action: {{ selected.choice.actionType }}</p><ul><li v-for="cost in selected.costDisplay" :key="cost">{{ cost }}</li><li v-for="check in selected.checkDisplay" :key="check">{{ check }}</li><li v-for="requirement in selected.requirementDisplay" :key="requirement">{{ requirement }}</li></ul><p v-if="selected.choice.startCombat">May start combat.</p></section>
          <section v-if="model.pendingCombatId"><h3>Combat pending</h3><p>The encounter will resume after combat.</p></section>
          <section v-if="model.pendingLootRewardId"><h3>Loot pending</h3><p>Resolve the rewards before continuing.</p></section>
          <button v-if="model.canContinue" type="button" @click="emit('continue')">Continue</button>
        </aside>
      </div>
    </section>
    <div v-if="confirmation" ref="dialog" class="encounter-confirmation" role="alertdialog" tabindex="-1" aria-modal="true"><h3>Confirm {{ confirmation.choice.displayName }}</h3><p>This action may be irreversible or start combat.</p><ul><li v-for="cost in confirmation.costDisplay" :key="cost">{{ cost }}</li></ul><button type="button" @click="confirmation = null">Cancel</button><button type="button" :disabled="busy" @click="confirm">Confirm</button></div>
  </div>
</template>
<style scoped>
.encounter-overlay{position:fixed;inset:0;z-index:80;display:grid;place-items:center;padding:24px;background:rgba(2,6,15,.76);backdrop-filter:blur(3px)}
.encounter-window{width:min(1080px,96vw);max-height:90vh;overflow:auto;border:1px solid #7589ad;border-radius:14px;background:#0d1628;color:#e8eefb;box-shadow:0 24px 80px #000;padding:22px}.encounter-window>header{display:flex;align-items:baseline;gap:16px;border-bottom:1px solid #34445f;padding-bottom:14px}.encounter-window h2{margin:0;color:#f4c963}.encounter-window header span{margin-left:auto;color:#aebbd0}.encounter-columns{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(320px,.85fr);gap:22px;padding-top:18px}.encounter-panel,.encounter-choice-details,.encounter-preparation{display:grid;gap:6px;margin:12px 0;padding:12px;border:1px solid #33445f;border-radius:9px;background:#121e33}.encounter-panel h3,.encounter-choice-details h3{margin:0;color:#d8e4fa}.encounter-choices{display:grid;gap:9px}.encounter-choices button{display:grid;text-align:left;padding:12px;border:1px solid #6981aa;border-radius:8px;background:#182741;color:#fff}.encounter-choices button:hover:not(:disabled){border-color:#f4c963;background:#223657}.encounter-choices button:disabled{opacity:.55;cursor:not-allowed}.encounter-choices small{color:#b6c3d7}.encounter-preparation strong{color:#f4c963}.encounter-preparation span{color:#c3cee0}.encounter-confirmation{position:fixed;z-index:81;width:min(430px,90vw);padding:20px;border:1px solid #e9bd55;border-radius:12px;background:#111c30;color:#fff;box-shadow:0 20px 60px #000}.encounter-confirmation button{margin:8px 8px 0 0;padding:9px 16px}.encounter-window aside>button{margin-top:14px;padding:10px 20px;border:1px solid #e9bd55;border-radius:8px;background:#253b60;color:#fff}@media(max-width:760px){.encounter-columns{grid-template-columns:1fr}.encounter-window{padding:15px}.encounter-window>header{align-items:flex-start;flex-direction:column}.encounter-window header span{margin-left:0}}
</style>
