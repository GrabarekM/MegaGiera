<script setup>
import { computed, ref } from 'vue'
import { COMBAT_PHASE, INITIATIVE_ATTRIBUTES } from '../combat/combatConstants.js'
import { buildCombatFeed, buildDetailedCombatLog, buildEnemyDecisionLogs } from '../combat/combatLogPresenter.js'

const props = defineProps({ combat: { type: Object, required: true }, showEnemyIntent: { type: Boolean, default: true }, showEnemyAiDebug: { type: Boolean, default: false } })
defineEmits(['select-initiative', 'select-skill', 'set-block', 'victory', 'return-main-menu', 'cancel'])
const statLabel = (value) => value[0].toUpperCase() + value.slice(1)
const showLogs = ref(false)
const debugBlock = ref(5)
const combatFeed = computed(() => buildCombatFeed(props.combat.log))
const detailedLogs = computed(() => buildDetailedCombatLog(props.combat.log))
const enemyDecisionLogs = computed(() => buildEnemyDecisionLogs(props.combat.log))
</script>

<template>
  <div class="combat-backdrop">
    <main class="combat-window" :class="{ 'combat-window--death': combat.result?.type === 'defeat' }" role="dialog" aria-modal="true" aria-labelledby="combat-title">
      <header v-if="combat.result?.type !== 'defeat'" class="combat-header">
        <div>
          <p>Combat encounter</p>
          <h1 id="combat-title">Round {{ combat.round }}</h1>
        </div>
        <div class="combat-header__actions">
          <strong>{{ combat.phase.replaceAll('_', ' ') }}</strong>
          <button type="button" @click="showLogs = true">Logs</button>
        </div>
      </header>

      <div v-if="combat.result?.type !== 'defeat'" class="combat-content">
        <section v-if="combat.phase === COMBAT_PHASE.INITIATIVE_SELECTION" class="initiative-picker">
          <p>You initiated combat</p>
          <h2>Choose an initiative attribute</h2>
          <div>
            <button
              v-for="attribute in INITIATIVE_ATTRIBUTES"
              :key="attribute"
              type="button"
              @click="$emit('select-initiative', attribute)"
            >{{ statLabel(attribute.replace(/([A-Z])/g, ' $1')) }}</button>
          </div>
        </section>

        <section v-if="combat.initiativeComparison" class="initiative-debug" aria-label="Opening initiative result">
          <span>Initiator: <strong>{{ combat.initiator }}</strong></span>
          <span>Attribute: <strong>{{ statLabel(combat.initiativeAttribute.replace(/([A-Z])/g, ' $1')) }}</strong></span>
          <span>Player: <strong>{{ combat.initiativeComparison.player }}</strong></span>
          <span>Enemy: <strong>{{ combat.initiativeComparison.enemy }}</strong></span>
          <span>First: <strong>{{ combat.initiativeWinner }}</strong></span>
        </section>

        <section v-if="showEnemyIntent && combat.enemySelections[0] && combat.phase !== COMBAT_PHASE.COMBAT_END" class="enemy-intent">
          <div>
            <p>Enemy Intent</p>
            <h2>{{ combat.enemies[0].name }}</h2>
          </div>
          <dl>
            <div><dt>Preparing</dt><dd>{{ combat.enemySelections[0].skill.name }}</dd></div>
            <div><dt>Initiative</dt><dd>{{ combat.enemySelections[0].skill.initiative }}</dd></div>
            <div><dt>Stat</dt><dd>{{ statLabel(combat.enemySelections[0].skill.usedStat.replace(/([A-Z])/g, ' $1')) }}</dd></div>
          </dl>
        </section>

        <section v-if="showEnemyAiDebug && combat.enemyAiDebug[0]" class="enemy-ai-debug">
          <strong>Enemy AI Debug · {{ combat.enemyAiDebug[0].behaviorProfile }}</strong>
          <span>Temperament: {{ combat.enemyAiDebug[0].temperament }}</span>
          <span>Threat rating: {{ combat.enemyAiDebug[0].threatRating }}/10</span>
          <span>Weights: {{ Object.entries(combat.enemyAiDebug[0].finalWeights).map(([skill, weight]) => `${skill}: ${weight}`).join(', ') }}</span>
          <span>Active rules: {{ combat.enemyAiDebug[0].activeRules.map((rule) => rule.id).join(', ') || 'none' }}</span>
          <span>Cooldowns: {{ Object.entries(combat.enemyAiDebug[0].cooldowns).map(([skill, value]) => `${skill}: ${value}`).join(', ') }}</span>
          <span>Available: {{ combat.enemyAiDebug[0].availableSkills.map((skill) => skill.name).join(', ') || 'none' }}</span>
          <span>Rejected: {{ combat.enemyAiDebug[0].rejectedSkills.map((skill) => `${skill.skillName} (${skill.reason})`).join(', ') || 'none' }}</span>
          <span>Selected: {{ combat.enemyAiDebug[0].selectedSkillName }}</span>
          <span>Reason: {{ combat.enemyAiDebug[0].reason }}</span>
        </section>

        <section class="combatants" aria-label="Combatants">
          <article class="combat-card combat-card--player">
            <span class="combat-card__icon" aria-hidden="true">⚔</span>
            <p class="combat-card__side">Hero</p>
            <h2>{{ combat.player.name }}</h2>
            <div class="health-bar">
              <span :style="{ width: `${(combat.player.currentHealth / combat.player.maxHealth) * 100}%` }"></span>
            </div>
            <strong class="health-value">HP {{ combat.player.currentHealth }} / {{ combat.player.maxHealth }}</strong>
            <strong v-if="combat.player.currentBlock > 0" class="block-value">Block {{ combat.player.currentBlock }}</strong>
            <small v-if="combat.player.weapon">Weapon: {{ combat.player.weapon.displayName }} · {{ combat.player.weaponRequirements.currentRank }} {{ combat.player.weapon.requiredProficiency }}</small>
            <dl>
              <div v-for="(value, stat) in combat.player.stats" :key="stat">
                <dt>{{ statLabel(stat) }}</dt><dd>{{ value }}</dd>
              </div>
            </dl>
          </article>

          <article v-for="enemy in combat.enemies" :key="enemy.id" class="combat-card combat-card--enemy">
            <span class="combat-card__icon" aria-hidden="true">☠</span>
            <p class="combat-card__side">Enemy</p>
            <h2>{{ enemy.name }}</h2>
            <div class="health-bar">
              <span :style="{ width: `${(enemy.currentHealth / enemy.maxHealth) * 100}%` }"></span>
            </div>
            <strong class="health-value">HP {{ enemy.currentHealth }} / {{ enemy.maxHealth }}</strong>
            <dl>
              <div v-for="(value, stat) in enemy.stats" :key="stat">
                <dt>{{ statLabel(stat) }}</dt><dd>{{ value }}</dd>
              </div>
            </dl>
          </article>
        </section>

        <section class="combat-actions">
          <div>
            <h2>Choose your action</h2>
            <div class="skill-list">
              <button
                v-for="skill in combat.player.skills"
                :key="skill.id"
                type="button"
                :disabled="combat.phase !== 'player_selection' || !skill.available"
                @click="$emit('select-skill', skill.id)"
              >
                <strong>{{ skill.name }}</strong>
                <span>{{ statLabel(skill.usedStat.replace(/([A-Z])/g, ' $1')) }} · Initiative {{ skill.initiative }} · d{{ skill.dice }}</span>
                <small>{{ skill.description }}</small>
              </button>
            </div>
            <p>Selected: <strong>{{ combat.playerSelection?.skill.name ?? 'None' }}</strong></p>
            <p v-if="combat.playerSelection">Initiative: <strong>{{ combat.playerSelection.skill.initiative }}</strong></p>
          </div>

          <div class="combat-details">
            <div>
              <h3>Initiative</h3>
              <ol>
                <li v-for="action in combat.initiativeQueue" :key="`${action.combatantId}-${action.skillId}`">
                  {{ action.position }}. {{ action.skill.name }} ({{ action.finalInitiative }})
                </li>
              </ol>
            </div>
            <div class="combat-feed" aria-live="polite">
              <h3>Combat Feed</h3>
              <ol>
                <li v-for="entry in combatFeed" :key="entry.id" :class="`combat-feed__${entry.kind}`">{{ entry.text }}</li>
              </ol>
            </div>
          </div>
          <details class="combat-debug">
            <summary>Block Debug</summary>
            <div>
              <input v-model.number="debugBlock" type="number" min="0" aria-label="Debug Block amount" />
              <button type="button" @click="$emit('set-block', debugBlock)">Set Block</button>
              <button type="button" @click="$emit('set-block', combat.player.stats.defense + 4)">Max Guard</button>
              <button type="button" @click="$emit('set-block', 0)">Clear</button>
            </div>
          </details>
        </section>
      </div>

      <section v-if="showLogs && combat.result?.type !== 'defeat'" class="logs-window" role="dialog" aria-modal="true" aria-labelledby="combat-logs-title">
        <header>
          <div><p>Combat details</p><h2 id="combat-logs-title">Combat Logs</h2></div>
          <button type="button" aria-label="Close combat logs" @click="showLogs = false">×</button>
        </header>
        <div class="logs-window__content">
          <article v-for="decision in enemyDecisionLogs" :key="decision.id" class="logs-window__decision">
            <small>Round {{ decision.round }} · Enemy AI</small>
            <h3>Selected: {{ decision.selectedSkillName }}</h3>
            <p>Reason: {{ decision.reason }}</p>
          </article>
          <article v-for="entry in detailedLogs" :key="entry.id">
            <small>Round {{ entry.round }}</small>
            <h3>{{ entry.title }}</h3>
            <dl>
              <template v-if="entry.weaponCheck">
                <div><dt>Weapon</dt><dd>{{ entry.weaponCheck.weaponName }}</dd></div>
                <div><dt>Required Attribute</dt><dd>{{ statLabel(entry.weaponCheck.requiredAttribute.replace(/([A-Z])/g, ' $1')) }} {{ entry.weaponCheck.requiredAttributeValue }} (Current: {{ entry.weaponCheck.currentAttribute }})</dd></div>
                <div><dt>Attribute Penalty</dt><dd>{{ entry.weaponCheck.attributeMet ? 'None' : '-15% damage' }}</dd></div>
                <div><dt>Required Proficiency</dt><dd>{{ entry.weaponCheck.requiredProficiency }}</dd></div>
                <div><dt>Current Rank</dt><dd>{{ entry.weaponCheck.currentRank }}</dd></div>
                <div><dt>Miss Chance</dt><dd>{{ entry.weaponCheck.missChance * 100 }}%</dd></div>
                <div><dt>Hit Roll</dt><dd>{{ Math.round(entry.weaponCheck.hitRoll * 100) }}% · {{ entry.weaponCheck.result }}</dd></div>
              </template>
              <div v-if="entry.kind !== 'miss'"><dt>Stat</dt><dd>{{ statLabel(entry.stat.replace(/([A-Z])/g, ' $1')) }} = {{ entry.statValue }}</dd></div>
              <div v-else><dt>Result</dt><dd>Miss</dd></div>
              <div><dt>Dice</dt><dd>{{ entry.dice }} → {{ entry.roll }}</dd></div>
              <div><dt>Calculation</dt><dd>{{ entry.calculation }}</dd></div>
              <div v-if="entry.kind === 'guard'"><dt>Block</dt><dd>{{ entry.previousBlock }} → {{ entry.currentBlock }}</dd></div>
              <div v-else><dt>{{ entry.targetName }} HP</dt><dd>{{ entry.previousHealth }} → {{ entry.currentHealth }}</dd></div>
              <div v-if="entry.block"><dt>Block absorbed</dt><dd>{{ entry.block.previousBlock }} → {{ entry.block.currentBlock }} ({{ entry.block.absorbed }})</dd></div>
            </dl>
          </article>
          <p v-if="detailedLogs.length === 0" class="logs-window__empty">No resolved actions yet.</p>
        </div>
      </section>

      <footer v-if="combat.result?.type !== 'defeat'">
        <div v-if="combat.phase === COMBAT_PHASE.COMBAT_END" class="combat-outcome" :class="`combat-outcome--${combat.result.type}`">
          <strong>{{ combat.result.type === 'victory' ? 'Victory' : 'Defeat' }}</strong>
          <span>{{ combat.result.type === 'victory' ? `${combat.enemies[0].name} has been defeated.` : 'Your hero has fallen.' }}</span>
        </div>
        <button v-if="combat.result?.type === 'victory'" type="button" @click="$emit('victory')">Return to Map</button>
        <button v-else type="button" class="cancel-button" @click="$emit('cancel')">Cancel Combat</button>
      </footer>

      <section v-else class="death-screen">
        <span aria-hidden="true">☠</span>
        <p>Defeat</p>
        <h1 id="combat-title">You died</h1>
        <button type="button" @click="$emit('return-main-menu')">Return to Main Menu</button>
      </section>
    </main>
  </div>
