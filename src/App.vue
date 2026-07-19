<script setup>
import { computed, nextTick, onErrorCaptured, ref, shallowRef } from 'vue'
import MainMenu from './views/MainMenu.vue'
import MenuTwo from './views/MenuTwo.vue'
import MenuThree from './views/MenuThree.vue'
import { createNewRun, createRunSeed, updateRunProgress } from './game/gameState.js'
import { generateMeadowsRegion } from './world/meadowsGenerator.js'
import { createRandomCharacterCreation } from './game/characterCreation.js'
import { readSave, removeSave, writeSave } from './game/saveService.js'

const initialSaveResult = readSave()
const currentView = ref('main-menu')
const selectedCharacter = ref(null)
const activeRun = ref(initialSaveResult.status === 'valid' ? initialSaveResult.save : null)
const activeWorldMap = shallowRef(initialSaveResult.status === 'valid' ? initialSaveResult.map : null)
const saveStatus = ref(initialSaveResult.status)
const saveMessage = ref(initialSaveResult.status === 'invalid' ? 'invalid-save' : '')
const isOpeningMap = ref(false)
const busy = ref(false)
const showNewRunConfirmation = ref(false)
const mapError = ref('')

const saveInfo = computed(() => {
  if (!activeRun.value || saveStatus.value !== 'valid') return null
  return {
    characterName: activeRun.value.characterState?.name ?? 'Unknown hero',
    moveCount: activeRun.value.time.moveCount,
    updatedAt: new Date(activeRun.value.updatedAt).toLocaleString(),
  }
})

function requestNewRun() {
  if (busy.value) return
  if (saveStatus.value === 'valid' || saveStatus.value === 'invalid') showNewRunConfirmation.value = true
  else currentView.value = 'menu-two'
}

function cancelNewRun() {
  showNewRunConfirmation.value = false
}

function confirmNewRun() {
  if (busy.value) return
  busy.value = true
  const result = removeSave()
  if (!result.ok) saveMessage.value = 'Save storage is unavailable. The old save could not be removed.'
  activeRun.value = null
  saveStatus.value = 'empty'
  showNewRunConfirmation.value = false
  currentView.value = 'menu-two'
  busy.value = false
}

function deleteBrokenSave() {
  if (busy.value) return
  const result = removeSave()
  if (result.ok) {
    activeRun.value = null
    saveStatus.value = 'empty'
    saveMessage.value = ''
  } else saveMessage.value = 'Save could not be deleted because browser storage is unavailable.'
}

async function openMenuThree(run, map) {
  selectedCharacter.value = { id: run.characterState.id, name: run.characterState.name, icon: '⚔️' }
  activeRun.value = run
  activeWorldMap.value = map
  mapError.value = ''
  isOpeningMap.value = true
  currentView.value = 'map-loading'
  await nextTick()
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  currentView.value = 'menu-three'
}

async function createRunForCharacter(characterCreation) {
  if (busy.value) return
  busy.value = true
  try {
    const seed = createRunSeed()
    const map = generateMeadowsRegion(seed)
    const run = createNewRun(characterCreation, { seed, map })
    const result = writeSave(run)
    const storedRun = result.ok ? result.save : run
    saveStatus.value = result.ok ? 'valid' : 'unavailable'
    saveMessage.value = result.ok ? '' : 'Progress cannot be saved because browser storage is unavailable.'
    await openMenuThree(storedRun, map)
  } finally {
    busy.value = false
  }
}

function quickStart() {
  if (!busy.value) createRunForCharacter(createRandomCharacterCreation())
}

async function continueRun() {
  if (busy.value) return
  busy.value = true
  try {
    const result = readSave()
    if (result.status !== 'valid') {
      activeRun.value = null
      saveStatus.value = result.status
      saveMessage.value = 'invalid-save'
      return
    }
    await openMenuThree(result.save, result.map)
  } finally {
    busy.value = false
  }
}

function persistProgress(progress) {
  if (!activeRun.value) return
  const updated = updateRunProgress(activeRun.value, progress)
  const result = writeSave(updated)
  activeRun.value = result.ok ? result.save : updated
  if (result.ok) saveStatus.value = 'valid'
  else saveMessage.value = 'Automatic save failed. Your latest progress may not persist after refresh.'
}

