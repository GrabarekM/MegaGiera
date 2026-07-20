<script setup>
import { computed, reactive } from 'vue'
import GameButton from '../components/GameButton.vue'
import { ATTRIBUTE_DEFINITIONS, FANTASY_NAMES, PROFICIENCY_CATEGORIES, PROFICIENCY_DESCRIPTIONS, PROFICIENCY_NAMES, STARTING_WEAPONS } from '../data/characterCreation.js'
import { COMBAT_SKILLS } from '../data/combatSkills.js'
import { buildCharacterCreation, canStartRun, changeAttribute, createCharacterDraft, getPointsRemaining, getSelectedWeapon, toggleProficiency } from '../game/characterCreation.js'
import brickBackground from '../assets/dark-brick-wall.png'

const emit = defineEmits(['next', 'back'])
const draft = reactive(createCharacterDraft())
const pointsRemaining = computed(() => getPointsRemaining(draft.attributes))
const selectedWeapon = computed(() => getSelectedWeapon(draft))
const selectedSkillNames = computed(() => selectedWeapon.value?.combatSkills.map((id) => COMBAT_SKILLS[id]?.name ?? id) ?? [])
const ready = computed(() => canStartRun(draft))
const WEAPON_VISUALS = Object.freeze({
  Club: '◆', Axe: '◇', Shield: '◈', Staff: '╱', Dagger: '†', Knife: '◢',
  Wand: '✦', Spellbook: '▤', 'Mystic Staff': '✧', Totem: '◉',
})

function randomizeName() {
  draft.name = FANTASY_NAMES[Math.floor(Math.random() * FANTASY_NAMES.length)]
}

function selectSubskill(name) {
  toggleProficiency(draft, name)
}

function getSubskillCategory(name) {
  return PROFICIENCY_CATEGORIES.find(({ proficiencies }) => proficiencies.includes(name))?.name ?? 'Adventure'
}

function getWeaponVisual(weapon) {
  return WEAPON_VISUALS[weapon.weaponType] ?? '◇'
}

function startRun() {
  if (ready.value) emit('next', buildCharacterCreation(draft))
}
</script>