</template>

<style scoped>
.combat-backdrop {
  position: fixed;
  z-index: 220;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: rgb(2 6 15 / 78%);
  backdrop-filter: blur(3px);
  color: #f8fafc;
}

.combat-window {
  position: relative;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  width: min(72rem, calc(100vw - 2rem));
  height: min(54rem, calc(100vh - 2rem));
  max-height: calc(100vh - 2rem);
  overflow: hidden;
  border: 1px solid #64748b;
  border-radius: 0.85rem;
  background: linear-gradient(145deg, #101827, #070b13);
  box-shadow: 0 2rem 6rem rgb(0 0 0 / 70%);
}

.combat-window--death {
  display: grid;
  width: min(32rem, calc(100vw - 2rem));
  min-height: 22rem;
  place-items: center;
}

.death-screen {
  display: grid;
  justify-items: center;
  gap: 0.65rem;
  padding: 2.5rem;
  text-align: center;
}

.death-screen > span { display: grid; width: 4rem; height: 4rem; place-items: center; border: 1px solid #7f1d1d; border-radius: 50%; background: #1f0a0a; color: #fca5a5; font-size: 2rem; }
.death-screen p { margin: 0.4rem 0 0; color: #f87171; font-size: 0.7rem; font-weight: 900; letter-spacing: 0.18em; text-transform: uppercase; }
.death-screen h1 { margin: 0; color: #f8fafc; font-size: 2.25rem; text-transform: uppercase; }
.death-screen button { margin-top: 1rem; border-color: #ef4444; background: #7f1d1d; }

.combat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.8rem 1.15rem;
  border-bottom: 1px solid #334155;
}

.combat-header p { margin: 0; color: #fbbf24; font-size: 0.67rem; font-weight: 900; letter-spacing: 0.16em; text-transform: uppercase; }
.combat-header h1 { margin: 0.1rem 0 0; font-size: 1.25rem; }
.combat-header > strong { padding: 0.35rem 0.6rem; border: 1px solid #475569; border-radius: 99px; color: #cbd5e1; font-size: 0.68rem; text-transform: uppercase; }
.combat-header__actions { display: flex; align-items: center; gap: 0.55rem; }
.combat-header__actions > strong { padding: 0.35rem 0.6rem; border: 1px solid #475569; border-radius: 99px; color: #cbd5e1; font-size: 0.68rem; text-transform: uppercase; }
.combat-header__actions button { padding: 0.4rem 0.7rem; }
.combat-content { overflow-y: auto; padding: 1rem; }
.initiative-picker { margin-bottom: 0.85rem; padding: 0.85rem; border: 1px solid #d97706; border-radius: 0.6rem; background: rgb(120 53 15 / 22%); text-align: center; }
.initiative-picker p { margin: 0; color: #fbbf24; font-size: 0.65rem; font-weight: 900; letter-spacing: 0.12em; text-transform: uppercase; }
.initiative-picker h2 { margin: 0.25rem 0 0.7rem; font-size: 1rem; }
.initiative-picker > div { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.4rem; }
.initiative-debug { display: flex; flex-wrap: wrap; gap: 0.45rem 0.9rem; margin-bottom: 0.85rem; padding: 0.55rem 0.7rem; border: 1px dashed #475569; border-radius: 0.45rem; color: #94a3b8; font-size: 0.65rem; text-transform: capitalize; }
.initiative-debug strong { color: #e2e8f0; }
.enemy-intent { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 0.85rem; padding: 0.75rem 0.9rem; border: 1px solid #a16207; border-radius: 0.55rem; background: linear-gradient(90deg, rgb(120 53 15 / 30%), rgb(15 23 42 / 80%)); }
.enemy-intent p { margin: 0; color: #fbbf24; font-size: 0.62rem; font-weight: 900; letter-spacing: 0.14em; text-transform: uppercase; }
.enemy-intent h2 { margin: 0.15rem 0 0; font-size: 1rem; }
.enemy-intent dl { width: min(24rem, 70%); margin: 0; }
.enemy-ai-debug { display: grid; gap: 0.25rem; margin-bottom: 0.85rem; padding: 0.65rem; border: 1px dashed #c084fc; border-radius: 0.45rem; background: rgb(88 28 135 / 18%); color: #d8b4fe; font-size: 0.65rem; }
.enemy-ai-debug strong { color: #f3e8ff; text-transform: uppercase; }

.combatants { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
.combat-card { position: relative; padding: 1rem; overflow: hidden; border: 1px solid; border-radius: 0.65rem; text-align: center; }
.combat-card--player { border-color: #eab308; background: linear-gradient(160deg, rgb(127 29 29 / 65%), #111827 62%); box-shadow: inset 0 0 2rem rgb(239 68 68 / 18%); }
.combat-card--enemy { border-color: #65a30d; background: linear-gradient(160deg, rgb(54 83 20 / 70%), #111827 62%); box-shadow: inset 0 0 2rem rgb(132 204 22 / 16%); }
.combat-card__icon { display: grid; width: 3rem; height: 3rem; place-items: center; margin: 0 auto 0.25rem; border: 1px solid rgb(255 255 255 / 30%); border-radius: 50%; background: rgb(2 6 23 / 65%); font-size: 1.45rem; }
.combat-card__side { margin: 0.2rem 0; color: #cbd5e1; font-size: 0.65rem; font-weight: 900; letter-spacing: 0.15em; text-transform: uppercase; }
.combat-card h2 { margin: 0.2rem 0 0.75rem; font-size: 1.15rem; }
.health-bar { height: 0.45rem; overflow: hidden; border-radius: 99px; background: #020617; }
.health-bar span { display: block; height: 100%; background: linear-gradient(90deg, #dc2626, #fb7185); transition: width 180ms ease; }
.health-value { display: block; margin-top: 0.35rem; font-size: 0.72rem; }
.block-value { display: inline-block; margin-top: 0.4rem; padding: 0.2rem 0.45rem; border: 1px solid #60a5fa; border-radius: 99px; background: #172554; color: #bfdbfe; font-size: 0.68rem; }
dl { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.35rem; margin: 0.8rem 0 0; }
dl div { padding: 0.4rem 0.2rem; border: 1px solid rgb(148 163 184 / 20%); border-radius: 0.35rem; background: rgb(2 6 23 / 48%); }
dt { color: #94a3b8; font-size: 0.62rem; } dd { margin: 0.1rem 0 0; font-weight: 900; }

.combat-actions { margin-top: 0.85rem; padding: 0.8rem; border: 1px solid #334155; border-radius: 0.6rem; background: rgb(15 23 42 / 75%); }
.combat-actions h2, .combat-actions h3 { margin: 0 0 0.55rem; font-size: 0.85rem; text-transform: uppercase; }
.combat-actions p { margin: 0.5rem 0 0; color: #94a3b8; font-size: 0.72rem; }
.skill-list { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.45rem; }
.skill-list button { display: grid; gap: 0.2rem; text-align: left; }
.skill-list button span { color: #c7d2fe; font-size: 0.62rem; font-weight: 700; }
.skill-list button small { color: #94a3b8; font-size: 0.62rem; font-weight: 500; }
button { padding: 0.55rem 0.75rem; border: 1px solid #818cf8; border-radius: 0.4rem; background: #1e293b; color: #fff; font-weight: 800; cursor: pointer; }
button:hover { border-color: #c7d2fe; background: #334155; } button:disabled { cursor: not-allowed; opacity: 0.4; }
.combat-details { display: grid; grid-template-columns: 1fr 1.5fr; gap: 0.75rem; margin-top: 0.8rem; }
.combat-details > div { min-height: 4rem; padding: 0.65rem; border-radius: 0.4rem; background: #0b1220; }
.combat-details ol { margin: 0; padding-left: 1.1rem; color: #cbd5e1; font-size: 0.68rem; }
.combat-feed { max-height: 10rem; overflow-y: auto; }
.combat-feed li { margin-bottom: 0.3rem; }
.combat-feed__round { color: #fbbf24; font-weight: 900; text-transform: uppercase; }
.combat-feed__damage { color: #fca5a5; }
.combat-feed__block { color: #93c5fd; }
.combat-feed__result { color: #86efac; font-weight: 900; }
.combat-debug { margin-top: 0.65rem; color: #64748b; font-size: 0.65rem; }
.combat-debug summary { cursor: pointer; font-weight: 800; text-transform: uppercase; }
.combat-debug > div { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-top: 0.4rem; }
.combat-debug input { width: 5rem; padding: 0.45rem; border: 1px solid #475569; border-radius: 0.35rem; background: #020617; color: #fff; }
.logs-window { position: absolute; z-index: 10; top: 0; right: 0; bottom: 0; width: min(36rem, 48%); display: grid; grid-template-rows: auto minmax(0, 1fr); border-left: 1px solid #64748b; border-radius: 0 0.85rem 0.85rem 0; background: #070b13; box-shadow: -1.5rem 0 3rem rgb(0 0 0 / 48%); }
.logs-window > header { display: flex; align-items: center; justify-content: space-between; padding: 0.85rem 1rem; border-bottom: 1px solid #334155; background: #111827; }
.logs-window > header p { margin: 0; color: #a5b4fc; font-size: 0.62rem; font-weight: 900; letter-spacing: 0.14em; text-transform: uppercase; }
.logs-window > header h2 { margin: 0.1rem 0 0; font-size: 1.15rem; }
.logs-window > header button { width: 2.25rem; height: 2.25rem; padding: 0; font-size: 1.25rem; }
.logs-window__content { display: grid; align-content: start; gap: 0.65rem; padding: 1rem; overflow-y: auto; }
.logs-window article { padding: 0.8rem; border: 1px solid #334155; border-radius: 0.5rem; background: #0f172a; }
.logs-window article > small { color: #fbbf24; font-weight: 800; text-transform: uppercase; }
.logs-window article h3 { margin: 0.2rem 0 0.65rem; font-size: 0.9rem; }
.logs-window__decision p { margin: 0; color: #cbd5e1; font-size: 0.72rem; }
.logs-window article dl { grid-template-columns: repeat(4, minmax(0, 1fr)); margin: 0; }
.logs-window__empty { color: #94a3b8; text-align: center; }
footer { display: flex; justify-content: flex-end; gap: 0.45rem; padding: 0.75rem 1rem; border-top: 1px solid #334155; }
.combat-outcome { display: grid; margin-right: auto; }
.combat-outcome strong { font-size: 0.9rem; text-transform: uppercase; }
.combat-outcome span { color: #94a3b8; font-size: 0.7rem; }
.combat-outcome--victory strong { color: #86efac; }
.combat-outcome--defeat strong { color: #fca5a5; }
.result-button { border-color: #475569; color: #cbd5e1; font-size: 0.68rem; }
.cancel-button { border-color: #7f1d1d; color: #fecaca; }

@media (max-width: 650px) {
  .combatants, .combat-details { grid-template-columns: 1fr; }
  .combat-window { width: calc(100vw - 1rem); height: calc(100vh - 1rem); max-height: calc(100vh - 1rem); }
  dl { grid-template-columns: repeat(2, 1fr); }
  footer { flex-wrap: wrap; }
  .skill-list { grid-template-columns: 1fr; }
  .enemy-intent { align-items: stretch; flex-direction: column; }
  .enemy-intent dl { width: 100%; }
  .combat-header__actions { align-items: flex-end; flex-direction: column; }
  .logs-window article dl { grid-template-columns: 1fr 1fr; }
  .logs-window { top: auto; left: 0; width: 100%; height: 68%; border-top: 1px solid #64748b; border-left: 0; border-radius: 0.85rem 0.85rem 0 0; box-shadow: 0 -1.5rem 3rem rgb(0 0 0 / 55%); }
}
</style>