function finishOpeningMap() { isOpeningMap.value = false }
function returnToMainMenu() { currentView.value = 'main-menu' }

function handleEscape(event) {
  if (event.key === 'Escape' && showNewRunConfirmation.value) cancelNewRun()
}

onErrorCaptured((error, instance, info) => {
  console.error('Map rendering failed:', error instanceof Error ? error.stack : String(error))
  console.error('Vue error context:', info, 'Component:', instance?.$options?.name ?? 'anonymous')
  mapError.value = error instanceof Error ? error.message : String(error)
  isOpeningMap.value = false
  return false
})
</script>

<template>
  <div @keydown="handleEscape">
    <MainMenu
      v-if="currentView === 'main-menu'"
      :save-info="saveInfo"
      :save-error="saveStatus === 'invalid' ? saveMessage : ''"
      :busy="busy"
      @new-run="requestNewRun"
      @quick-start="quickStart"
      @continue="continueRun"
      @delete-save="deleteBrokenSave"
    />
    <MenuTwo v-else-if="currentView === 'menu-two'" @next="createRunForCharacter" />
    <MenuThree
      v-else-if="currentView === 'menu-three'"
      :character="selectedCharacter"
      :run="activeRun"
      :world-map="activeWorldMap"
      @ready="finishOpeningMap"
      @save-state="persistProgress"
      @main-menu="returnToMainMenu"
      @new-run="requestNewRun"
    />

    <div v-if="currentView === 'map-loading' || isOpeningMap" class="map-opening-screen">
      <div class="dialog"><p>Entering</p><h2>Map 1 — Meadows</h2><div class="loading"><span></span></div><strong>Loading run…</strong></div>
    </div>

    <div v-if="showNewRunConfirmation" class="modal-backdrop" @click.self="cancelNewRun">
      <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="new-run-title">
        <h2 id="new-run-title">Start a new run?</h2>
        <p>Starting a new run will delete your current progress.</p>
        <div class="modal-actions">
          <button type="button" autofocus @click="cancelNewRun">Cancel</button>
          <button type="button" class="danger" @click="confirmNewRun">Start New Run</button>
        </div>
      </div>
    </div>

    <div v-if="mapError" class="map-error-screen" role="alert">
      <h2>Map could not be loaded</h2><p>{{ mapError }}</p>
      <button type="button" @click="mapError = ''; currentView = 'main-menu'">Back to Main Menu</button>
    </div>
  </div>
</template>

<style scoped>
.map-opening-screen,.modal-backdrop,.map-error-screen{position:fixed;z-index:100;inset:0;display:grid;place-items:center;padding:1.5rem;background:rgb(2 6 23 / 96%);color:#f8fafc;text-align:center}.dialog{width:min(36rem,100%);padding:2.5rem 2rem;border:2px solid #a5b4fc;border-radius:1rem;background:#0f172a;box-shadow:0 25px 60px #000}.dialog p{margin-top:1rem;color:#cbd5e1}.dialog h2{font-size:2rem;font-weight:900}.loading{height:.9rem;margin-top:2rem;overflow:hidden;border:1px solid #64748b;border-radius:999px;background:#020617}.loading span{display:block;width:45%;height:100%;background:linear-gradient(90deg,#4338ca,#818cf8);animation:loading 1s ease-in-out infinite alternate}.dialog strong{display:block;margin-top:.75rem;color:#c7d2fe}.modal-actions{display:flex;justify-content:center;gap:.75rem;margin-top:1.75rem}.modal-actions button,.map-error-screen button{padding:.7rem 1rem;border:1px solid #a5b4fc;border-radius:.5rem;background:#1e293b;color:#fff}.modal-actions .danger{border-color:#f87171;background:#7f1d1d}.map-error-screen p{margin-top:1rem;color:#fca5a5}.map-error-screen button{margin-top:1.5rem}@keyframes loading{to{transform:translateX(122%)}}
</style>