<template>
  <main class="creation" :style="{ backgroundImage: `url(${brickBackground})` }">
    <div class="creation__content">
      <header class="creation-header">
        <div><p>New Game</p><h1>Character Creation</h1></div>
        <p class="creation-header__instruction">Prepare one traveler for the road ahead.</p>
      </header>

      <div class="creation-workspace">
        <div class="identity-column">
          <section class="material-panel name-panel" aria-labelledby="name-heading">
            <div class="section-heading"><h2 id="name-heading">Character Name</h2></div>
            <div class="name-row">
              <input v-model="draft.name" maxlength="32" placeholder="Enter a name" aria-label="Character Name">
              <button type="button" class="small-action" @click="randomizeName">Random</button>
            </div>
            <small v-if="!draft.name.trim()">A name is required.</small>
          </section>

          <section class="material-panel attributes-panel" aria-labelledby="attributes-heading">
            <div class="section-heading">
              <h2 id="attributes-heading">Attributes</h2>
              <strong>Points: {{ pointsRemaining }}</strong>
            </div>
            <div class="attributes">
              <div v-for="attribute in ATTRIBUTE_DEFINITIONS" :key="attribute.id" class="attribute-row">
                <span>{{ attribute.name }}</span>
                <div class="stepper">
                  <button type="button" :aria-label="`Decrease ${attribute.name}`" :disabled="draft.attributes[attribute.id] <= 1" @click="changeAttribute(draft, attribute.id, -1)">−</button>
                  <b>{{ draft.attributes[attribute.id] }}</b>
                  <button type="button" :aria-label="`Increase ${attribute.name}`" :disabled="draft.attributes[attribute.id] >= 5 || pointsRemaining <= 0" @click="changeAttribute(draft, attribute.id, 1)">+</button>
                </div>
              </div>
            </div>
          </section>
        </div>

        <section class="material-panel weapon-panel" aria-labelledby="weapon-heading">
          <div class="section-heading"><h2 id="weapon-heading">Starting Weapon</h2><strong>{{ selectedWeapon ? '1 selected' : 'Choose 1' }}</strong></div>
          <div class="choice-list weapon-list">
            <button v-for="weapon in STARTING_WEAPONS" :key="weapon.id" type="button" :aria-pressed="draft.startingWeaponId === weapon.id" :class="{ selected: draft.startingWeaponId === weapon.id }" @click="draft.startingWeaponId = weapon.id">
              <span class="weapon-art-placeholder" :data-weapon-type="weapon.weaponType" aria-hidden="true"><i>{{ getWeaponVisual(weapon) }}</i><small>ART</small></span>
              <span class="weapon-choice-label"><strong>{{ weapon.displayName }}</strong><small>{{ weapon.weaponType }}</small></span>
              <b v-if="draft.startingWeaponId === weapon.id">Selected</b>
            </button>
          </div>
          <aside v-if="selectedWeapon" class="detail-panel weapon-detail" aria-live="polite">
            <p>Selected weapon</p>
            <h3>{{ selectedWeapon.displayName }}</h3>
            <span>{{ selectedWeapon.description }}</span>
            <dl>
              <div><dt>Type</dt><dd>{{ selectedWeapon.weaponType }}</dd></div>
              <div><dt>Requires</dt><dd>{{ ATTRIBUTE_DEFINITIONS.find(({ id }) => id === selectedWeapon.requiredAttribute)?.name }} {{ selectedWeapon.requiredAttributeValue }}</dd></div>
              <div><dt>Training</dt><dd>{{ selectedWeapon.requiredProficiency }}</dd></div>
              <div><dt>Actions</dt><dd>{{ selectedSkillNames.join(', ') }}</dd></div>
            </dl>
          </aside>
          <aside v-else class="detail-panel empty-detail"><p>Choose a weapon to inspect it.</p></aside>
        </section>

        <section class="material-panel subskills-panel" aria-labelledby="subskills-heading">
          <div class="section-heading">
            <div><h2 id="subskills-heading">Subskills</h2><p>Choose two paths worth exploring.</p></div>
            <strong>{{ draft.noviceProficiencies.length }} / 2</strong>
          </div>
          <div class="choice-list subskill-list">
            <button v-for="name in PROFICIENCY_NAMES" :key="name" type="button" :aria-pressed="draft.noviceProficiencies.includes(name)" :class="{ selected: draft.noviceProficiencies.includes(name) }" :disabled="draft.noviceProficiencies.length >= 2 && !draft.noviceProficiencies.includes(name)" @click="selectSubskill(name)">
              <span class="choice-mark" aria-hidden="true"></span><span>{{ name }}</span>
            </button>
          </div>
          <aside v-if="draft.noviceProficiencies.length" class="selected-subskill-details" aria-live="polite">
            <article v-for="name in draft.noviceProficiencies" :key="name" class="detail-panel subskill-detail">
              <p>Selected Subskill</p>
              <h3>{{ name }}</h3>
              <span>{{ PROFICIENCY_DESCRIPTIONS[name] }}</span>
              <dl><div><dt>Use</dt><dd>{{ getSubskillCategory(name) }} situations encountered during the adventure.</dd></div></dl>
            </article>
          </aside>
          <aside v-else class="detail-panel empty-detail"><p>Select a Subskill to learn where it may be useful.</p></aside>
        </section>
      </div>

      <footer class="creation-footer">
        <button type="button" class="secondary-action" @click="emit('back')">Back</button>
        <p v-if="!ready">Name your traveler, spend all attribute points, choose a weapon and two Subskills.</p>
        <p v-else class="ready-message">Your traveler is ready.</p>
        <GameButton label="Start Game" :disabled="!ready" @click="startRun" />
      </footer>
    </div>
  </main>
</template>

