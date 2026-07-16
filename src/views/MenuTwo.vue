<script setup>
import { computed, reactive } from 'vue'
import GameButton from '../components/GameButton.vue'
import { ATTRIBUTE_DEFINITIONS, EQUIPMENT_SLOTS, FANTASY_NAMES, PROFICIENCY_NAMES, STARTING_WEAPONS } from '../data/characterCreation.js'
import { COMBAT_SKILLS } from '../data/combatSkills.js'
import { buildCharacterCreation, canStartRun, changeAttribute, createCharacterDraft, getPointsRemaining, getSelectedWeapon, toggleProficiency } from '../game/characterCreation.js'
import brickBackground from '../assets/dark-brick-wall.png'

const emit = defineEmits(['next'])
const draft = reactive(createCharacterDraft())
const pointsRemaining = computed(() => getPointsRemaining(draft.attributes))
const selectedWeapon = computed(() => getSelectedWeapon(draft))
const selectedSkillNames = computed(() => selectedWeapon.value?.combatSkills.map((id) => COMBAT_SKILLS[id]?.name ?? id) ?? [])
const ready = computed(() => canStartRun(draft))

function randomizeName() {
  draft.name = FANTASY_NAMES[Math.floor(Math.random() * FANTASY_NAMES.length)]
}

function startRun() {
  if (ready.value) emit('next', buildCharacterCreation(draft))
}
</script>

<template>
  <main class="creation" :style="{ backgroundImage: `linear-gradient(rgb(2 6 23 / 72%), rgb(2 6 23 / 88%)), url(${brickBackground})` }">
    <div class="creation__content">
      <header><p>New Run</p><h1>Character Creation</h1></header>

      <section class="panel">
        <h2>1. Character Name</h2>
        <div class="name-row"><input v-model="draft.name" maxlength="32" placeholder="Enter a name" aria-label="Character Name"><button type="button" @click="randomizeName">Random Name</button></div>
        <small v-if="!draft.name.trim()">A character name is required.</small>
      </section>

      <section class="panel">
        <div class="section-heading"><h2>2. Attributes</h2><strong>Points Remaining: {{ pointsRemaining }}</strong></div>
        <div class="attributes">
          <article v-for="attribute in ATTRIBUTE_DEFINITIONS" :key="attribute.id">
            <span>{{ attribute.name }}</span>
            <div><button type="button" :disabled="draft.attributes[attribute.id] <= 1" @click="changeAttribute(draft, attribute.id, -1)">−</button><b>{{ draft.attributes[attribute.id] }}</b><button type="button" :disabled="draft.attributes[attribute.id] >= 5 || pointsRemaining <= 0" @click="changeAttribute(draft, attribute.id, 1)">+</button></div>
          </article>
        </div>
      </section>

      <section class="panel">
        <div class="section-heading"><h2>3. Proficiencies</h2><strong>Novice: {{ draft.noviceProficiencies.length }} / 2</strong></div>
        <p>Choose exactly two starting proficiencies.</p>
        <div class="proficiencies">
          <button v-for="name in PROFICIENCY_NAMES" :key="name" type="button" :class="{ selected: draft.noviceProficiencies.includes(name) }" :disabled="draft.noviceProficiencies.length >= 2 && !draft.noviceProficiencies.includes(name)" @click="toggleProficiency(draft, name)">
            <span>{{ name }}</span><small>{{ draft.noviceProficiencies.includes(name) ? 'Novice' : 'Untrained' }}</small>
          </button>
        </div>
      </section>

      <section class="panel">
        <h2>4. Starting Weapon</h2>
        <div class="weapons">
          <button v-for="weapon in STARTING_WEAPONS" :key="weapon.id" type="button" :class="{ selected: draft.startingWeaponId === weapon.id }" @click="draft.startingWeaponId = weapon.id">
            <b>{{ weapon.displayName }}</b><small>{{ ATTRIBUTE_DEFINITIONS.find(({ id }) => id === weapon.requiredAttribute)?.name }} {{ weapon.requiredAttributeValue }} · {{ weapon.requiredProficiency }}</small>
            <span class="weapon-tooltip">Current {{ draft.attributes[weapon.requiredAttribute] }} · {{ draft.attributes[weapon.requiredAttribute] >= weapon.requiredAttributeValue ? 'Attribute met' : 'Attribute not met' }} · {{ draft.noviceProficiencies.includes(weapon.requiredProficiency) ? 'Novice' : 'Untrained' }}</span>
          </button>
        </div>
      </section>

      <section class="panel">
        <h2>5. Equipment Preview</h2>
        <div class="equipment"><article v-for="(slot, index) in EQUIPMENT_SLOTS" :key="`${slot.id}-${index}`"><span>{{ slot.name }}</span><small>Empty</small></article></div>
      </section>

      <section class="panel summary">
        <h2>Character Summary</h2>
        <dl><div><dt>Name</dt><dd>{{ draft.name.trim() || 'Not set' }}</dd></div><div><dt>Novice Proficiencies</dt><dd>{{ draft.noviceProficiencies.join(', ') || 'Not selected' }}</dd></div><div><dt>Starting Weapon</dt><dd>{{ selectedWeapon?.displayName ?? 'Not selected' }}</dd></div><div><dt>Starting Skills</dt><dd>{{ selectedSkillNames.join(', ') || 'Not selected' }}</dd></div></dl>
        <div class="summary__attributes"><span v-for="attribute in ATTRIBUTE_DEFINITIONS" :key="attribute.id">{{ attribute.name }} <b>{{ draft.attributes[attribute.id] }}</b></span></div>
      </section>

      <div class="start"><GameButton label="Start Run" :disabled="!ready" @click="startRun" /><p v-if="!ready">Set a name, spend all points, choose two proficiencies and one weapon.</p></div>
    </div>
  </main>