<style scoped>
*{box-sizing:border-box}.creation{height:100dvh;min-height:680px;overflow:hidden;padding:clamp(.75rem,1.7vh,1.2rem);background-color:#2a1a10;background-repeat:repeat;background-size:520px;background-blend-mode:multiply;color:#eadfc8}.creation__content{display:grid;grid-template-rows:auto minmax(0,1fr) auto;gap:clamp(.55rem,1.1vh,.8rem);width:min(96rem,100%);height:100%;margin:auto}.creation-header{display:flex;align-items:end;justify-content:space-between;padding:0 .25rem;border-bottom:1px solid #6d4b2f}.creation-header>div{display:flex;align-items:baseline;gap:1rem}.creation-header p{color:#c8b89c;font-size:.72rem;font-weight:800;letter-spacing:.18em;text-transform:uppercase}.creation-header h1{color:#f0e4ca;font-family:Georgia,'Times New Roman',serif;font-size:clamp(1.75rem,2.2vw,2.4rem);line-height:1.1}.creation-header__instruction{padding-bottom:.3rem;letter-spacing:.04em!important;text-transform:none!important}.creation-workspace{display:grid;grid-template-columns:minmax(16.5rem,.82fr) minmax(20rem,1fr) minmax(34rem,1.55fr);gap:clamp(.55rem,.8vw,.85rem);min-height:0}.identity-column{display:grid;grid-template-rows:auto minmax(0,1fr);gap:clamp(.55rem,1vh,.75rem);min-height:0}.material-panel{min-height:0;padding:clamp(.7rem,1.2vh,1rem);overflow:hidden;border:1px solid #6d4b2f;border-top-color:#a87948;border-radius:.25rem;background:#2b1d13;box-shadow:inset 0 0 0 2px #1a110b,0 8px 18px #0008}.section-heading{display:flex;align-items:start;justify-content:space-between;gap:.75rem;padding-bottom:.55rem;border-bottom:1px solid #6d4b2f}.section-heading h2{color:#d8ad68;font-family:Georgia,'Times New Roman',serif;font-size:1.05rem}.section-heading p{margin-top:.1rem;color:#c8b89c;font-size:.75rem}.section-heading strong{color:#d8c89f;font-size:.75rem;white-space:nowrap}.name-row{display:flex;align-items:center;gap:.45rem;margin-top:.65rem}.name-row input{width:min(13.5rem,100%);height:2rem;padding:.35rem .55rem;border:1px solid #8c704e;border-radius:.15rem;outline:none;background:#d6c59d;color:#2a1d13;font:700 .85rem Georgia,'Times New Roman',serif}.name-row input:focus{border-color:#c99a4a;box-shadow:0 0 0 2px #c99a4a44}.name-panel small{display:block;margin-top:.35rem;color:#e7a99d;font-size:.7rem}.small-action,.secondary-action{border:1px solid #80603d;border-radius:.15rem;background:#402a1a;color:#eadfc8;font-weight:800;cursor:pointer}.small-action{height:2rem;padding:0 .65rem;font-size:.72rem}.small-action:hover,.secondary-action:hover{border-color:#c99a4a;background:#56391f}.attributes{display:grid;gap:.25rem;margin-top:.55rem}.attribute-row{display:grid;grid-template-columns:1fr auto;align-items:center;min-height:2.25rem;padding:.2rem .35rem .2rem .55rem;border-bottom:1px solid #513620}.attribute-row>span{font-size:.82rem;font-weight:750}.stepper{display:grid;grid-template-columns:1.8rem 2rem 1.8rem;align-items:center;text-align:center}.stepper button{width:1.65rem;height:1.65rem;border:1px solid #80603d;border-radius:.1rem;background:#3a291d;color:#eadfc8;font-size:1rem;font-weight:900;cursor:pointer}.stepper button:hover:not(:disabled){border-color:#c99a4a;background:#573a22}.stepper button:disabled{border-color:#4d4034;background:#2e2923;color:#807363;cursor:not-allowed}.stepper b{color:#f0d99a;font-size:.9rem}.choice-list{display:grid;align-content:start;gap:.22rem;margin-top:.55rem}.weapon-list{grid-template-columns:repeat(2,minmax(0,1fr))}.choice-list button{display:flex;align-items:center;gap:.45rem;min-width:0;min-height:2rem;padding:.3rem .45rem;border:1px solid #3f2c1d;border-radius:.12rem;background:#21170f;color:#dfd0b5;font-size:.74rem;text-align:left;cursor:pointer}.choice-list button:hover:not(:disabled){border-color:#8a623a;background:#362518}.choice-list button.selected{border-color:#d0a055;background:#4b321c;color:#f5dfaf}.choice-list button:disabled{color:#81725f;cursor:not-allowed}.weapon-list button{justify-content:space-between;border-left:3px solid #4b3422;border-radius:.1rem}.weapon-list button.selected{border-left-color:#e0b35e;box-shadow:inset 0 0 0 1px #76502c}.weapon-list button b{color:#e8bd69;font-size:.58rem;letter-spacing:.08em;text-transform:uppercase}.choice-mark{flex:0 0 auto;width:.72rem;height:.72rem;border:1px solid #8b7458;border-radius:50%;background:#1b120b}.subskill-list button.selected .choice-mark{border:3px solid #c99a4a;background:#332214}.detail-panel{margin-top:.65rem;padding:.65rem .75rem;border:1px solid #765a36;border-left:3px solid #b87832;background:#d6c59d;color:#2a1d13}.detail-panel>p{color:#6d4b2f;font-size:.62rem;font-weight:900;letter-spacing:.12em;text-transform:uppercase}.detail-panel h3{margin:.1rem 0 .25rem;font:700 1rem Georgia,'Times New Roman',serif}.detail-panel>span{display:block;min-height:2.1em;color:#59432d;font-size:.75rem;line-height:1.35}.detail-panel dl{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.28rem .7rem;margin-top:.5rem;padding-top:.45rem;border-top:1px solid #a68d61}.detail-panel dl div{min-width:0}.detail-panel dt{color:#6d4b2f;font-size:.58rem;font-weight:900;text-transform:uppercase}.detail-panel dd{overflow:hidden;color:#2a1d13;font-size:.68rem;font-weight:750;text-overflow:ellipsis;white-space:nowrap}.empty-detail{display:grid;min-height:5rem;place-items:center;color:#765f43;text-align:center}.subskill-list{grid-template-columns:repeat(3,minmax(0,1fr))}.subskill-list button{min-height:1.78rem;padding-block:.2rem}.selected-subskill-details{display:grid;grid-template-columns:repeat(auto-fit,minmax(0,1fr));gap:.55rem}.selected-subskill-details .detail-panel{min-width:0}.subskill-detail{min-height:7.2rem}.subskill-detail dl{grid-template-columns:1fr}.creation-footer{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:1rem;padding-top:.15rem}.creation-footer>p{color:#c8b89c;font-size:.75rem;text-align:center}.creation-footer .ready-message{color:#b9d7b6}.secondary-action{min-width:7rem;min-height:2.7rem;padding:.55rem 1rem}.creation-footer :deep(.game-button){min-width:10rem;min-height:2.7rem;padding:.5rem 1.2rem;border:1px solid #9b7042;border-radius:.18rem;background:#573820;color:#f0d99a;box-shadow:inset 0 0 0 2px #2b1d13,0 5px 12px #0007;font:800 1rem Georgia,'Times New Roman',serif}.creation-footer :deep(.game-button:hover:not(:disabled)){transform:none;border-color:#d5a451;background:#6b4728}.creation-footer :deep(.game-button:active:not(:disabled)){transform:translateY(1px)}.creation-footer :deep(.game-button:disabled){border-color:#594b3c;background:#332d27;color:#817563;opacity:1}
.creation{background-color:#202225;background-blend-mode:normal;color:#e6e0d2}
.creation-header{border-bottom-color:#777269}.creation-header p{color:#bbb5a8}.creation-header h1{color:#eee8d9}.creation-header__instruction{color:#bdb8ad!important}
.creation-workspace{align-items:start}
.identity-column{grid-template-rows:auto auto;align-content:start}
.material-panel{align-self:start;border-color:#5f6060;border-top-color:#929087;background:#292b2e;box-shadow:inset 0 0 0 2px #17191b,0 8px 18px #0009}
.section-heading{border-bottom-color:#55575a}.section-heading h2{color:#c8bd78}.section-heading p{color:#b8b4aa}.section-heading strong{color:#d8d0b9}
.name-row input{border-color:#77736a;background:#cfc8b6;color:#242526}.name-row input:focus{border-color:#aaa35d;box-shadow:0 0 0 2px #aaa35d44}
.small-action,.secondary-action{border-color:#666762;background:#343638;color:#e7e1d3}.small-action:hover,.secondary-action:hover{border-color:#aaa35d;background:#454641}
.attribute-row{border-bottom-color:#44474a}.stepper button{border-color:#656763;background:#202225;color:#e5dfd2}.stepper button:hover:not(:disabled){border-color:#aaa35d;background:#3d3f3d}.stepper button:disabled{border-color:#454746;background:#252729;color:#777872}.stepper b{color:#d4ca88}
.choice-list button{border-color:#44474a;background:#202225;color:#ded9ce}.choice-list button:hover:not(:disabled){border-color:#777871;background:#333538}.choice-list button.selected{border-color:#aaa35d;background:#44463e;color:#f0eadb}.choice-list button:disabled{color:#777872}.weapon-list button{border-left-color:#55575a}.weapon-list button.selected{border-left-color:#c5b85d;box-shadow:inset 0 0 0 1px #77704b}.weapon-list button b{color:#d6ca77}
.weapon-list button{display:grid;grid-template-columns:2.75rem minmax(0,1fr) auto;min-height:4rem;padding:.35rem .55rem;column-gap:.65rem}.weapon-art-placeholder{display:grid;width:2.55rem;height:2.55rem;grid-template-rows:1fr auto;place-items:center;align-self:center;border:1px solid #696b68;background:#17191b;box-shadow:inset 0 0 0 2px #292b2e;color:#bdb36b}.weapon-art-placeholder i{font:normal 1.25rem/1 Georgia,'Times New Roman',serif}.weapon-art-placeholder small{padding-bottom:.12rem;color:#777871;font-size:.42rem;font-weight:900;letter-spacing:.12em}.weapon-choice-label{display:grid;gap:.15rem;min-width:0}.weapon-choice-label strong{overflow:hidden;color:inherit;font-size:.8rem;text-overflow:ellipsis;white-space:nowrap}.weapon-choice-label small{color:#92938e;font-size:.62rem}.weapon-list button.selected .weapon-art-placeholder{border-color:#c5b85d;background:#24261f}.weapon-list button.selected .weapon-choice-label small{color:#c9c2a0}
.choice-mark{border-color:#777871;background:#1b1d1f}.subskill-list button.selected .choice-mark{border-color:#c5b85d;background:#3d3f38}
.detail-panel{border-color:#77736a;border-left-color:#8e884f;background:#c9c3b3;color:#242526}.detail-panel>p,.detail-panel dt{color:#5f5b4f}.detail-panel>span{color:#4e4c45}.detail-panel dl{border-top-color:#9d9788}.detail-panel dd{color:#242526}.empty-detail{color:#625f56}
.weapon-panel,.subskills-panel{align-self:start}
.selected-subskill-details{grid-template-columns:1fr}
.subskill-detail{width:100%;min-height:7.2rem}
.creation-footer>p{color:#bbb5a8}.creation-footer .ready-message{color:#b9c9a3}.creation-footer :deep(.game-button){border-color:#77736a;background:#3b3d3b;color:#e8dfbd;box-shadow:inset 0 0 0 2px #202225,0 5px 12px #0008}.creation-footer :deep(.game-button:hover:not(:disabled)){border-color:#b5aa62;background:#505149}.creation-footer :deep(.game-button:disabled){border-color:#505250;background:#292b2d;color:#7f8079}
@media(max-width:1100px),(max-height:720px){.creation{height:auto;min-height:100vh;overflow:auto}.creation__content{height:auto}.creation-workspace{grid-template-columns:minmax(16rem,.8fr) minmax(20rem,1.2fr)}.subskills-panel{grid-column:1/-1}.creation-header__instruction{display:none}}
@media(max-width:720px){.creation-workspace{grid-template-columns:1fr}.subskills-panel{grid-column:auto}.subskill-list{grid-template-columns:repeat(2,minmax(0,1fr))}.creation-header>div{display:block}.creation-footer{grid-template-columns:1fr}.creation-footer>p{grid-row:1}.secondary-action,.creation-footer :deep(.game-button){width:100%}}
</style>