</template>

<style scoped>
.creation{min-height:100vh;padding:2rem 1rem;background-repeat:repeat;background-size:520px;color:#e2e8f0}.creation__content{width:min(72rem,100%);margin:auto}header{text-align:center}header p{color:#a5b4fc;font-weight:900;letter-spacing:.3em;text-transform:uppercase}h1{font-size:clamp(2.4rem,6vw,4rem);font-weight:950;color:#fff}h2{font-size:1.25rem;font-weight:900;color:#f8fafc}.panel{margin-top:1.25rem;padding:1.25rem;border:1px solid #64748b;border-radius:.8rem;background:rgb(15 23 42 / 94%);box-shadow:0 12px 30px #0008}.section-heading,.name-row{display:flex;align-items:center;justify-content:space-between;gap:1rem}.section-heading strong{color:#fbbf24}.name-row{margin-top:1rem;justify-content:flex-start}.name-row input{flex:1;min-width:0;padding:.75rem;border:1px solid #818cf8;border-radius:.45rem;background:#020617;color:#fff}.panel button{padding:.55rem .7rem;border:1px solid #64748b;border-radius:.4rem;background:#1e293b;color:#f8fafc;cursor:pointer}.panel button:hover:not(:disabled),.panel button.selected{border-color:#a5b4fc;background:#3730a3}.panel button:disabled{opacity:.4;cursor:not-allowed}.panel>small,.panel>p{display:block;margin-top:.55rem;color:#cbd5e1}.attributes{display:grid;grid-template-columns:repeat(4,1fr);gap:.65rem;margin-top:1rem}.attributes article{padding:.75rem;border:1px solid #334155;border-radius:.5rem;background:#0b1220}.attributes article>span{display:block;margin-bottom:.55rem;font-weight:800}.attributes article div{display:grid;grid-template-columns:2rem 1fr 2rem;align-items:center;text-align:center}.attributes b{font-size:1.35rem}.proficiencies{display:grid;grid-template-columns:repeat(3,1fr);gap:.5rem;margin-top:1rem}.proficiencies button,.weapons button{display:flex;justify-content:space-between;gap:.4rem;text-align:left}.proficiencies small,.weapons small{color:#cbd5e1}.weapons{display:grid;grid-template-columns:repeat(3,1fr);gap:.6rem;margin-top:1rem}.equipment{display:grid;grid-template-columns:repeat(4,1fr);gap:.5rem;margin-top:1rem}.equipment article{padding:.65rem;border:1px solid #334155;border-radius:.4rem;background:#0b1220}.equipment small{display:block;color:#94a3b8}.summary dl{display:grid;grid-template-columns:repeat(2,1fr);gap:.75rem;margin-top:1rem}.summary dl div{padding:.7rem;background:#0b1220}.summary dt{color:#a5b4fc;font-size:.75rem;text-transform:uppercase}.summary dd{font-weight:800}.summary__attributes{display:flex;flex-wrap:wrap;gap:.45rem;margin-top:.8rem}.summary__attributes span{padding:.4rem .55rem;border:1px solid #475569;border-radius:.4rem}.start{text-align:center;margin:1.5rem}.start p{margin-top:.6rem;color:#fca5a5}@media(max-width:760px){.attributes,.equipment{grid-template-columns:repeat(2,1fr)}.proficiencies,.weapons,.summary dl{grid-template-columns:1fr}.section-heading{align-items:flex-start;flex-direction:column}}
</style>
