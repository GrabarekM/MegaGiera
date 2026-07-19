<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, shallowReactive, toRaw } from 'vue'
import { findPath, generateMeadowsRegion, MEADOWS_GENERATION_CONFIG, POI, terrainDetails } from '../data/maps.js'
import { createWorldMapPresentation } from '../world/worldTilePresentation.js'
import { initializeWorldSession } from '../world/worldSession.js'
import { canPlayerEnterTile, resolveMovementIntent } from '../world/worldMovement.js'
import { calculateTileTravelTime } from '../data/travelConfig.js'
import { getWorldClock, getWorldPeriod, WORLD_PERIOD } from '../world/worldClock.js'
import { getNightThreat } from '../world/nightThreatService.js'
import { isSafeZone } from '../world/safeZoneService.js'
import { activateLightSource, canWaitUntilMorning, consumeLightDuration, deactivateLightSource, isLightActive, LIGHT_SOURCE_TYPE, toggleHolyLantern } from '../world/lightSourceSystem.js'
import { checkNightEncounter } from '../world/nightEncounterService.js'
import { canWaitThroughNight } from '../world/wardwoodEconomy.js'
import { WardwoodService } from '../world/wardwoodService.js'
import { waitUntilMorningProtected } from '../world/nightProtectionService.js'
import { STATIC_POI_CONFIG } from '../data/staticPoiConfig.js'
import { calculateFollowScroll } from '../utils/camera.js'
import EventModal from '../components/EventModal.vue'
import CombatView from '../components/CombatView.vue'
import TrainerScreen from '../components/TrainerScreen.vue'
import ItemTooltip from '../components/ItemTooltip.vue'
import PoiInteractionOverlay from '../components/PoiInteractionOverlay.vue'
import EncounterOverlay from '../components/EncounterOverlay.vue'
import RegionStatePanel from '../components/RegionStatePanel.vue'
import WorldTileLayers from '../components/WorldTileLayers.vue'
import DialogueOverlay from '../components/DialogueOverlay.vue'
import QuestPanels from '../components/QuestPanels.vue'
import { DialogueDatabase } from '../dialogue/dialogueDatabase.js'
import { dialogueDefinitions, DIALOGUE_NPCS } from '../dialogue/dialogueDefinitions.js'
import { DialogueRepository } from '../dialogue/dialogueRepository.js'
import { DialogueEffectExecutor, DialogueExternalActionService, DialogueSessionService } from '../dialogue/dialogueServices.js'
import { QuestDatabase } from '../quests/questDatabase.js'
import { questDefinitions } from '../quests/questDefinitions.js'
import { QuestRepository } from '../quests/questRepository.js'
import { QuestEffectExecutor, QuestService } from '../quests/questServices.js'
import { createQuestLogViewModel, createQuestTrackerViewModel } from '../quests/questPresentation.js'
import { NpcScheduleDatabase } from '../npcSchedules/npcScheduleDatabase.js'
import { NPC_ASSIGNMENTS, npcScheduleDefinitions, SCHEDULE_LOCATIONS } from '../npcSchedules/npcScheduleDefinitions.js'
import { NpcScheduleRepository } from '../npcSchedules/npcScheduleRepository.js'
import { NpcScheduleAvailabilityService, NpcScheduleProcessingService, NpcScheduleResolver, NpcScheduleRuntimeModifierService } from '../npcSchedules/npcScheduleServices.js'
import { NpcScheduleIntegrationCoordinator } from '../npcSchedules/npcScheduleIntegrations.js'
import { MODIFIER_TYPE } from '../npcSchedules/npcScheduleConstants.js'
import { ITEM_LIST, getItemDefinition } from '../items/itemDatabase.js'
import { createItemInstance } from '../items/itemInstance.js'
import { createItemUseContext } from '../items/itemUseContext.js'
import { ItemUseService, ITEM_USE_ACTION } from '../items/itemUseService.js'
import { BookService } from '../books/bookService.js'
import { getBookCollectionSummary, queryLibrary } from '../books/bookCollectionService.js'
import { BOOK_CATEGORY, BOOK_KIND } from '../books/bookDefinitions.js'
import { ITEM_TYPE } from '../items/itemConstants.js'
import { EquipmentManager, EQUIPMENT_EVENT } from '../equipment/equipmentManager.js'
import { InventoryManager, INVENTORY_FILTER, INVENTORY_SORT } from '../inventory/inventoryManager.js'
import { claimLootReward, leaveLootReward, takeLootReward } from '../inventory/lootReward.js'
import { generateLoot } from '../loot/lootGenerator.js'
import { LOOT_DEFINITIONS, POI_LOOT_DEFINITION_IDS, REGION_LOOT_MODIFIERS } from '../data/lootDefinitions.js'
import { calculateCharacterStats } from '../character/characterStatCalculator.js'
import { EventManager } from '../engine/events/eventManager.js'
import { enginePreviewEvent } from '../data/events/enginePreviewEvent.js'
import { cloneCharacterState, createCharacterState, restoreCharacterState } from '../game/characterState.js'
import { CombatManager } from '../combat/combatManager.js'
import { COMBAT_INITIATOR, COMBAT_RESULT } from '../combat/combatConstants.js'
import { ENEMY_TEMPLATE_LIST, ENEMY_TEMPLATES } from '../data/enemyTemplates.js'
import { ATTRIBUTE_DEFINITIONS, EQUIPMENT_SLOTS, PROFICIENCY_CATEGORIES, PROFICIENCY_DESCRIPTIONS, PROFICIENCY_NAMES } from '../data/characterCreation.js'
import { WEAPON_LIST } from '../data/weapons.js'
import { COMBAT_SKILLS } from '../data/combatSkills.js'
import { createPanelManager, GAME_PANELS, isTextInputTarget } from '../ui/panelManager.js'
import { gainExperience, gainLearningPoints } from '../game/characterProgression.js'
import { PracticeGainService } from '../skills/practiceGainService.js'
import { TRAINER_LIST, TRAINERS } from '../data/trainers.js'
import { MENTOR_LIST, MENTORS } from '../data/mentors.js'
import { getDiscoveredKnowledge, grantAllKnowledge, grantKnowledge, removeKnowledge, resetKnowledge } from '../game/knowledgeService.js'
import { applyLesson } from '../npc/trainerSystem.js'
import { MERCHANT_DEFINITIONS, MERCHANT_LIST } from '../merchants/merchantDefinitions.js'
import { generateMerchantState } from '../merchants/merchantStock.js'
import { MerchantService, merchantAcceptsItem } from '../merchants/merchantService.js'
import { calculateTransactionPrice } from '../merchants/merchantPriceCalculator.js'
import { STOCK_REFRESH_SOURCE } from '../merchants/merchantConstants.js'
import { SalvageService, createSalvageRandomSource, isPotentiallySalvageable } from '../salvage/salvageService.js'
import { SALVAGE_DEFINITIONS } from '../salvage/salvageDefinitions.js'
import { CraftingService } from '../crafting/craftingService.js'
import { RecipeUnlockService } from '../crafting/recipeUnlockService.js'
import { RECIPE_CATEGORY, STATION_TYPE } from '../crafting/craftingConstants.js'
import { poiDatabase } from '../poi/poiDatabase.js'
import { PoiRepository } from '../poi/poiRepository.js'
import { PoiService } from '../poi/poiService.js'
import { PoiDiscoveryService } from '../poi/poiDiscoveryService.js'
import { PoiActionService } from '../poi/poiActionService.js'
import { createPoiInteractionContext } from '../poi/poiInteractionContext.js'
import { PoiOutcomeService } from '../poi/poiOutcomeService.js'
import { createPoiInteractionModel, createPoiMarkerModel, getPoiUiMessage } from '../poi/poiPresentationService.js'
import { encounterDatabase } from '../encounters/encounterDatabase.js'
import { EncounterStateRepository } from '../encounters/encounterRepository.js'
import { EncounterSelectionService } from '../encounters/encounterSelectionService.js'
import { ENCOUNTER_TRIGGER_SOURCE, MOVEMENT_SOURCE } from '../encounters/encounterConstants.js'
import { TravelEncounterService } from '../encounters/travelEncounterService.js'
import { EncounterDetectionService } from '../encounters/encounterDetectionService.js'
import { EncounterResolutionService } from '../encounters/encounterResolutionService.js'
import { EncounterCombatService } from '../encounters/encounterCombatService.js'
import { EncounterNonCombatService } from '../encounters/encounterNonCombatService.js'
import { EncounterChoiceAvailabilityResolver, EncounterChoiceService } from '../encounters/encounterChoiceService.js'
import { createEncounterPresentationModel } from '../encounters/encounterPresentationService.js'
import { EncounterPresentationCoordinator } from '../encounters/encounterPresentationCoordinator.js'
import { NotificationService } from '../ui/notificationService.js'
import { WorldEventStateRepository } from '../worldEvents/worldEventRepository.js'
import { worldEventDatabase } from '../worldEvents/worldEventDatabase.js'
import { WorldEventProcessingService } from '../worldEvents/worldEventServices.js'
import { TRIGGER_TYPE } from '../worldEvents/worldEventConstants.js'
import { WorldEventEffectExecutor } from '../worldEvents/worldEventEffectExecutor.js'
import { createRegionStateViewModel } from '../worldEvents/worldEventPresentation.js'
import { ITEM_QUALITY } from '../items/itemConstants.js'
import { advanceMentorDiscovery, canOpenMentor, MENTOR_DISCOVERY, PERSONAL_QUEST_STATE, resetMentorProgress, revealMentorLessons, setPersonalQuestState } from '../npc/mentorSystem.js'
import { revealAllLessons, resetRevealedLessons, revealEligibleLessons } from '../npc/lessonVisibilityService.js'
import {
  advancePoiDiscovery,
  countPoiDiscoveryStates,
  createPoiRecords,
  getVisibleTileIndices,
  isTileCurrentlyVisible,
  POI_DISCOVERY_STATE,
} from '../engine/poiDiscoverySystem.js'
import {
  advanceMovementTime,
  advanceTime,
  createInitialTime,
  formatHour,
  getTimeOfDay,
  getElapsedMinutes,
  restHours,
  TIME_OF_DAY,
  TIME_OF_DAY_DETAILS,
  waitHours,
  waitUntilTimeOfDay,
} from '../engine/timeSystem.js'

const props = defineProps({
  character: {
    type: Object,
    required: true,
  },
  run: { type: Object, required: true },
  worldMap: { type: Object, default: null },
})

const emit = defineEmits(['ready', 'save-state', 'main-menu', 'new-run'])

const rawRun = toRaw(props.run)
const initialWorldSession = initializeWorldSession(rawRun, props.worldMap ? () => toRaw(props.worldMap) : generateMeadowsRegion)
if (!initialWorldSession.ok) throw new Error(`World initialization failed: ${initialWorldSession.reason}`)
if (initialWorldSession.usedFallback && import.meta.env.DEV) console.warn('Saved player position was invalid; using the Meadows start position.')
const currentSeed = ref(initialWorldSession.seed)
// The map contains 10,000 tiles. Deeply proxying every tile can block the first
// render when Menu 3 is opened, so only the map's top-level properties are reactive.
const meadowsMap = shallowReactive(initialWorldSession.map)
const initialPlayerPosition = initialWorldSession.position

const showMapIntro = ref(true)
const loadingProgress = ref(0)
let loadingAnimationFrame = null
const fogEnabled = ref(true)
const showTimeActions = ref(false)
const showDevTools = ref(false)
const devToolsQuery = ref('')
const devToolsCategory = ref('all')
const devToolsMenu = ref(null)
const visibleDevToolCount = ref(0)
const showCoordinates = ref(false)
const showTileGrid = ref(false)
const showPointsOfInterest = ref(false)
const showBiomeColors = ref(true)
const showBlockedTiles = ref(false)
const showMainComponent = ref(false)
const showBiomeBoundaries = ref(false)
const showPassages = ref(false)
const showBossPath = ref(false)
const showTerrainStats = ref(false)
const showRoads = ref(false)
const showGravelRoads = ref(false)
const showWoodenBridges = ref(false)
const showSecondaryRoadTargets = ref(false)
const showTravelCosts = ref(false)
const showSettlementInfluence = ref(false)
const showRoadConnections = ref(false)
const showBridges = ref(false)
const showCityBounds = ref(false)
const showVillageBounds = ref(false)
const showRegionZones = ref(false)
const showStartPosition = ref(false)
const showBossPosition = ref(false)

const DEV_TOOL_CATEGORY_PATTERNS = Object.freeze({
  poi: /poi|point of interest|detection|identification|discovery/i,
  roads: /road|bridge/i,
  combat: /combat|event/i,
  world: /settlement|city|village|region|sector|boss|start position|edge zone|density|empty sector|merchant|gold|stock|price|transaction/i,
})

function getDevToolCategory(label) {
  return Object.entries(DEV_TOOL_CATEGORY_PATTERNS).find(([, pattern]) => pattern.test(label))?.[0] ?? 'map'
}

async function filterDevTools() {
  await nextTick()
  if (!devToolsMenu.value) return
  const query = devToolsQuery.value.trim().toLocaleLowerCase()
  const buttons = [...devToolsMenu.value.querySelectorAll(':scope > button')]
  let visible = 0

  for (const button of buttons) {
    const label = button.textContent.trim()
    const matchesQuery = !query || label.toLocaleLowerCase().includes(query)
    const matchesCategory = devToolsCategory.value === 'all' || getDevToolCategory(label) === devToolsCategory.value
    button.hidden = !(matchesQuery && matchesCategory)
    if (!button.hidden) visible += 1
  }

  const seedTools = devToolsMenu.value.querySelector('.dev-seed')
  if (seedTools) seedTools.hidden = Boolean(query && !'map seed generate'.includes(query)) || !['all', 'map'].includes(devToolsCategory.value)
  visibleDevToolCount.value = visible + (seedTools && !seedTools.hidden ? 1 : 0)
}

async function openDevTools() {
  showDevTools.value = true
  await filterDevTools()
}
const showSectorGrid = ref(false)
const showEdgeZone = ref(false)
const showSectorStats = ref(false)
const showEmptySectors = ref(false)
const showDensityHeatmap = ref(false)
const showPoiDetectionRanges = ref(false)
const showPoiIdentificationRanges = ref(false)
const showPoiDiscoveryStates = ref(false)
const mapScrollArea = ref(null)
let isDraggingMap = false
const mapZoom = ref(1)
const minimumZoom = 0.5
const maximumZoom = 2
const baseTileSize = 88
const mapTileSize = computed(() => baseTileSize * mapZoom.value)
const viewport = reactive({ left: 0, top: 0, width: 1200, height: 800 })
let viewportAnimationFrame = null
const dragStart = { x: 0, y: 0, scrollLeft: 0, scrollTop: 0 }
let didDragMap = false
const playerPosition = ref(initialPlayerPosition)
const exploredTiles = reactive(new Set(rawRun.discovered))
const visitedTiles = reactive(new Set(rawRun.visited))
const timeState = ref({ ...rawRun.time })
const poiDiscovery = reactive({ ...(rawRun.poiDiscovery ?? {}) })
const poiState = reactive(structuredClone(rawRun.poiState ?? { version: 1, instances: [] }))
const poiRevision = ref(0)
const poiRepository = new PoiRepository(poiState)
const poiService = new PoiService({ database: poiDatabase, repository: poiRepository, onChange: (state) => { poiState.version = state.version; poiState.instances.splice(0, poiState.instances.length, ...state.instances); poiRevision.value += 1; saveProgress() } })
const encounterStateRepository = new EncounterStateRepository(rawRun.encounterState)
const worldEventStateRepository = new WorldEventStateRepository(rawRun.worldEventRuntime)
const worldEventProcessingService = new WorldEventProcessingService({ database: worldEventDatabase, repository: worldEventStateRepository })
const worldEventDebugView = ref(null)
const debugWorldEventId = ref(worldEventDatabase.getAll()[0]?.id ?? '')
function applyWorldEventProcessingResults(processed) { const context = { worldDay: timeState.value.day, worldTime: { hour: timeState.value.hour, minute: timeState.value.minute ?? 0 }, randomSource: () => Number(debugEncounterRandom?.value ?? 0.5) }; const effects = []; for (const result of processed?.results ?? []) { if (result?.code === 'WORLD_EVENT_ACTIVATED_PENDING_EFFECTS') effects.push(worldEventEffectExecutor.applyPendingWorldEventEffects(result.instance.instanceId, context)); if (result?.code === 'WORLD_EVENT_EXPIRED_PENDING_CLEANUP') effects.push(worldEventEffectExecutor.revertWorldEventEffects(result.instance.instanceId, context)) } regionStateRevision.value += 1; return effects }
function worldEventSignal(type, changes = {}) { const signal = { signalId: `debug-${type}-${worldEventStateRepository.worldState.processingSequenceCounter + 1}`, triggerType: type, worldDay: timeState.value.day, worldTime: { hour: timeState.value.hour, minute: timeState.value.minute ?? 0 }, regionId: meadowsMap.id, ...changes }; worldEventDebugView.value = worldEventProcessingService.processSignal(signal, { characterState }); applyWorldEventProcessingResults(worldEventDebugView.value); saveProgress(); return worldEventDebugView.value }
function processWorldEventsForCurrentTime() { worldEventDebugView.value = worldEventProcessingService.processTime(timeState.value.day, { hour: timeState.value.hour, minute: timeState.value.minute ?? 0 }); applyWorldEventProcessingResults(worldEventDebugView.value); npcScheduleProcessing.invalidateAll(); processNpcSchedules(); return worldEventDebugView.value }
const encounterSelectionService = new EncounterSelectionService({ database: encounterDatabase, stateRepository: encounterStateRepository, runSeed: rawRun.seed })
const travelEncounterService = new TravelEncounterService({ selectionService: encounterSelectionService, travelState: encounterStateRepository.state.travelState, runSeed: rawRun.seed })
const debugEncounterId = ref(encounterDatabase.getAllEncounters()[0]?.id ?? '')
const debugEncounterTableId = ref(encounterDatabase.getAllTables()[0]?.id ?? '')
const debugEncounterChoiceId = ref('fight')
const debugEncounterView = ref(null)
const debugEncounterRandom = ref(0.25)
const debugPoiInstanceId = ref(poiRepository.getAll()[0]?.instanceId ?? '')
const debugPoiStateId = ref('untouched')
const debugPoiFlag = ref('searched')
const debugPoiCounter = ref('searchAction')
const debugPoiActionId = ref('cart_search')
const debugPoiView = ref(null)
const activePoiInstanceId = ref(null)
const poiUiMessage = ref('')
const poiActionBusy = ref(false)
const activePoiLootInstanceId = ref(null)
const activeEncounterLootInstanceId = ref(null)
const selectedDebugPoi = computed(() => poiRepository.get(debugPoiInstanceId.value))
function debugPoi(action) { const id = debugPoiInstanceId.value; const value = action(); debugPoiView.value = { result: value, definition: selectedDebugPoi.value ? poiDatabase.get(selectedDebugPoi.value.poiDefinitionId) : null, instance: selectedDebugPoi.value }; return value }
function debugCreatePoi() { const definition = poiDatabase.getAll().find((entry) => !poiRepository.get(`${entry.id}-${props.run.runId}-debug`)) ?? poiDatabase.getAll()[0]; const value = poiService.create(definition.id, { instanceId: `${definition.id}-${props.run.runId}-debug`, runId: props.run.runId, seed: currentSeed.value, worldPosition: playerPosition.value }); if (value.ok) debugPoiInstanceId.value = value.instance.instanceId; debugPoiView.value = value }
function debugRevealAllPois() { for (const instance of poiRepository.getAll()) poiService.discover(instance.instanceId, true); debugPoiView.value = { revealed: poiRepository.getAll().length } }
function debugResetAllPois() { for (const instance of poiRepository.getAll()) poiService.reset(instance.instanceId); debugPoiView.value = { reset: poiRepository.getAll().length } }
async function debugTeleportToPoi() { const instance = selectedDebugPoi.value; if (!instance) return; playerPosition.value = { ...instance.worldPosition }; await centerMapOnPlayer(); saveProgress() }
function debugOpenPoiOverlay() { if (debugPoiInstanceId.value) { poiService.discover(debugPoiInstanceId.value, true); openPoi(debugPoiInstanceId.value) } }
function worldEventEncounterContext() { const region = worldEventStateRepository.region(meadowsMap.id); return { regionThreatLevel: region?.threatLevel ?? 1, worldFlags: worldEventStateRepository.worldState.worldFlags, regionFlags: Object.fromEntries((region?.activeFlags ?? []).map((flag) => [flag, true])), worldEventEncounterRuntime: worldEventEffectExecutor.encounters } }
function encounterDebugContext() { const tile = currentPlayerTile.value; const road = Boolean(tile?.road || tile?.roadType || tile?.isRoad); return { runId: props.run.runId, regionId: meadowsMap.id, biomeTags: [tile?.biome ?? tile?.terrain ?? 'grassland'], locationId: `${meadowsMap.id}-${road ? 'road' : 'wilds'}`, locationTags: [road ? 'Road' : 'Wilderness'], worldPosition: { ...playerPosition.value }, worldDay: timeState.value.day, worldTime: { hour: timeState.value.hour, minute: timeState.value.minute ?? 0 }, isNight: getWorldPeriod(timeState.value) === WORLD_PERIOD.NIGHT, nightThreatPercent: currentThreat.value.level, currentSafeZoneStatus: playerInSafeZone.value, characterState, knownKnowledgeIds: characterState.discoveredKnowledge, triggerSource: ENCOUNTER_TRIGGER_SOURCE.DEVELOPER, randomSource: () => Number(debugEncounterRandom.value), ...worldEventEncounterContext() } }
function encounterInteractionContext(randomSource = () => Number(debugEncounterRandom.value)) { return { characterState, characterStats: calculatedCharacter.value, inventoryManager, wardwoodService, worldDay: timeState.value.day, worldTime: { hour: timeState.value.hour, minute: timeState.value.minute ?? 0 }, worldFlags: {}, regionFlags: {}, questFlags: {}, activeLightSourceType: characterState.activeLightSource?.type ?? null, isNight: getWorldPeriod(timeState.value) === WORLD_PERIOD.NIGHT, nightThreatPercent: currentThreat.value.level, randomSource, advanceWorldTime: (minutes) => { timeState.value = advanceTime(timeState.value, { minutes, countMove: false, reason: 'encounter-choice' }); return { ok: true } } } }
function debugPreviewEncounter() { debugEncounterView.value = encounterSelectionService.previewEncounterSelection(encounterDebugContext()) }
function debugSelectEncounter() { debugEncounterView.value = encounterSelectionService.selectEncounter(encounterDebugContext()); saveProgress() }
function debugCreateEncounterInstance() { const previous = encounterStateRepository.state.forcedNextEncounterId; encounterStateRepository.state.forcedNextEncounterId = debugEncounterId.value; debugSelectEncounter(); if (!debugEncounterView.value?.success) encounterStateRepository.state.forcedNextEncounterId = previous }
function debugTravelContext(locationTags = ['Road'], changes = {}) { return { characterId: characterState.id, runId: props.run.runId, movementSource: MOVEMENT_SOURCE.DEVELOPER, developerMovementGeneratesProgress: true, previousPosition: { row: 0, column: 0 }, currentPosition: { row: 0, column: 1 }, travelDistance: 1, regionId: meadowsMap.id, biomeTags: ['forest'], locationId: `debug-${locationTags[0]}`, locationTags, previousWorldDay: timeState.value.day, previousWorldTime: { hour: timeState.value.hour, minute: timeState.value.minute ?? 0 }, worldDay: timeState.value.day, worldTime: { hour: timeState.value.hour, minute: timeState.value.minute ?? 0 }, isNight: getWorldPeriod(timeState.value) === WORLD_PERIOD.NIGHT, nightThreatPercent: currentThreat.value.level, isInSafeZone: false, characterState, randomSource: () => Number(debugEncounterRandom.value), stopMovement: () => true, ...worldEventEncounterContext(), ...changes } }
function debugProcessTravel(locationTags = ['Road'], changes = {}) { debugEncounterView.value = travelEncounterService.processTravelSegment(debugTravelContext(locationTags, changes)); saveProgress() }
function debugPreviewTravel() { debugEncounterView.value = travelEncounterService.previewTravelEncounterTrigger(debugTravelContext()) }
function debugActiveEncounter() { return encounterStateRepository.instances.get(encounterStateRepository.state.travelState.pendingEncounterInstanceId) }
function debugActivateEncounter(random = () => Number(debugEncounterRandom.value)) { const instance = debugActiveEncounter(); debugEncounterView.value = instance ? encounterDetectionService.activatePendingEncounter(instance.instanceId, encounterInteractionContext(random)) : { ok: false, code: 'ENCOUNTER_NOT_PENDING' }; saveProgress() }
function debugEncounterChoice(execute = false) { const instance = debugActiveEncounter(); debugEncounterView.value = instance ? (execute ? encounterChoiceService.execute(instance.instanceId, debugEncounterChoiceId.value, encounterInteractionContext()) : encounterChoiceService.preview(instance.instanceId, debugEncounterChoiceId.value, encounterInteractionContext())) : { ok: false, code: 'ENCOUNTER_NOT_PENDING' }; presentEncounterLoot(debugEncounterView.value, instance?.instanceId); saveProgress() }
function debugEncounterPresentation() { const instance = debugActiveEncounter(); debugEncounterView.value = instance ? createEncounterPresentationModel(instance, encounterDatabase.getEncounter(instance.encounterDefinitionId), encounterChoiceAvailabilityResolver, encounterInteractionContext()) : null }
const characterState = reactive(restoreCharacterState(rawRun.characterState, createCharacterState({
  id: `character-${rawRun.runId}`,
  name: 'Hero',
})))
const equipmentManager = new EquipmentManager(characterState)
const inventoryManager = new InventoryManager(characterState)
const recipeUnlockService = new RecipeUnlockService(characterState)
const craftingService = new CraftingService({ character: characterState, inventoryManager, recipeUnlockService, getWorldTime: () => ({ day: timeState.value.day, hour: timeState.value.hour }) })
const recipeSearch = ref('')
const recipeCategory = ref('')
const recipeStation = ref(STATION_TYPE.NONE)
const selectedRecipeId = ref(null)
const craftingMessage = ref('')
const knownRecipes = computed(() => recipeUnlockService.getKnownRecipes().filter((recipe) => !recipeSearch.value || `${recipe.displayName} ${recipe.description}`.toLocaleLowerCase().includes(recipeSearch.value.toLocaleLowerCase())).filter((recipe) => !recipeCategory.value || recipe.category === recipeCategory.value))
const selectedRecipePreview = computed(() => selectedRecipeId.value ? craftingService.preview(selectedRecipeId.value, 1, { stationType: recipeStation.value }) : null)
function craftRecipe(quantity) { const context = { stationType: recipeStation.value }; const result = quantity === 'max' ? craftingService.craftMax(selectedRecipeId.value, context) : craftingService.craft(selectedRecipeId.value, quantity, context); craftingMessage.value = result.message ?? result.blockers?.[0]?.message ?? result.code; if (result.ok) saveProgress() }
const salvageService = new SalvageService({ character: characterState, inventoryManager, randomSource: createSalvageRandomSource(rawRun.seed), getWorldTime: () => ({ day: timeState.value.day, hour: timeState.value.hour }) })
const wardwoodService = new WardwoodService(characterState, inventoryManager)
wardwoodService.expire(timeState.value.day)
const poiDiscoveryService = new PoiDiscoveryService({ poiService })
const poiActionService = new PoiActionService({ poiService })
let poiDebugRandom = () => 0.5
function currentPoiContext() { const contextInstance = poiRepository.get(activePoiInstanceId.value ?? debugPoiInstanceId.value); return createPoiInteractionContext({ poiInstanceId: contextInstance?.instanceId, character: characterState, locationId: contextInstance?.locationId, regionId: contextInstance?.regionId, worldPosition: playerPosition.value, worldDay: timeState.value.day, worldTime: timeState.value.hour, isInCombat: Boolean(combatSnapshot.value?.worldBlocked), isNight: getWorldPeriod(timeState.value) === WORLD_PERIOD.NIGHT, characterStats: calculatedCharacter.value, proficiencyState: characterState.proficiencySkills, inventoryManager, wardwoodService, knownKnowledgeIds: characterState.discoveredKnowledge, controlledRandomSource: () => poiDebugRandom(), advanceWorldTime: (minutes) => { timeState.value = advanceTime(timeState.value, { minutes, countMove: false, reason: 'poi-action' }); return { ok: true } } }) }
const merchantState = reactive(JSON.parse(JSON.stringify(rawRun.merchantState ?? generateMerchantState(rawRun.seed, rawRun.runId))))
const merchantService = new MerchantService({ character: characterState, inventoryManager, merchantState, wardwoodService, runId: rawRun.runId, seed: rawRun.seed, getWorldTime: () => ({ day: timeState.value.day, hour: timeState.value.hour }) })
const activeMerchantId = ref(null)
const merchantSearch = ref('')
const merchantFilter = ref('')
const merchantSort = ref('name')
const merchantSelectedItem = ref(null)
const selectedBuyIds = ref([])
const selectedSellIds = ref([])
const buyQuantities = reactive({})
const sellQuantities = reactive({})
const merchantMessage = ref('')
const activeMerchant = computed(() => MERCHANT_DEFINITIONS[activeMerchantId.value] ?? null)
const activeMerchantStock = computed(() => merchantState[activeMerchantId.value] ?? null)
const merchantStockEntries = computed(() => { const phrase = merchantSearch.value.trim().toLocaleLowerCase(); const entries = (activeMerchantStock.value?.stockEntries ?? []).map((entry) => ({ entry, item: getItemDefinition(entry.itemDefinitionId) })).filter(({ item }) => item).filter(({ item }) => !phrase || item.displayName.toLocaleLowerCase().includes(phrase)).filter(({ item }) => !merchantFilter.value || item.itemType === merchantFilter.value); return entries.sort(merchantSort.value === 'price' ? (a, b) => merchantBuyPrice(a).totalPrice - merchantBuyPrice(b).totalPrice : (a, b) => a.item.displayName.localeCompare(b.item.displayName)) })
const merchantInventoryEntries = computed(() => inventoryEntries.value.map((entry) => ({ ...entry, acceptance: activeMerchant.value ? merchantAcceptsItem(activeMerchant.value, entry.definition) : { accepted: false } })))
const merchantBuyPrice = ({ entry, item }, quantity = 1) => calculateTransactionPrice(item, activeMerchant.value, 'buy', quantity, entry.priceOverride)
const merchantSellPrice = (entry, quantity = 1) => calculateTransactionPrice(entry.definition, activeMerchant.value, 'sell', quantity)
const buySummary = computed(() => merchantService.validateBuy(activeMerchantId.value, selectedBuyIds.value.map((itemDefinitionId) => ({ itemDefinitionId, quantity: Math.max(1, Math.trunc(buyQuantities[itemDefinitionId] ?? 1)) }))))
const sellSummary = computed(() => merchantService.validateSell(activeMerchantId.value, selectedSellIds.value.map((instanceId) => ({ instanceId, quantity: Math.max(1, Math.trunc(sellQuantities[instanceId] ?? 1)) }))))
const bookService = new BookService({ character: characterState, inventoryManager })
const bookCollection = computed(() => getBookCollectionSummary(characterState))
const librarySearch = ref('')
const libraryCategory = ref('')
const libraryBookType = ref('')
const librarySort = ref('name')
const libraryEntries = computed(() => queryLibrary(characterState, { search: librarySearch.value, category: libraryCategory.value || null, bookType: libraryBookType.value || null, sort: librarySort.value }))
const itemUseService = new ItemUseService({ character: characterState, inventoryManager, wardwoodService, bookService })
const calculatedCharacter = computed(() => calculateCharacterStats(characterState))
equipmentManager.on(EQUIPMENT_EVENT.EQUIPMENT_CHANGED, () => saveProgress())
const panelManager = createPanelManager()
const activePanel = ref(panelManager.activePanel)
const unsubscribePanelManager = panelManager.subscribe((panel) => { activePanel.value = panel })
const selectedEquipmentItem = ref(null)
const selectedItemDefinition = ref(ITEM_LIST[0])
const inventorySearch = ref('')
const inventoryFilter = ref(INVENTORY_FILTER.ALL)
const inventorySort = ref(INVENTORY_SORT.NEWEST)
const selectedInventoryInstanceId = ref(null)
const inventoryContextInstanceId = ref(null)
const pendingDestroyInstanceId = ref(null)
const pendingSalvageInstanceId = ref(null)
const salvageDebugResult = ref(null)
const activeLootReward = ref(null)
const selectedLootEntryIndices = ref([])
const inventoryEntries = computed(() => { const entries = inventoryManager.query({ search: inventorySearch.value, filter: inventoryFilter.value, sort: inventorySort.value }); const wardwoodEntries = entries.filter(({ definition }) => definition.id === 'wardwood'); if (wardwoodEntries.length < 2) return entries; const first = wardwoodEntries[0]; const logical = { ...first, instance: { ...first.instance, quantity: wardwoodEntries.reduce((sum, entry) => sum + entry.instance.quantity, 0) } }; return entries.filter((entry) => entry === first || entry.definition.id !== 'wardwood').map((entry) => entry === first ? logical : entry) })
const selectedInventoryEntry = computed(() => inventoryEntries.value.find(({ instance }) => instance.instanceId === selectedInventoryInstanceId.value) ?? null)
const salvagePreview = computed(() => pendingSalvageInstanceId.value ? salvageService.preview(pendingSalvageInstanceId.value) : null)
const inventoryFilters = Object.values(INVENTORY_FILTER)
const inventorySorts = Object.values(INVENTORY_SORT)
const wardwoodSummary = computed(() => wardwoodService.getSummary(timeState.value.day))
const requiredExperience = computed(() => characterState.requiredExperience)
const experienceProgress = computed(() => Math.min(100, (characterState.experience / requiredExperience.value) * 100))
const levelUpPopup = ref(null)
const activeTrainer = ref(null)
const trainingMessage = ref('')
const lessonDiscoveryMessage = ref('')
const knowledgeNotification = ref(null)
const showKnowledgeDebug = ref(false)
const characterCombatSkills = computed(() => characterState.startingSkills.map((id) => COMBAT_SKILLS[id]).filter(Boolean))
const equipmentEntries = computed(() => EQUIPMENT_SLOTS.map((slot) => { const instance = characterState.equipment[slot.id]; return { ...slot, instance, item: getItemDefinition(instance?.definitionId) } }))
const equipmentSlotIcon = (slotId) => ({ weapon: '⚔', mainHand: '⚔', offHand: '◈', head: '♟', neck: '◇', chest: '▦', gloves: '✦', bracelet: '◌', ringLeft: '◉', ringRight: '◉', legs: 'Ⅱ', feet: '⌁', cloak: '◢', robe: '♜' }[slotId] ?? '□')
const proficiencyWeaponTypes = (proficiency) => [...new Set(WEAPON_LIST.filter((weapon) => weapon.requiredProficiency === proficiency).map((weapon) => weapon.weaponType))]

function equipPreviewItem(item) {
  const slotId = item.equipSlots[0]
  if (!slotId) { trainingMessage.value = 'This item cannot be equipped.'; return { ok: false } }
  const result = equipmentManager.equip(createItemInstance(item.id), slotId)
  trainingMessage.value = result.ok ? `${item.displayName} equipped.` : result.code
  return result
}
function unequipSlot(slotId) { const result = equipmentManager.unequip(slotId); if (result.ok) inventoryManager.add(result.instance); trainingMessage.value = result.ok ? `${result.item.displayName} unequipped.` : result.code; if (result.ok) saveProgress(); return result }

function equipInventoryItem(entry) {
  const slotId = entry.definition.equipSlots[0]
  if (!slotId) return { ok: false, code: 'ITEM_CANNOT_BE_EQUIPPED' }
  const previous = equipmentManager.getItemInSlot(slotId)
  const result = equipmentManager.equip(entry.instance, slotId)
  if (!result.ok) { trainingMessage.value = result.code; return result }
  inventoryManager.remove(entry.instance.instanceId, 1)
  if (previous) inventoryManager.add(previous)
  trainingMessage.value = `${entry.definition.displayName} equipped.`
  saveProgress()
  return result
}

function isFrameworkSafeZoneAtPlayer() { return poiRepository.getAll().some((instance) => instance.isActive && instance.localFlags.safeZoneEnabled && instance.worldPosition.row === playerPosition.value.row && instance.worldPosition.column === playerPosition.value.column) }
function currentItemUseContext() { return createItemUseContext({ position: { ...playerPosition.value }, time: { ...timeState.value }, isSafeZone: isSafeZone(currentPlayerTile.value) || isFrameworkSafeZoneAtPlayer(), isCombatActive: combatSnapshot.value.worldBlocked, activeLightSource: characterState.activeLightSource, period: worldClockStatus.value.currentPeriod }) }
function useInventoryItem(entry, action = ITEM_USE_ACTION.USE) { const result = itemUseService.useItem(characterState.id, entry.instance.instanceId, currentItemUseContext(), action); trainingMessage.value = result.messages?.[0] ?? result.code; inventoryContextInstanceId.value = null; if (result.ok) saveProgress(); return result }

function inspectInventoryItem(entry) { selectedInventoryInstanceId.value = entry.instance.instanceId; inventoryContextInstanceId.value = null }
function toggleFavorite(entry) { inventoryManager.setFavorite(entry.instance.instanceId, !entry.instance.favorite); inventoryContextInstanceId.value = null; saveProgress() }
function requestDestroy(entry) { pendingDestroyInstanceId.value = entry.instance.instanceId; inventoryContextInstanceId.value = null }
function confirmDestroy() { const result = inventoryManager.destroy(pendingDestroyInstanceId.value); trainingMessage.value = result.ok ? 'Item destroyed.' : result.code; pendingDestroyInstanceId.value = null; selectedInventoryInstanceId.value = null; if (result.ok) saveProgress(); return result }
function requestSalvage(entry) { pendingSalvageInstanceId.value = entry.instance.instanceId; inventoryContextInstanceId.value = null; salvageDebugResult.value = salvageService.preview(entry.instance.instanceId) }
function confirmSalvage() { const result = salvageService.execute(pendingSalvageInstanceId.value); salvageDebugResult.value = result; pendingSalvageInstanceId.value = null; selectedInventoryInstanceId.value = null; trainingMessage.value = result.message ?? result.code; if (result.ok && result.reward.entries.length) presentLootReward(result.reward); if (result.ok) saveProgress(); return result }
function salvageActionState(entry) { return isPotentiallySalvageable(entry.definition) ? salvageService.preview(entry.instance.instanceId) : null }
function debugGiveSalvageItem(definitionId = 'rusty_sword') { const instance = createItemInstance(definitionId); inventoryManager.add(instance); selectedInventoryInstanceId.value = instance.instanceId; trainingMessage.value = `${getItemDefinition(definitionId).displayName} granted.`; saveProgress() }
function debugSetSelectedItemQuality(quality = ITEM_QUALITY.MASTERWORK) { const instanceId = selectedInventoryEntry.value?.instance.instanceId; if (!instanceId) return; inventoryManager.replace(instanceId, { state: { ...selectedInventoryEntry.value.instance.state, quality } }); trainingMessage.value = `Item quality set to ${quality}.`; saveProgress() }
function debugToggleProtected() { const entry = selectedInventoryEntry.value; if (!entry) return; inventoryManager.replace(entry.instance.instanceId, { state: { ...entry.instance.state, protected: !entry.instance.state?.protected } }); saveProgress() }
function debugPreviewSalvage() { if (selectedInventoryEntry.value) salvageDebugResult.value = salvageService.preview(selectedInventoryEntry.value.instance.instanceId) }
function debugForceSalvage(empty = false) { const entry = selectedInventoryEntry.value; if (!entry) return; const service = empty ? new SalvageService({ character: characterState, inventoryManager, randomSource: () => 0.999999, getWorldTime: () => ({ day: timeState.value.day, hour: timeState.value.hour }) }) : salvageService; const result = service.execute(entry.instance.instanceId); salvageDebugResult.value = result; trainingMessage.value = result.message ?? result.code; if (result.ok && result.reward.entries.length) presentLootReward(result.reward); if (result.ok) saveProgress() }

function openMerchant(merchantId) { const schedule=npcScheduleIntegration.services.resolve(merchantId,'Trade',{hour:timeState.value.hour,minute:timeState.value.minute??0});if(npcScheduleRepository.runtime.states[merchantId]&&!schedule.available){merchantMessage.value=`${schedule.reason} ${schedule.hours.next.label}`.trim();return false}activeMerchantId.value = merchantId; merchantSearch.value = ''; merchantFilter.value = ''; selectedBuyIds.value = []; selectedSellIds.value = []; merchantMessage.value = ''; showDevTools.value = false;return true }
function resumeDialogueExternal() { if (dialogueRepository.runtime.activeSession?.status !== 'AwaitingExternalAction') return; const result = dialogueService.resumeExternal(dialogueContext()); dialogueView.value = result.view ?? null; saveProgress() }
function closeMerchant() { activeMerchantId.value = null; merchantSelectedItem.value = null; selectedBuyIds.value = []; selectedSellIds.value = []; resumeDialogueExternal() }
function closeTrainer() { activeTrainer.value = null; resumeDialogueExternal() }
function completeMerchantResult(result) { merchantMessage.value = result.ok ? `${result.code}: ${result.totalPrice ?? 0} Gold` : result.code; if (result.ok) saveProgress(); return result }
function buyMerchantItem(itemDefinitionId, quantity = 1) { return completeMerchantResult(merchantService.buy(activeMerchantId.value, itemDefinitionId, Math.max(1, Math.trunc(quantity)))) }
function sellMerchantItem(instanceId, quantity = 1) { return completeMerchantResult(merchantService.sell(activeMerchantId.value, instanceId, Math.max(1, Math.trunc(quantity)))) }
function buySelectedMerchantItems() { if (!selectedBuyIds.value.length) return; const result = merchantService.buySelected(activeMerchantId.value, selectedBuyIds.value.map((itemDefinitionId) => ({ itemDefinitionId, quantity: Math.max(1, Math.trunc(buyQuantities[itemDefinitionId] ?? 1)) }))); if (result.ok) selectedBuyIds.value = []; return completeMerchantResult(result) }
function sellSelectedMerchantItems() { if (!selectedSellIds.value.length) return; const result = merchantService.sellSelected(activeMerchantId.value, selectedSellIds.value.map((instanceId) => ({ instanceId, quantity: Math.max(1, Math.trunc(sellQuantities[instanceId] ?? 1)) }))); if (result.ok) selectedSellIds.value = []; return completeMerchantResult(result) }
function refreshActiveMerchant(source = STOCK_REFRESH_SOURCE.DEVELOPER) { if (!activeMerchantId.value) return; completeMerchantResult(merchantService.refresh(activeMerchantId.value, source)) }
function resetActiveMerchant() { if (!activeMerchantId.value) return; completeMerchantResult(merchantService.reset(activeMerchantId.value)) }
function givePlayerGold(amount = 100) { characterState.gold += amount; merchantMessage.value = `${amount} Gold granted.`; saveProgress() }

function performDefaultInventoryAction(entry) {
  if ([ITEM_TYPE.WEAPON, ITEM_TYPE.ARMOR, ITEM_TYPE.SHIELD, ITEM_TYPE.ACCESSORY].includes(entry.definition.itemType)) return equipInventoryItem(entry)
  if (entry.definition.itemType === ITEM_TYPE.CONSUMABLE) return useInventoryItem(entry)
  if ([ITEM_TYPE.BOOK, ITEM_TYPE.SCROLL].includes(entry.definition.itemType)) return useInventoryItem(entry)
  return inspectInventoryItem(entry)
}

function takeAllLoot() {
  if (activeEncounterLootInstanceId.value) { const instanceId = activeEncounterLootInstanceId.value; const claimed = takeLootReward(activeLootReward.value, characterState, inventoryManager); if (!claimed.ok) return claimed; const result = encounterResolutionService.resolveLoot(instanceId, 'all', encounterInteractionContext()); if (result.ok) { activeLootReward.value = null; selectedLootEntryIndices.value = []; activeEncounterLootInstanceId.value = null; encounterCoordinator.resume(); encounterUiRevision.value += 1; saveProgress() } return result }
  if (activePoiLootInstanceId.value) { const instanceId = activePoiLootInstanceId.value; const result = poiOutcomeService.resolveLoot(instanceId, 'all', [], currentPoiContext()); if (result.ok) { activeLootReward.value = null; selectedLootEntryIndices.value = []; activePoiLootInstanceId.value = null; activePoiInstanceId.value = instanceId; saveProgress() } return result }
  const result = takeLootReward(activeLootReward.value, characterState, inventoryManager)
  if (result.ok) { activeLootReward.value = null; selectedLootEntryIndices.value = []; saveProgress() }
  return result
}

function presentLootReward(reward) {
  if (!reward?.entries.length) { trainingMessage.value = 'No loot found.'; return false }
  activeLootReward.value = reward
  selectedLootEntryIndices.value = reward.entries.map((_, index) => index)
  return true
}
function presentEncounterLoot(result, instanceId) { if (!result?.lootReward || !instanceId) return false; activeEncounterLootInstanceId.value = instanceId; return presentLootReward(result.lootReward) }
function takeSelectedLoot() { if (activeEncounterLootInstanceId.value) { const instanceId = activeEncounterLootInstanceId.value; const claimed = claimLootReward(activeLootReward.value, selectedLootEntryIndices.value, characterState, inventoryManager); if (!claimed.ok) return claimed; const result = encounterResolutionService.resolveLoot(instanceId, 'selected', encounterInteractionContext()); if (result.ok) { activeLootReward.value = null; selectedLootEntryIndices.value = []; activeEncounterLootInstanceId.value = null; encounterCoordinator.resume(); encounterUiRevision.value += 1; saveProgress() } return result }; if (activePoiLootInstanceId.value) { const instanceId = activePoiLootInstanceId.value; const result = poiOutcomeService.resolveLoot(instanceId, 'selected', selectedLootEntryIndices.value, currentPoiContext()); if (result.ok) { activeLootReward.value = null; selectedLootEntryIndices.value = []; activePoiLootInstanceId.value = null; activePoiInstanceId.value = instanceId; saveProgress() } return result }; const result = claimLootReward(activeLootReward.value, selectedLootEntryIndices.value, characterState, inventoryManager); if (result.ok) { activeLootReward.value = null; selectedLootEntryIndices.value = []; saveProgress() }; return result }
function leaveLoot() { if (activeEncounterLootInstanceId.value) { const instanceId = activeEncounterLootInstanceId.value; leaveLootReward(activeLootReward.value); const result = encounterResolutionService.resolveLoot(instanceId, 'leave', encounterInteractionContext()); if (result.ok) { activeLootReward.value = null; selectedLootEntryIndices.value = []; activeEncounterLootInstanceId.value = null; encounterCoordinator.resume(); encounterUiRevision.value += 1; saveProgress() } return result }; if (activePoiLootInstanceId.value) { const instanceId = activePoiLootInstanceId.value; const result = poiOutcomeService.resolveLoot(instanceId, 'leave', [], currentPoiContext()); if (result.ok) { activeLootReward.value = null; selectedLootEntryIndices.value = []; activePoiLootInstanceId.value = null; activePoiInstanceId.value = instanceId; saveProgress() } return result }; const result = leaveLootReward(activeLootReward.value); if (result.ok) { activeLootReward.value = null; selectedLootEntryIndices.value = [] }; return result }

function debugGainLearningPoints(amount) {
  gainLearningPoints(characterState, amount)
  saveProgress()
}

function debugResetLearningPoints() {
  characterState.learningPoints = 0
  saveProgress()
}

function debugLevelUp() {
  const result = gainExperience(characterState, characterState.requiredExperience - characterState.experience)
  levelUpPopup.value = result.levelUps.at(-1) ?? null
  saveProgress()
}

function openTrainer(trainerId) {
  activeTrainer.value = TRAINERS[trainerId] ?? null
  const discovered = activeTrainer.value ? revealEligibleLessons(characterState, [activeTrainer.value]) : []
  if (discovered.length) { lessonDiscoveryMessage.value = `New lesson discovered: ${discovered[0].displayName}`; saveProgress() }
  trainingMessage.value = ''
  showDevTools.value = false
}

function openMentor(mentorId) {
  const mentor = MENTORS[mentorId]
  const result = mentor ? canOpenMentor(characterState, mentor) : { ok: false, code: 'MENTOR_NOT_DISCOVERED' }
  if (!result.ok) { trainingMessage.value = result.code; return result }
  activeTrainer.value = mentor
  revealEligibleLessons(characterState, [mentor])
  showDevTools.value = false
  saveProgress()
  return result
}

function debugMentorDiscovery(mentorId, state) { const result = advanceMentorDiscovery(characterState, MENTORS[mentorId], state); saveProgress(); return result }
function debugMentorQuest(mentorId, state) { const mentor = MENTORS[mentorId]; const result = setPersonalQuestState(characterState, mentor, state); revealEligibleLessons(characterState, [mentor]); saveProgress(); return result }
function debugRevealMentorLessons(mentorId) { revealMentorLessons(characterState, MENTORS[mentorId], { developer: true }); saveProgress() }
function debugUnlockMentorTestData() { if (!characterState.specializations.includes('blade_disciple')) characterState.specializations.push('blade_disciple'); if (!characterState.passiveSkills.includes('disciplined_student')) characterState.passiveSkills.push('disciplined_student'); saveProgress() }
function debugResetMentors() { resetMentorProgress(characterState, MENTOR_LIST); saveProgress() }

function reevaluateKnowledgeLessons() {
  const discovered = revealEligibleLessons(characterState, [...TRAINER_LIST, ...MENTOR_LIST])
  if (discovered.length) lessonDiscoveryMessage.value = `New lesson discovered: ${discovered[0].displayName}`
  return discovered
}
function notifyKnowledge(result) { if (result.ok) knowledgeNotification.value = result.knowledge }
function debugGrantKnowledge(knowledgeId) { const result = grantKnowledge(characterState, knowledgeId, { discoveredDay: timeState.value.day, sourceType: 'developer', sourceId: 'developer_tools' }); notifyKnowledge(result); if (result.ok) reevaluateKnowledgeLessons(); saveProgress(); return result }
function debugRemoveKnowledge(knowledgeId) { const result = removeKnowledge(characterState, knowledgeId); saveProgress(); return result }
function debugGrantAllKnowledge() { const results = grantAllKnowledge(characterState, { discoveredDay: timeState.value.day, sourceType: 'developer', sourceId: 'developer_tools' }); if (results.length) knowledgeNotification.value = results.at(-1).knowledge; reevaluateKnowledgeLessons(); saveProgress() }
function debugResetKnowledge() { resetKnowledge(characterState); knowledgeNotification.value = null; saveProgress() }

function trainLesson(lesson) {
  const result = applyLesson(characterState, lesson, activeTrainer.value, { day: timeState.value.day, locationId: activeTrainer.value?.locationId })
  trainingMessage.value = result.ok ? `${lesson.displayName} completed.` : 'Training requirements are not met.'
  if (result.ok) saveProgress()
  if (result.ok) {
    const knowledgeReward = result.rewards.find((reward) => reward.code === 'KNOWLEDGE_GRANTED')
    if (knowledgeReward) notifyKnowledge(knowledgeReward)
    const discovered = revealEligibleLessons(characterState, [...TRAINER_LIST, ...MENTOR_LIST])
    if (discovered.length) lessonDiscoveryMessage.value = `New lesson discovered: ${discovered[0].displayName}`
  }
}

function debugRevealLessons() { revealAllLessons(characterState, TRAINER_LIST, { developer: true }); saveProgress() }
function debugResetRevealedLessons() { resetRevealedLessons(characterState); saveProgress() }

function debugGiveGold(amount = 100) {
  characterState.gold += amount
  saveProgress()
}
const eventResultMessage = ref('')
const eventManager = new EventManager({
  getGold: () => characterState.gold,
  changeGold: (amount) => { characterState.gold = Math.max(0, characterState.gold + amount) },
  getFlag: (key) => characterState.flags[key],
  setFlag: (key, value) => { characterState.flags[key] = value },
  advanceTime: ({ hours, minutes }) => {
    const previous = timeState.value
    timeState.value = advanceTime(timeState.value, minutes === undefined
      ? { hours, reason: 'event' }
      : { minutes, reason: 'event' })
    handleProtectionTimeAdvanced(previous, timeState.value)
  },
  showMessage: (message) => { eventResultMessage.value = message },
}, [enginePreviewEvent])
const eventSnapshot = ref(eventManager.getSnapshot())
const unsubscribeEventManager = eventManager.subscribe((snapshot) => { eventSnapshot.value = snapshot })
const practiceGainService = new PracticeGainService()
const combatManager = new CombatManager({ practiceGainService })
const encounterResolutionService = new EncounterResolutionService({ database: encounterDatabase, stateRepository: encounterStateRepository, travelService: travelEncounterService, revealPoi: (target) => poiDiscoveryService.revealByOtherPoi(target, 'random-encounter', currentPoiContext()) })
const encounterCombatService = new EncounterCombatService({ database: encounterDatabase, stateRepository: encounterStateRepository, resolutionService: encounterResolutionService, startCombat: (context) => { const started = combatManager.startCombat({ character: characterState, enemyTemplateId: context.combatDefinitionId, initiator: context.initiator === 'enemy' ? COMBAT_INITIATOR.ENEMY : COMBAT_INITIATOR.PLAYER, source: { type: 'encounter', id: context.encounterInstanceId }, preparationModifiers: context }); return started.ok ? { ok: true, combatId: started.combat.id } : { ok: false, code: started.error } } })
const encounterNonCombatService = new EncounterNonCombatService({ stateRepository: encounterStateRepository, resolutionService: encounterResolutionService })
const encounterChoiceAvailabilityResolver = new EncounterChoiceAvailabilityResolver()
const encounterChoiceService = new EncounterChoiceService({ stateRepository: encounterStateRepository, availabilityResolver: encounterChoiceAvailabilityResolver, combatService: encounterCombatService, nonCombatService: encounterNonCombatService, resolutionService: encounterResolutionService, runSeed: rawRun.seed })
const encounterDetectionService = new EncounterDetectionService({ database: encounterDatabase, stateRepository: encounterStateRepository, runSeed: rawRun.seed })
const encounterNotificationService = new NotificationService()
const worldEventEffectExecutor = new WorldEventEffectExecutor({ database: worldEventDatabase, repository: worldEventStateRepository, lifecycle: worldEventProcessingService.lifecycle, processingService: worldEventProcessingService, poiService, poiDiscoveryService, merchantService, notificationService: encounterNotificationService })
const dialogueDatabase = new DialogueDatabase(dialogueDefinitions, Object.keys(DIALOGUE_NPCS))
const dialogueRepository = new DialogueRepository(rawRun.dialogueRuntime)
const dialogueNpcStates = reactive(Object.fromEntries(Object.keys(DIALOGUE_NPCS).map((id) => [id, { metPlayer: false, localFlags: {}, localCounters: {} }])))
const dialogueView = ref(null)
const dialogueBusy = ref(false)
const dialogueExternalActions = new DialogueExternalActionService({ OpenMerchant: openMerchant, OpenTrainer: openTrainer, OpenKnowledge: () => panelManager.toggle('knowledge'), OpenCrafting: () => panelManager.toggle('recipes'), OpenRest: () => performWaitHours(8) })
const dialogueEffectExecutor = new DialogueEffectExecutor({ notifications: encounterNotificationService, poiDiscovery: poiDiscoveryService, worldEvents: { trigger: (eventId) => worldEventSignal('Manual', { targetId: eventId }) } })
const dialogueService = new DialogueSessionService({ database: dialogueDatabase, repository: dialogueRepository, effectExecutor: dialogueEffectExecutor, externalActions: dialogueExternalActions })
const questDatabase = new QuestDatabase(questDefinitions)
const questRepository = new QuestRepository(rawRun.questRuntime)
const questRevision = ref(0)
const questLogOpen = ref(false)
const questEffectExecutor = new QuestEffectExecutor({ notifications: encounterNotificationService, poiDiscovery: poiDiscoveryService, worldEvents: { trigger: (eventId) => worldEventSignal('Manual', { targetId: eventId }) } })
const questService = new QuestService({ database: questDatabase, repository: questRepository, effects: questEffectExecutor, notifications: encounterNotificationService })
const questLogModel = computed(() => { void questRevision.value; return createQuestLogViewModel(questDatabase, questRepository) })
const questTrackerModel = computed(() => { void questRevision.value; return createQuestTrackerViewModel(questDatabase, questRepository) })
const npcScheduleDatabase = new NpcScheduleDatabase(npcScheduleDefinitions, Object.keys(NPC_ASSIGNMENTS), SCHEDULE_LOCATIONS)
const npcScheduleRepository = new NpcScheduleRepository(rawRun.npcScheduleRuntime)
const npcScheduleModifiers = new NpcScheduleRuntimeModifierService(npcScheduleRepository)
const npcScheduleResolver = new NpcScheduleResolver({ database:npcScheduleDatabase, repository:npcScheduleRepository, assignments:NPC_ASSIGNMENTS, modifierService:npcScheduleModifiers, poiService })
const npcScheduleProcessing = new NpcScheduleProcessingService({ database:npcScheduleDatabase, repository:npcScheduleRepository, resolver:npcScheduleResolver, modifierService:npcScheduleModifiers })
const npcScheduleAvailability = new NpcScheduleAvailabilityService(npcScheduleRepository)
const npcScheduleIntegration = new NpcScheduleIntegrationCoordinator({ repository:npcScheduleRepository, database:npcScheduleDatabase })
const npcScheduleDebugView = ref(null)
function npcScheduleContext() { return { regionId:meadowsMap.id, worldState:worldEventStateRepository.worldState, regionState:worldEventStateRepository.region(meadowsMap.id), questRepository, safeZones:worldEventStateRepository.region(meadowsMap.id)?.temporaryModifiers??{} } }
function processNpcSchedules() { npcScheduleDebugView.value=npcScheduleProcessing.process(timeState.value.day,{hour:timeState.value.hour,minute:timeState.value.minute??0},npcScheduleContext());npcScheduleIntegration.afterProcessing(npcScheduleDebugView.value);return npcScheduleDebugView.value }
function debugScheduleOverride(npcId,type,value,durationMinutes=null) { npcScheduleModifiers.add(npcId,{sourceId:'developer',type,value,priority:1000,durationMinutes},{worldDay:timeState.value.day,worldTime:{hour:timeState.value.hour,minute:timeState.value.minute??0}});npcScheduleProcessing.invalidateNpc(npcId);processNpcSchedules();saveProgress() }
processNpcSchedules()
function questContext() { return { character: characterState, worldState: worldEventStateRepository.worldState, regionState: worldEventStateRepository.region(meadowsMap.id), worldDay: timeState.value.day, worldTime: { hour: timeState.value.hour, minute: timeState.value.minute ?? 0 } } }
function emitQuestSignal(signalType, changes={}) { const result=questService.processSignal({ signalId:`quest-signal-${signalType}-${worldEventStateRepository.worldState.processingSequenceCounter}-${questRepository.runtime.processedSignalIds.length}`, signalType, sourceSystem:'Game', worldDay:timeState.value.day, worldTime:{hour:timeState.value.hour,minute:timeState.value.minute??0}, ...changes },questContext());questRevision.value++;saveProgress();return result }
function debugStartQuest(id) { const result=questService.start(id,{...questContext(),startSource:'Developer'});questRevision.value++;saveProgress();return result }
function trackQuest(id) { questService.track(id);questRevision.value++;saveProgress() }
dialogueEffectExecutor.registry.register('StartQuest',(effect)=>{const result=questService.start(effect.questId,{...questContext(),startSource:'Dialogue'});if(!result.ok)throw Error(result.code);return()=>questService.cancel(result.instance.instanceId,questContext())})
function dialogueContext(npcId = dialogueRepository.runtime.activeSession?.npcId) { return { character: characterState, npc: DIALOGUE_NPCS[npcId], npcState: dialogueNpcStates[npcId], worldState: worldEventStateRepository.worldState, regionState: worldEventStateRepository.region(meadowsMap.id), worldDay: timeState.value.day, worldTime: { hour: timeState.value.hour, minute: timeState.value.minute ?? 0 }, regionName: 'Meadows', randomSource: () => Number(debugEncounterRandom.value) } }
function startDialogue(npcId) { const availability=npcScheduleIntegration.services.resolve(npcId,'Talk',{hour:timeState.value.hour,minute:timeState.value.minute??0});if(npcScheduleRepository.runtime.states[npcId]&&!availability.available)return{ok:false,code:'NPC_INTERACTION_UNAVAILABLE',reason:availability.reason,next:availability.hours.next}; const result = dialogueService.startNpc(npcId, dialogueContext(npcId)); dialogueView.value = result.view ?? null; if(result.ok)emitQuestSignal('NpcTalkedTo',{npcId,sourceId:npcId,targetIds:[npcId]}); saveProgress(); return result }
function chooseDialogue(choiceId) { if (dialogueBusy.value) return; dialogueBusy.value = true; try { const result = dialogueService.choose(choiceId, dialogueContext()); dialogueView.value = result.view ?? (dialogueRepository.runtime.activeSession?.status === 'AwaitingExternalAction' ? null : dialogueView.value); saveProgress(); return result } finally { dialogueBusy.value = false } }
function closeDialogue() { dialogueService.end(dialogueContext(), 'Interrupted'); dialogueView.value = null; saveProgress() }
const regionStateRevision = ref(0)
const regionStateModel = computed(() => { void regionStateRevision.value; return createRegionStateViewModel(meadowsMap.id, worldEventStateRepository, worldEventDatabase) })
const encounterUiRevision = ref(0)
const encounterUiMessage = ref('')
const encounterCoordinator = new EncounterPresentationCoordinator({ database: encounterDatabase, stateRepository: encounterStateRepository, detectionService: encounterDetectionService, choiceService: encounterChoiceService, resolutionService: encounterResolutionService, availabilityResolver: encounterChoiceAvailabilityResolver, contextFactory: encounterInteractionContext, notificationService: encounterNotificationService })
const unsubscribeEncounterNotifications = encounterNotificationService.subscribe((notification) => { encounterUiMessage.value = notification.message; encounterUiRevision.value += 1 })
const activeEncounterModel = computed(() => { void encounterUiRevision.value; return encounterCoordinator.presentation() })
const encounterChoiceBusy = computed(() => Boolean(encounterCoordinator.requestId))
function refreshEncounterUi() { encounterUiRevision.value += 1; saveProgress() }
function executeEncounterUiChoice(choiceId) { const result = encounterCoordinator.executeChoice(choiceId); debugEncounterView.value = result; if (result?.lootReward) presentEncounterLoot(result, encounterCoordinator.activeInstanceId); refreshEncounterUi() }
function continueEncounterUi() { const result = encounterCoordinator.closeFinalized(); if (!result.ok) encounterUiMessage.value = 'The encounter is not fully resolved yet.'; refreshEncounterUi() }
const poiOutcomeService = new PoiOutcomeService({ poiService, discoveryService: poiDiscoveryService, startCombat: (definition, { poiInstance, outcome }) => { const started = combatManager.startCombat({ character: characterState, enemyTemplateId: definition.encounterDefinitionId, initiator: definition.surpriseMode === 'EnemyAmbushes' ? COMBAT_INITIATOR.ENEMY : COMBAT_INITIATOR.PLAYER, source: { type: 'poi', id: poiInstance.instanceId, outcomeId: outcome.id } }); return started.ok ? { ok: true, combatId: started.combat.id } : started } })
const poiMarkers = computed(() => { void poiRevision.value; return poiRepository.getByRegion(meadowsMap.id).map((instance) => createPoiMarkerModel(instance, poiDatabase.get(instance.poiDefinitionId), poiService.getMapStatus(instance.instanceId))) })
const poiMarkerByTile = computed(() => new Map(poiMarkers.value.filter(({ visible }) => visible).map((marker) => [marker.worldPosition.row * meadowsMap.columns + marker.worldPosition.column, marker])))
const activePoiModel = computed(() => { void poiRevision.value; const instance = poiRepository.get(activePoiInstanceId.value); const definition = instance && poiDatabase.get(instance.poiDefinitionId); return instance && definition ? createPoiInteractionModel(instance, definition, poiActionService, currentPoiContext()) : null })
function openPoi(instanceId) { if (encounterCoordinator.activeInstanceId) { poiUiMessage.value = 'Resolve the active encounter first.'; return }; if (combatSnapshot.value.worldBlocked) { poiUiMessage.value = 'A location cannot be opened during combat.'; return }; const instance = poiRepository.get(instanceId); if (!instance?.isDiscovered) { poiUiMessage.value = getPoiUiMessage('POI_NOT_DISCOVERED'); return }; const opened = poiActionService.open(instanceId, currentPoiContext()); if (!opened.ok) { poiUiMessage.value = getPoiUiMessage(opened.code); return }; activePoiInstanceId.value = instanceId; poiUiMessage.value = ''; if (instance.pendingResolution?.generatedRewardBundle && !instance.pendingResolution.lootResolved) resumePoiLoot() }
function closePoi() { if (activePoiModel.value?.pendingCombat || activePoiModel.value?.pendingLoot) return; activePoiInstanceId.value = null; poiUiMessage.value = '' }
function resumePoiLoot() { const instance = poiRepository.get(activePoiInstanceId.value); const reward = instance?.pendingResolution?.generatedRewardBundle; if (reward) { activePoiLootInstanceId.value = instance.instanceId; presentLootReward(reward) } }
function executePoiUiAction(actionId) { if (poiActionBusy.value) return; poiActionBusy.value = true; try { const action = poiActionService.execute(activePoiInstanceId.value, actionId, currentPoiContext()); if (!action.ok) { poiUiMessage.value = getPoiUiMessage(action.code); return }; const outcome = poiOutcomeService.execute(activePoiInstanceId.value, action.pendingOutcomeId, currentPoiContext()); poiUiMessage.value = outcome.ok ? (outcome.outcome?.description ?? outcome.result?.description ?? 'The action is complete.') : getPoiUiMessage(outcome.code); if (outcome.lootReward) { activePoiLootInstanceId.value = activePoiInstanceId.value; presentLootReward(outcome.lootReward) } if (outcome.combatResult?.ok) activePoiInstanceId.value = null; saveProgress() } finally { poiActionBusy.value = false } }
const combatSnapshot = ref(combatManager.getSnapshot())
const unsubscribeCombatManager = combatManager.subscribe((snapshot) => { combatSnapshot.value = snapshot })
const debugDiceRoll = ref(1)
const debugBlockAmount = ref(5)
const debugEnemyTemplateId = ref(ENEMY_TEMPLATE_LIST[0].id)
const selectedEnemyTemplate = computed(() => ENEMY_TEMPLATES[debugEnemyTemplateId.value])
const showEnemyIntent = ref(true)
const showEnemyAiDebug = ref(false)
const lastThreatCheck = ref(null)
const moveCount = computed(() => timeState.value.moveCount)
const currentTimeOfDay = computed(() => getTimeOfDay(timeState.value.hour, timeState.value.minute ?? 0))
const currentTimeDetails = computed(() => TIME_OF_DAY_DETAILS[currentTimeOfDay.value])
const currentThreat = computed(() => getNightThreat(timeState.value))
const worldClockStatus = computed(() => getWorldClock(timeState.value, currentThreat.value.level))
const waitTargets = [
  TIME_OF_DAY.DAWN,
  TIME_OF_DAY.MORNING,
  TIME_OF_DAY.NOON,
  TIME_OF_DAY.AFTERNOON,
  TIME_OF_DAY.EVENING,
  TIME_OF_DAY.DUSK,
  TIME_OF_DAY.NIGHT,
]
for (const index of exploredTiles) if (meadowsMap.tiles[index]) meadowsMap.tiles[index].discovered = true
for (const index of visitedTiles) if (meadowsMap.tiles[index]) meadowsMap.tiles[index].visited = true
const selectedTileIndex = ref(null)
const hoveredTile = ref(null)
const tooltipPosition = reactive({ x: 0, y: 0 })
const playerTileIndex = computed(
  () => playerPosition.value.row * meadowsMap.columns + playerPosition.value.column,
)
const currentPlayerTile = computed(() => meadowsMap.tiles[playerTileIndex.value])
const playerInSafeZone = computed(() => { void poiRevision.value; return isSafeZone(currentPlayerTile.value) || isFrameworkSafeZoneAtPlayer() })
const playerProtected = computed(() => isLightActive(characterState.activeLightSource))
const worldStatus = computed(() => {
  if (playerInSafeZone.value) return 'Safe Zone'
  if (playerProtected.value) return 'Protected'
  if (worldClockStatus.value.currentPeriod === WORLD_PERIOD.DAY) return 'Day'
  if (currentThreat.value.level >= 100) return 'High Threat'
  return currentThreat.value.level > 0 ? 'Danger' : 'Night'
})
const poiRecords = computed(() => createPoiRecords(meadowsMap))
const poiRecordByTileIndex = computed(() => new Map(poiRecords.value.map((poi) => [poi.tileIndex, poi])))
const poiDiscoveryCounts = computed(() => countPoiDiscoveryStates(poiRecords.value, poiDiscovery))
const identifiedStates = new Set([POI_DISCOVERY_STATE.IDENTIFIED, POI_DISCOVERY_STATE.VISITED])
const getPoiState = (tile) => {
  const record = poiRecordByTileIndex.value.get(tile.index)
  return record ? poiDiscovery[record.id] ?? POI_DISCOVERY_STATE.HIDDEN : null
}
const isPoiIdentityVisible = (tile) => identifiedStates.has(getPoiState(tile))
function buildPoiRangeIds(rangeProperty) {
  const ids = new Set()
  for (const poi of poiRecords.value) {
    const range = poi[rangeProperty]
    for (let row = Math.max(0, poi.row - range); row <= Math.min(meadowsMap.rows - 1, poi.row + range); row += 1) {
      for (let column = Math.max(0, poi.column - range); column <= Math.min(meadowsMap.columns - 1, poi.column + range); column += 1) {
        if (Math.max(Math.abs(column - poi.column), Math.abs(row - poi.row)) <= range) ids.add(row * meadowsMap.columns + column)
      }
    }
  }
  return ids
}
const poiDetectionRangeIds = computed(() => buildPoiRangeIds('detectionRange'))
const poiIdentificationRangeIds = computed(() => buildPoiRangeIds('identificationRange'))
const visibleTiles = computed(() => {
  const tileSize = mapTileSize.value
  const buffer = 2
  const startColumn = Math.max(0, Math.floor(viewport.left / tileSize) - buffer)
  const endColumn = Math.min(
    meadowsMap.columns - 1,
    Math.ceil((viewport.left + viewport.width) / tileSize) + buffer,
  )
  const startRow = Math.max(0, Math.floor(viewport.top / tileSize) - buffer)
  const endRow = Math.min(
    meadowsMap.rows - 1,
    Math.ceil((viewport.top + viewport.height) / tileSize) + buffer,
  )
  const tiles = []

  for (let row = startRow; row <= endRow; row += 1) {
    for (let column = startColumn; column <= endColumn; column += 1) {
      const index = row * meadowsMap.columns + column
      tiles.push(meadowsMap.tiles[index])
    }
  }

  return tiles
})
const worldTilePresentations = computed(() => createWorldMapPresentation(meadowsMap, mapTileSize.value, currentSeed.value))
const mapGridVisible = computed(() => showTileGrid.value || showCoordinates.value || showSectorGrid.value)
const selectedTile = computed(() => {
  if (selectedTileIndex.value === null) return null
  const index = selectedTileIndex.value
  const mapTile = meadowsMap.tiles[index]
  const terrain = mapTile.terrain
  const discoveryState = getPoiState(mapTile)
  const identityVisible = identifiedStates.has(discoveryState)
  const staticPoi = identityVisible && mapTile.staticPoiId ? staticPoiById.value.get(mapTile.staticPoiId) : null
  const details = discoveryState === POI_DISCOVERY_STATE.DETECTED
    ? { name: 'Interesting Location', type: 'Unknown point of interest', description: 'Something noteworthy is located here.' }
    : terrainDetails[terrain]
  return {
    index,
    terrain,
    column: (index % meadowsMap.columns) + 1,
    row: Math.floor(index / meadowsMap.columns) + 1,
    ...details,
    pointOfInterest: identityVisible ? mapTile.pointOfInterest : null,
    staticPoi,
    discoveryState,
    travelMinutes: mapTile.walkable ? calculateTileTravelTime(mapTile) : null,
    visited: visitedTiles.has(index),
  }
})
const staticPoiById = computed(() => new Map(meadowsMap.region.staticPois.map((poi) => [poi.id, poi])))
const staticPoiCounts = computed(() => Object.entries(STATIC_POI_CONFIG).map(([type, config]) => ({
  type,
  category: config.category,
  count: meadowsMap.region.staticPois.filter((poi) => poi.type === type).length,
  preferredBiomes: config.preferredTerrains.join(', '),
  zone: config.zone,
})))
const formatPoiType = (type) => type.split('_').map((part) => part[0].toUpperCase() + part.slice(1)).join(' ')
const bossPath = computed(() => {
  const boss = meadowsMap.pointsOfInterest[POI.BOSS_ARENA]?.[0]
  return new Set(boss ? findPath(meadowsMap, meadowsMap.startIndex, boss.id) : [])
})
const biomeBoundaryIds = computed(() => new Set(meadowsMap.biomeBoundaries))
const mountainPassageIds = computed(() => new Set(meadowsMap.formations.mountainRanges.flatMap((range) => range.passageIds)))
const roadDebugIds = computed(() => new Set(meadowsMap.region.roadNetwork.roadIds))
const bridgeDebugIds = computed(() => new Set(meadowsMap.region.roadNetwork.bridgeIds))
const gravelRoadDebugIds = computed(() => new Set(meadowsMap.region.secondaryRoadNetwork.gravelRoadIds))
const woodenBridgeDebugIds = computed(() => new Set(meadowsMap.region.secondaryRoadNetwork.woodenBridgeIds))
const secondaryRoadStartIds = computed(() => new Set(meadowsMap.region.secondaryRoadNetwork.branches.map((branch) => branch.startId)))
const secondaryRoadTargetIds = computed(() => new Set(meadowsMap.region.secondaryRoadNetwork.branches
  .map((branch) => meadowsMap.region.staticPois.find((poi) => poi.id === branch.targetPoiId)?.position.index).filter(Number.isInteger)))
const roadConnectionIds = computed(() => new Set(meadowsMap.region.roadNetwork.connections.flatMap((connection) => connection.pathIds)))
const cityBoundsIds = computed(() => new Set(meadowsMap.region.settlements.city.tileIds))
const villageBoundsIds = computed(() => new Set(meadowsMap.region.settlements.villages.flatMap((village) => village.tileIds)))
const settlementInfluenceIds = computed(() => new Set(meadowsMap.region.farms.flatMap((farm) => farm.tileIds)))
const regionZoneById = computed(() => {
  const result = new Map()
  for (const [zone, ids] of Object.entries(meadowsMap.region.zones)) for (const id of ids) result.set(id, zone)
  return result
})
const sectorByTileId = computed(() => {
  const result = new Map()
  for (const sector of meadowsMap.region.sectors) {
    for (let row = sector.top; row < sector.bottom; row += 1) {
      for (let column = sector.left; column < sector.right; column += 1) result.set(row * meadowsMap.columns + column, sector)
    }
  }
  return result
})
const sectorBoundaryIds = computed(() => new Set(meadowsMap.tiles.filter((tile) => {
  const sector = sectorByTileId.value.get(tile.id)
  return tile.column === sector.left || tile.column === sector.right - 1 || tile.row === sector.top || tile.row === sector.bottom - 1
}).map((tile) => tile.id)))
const edgeZoneIds = computed(() => new Set(meadowsMap.tiles.filter((tile) => Math.min(tile.column, tile.row,
  meadowsMap.columns - 1 - tile.column, meadowsMap.rows - 1 - tile.row) <= MEADOWS_GENERATION_CONFIG.edgeZone.width).map((tile) => tile.id)))
const maximumSectorDensity = computed(() => Math.max(1, ...meadowsMap.region.sectors.map((sector) => sector.densityScore)))
const terrainPercentages = computed(() => Object.entries(meadowsMap.terrainCounts).map(([type, count]) => ({
  type,
  percentage: ((count / meadowsMap.tiles.length) * 100).toFixed(1),
})))

function updateMapViewport() {
  viewportAnimationFrame = null
  const area = mapScrollArea.value
  if (!area) return
  viewport.left = area.scrollLeft
  viewport.top = area.scrollTop
  viewport.width = area.clientWidth
  viewport.height = area.clientHeight
}

function scheduleViewportUpdate() {
  if (viewportAnimationFrame) return
  viewportAnimationFrame = requestAnimationFrame(updateMapViewport)
}

function startMapDrag(event) {
  const area = mapScrollArea.value
  if (!area || event.button !== 0) return

  isDraggingMap = true
  didDragMap = false
  area.classList.add('map-scroll-area--dragging')
  hoveredTile.value = null
  dragStart.x = event.clientX
  dragStart.y = event.clientY
  dragStart.scrollLeft = area.scrollLeft
  dragStart.scrollTop = area.scrollTop
}

function moveMap(event) {
  const area = mapScrollArea.value
  if (!area || !isDraggingMap) return

  if (Math.abs(event.clientX - dragStart.x) > 4 || Math.abs(event.clientY - dragStart.y) > 4) {
    if (!didDragMap) {
      area.setPointerCapture(event.pointerId)
    }
    didDragMap = true
  }

  area.scrollLeft = dragStart.scrollLeft - (event.clientX - dragStart.x)
  area.scrollTop = dragStart.scrollTop - (event.clientY - dragStart.y)
}

function isAdjacentTile(index) {
  const row = Math.floor(index / meadowsMap.columns)
  const column = index % meadowsMap.columns
  const rowDistance = Math.abs(row - playerPosition.value.row)
  const columnDistance = Math.abs(column - playerPosition.value.column)
  return rowDistance + columnDistance === 1
}

function isTilePassable(index) {
  const tile = meadowsMap.tiles[index]
  return canPlayerEnterTile(meadowsMap, tile?.row, tile?.column)
}

function canMoveTo(index) {
  return isAdjacentTile(index) && isTilePassable(index)
}

function isTileVisible(index) {
  if (!fogEnabled.value) return true
  return isTileCurrentlyVisible(meadowsMap.tiles[index], playerPosition.value)
}

function revealEntireMap() {
  for (let index = 0; index < meadowsMap.tiles.length; index += 1) {
    exploredTiles.add(index)
    meadowsMap.tiles[index].discovered = true
  }
  saveProgress()
}

function toggleFogOfWar() {
  fogEnabled.value = !fogEnabled.value
}

function toggleCoordinates() {
  showCoordinates.value = !showCoordinates.value
}

function generateFromSeed() {
  resetMap()
}

function startMapLoading() {
  if (loadingAnimationFrame) cancelAnimationFrame(loadingAnimationFrame)
  loadingProgress.value = 0
  const startedAt = performance.now()
  const duration = 1800

  function updateLoading(now) {
    loadingProgress.value = Math.min(100, Math.round(((now - startedAt) / duration) * 100))
    if (loadingProgress.value < 100) {
      loadingAnimationFrame = requestAnimationFrame(updateLoading)
    } else {
      loadingAnimationFrame = null
    }
  }

  loadingAnimationFrame = requestAnimationFrame(updateLoading)
}

function closeMapIntro() {
  if (loadingProgress.value === 100) showMapIntro.value = false
}

async function centerMapOnPlayer() {
  await nextTick()
  const area = mapScrollArea.value
  if (!area) return

  const scaledTileSize = baseTileSize * mapZoom.value
  const tileCenterX = (playerPosition.value.column + 0.5) * scaledTileSize
  const tileCenterY = (playerPosition.value.row + 0.5) * scaledTileSize
  area.scrollLeft = Math.max(0, tileCenterX - area.clientWidth / 2)
  area.scrollTop = Math.max(0, tileCenterY - area.clientHeight / 2)
  updateMapViewport()
}

async function followPlayerCamera() {
  await nextTick()
  const area = mapScrollArea.value
  if (!area) return

  const tileSize = mapTileSize.value
  const target = calculateFollowScroll({
    scrollLeft: area.scrollLeft,
    scrollTop: area.scrollTop,
    viewportWidth: area.clientWidth,
    viewportHeight: area.clientHeight,
    contentWidth: meadowsMap.columns * tileSize,
    contentHeight: meadowsMap.rows * tileSize,
    playerCenterX: (playerPosition.value.column + 0.5) * tileSize,
    playerCenterY: (playerPosition.value.row + 0.5) * tileSize,
  })

  if (target.left !== area.scrollLeft) area.scrollLeft = target.left
  if (target.top !== area.scrollTop) area.scrollTop = target.top
  updateMapViewport()
}

async function resetMap() {
  Object.assign(meadowsMap, generateMeadowsRegion(currentSeed.value))
  const startTile = meadowsMap.tiles[meadowsMap.startIndex]
  playerPosition.value = { row: startTile.row, column: startTile.column }
  mapZoom.value = 1
  fogEnabled.value = true
  showCoordinates.value = false
  showBiomeBoundaries.value = false
  showPassages.value = false
  showMapIntro.value = true
  selectedTileIndex.value = null
  exploredTiles.clear()
  visitedTiles.clear()
  visitedTiles.add(playerPosition.value.row * meadowsMap.columns + playerPosition.value.column)
  meadowsMap.tiles[meadowsMap.startIndex].visited = true
  revealTilesAroundPlayer()
  for (const key of Object.keys(poiDiscovery)) delete poiDiscovery[key]
  updatePoiDiscovery()
  startMapLoading()
  timeState.value = createInitialTime()
  saveProgress()
  await centerMapOnPlayer()
}

function isTileExplored(index) {
  return exploredTiles.has(index)
}

function canInspectTile(index) {
  const poiState = getPoiState(meadowsMap.tiles[index])
  if (poiState === POI_DISCOVERY_STATE.HIDDEN) return false
  return !fogEnabled.value || isTileExplored(index) || poiState === POI_DISCOVERY_STATE.DETECTED
}

function showTileTooltip(tile, event) {
  if (!canInspectTile(tile.index)) {
    hoveredTile.value = null
    return
  }
  hoveredTile.value = tile
  tooltipPosition.x = event.clientX + 14
  tooltipPosition.y = event.clientY + 14
}

function hideTileTooltip() {
  hoveredTile.value = null
}

function inspectTile(index) {
  if (didDragMap || !canInspectTile(index)) return
  selectedTileIndex.value = index
}

function revealTilesAroundPlayer() {
  for (const index of getVisibleTileIndices(playerPosition.value, meadowsMap.columns, meadowsMap.rows)) {
    exploredTiles.add(index)
    meadowsMap.tiles[index].discovered = true
  }
}

function updatePoiDiscovery() {
  const previous = { ...poiDiscovery }
  const next = advancePoiDiscovery(poiRecords.value, poiDiscovery, playerPosition.value)
  for (const key of Object.keys(poiDiscovery)) delete poiDiscovery[key]
  Object.assign(poiDiscovery, next)
  for (const instance of poiRepository.getAll()) poiDiscoveryService.evaluate(instance.instanceId, currentPoiContext())
  const rewarded = characterState.flags.rewardedPoiIds ?? (characterState.flags.rewardedPoiIds = [])
  const newlyVisited = poiRecords.value.find((poi) => previous[poi.id] !== POI_DISCOVERY_STATE.VISITED && next[poi.id] === POI_DISCOVERY_STATE.VISITED && !rewarded.includes(poi.id))
  if (newlyVisited) {
    rewarded.push(newlyVisited.id)
    const definitionId = newlyVisited.type.includes('boss') ? 'meadows_boss_loot' : POI_LOOT_DEFINITION_IDS[newlyVisited.type]
    if (definitionId) presentLootReward(generateLoot(LOOT_DEFINITIONS[definitionId], { sourceName: `${formatPoiType(newlyVisited.type)} discovered`, source: { type: newlyVisited.type.includes('boss') ? 'boss' : 'poi', id: newlyVisited.id }, regionModifier: REGION_LOOT_MODIFIERS.meadows }))
  }
}

function processPlayerTravel(previousPosition, previousTime, movementSource, tile) {
  const road = Boolean(tile?.road || tile?.roadType || tile?.isRoad)
  const result = travelEncounterService.processTravelSegment({ characterId: characterState.id, runId: props.run.runId, movementSource, previousPosition, currentPosition: { ...playerPosition.value }, regionId: meadowsMap.id, biomeTags: [tile?.biome ?? tile?.terrain ?? 'grassland'], locationId: `${meadowsMap.id}-${road ? 'road' : 'wilds'}`, locationTags: [road ? 'Road' : 'Wilderness'], previousWorldDay: previousTime.day, previousWorldTime: { hour: previousTime.hour, minute: previousTime.minute ?? 0 }, worldDay: timeState.value.day, worldTime: { hour: timeState.value.hour, minute: timeState.value.minute ?? 0 }, isNight: getWorldPeriod(timeState.value) === WORLD_PERIOD.NIGHT, nightThreatPercent: currentThreat.value.level, isInSafeZone: playerInSafeZone.value, isInCombat: combatSnapshot.value.worldBlocked, isMovementLocked: false, hasBlockingOverlay: Boolean(activePoiInstanceId.value || activeLootReward.value || eventSnapshot.value.movementBlocked), hasMandatoryLoot: Boolean(activeLootReward.value), hasMandatoryPoiResolution: Boolean(activePoiInstanceId.value), characterIncapacitated: characterState.currentHp <= 0, activeLightSourceType: characterState.activeLightSource?.type ?? null, hasTorch: characterState.activeLightSource?.type === LIGHT_SOURCE_TYPE.TORCH, hasLantern: characterState.activeLightSource?.type === LIGHT_SOURCE_TYPE.LANTERN, hasHolyLantern: characterState.activeLightSource?.type === LIGHT_SOURCE_TYPE.HOLY_LANTERN, characterState, knownKnowledgeIds: characterState.discoveredKnowledge, stopMovement: () => true, ...worldEventEncounterContext() })
  if (result.code === 'ENCOUNTER_PENDING_TRIGGER') { const activated = encounterCoordinator.openPending(); debugEncounterView.value = activated; trainingMessage.value = activated.ok ? 'An encounter blocks your path.' : 'The pending encounter could not be activated.'; encounterUiRevision.value += 1 }
  processWorldEventsForCurrentTime()
  debugEncounterView.value = { travelResult: result, travelState: encounterStateRepository.serialize().travelState }
  return result
}

function movePlayerTo(index) {
  if (eventSnapshot.value.movementBlocked || combatSnapshot.value.worldBlocked) return
  if (encounterStateRepository.state.travelState.movementBlockedByEncounter) { encounterUiMessage.value = 'Resolve the active encounter before moving.'; return }
  if (activePoiInstanceId.value) return
  if (activeLootReward.value) return
  if (characterState.activeLightSource?.type === LIGHT_SOURCE_TYPE.CAMPFIRE && characterState.activeLightSource.enabled) { trainingMessage.value = 'Extinguish the Campfire before moving.'; return }
  if (didDragMap) {
    didDragMap = false
    return
  }

  if (!canMoveTo(index)) return

  const previousPosition = { ...playerPosition.value }
  const previousTime = { ...timeState.value }
  playerPosition.value = {
    row: Math.floor(index / meadowsMap.columns),
    column: index % meadowsMap.columns,
  }
  visitedTiles.add(index)
  meadowsMap.tiles[index].visited = true
  revealTilesAroundPlayer()
  updatePoiDiscovery()
  const travelMinutes = calculateTileTravelTime(meadowsMap.tiles[index])
  timeState.value = advanceMovementTime(timeState.value, travelMinutes)
  const protectionResult = consumeLightDuration(characterState, travelMinutes)
  if (protectionResult.expired) trainingMessage.value = protectionResult.message
  processPlayerTravel(previousPosition, previousTime, MOVEMENT_SOURCE.CLICK, meadowsMap.tiles[index])
  saveProgress()
  performNightThreatCheck(meadowsMap.tiles[index])
  followPlayerCamera()
}

function movePlayerBy(deltaRow, deltaColumn) {
  if (eventSnapshot.value.movementBlocked || combatSnapshot.value.worldBlocked) return
  if (encounterStateRepository.state.travelState.movementBlockedByEncounter) { encounterUiMessage.value = 'Resolve the active encounter before moving.'; return }
  if (activePoiInstanceId.value) return
  if (characterState.activeLightSource?.type === LIGHT_SOURCE_TYPE.CAMPFIRE && characterState.activeLightSource.enabled) { trainingMessage.value = 'Extinguish the Campfire before moving.'; return }
  const movement = resolveMovementIntent(meadowsMap, playerPosition.value, deltaRow, deltaColumn)
  if (!movement.moved) return
  const nextIndex = movement.position.row * meadowsMap.columns + movement.position.column

  const previousPosition = { ...playerPosition.value }
  const previousTime = { ...timeState.value }
  playerPosition.value = movement.position
  visitedTiles.add(nextIndex)
  meadowsMap.tiles[nextIndex].visited = true
  revealTilesAroundPlayer()
  updatePoiDiscovery()
  const travelMinutes = calculateTileTravelTime(meadowsMap.tiles[nextIndex])
  timeState.value = advanceMovementTime(timeState.value, travelMinutes)
  const protectionResult = consumeLightDuration(characterState, travelMinutes)
  if (protectionResult.expired) trainingMessage.value = protectionResult.message
  processPlayerTravel(previousPosition, previousTime, MOVEMENT_SOURCE.MANUAL, meadowsMap.tiles[nextIndex])
  saveProgress()
  performNightThreatCheck(meadowsMap.tiles[nextIndex])
  followPlayerCamera()
}

function saveProgress() {
  if (combatSnapshot.value.worldBlocked) return false
  emit('save-state', {
    seed: currentSeed.value,
    regionId: meadowsMap.id,
    playerPosition: { ...playerPosition.value },
    time: { ...timeState.value },
    discovered: [...exploredTiles],
    visited: [...visitedTiles],
    poiDiscovery: { ...poiDiscovery },
    poiState: poiRepository.serialize(),
    encounterState: encounterStateRepository.serialize(),
    worldEventRuntime: worldEventStateRepository.serialize(),
    dialogueRuntime: dialogueRepository.serialize(),
    questRuntime: questRepository.serialize(),
    npcScheduleRuntime: npcScheduleRepository.serialize(),
    characterState: cloneCharacterState(characterState),
    merchantState: structuredClone(toRaw(merchantState)),
  })
  return true
}

function performWaitHours(hours) {
  if (eventSnapshot.value.movementBlocked || combatSnapshot.value.worldBlocked) return
  if (getWorldPeriod(timeState.value) === WORLD_PERIOD.NIGHT && !canWaitThroughNight(currentPlayerTile.value, characterState)) { trainingMessage.value = 'You cannot wait through the night without shelter or a Campfire.'; return }
  const previous = timeState.value
  timeState.value = waitHours(timeState.value, hours)
  processWorldEventsForCurrentTime()
  handleProtectionTimeAdvanced(previous, timeState.value)
  saveProgress()
}

function performWaitUntil(period) {
  if (eventSnapshot.value.movementBlocked || combatSnapshot.value.worldBlocked) return
  if (getWorldPeriod(timeState.value) === WORLD_PERIOD.NIGHT && !canWaitThroughNight(currentPlayerTile.value, characterState)) { trainingMessage.value = 'You cannot wait through the night without protection.'; return }
  const previous = timeState.value
  timeState.value = waitUntilTimeOfDay(timeState.value, period)
  processWorldEventsForCurrentTime()
  handleProtectionTimeAdvanced(previous, timeState.value)
  saveProgress()
}

function performRest() {
  if (eventSnapshot.value.movementBlocked || combatSnapshot.value.worldBlocked) return
  if (!canWaitThroughNight(currentPlayerTile.value, characterState)) { trainingMessage.value = 'Rest requires a Safe Zone or Campfire.'; return }
  const previous = timeState.value
  timeState.value = restHours(timeState.value, 6)
  handleProtectionTimeAdvanced(previous, timeState.value)
  saveProgress()
}

function performNightThreatCheck(tile = currentPlayerTile.value, options = {}) {
  const result = checkNightEncounter({ time: timeState.value, tile, lightSource: characterState.activeLightSource, regionId: meadowsMap.id, ...options })
  lastThreatCheck.value = result
  if (result.triggered) {
    trainingMessage.value = `${result.encounter.type}: ${result.encounter.demonName} (placeholder)`
    startTestCombat(COMBAT_INITIATOR.ENEMY, false, 'grey_wolf')
  }
  return result
}

function handleProtectionTimeAdvanced(previous, current) { const elapsed = getElapsedMinutes(current) - getElapsedMinutes(previous); const result = consumeLightDuration(characterState, elapsed); if (result.expired) trainingMessage.value = result.message; const expiration = wardwoodService.expire(current.day); if (expiration.expired) trainingMessage.value = expiration.message; return result }
function buildCampfire() { const instance = characterState.inventory.find(({ definitionId }) => definitionId === 'wardwood'); if (!instance) return { ok: false, code: 'NO_WARDWOOD' }; return useInventoryItem({ instance, definition: getItemDefinition('wardwood') }, ITEM_USE_ACTION.BUILD_CAMPFIRE) }
function waitAtCampfireUntilMorning() {
  const result = waitUntilMorningProtected({ character: characterState, tile: currentPlayerTile.value, time: timeState.value, wardwoodService, random: Math.random })
  trainingMessage.value = result.ok ? (result.recovery.recovered ? 'Morning arrived. You recovered 1 Dead Wardwood.' : 'Morning arrived safely.') : result.code
  if (result.ok) { timeState.value = result.time; saveProgress() }
  return result
}
function enableLight(type, options = {}) { const result = activateLightSource(characterState, type, options); if (result.ok) saveProgress(); return result }
function giveWardwood(amount = 1) { const result = wardwoodService.addBatch(amount, timeState.value.day); saveProgress(); return result }
function giveInventoryItem(definitionId) { const instance = createItemInstance(definitionId); const result = inventoryManager.add(instance); if (definitionId === 'dead_wardwood') characterState.deadWardwood += 1; saveProgress(); return result }
function useFirstItem(definitionId, action) { const instance = characterState.inventory.find((item) => item.definitionId === definitionId); return instance ? useInventoryItem({ instance, definition: getItemDefinition(definitionId) }, action) : { ok: false, code: 'ITEM_NOT_FOUND' } }
function debugExpireOldestWardwood() { const oldest = [...characterState.wardwoodBatches].sort((a, b) => a.expirationDay - b.expirationDay)[0]; if (!oldest) return; oldest.expirationDay = timeState.value.day; const result = wardwoodService.expire(timeState.value.day); trainingMessage.value = result.message ?? 'No Wardwood expired.'; saveProgress() }
function debugSetOldestWardwoodExpiration(day) { const oldest = [...characterState.wardwoodBatches].sort((a, b) => a.expirationDay - b.expirationDay)[0]; if (oldest) oldest.expirationDay = day; saveProgress() }
function debugAdvanceMinutes(minutes) { const previous = timeState.value; timeState.value = advanceTime(timeState.value, { minutes, reason: 'developer' }); handleProtectionTimeAdvanced(previous, timeState.value); saveProgress() }
function debugSetTime(hour, minute = 0) { timeState.value = { ...timeState.value, hour, minute }; saveProgress() }
function debugSetDay(day) { timeState.value = { ...timeState.value, day: Math.max(1, Math.trunc(day)) }; const result = wardwoodService.expire(timeState.value.day); if (result.expired) trainingMessage.value = result.message; saveProgress() }
function debugToggleNight() { debugSetTime(getWorldPeriod(timeState.value) === WORLD_PERIOD.NIGHT ? 6 : 20, 0) }

function triggerPreviewEvent() {
  eventResultMessage.value = ''
  eventManager.startEvent('dev-engine-preview')
}

function chooseEventOption(optionId) {
  const result = eventManager.chooseOption(optionId)
  if (result.ok) saveProgress()
}

function closeActiveEvent() {
  eventManager.closeEvent()
}

function startTestCombat(initiator = COMBAT_INITIATOR.PLAYER, fullHealth = false, enemyTemplateId = debugEnemyTemplateId.value) {
  if (eventSnapshot.value.movementBlocked) return
  const combatCharacter = cloneCharacterState(characterState)
  if (fullHealth) combatCharacter.health.current = combatCharacter.health.max
  const started = combatManager.startCombat({
    character: combatCharacter,
    enemyTemplateId,
    initiator,
    source: { type: 'developer', id: 'test-combat' },
  })
  if (started.ok) showDevTools.value = false
  return started
}

function selectCombatInitiative(attribute) {
  return combatManager.selectInitiativeAttribute(attribute)
}

function selectCombatSkill(skillId) {
  const selected = combatManager.selectPlayerSkill(skillId)
  if (!selected.ok) return selected
  const enemy = combatManager.resolveEnemySelection()
  if (!enemy.ok) return enemy
  const initiative = combatManager.resolveInitiative()
  if (!initiative.ok) return initiative
  const actions = combatManager.resolveActions()
  if (!actions.ok) return actions
  if (actions.combatEnded) return actions
  return combatManager.endRound()
}

function finishTestCombat(result) {
  const combatId = combatSnapshot.value.activeCombat?.id
  const combatSource = combatSnapshot.value.activeCombat?.source
  const defeatedEnemyName = combatSnapshot.value.activeCombat?.enemies?.[0]?.name ?? 'Enemy'
  const defeatedEnemyId = combatSnapshot.value.activeCombat?.enemies?.[0]?.sourceRef?.id
  const completed = combatManager.finishCombat(result)
  if (completed.ok) {
    characterState.health.current = completed.combat.player.currentHealth
    if (combatSource?.type === 'poi') {
      poiOutcomeService.resolveCombat(combatSource.id, combatId, result === COMBAT_RESULT.VICTORY ? 'Victory' : result === COMBAT_RESULT.DEFEAT ? 'Defeat' : result === COMBAT_RESULT.ESCAPED ? 'Escaped' : 'Cancelled', currentPoiContext())
      activePoiInstanceId.value = combatSource.id
    } else if (combatSource?.type === 'encounter') {
      const encounterResult = encounterCombatService.resolveEncounterCombat(combatSource.id, combatId, result === COMBAT_RESULT.VICTORY ? 'Victory' : result === COMBAT_RESULT.DEFEAT ? 'Defeat' : result === COMBAT_RESULT.ESCAPED ? 'Escaped' : 'Cancelled', encounterInteractionContext())
      debugEncounterView.value = encounterResult
      presentEncounterLoot(encounterResult, combatSource.id)
      encounterCoordinator.resume()
      encounterUiRevision.value += 1
    } else if (result === COMBAT_RESULT.VICTORY) {
      const definition = LOOT_DEFINITIONS[ENEMY_TEMPLATES[defeatedEnemyId]?.lootDefinitionId]
      presentLootReward(generateLoot(definition, { sourceName: `${defeatedEnemyName} defeated`, source: { type: 'enemy', id: defeatedEnemyId }, regionModifier: REGION_LOOT_MODIFIERS.meadows, smartLootCharacter: characterState, isRandomLoot: true }))
    }
    saveProgress()
  }
}

function returnToMainMenuAfterDefeat() {
  const completed = combatManager.finishCombat(COMBAT_RESULT.DEFEAT)
  if (!completed.ok) return completed
  characterState.health.current = completed.combat.player.currentHealth
  saveProgress()
  emit('main-menu')
  return completed
}

function cancelTestCombat() {
  const combatId = combatSnapshot.value.activeCombat?.id
  const combatSource = combatSnapshot.value.activeCombat?.source
  const completed = combatManager.cancelCombat()
  if (completed.ok) {
    characterState.health.current = completed.combat.player.currentHealth
    if (combatSource?.type === 'poi') { poiOutcomeService.resolveCombat(combatSource.id, combatId, 'Cancelled', currentPoiContext()); activePoiInstanceId.value = combatSource.id }
    if (combatSource?.type === 'encounter') debugEncounterView.value = encounterCombatService.resolveEncounterCombat(combatSource.id, combatId, 'Cancelled', encounterInteractionContext())
    saveProgress()
  }
}

function setDiceDebugMode(mode) {
  combatManager.diceService.setMode(mode)
}

function setFixedDiceRoll() {
  const roll = Math.max(1, Math.trunc(Number(debugDiceRoll.value) || 1))
  debugDiceRoll.value = roll
  combatManager.diceService.setFixedRoll(roll)
}

function setDebugBlock(value) {
  return combatManager.setPlayerBlock(value)
}

function handleMovementKey(event) {
  if (showMapIntro.value) return
  if (activeLootReward.value) return
  if (isTextInputTarget(event.target)) return
  if (panelManager.handleKey(event)) { event.preventDefault(); return }
  if (activePanel.value) return

  const movement = {
    w: [-1, 0],
    a: [0, -1],
    s: [1, 0],
    d: [0, 1],
  }[event.key.toLowerCase()]

  if (!movement) return
  event.preventDefault()
  movePlayerBy(...movement)
}

function stopMapDrag(event) {
  const area = mapScrollArea.value
  if (!area || !isDraggingMap) return

  isDraggingMap = false
  area.classList.remove('map-scroll-area--dragging')
  if (area.hasPointerCapture(event.pointerId)) {
    area.releasePointerCapture(event.pointerId)
  }
}

async function zoomMap(event) {
  const area = mapScrollArea.value
  if (!area) return

  const previousZoom = mapZoom.value
  const zoomStep = event.deltaY < 0 ? 0.1 : -0.1
  const nextZoom = Math.min(maximumZoom, Math.max(minimumZoom, previousZoom + zoomStep))
  if (nextZoom === previousZoom) return

  const bounds = area.getBoundingClientRect()
  const cursorX = event.clientX - bounds.left
  const cursorY = event.clientY - bounds.top
  const mapPointX = (area.scrollLeft + cursorX) / previousZoom
  const mapPointY = (area.scrollTop + cursorY) / previousZoom

  mapZoom.value = Number(nextZoom.toFixed(2))
  await nextTick()

  area.scrollLeft = mapPointX * mapZoom.value - cursorX
  area.scrollTop = mapPointY * mapZoom.value - cursorY
  updateMapViewport()
}

revealTilesAroundPlayer()
updatePoiDiscovery()

onMounted(() => {
  emit('ready')
  centerMapOnPlayer()
  startMapLoading()
  const recovery = encounterCoordinator.recoverPendingEncounterState()
  if (recovery.panel === 'loot') { const instance = encounterCoordinator.activeInstance; presentEncounterLoot({ lootReward: instance?.pendingResolution?.generatedLootReward }, instance?.instanceId) }
  encounterUiRevision.value += 1
  window.addEventListener('keydown', handleMovementKey)
  window.addEventListener('resize', scheduleViewportUpdate)
})

onBeforeUnmount(() => {
  saveProgress()
  unsubscribeEventManager()
  unsubscribeCombatManager()
  unsubscribePanelManager()
  unsubscribeEncounterNotifications()
  if (loadingAnimationFrame) cancelAnimationFrame(loadingAnimationFrame)
  if (viewportAnimationFrame) cancelAnimationFrame(viewportAnimationFrame)
  window.removeEventListener('keydown', handleMovementKey)
  window.removeEventListener('resize', scheduleViewportUpdate)
})
</script>

<template>
  <main class="game-screen">
    <aside class="player-panel">
      <header class="player-header">
        <span class="player-icon" aria-hidden="true">{{ character.icon }}</span>
        <div>
          <p class="panel-caption">Player</p>
          <h1 class="player-class">{{ characterState.name }}</h1>
        </div>
      </header>

      <section class="game-navigation" aria-label="Game navigation">
        <button data-testid="game-main-menu" type="button" @click="$emit('main-menu')">Main Menu</button>
        <button data-testid="game-new-run" type="button" class="game-navigation__new" @click="$emit('new-run')">New Run</button>
      </section>
      <RegionStatePanel v-if="regionStateModel" :model="regionStateModel" />
      <QuestPanels :log="questLogModel" :tracker="questTrackerModel" :open="questLogOpen" @close="questLogOpen=false" @track="trackQuest" />

      <section class="time-actions" aria-label="Time actions">
        <button type="button" class="time-actions__toggle" :aria-expanded="showTimeActions" @click="showTimeActions = !showTimeActions">
          <span>Wait & Rest</span><span aria-hidden="true">{{ showTimeActions ? '−' : '+' }}</span>
        </button>
        <div v-if="showTimeActions" class="time-actions__menu">
          <button type="button" @click="performWaitHours(3)">Wait 3 Hours</button>
          <button type="button" @click="performWaitHours(6)">Wait 6 Hours</button>
          <button v-for="period in waitTargets" :key="period" type="button" @click="performWaitUntil(period)">
            Wait Until {{ TIME_OF_DAY_DETAILS[period].label }}
          </button>
          <button type="button" class="time-actions__rest" @click="performRest">Rest 6 Hours</button>
          <button type="button" @click="buildCampfire">Build Campfire (3 Wardwood)</button>
          <button v-if="worldClockStatus.currentPeriod === WORLD_PERIOD.NIGHT" type="button" :disabled="!canWaitThroughNight(currentPlayerTile, characterState)" @click="waitAtCampfireUntilMorning">Wait Until Morning Safely</button>
          <button type="button" @click="useFirstItem('wardwood', ITEM_USE_ACTION.LIGHT_TORCH)">Light Torch (1 Wardwood)</button>
          <button type="button" @click="useFirstItem('lantern', ITEM_USE_ACTION.LIGHT_LANTERN)">Light Lantern</button>
          <button v-if="characterState.activeLightSource" type="button" @click="deactivateLightSource(characterState); saveProgress()">Extinguish Light</button>
        </div>
      </section>

      <section class="resource-section" aria-label="Player resources">
        <div class="move-counter">Moves <strong>{{ moveCount }}</strong></div>
        <div class="move-counter">Level <strong>{{ characterState.level }}</strong></div>
        <div class="move-counter">Gold <strong>{{ characterState.gold }}</strong></div>
        <div class="move-counter lp-counter" title="Learning Points — Used to learn Attributes, Proficiencies and Combat Skills from Trainers.">LP <strong>{{ characterState.learningPoints }}</strong></div>
        <div>
          <div class="resource-label">
            <span>HP</span>
            <span>{{ characterState.health.current }} / {{ calculatedCharacter.maximumHealth }}</span>
          </div>
          <div class="resource-track">
            <div class="resource-fill resource-fill--health" :style="{ width: `${(characterState.health.current / calculatedCharacter.maximumHealth) * 100}%` }"></div>
          </div>
        </div>
        <div>
          <div class="resource-label"><span>XP</span><span>{{ characterState.experience }} / {{ requiredExperience }}</span></div>
          <div class="resource-track"><div class="resource-fill resource-fill--xp" :style="{ width: `${experienceProgress}%` }"></div></div>
        </div>
        <div class="hud-weapon">🗡 {{ calculatedCharacter.equippedWeapon?.displayName ?? 'Unarmed' }} · Armor {{ calculatedCharacter.armorRating }}</div>
      </section>

      <section v-if="false" class="stats-section" aria-labelledby="stats-heading">
        <h2 id="stats-heading" class="section-title">Stats</h2>
        <dl class="stats-list">
          <div class="stat-row"><dt>Strength</dt><dd>{{ calculatedCharacter.finalStats.strength }}</dd></div>
          <div class="stat-row"><dt>Defense</dt><dd>{{ calculatedCharacter.finalStats.defense }}</dd></div>
          <div class="stat-row"><dt>Vitality</dt><dd>{{ calculatedCharacter.finalStats.vitality }}</dd></div>
          <div class="stat-row"><dt>Agility</dt><dd>{{ calculatedCharacter.finalStats.agility }}</dd></div>
          <div class="stat-row"><dt>Magic Power</dt><dd>{{ calculatedCharacter.finalStats.magicPower }}</dd></div>
          <div class="stat-row"><dt>Wisdom</dt><dd>{{ calculatedCharacter.finalStats.wisdom }}</dd></div>
          <div class="stat-row"><dt>Perception</dt><dd>{{ calculatedCharacter.finalStats.perception }}</dd></div>
          <div class="stat-row"><dt>Luck</dt><dd>{{ calculatedCharacter.finalStats.luck }}</dd></div>
        </dl>
      </section>

      <section v-if="false" class="stats-section" aria-labelledby="proficiencies-heading">
        <h2 id="proficiencies-heading" class="section-title">Proficiencies</h2>
        <dl class="stats-list proficiency-list">
          <div v-for="proficiency in PROFICIENCY_NAMES" :key="proficiency" class="stat-row">
            <dt>{{ proficiency }}<small>{{ PROFICIENCY_DESCRIPTIONS[proficiency] ?? 'A general adventuring proficiency.' }}</small><small>Weapons: {{ proficiencyWeaponTypes(proficiency).join(', ') || 'None' }}</small></dt>
            <dd>{{ characterState.proficiencies[proficiency] }}</dd>
          </div>
        </dl>
      </section>

      <section class="dev-controls" aria-label="Developer tools">
        <button
          type="button"
          class="dev-controls__toggle"
          :aria-expanded="showDevTools"
          aria-controls="dev-tools-window"
          @click="openDevTools"
        >
          <span>Dev Tools</span>
          <span aria-hidden="true">⚙</span>
        </button>
        <Teleport to="body">
          <div v-if="showDevTools" class="dev-tools-backdrop" @click.self="showDevTools = false">
            <section
              id="dev-tools-window"
              class="dev-tools-window"
              role="dialog"
              aria-modal="true"
              aria-labelledby="dev-tools-title"
            >
              <header class="dev-tools-window__header">
                <div>
                  <small>Developer</small>
                  <h2 id="dev-tools-title">Dev Tools</h2>
                </div>
                <button
                  type="button"
                  class="dev-tools-window__close"
                  aria-label="Close developer tools"
                  @click="showDevTools = false"
                >
                  ×
                </button>
              </header>
              <div class="dev-tools-filter">
                <label>
                  <span>Search</span>
                  <input
                    v-model="devToolsQuery"
                    type="search"
                    placeholder="Search tools..."
                    @input="filterDevTools"
                  />
                </label>
                <label>
                  <span>Category</span>
                  <select v-model="devToolsCategory" @change="filterDevTools">
                    <option value="all">All tools</option>
                    <option value="map">Map &amp; visibility</option>
                    <option value="poi">Points of interest</option>
                    <option value="roads">Roads &amp; bridges</option>
                    <option value="world">World generation</option>
                    <option value="combat">Combat &amp; events</option>
                  </select>
                </label>
                <span class="dev-tools-filter__count">{{ visibleDevToolCount }} results</span>
                <button
                  v-if="devToolsQuery || devToolsCategory !== 'all'"
                  type="button"
                  class="dev-tools-filter__clear"
                  @click="devToolsQuery = ''; devToolsCategory = 'all'; filterDevTools()"
                >Clear filters</button>
              </div>
              <div ref="devToolsMenu" class="dev-controls__menu">
        <button v-for="merchant in MERCHANT_LIST" :key="merchant.id" type="button" @click="openMerchant(merchant.id)">Open {{ merchant.merchantType }}</button>
        <button type="button" @click="givePlayerGold(100)">Give Player Gold</button>
        <button type="button" @click="merchantService.setMerchantGold('general_merchant', 1000); saveProgress()">Set Merchant Gold</button>
        <button type="button" @click="merchantService.addStock('general_merchant', 'torch', 1); saveProgress()">Add Item to Merchant Stock</button>
        <button type="button" @click="merchantService.removeStock('general_merchant', 'torch'); saveProgress()">Remove Item from Merchant Stock</button>
        <button type="button" @click="merchantService.addStock('general_merchant', 'wardwood', 1); saveProgress()">Add Wardwood to Stock</button>
        <button type="button" @click="merchantService.refresh('general_merchant'); saveProgress()">Refresh Merchant Stock</button>
        <button type="button" @click="merchantService.reset('general_merchant'); saveProgress()">Reset Merchant Stock</button>
        <button type="button" @click="merchantMessage = JSON.stringify(calculateTransactionPrice(getItemDefinition('torch'), MERCHANT_DEFINITIONS.general_merchant, 'buy', 1))">Show Price Calculation</button>
        <button type="button" @click="givePlayerGold(100); completeMerchantResult(merchantService.buy('general_merchant', 'torch', 1))">Force Buy Transaction</button>
        <button type="button" @click="merchantMessage = 'Select an inventory item in Merchant UI to force a sell transaction.'">Force Sell Transaction</button>
        <button type="button" @click="debugGiveSalvageItem('wooden_staff')">Give Salvageable Item</button>
        <button type="button" @click="debugGiveSalvageItem('rusty_sword')">Give Rusty Sword</button>
        <button type="button" @click="debugGiveSalvageItem('leather_armor')">Give Leather Armor</button>
        <button type="button" @click="debugGiveSalvageItem('studded_armor')">Give Studded Armor</button>
        <button type="button" @click="debugGiveSalvageItem('bone_armor')">Give Bone Armor</button>
        <button type="button" @click="debugSetSelectedItemQuality(ITEM_QUALITY.MASTERWORK)">Set Item Quality</button>
        <button type="button" @click="debugPreviewSalvage">Preview Salvage</button>
        <button type="button" @click="debugForceSalvage(false)">Force Salvage</button>
        <button type="button" @click="debugForceSalvage(true)">Force Empty Salvage</button>
        <button type="button" @click="salvageDebugResult = selectedInventoryEntry ? SALVAGE_DEFINITIONS[selectedInventoryEntry.definition.salvageDefinitionId] : null">Show SalvageDefinition</button>
        <button type="button" @click="debugPreviewSalvage">Show Quality Modifier</button>
        <button type="button" @click="selectedInventoryEntry && toggleFavorite(selectedInventoryEntry)">Toggle Favorite</button>
        <button type="button" @click="debugToggleProtected">Toggle Protected</button>
        <button type="button" @click="selectedInventoryEntry && equipInventoryItem(selectedInventoryEntry)">Equip Test Item</button>
        <button type="button" @click="unequipSlot('mainHand')">Unequip Test Item</button>
        <pre v-if="salvageDebugResult" class="salvage-debug">{{ JSON.stringify(salvageDebugResult, null, 2) }}</pre>
        <select v-model="debugEncounterId" aria-label="Encounter definition"><option v-for="definition in encounterDatabase.getAllEncounters()" :key="definition.id" :value="definition.id">{{ definition.displayName }}</option></select>
        <select v-model="debugEncounterTableId" aria-label="Encounter table"><option v-for="table in encounterDatabase.getAllTables()" :key="table.id" :value="table.id">{{ table.displayName }}</option></select>
        <input v-model.number="debugEncounterRandom" type="number" min="0" max="0.999" step="0.05" aria-label="Encounter controlled RNG">
        <button type="button" @click="debugEncounterView = encounterDatabase.getAllEncounters()">List Encounter Definitions</button>
        <button type="button" @click="debugEncounterView = encounterDatabase.getAllTables()">List Encounter Tables</button>
        <button type="button" @click="debugEncounterView = encounterDatabase.getEncounter(debugEncounterId)">Show Encounter Definition</button>
        <button type="button" @click="debugEncounterView = encounterDatabase.getTable(debugEncounterTableId)">Show Encounter Table</button>
        <button type="button" @click="debugEncounterView = encounterDatabase.validate()">Validate Encounter Data</button>
        <button type="button" @click="debugPreviewEncounter">Preview Encounter Selection</button>
        <button type="button" @click="debugSelectEncounter">Select Encounter</button>
        <button type="button" @click="encounterStateRepository.state.forcedNextEncounterId = debugEncounterId; saveProgress()">Force Next Encounter</button>
        <button type="button" @click="encounterStateRepository.state.forcedNextEncounterTableId = debugEncounterTableId; saveProgress()">Force Next Encounter Table</button>
        <button type="button" @click="encounterStateRepository.state.forcedNextEncounterId = null; encounterStateRepository.state.forcedNextEncounterTableId = null; saveProgress()">Clear Forced Encounter</button>
        <button type="button" @click="encounterStateRepository.state.disabledEncounterIds = [...new Set([...encounterStateRepository.state.disabledEncounterIds, debugEncounterId])]; saveProgress()">Disable Encounter</button>
        <button type="button" @click="encounterStateRepository.state.disabledEncounterIds = encounterStateRepository.state.disabledEncounterIds.filter(id => id !== debugEncounterId); saveProgress()">Enable Encounter</button>
        <button type="button" @click="encounterStateRepository.setOccurrence(debugEncounterId, 1); saveProgress()">Set Encounter Occurrence Count</button>
        <button type="button" @click="encounterStateRepository.setOccurrence(debugEncounterId, 0); saveProgress()">Clear Encounter Occurrence Count</button>
        <button type="button" @click="encounterStateRepository.setCooldown(debugEncounterId, { type: 'EncounterCount', value: 3, startedEncounterCount: encounterStateRepository.state.triggeredEncounterCount }); saveProgress()">Add Encounter Cooldown</button>
        <button type="button" @click="encounterStateRepository.clearCooldown(debugEncounterId); saveProgress()">Clear Encounter Cooldown</button>
        <button type="button" @click="encounterStateRepository.state.cooldowns = {}; saveProgress()">Clear All Encounter Cooldowns</button>
        <button type="button" @click="encounterStateRepository.state.recentEncounterIds.push(debugEncounterId); saveProgress()">Add Encounter to Recent History</button>
        <button type="button" @click="encounterStateRepository.state.recentEncounterIds = []; encounterStateRepository.state.recentEncounterTags = []; saveProgress()">Clear Recent History</button>
        <button type="button" @click="encounterStateRepository.state.uniqueEncounterIdsUsed = [...new Set([...encounterStateRepository.state.uniqueEncounterIdsUsed, debugEncounterId])]; saveProgress()">Mark Encounter Unique Used</button>
        <button type="button" @click="encounterStateRepository.state.uniqueEncounterIdsUsed = encounterStateRepository.state.uniqueEncounterIdsUsed.filter(id => id !== debugEncounterId); saveProgress()">Clear Unique Encounter</button>
        <button type="button" @click="debugCreateEncounterInstance">Create Encounter Instance</button>
        <button type="button" @click="encounterStateRepository.instances.delete(debugEncounterView?.encounterInstanceId); saveProgress()">Delete Encounter Instance</button>
        <button type="button" @click="debugEncounterView = encounterStateRepository.serialize()">Show Encounter Run State</button>
        <button type="button" @click="encounterStateRepository.reset(); saveProgress()">Reset Encounter Run State</button>
        <button type="button" @click="debugEncounterView = encounterStateRepository.state.travelState">Show Encounter Travel State</button>
        <select v-model="debugWorldEventId" aria-label="World event definition"><option v-for="definition in worldEventDatabase.getAll()" :key="definition.id" :value="definition.id">{{ definition.displayName }}</option></select>
        <button type="button" @click="worldEventDebugView = worldEventProcessingService.debugSnapshot()">Show World Event Debug View</button>
        <button type="button" @click="worldEventDebugView = worldEventStateRepository.reset(); saveProgress()">Reset World State</button>
        <button type="button" @click="worldEventStateRepository.worldState.worldFlags.debug = true; worldEventSignal(TRIGGER_TYPE.WORLD_FLAG_SET, { sourceId: 'debug', value: true })">Set World Flag</button>
        <button type="button" @click="worldEventStateRepository.regionStates.meadows.activeFlags.push('debug'); worldEventSignal(TRIGGER_TYPE.REGION_FLAG_SET, { sourceId: 'debug', value: true })">Set Region Flag</button>
        <button type="button" @click="worldEventSignal(TRIGGER_TYPE.WORLD_DAY)">Emit World Day Trigger</button>
        <button type="button" @click="worldEventSignal(TRIGGER_TYPE.REGION_ENTERED)">Emit Region Entered</button>
        <button type="button" @click="worldEventSignal(TRIGGER_TYPE.LOCATION_ENTERED, { locationId: 'debug-location' })">Emit Location Entered</button>
        <button type="button" @click="worldEventSignal(TRIGGER_TYPE.POI_COMPLETED, { sourceId: 'wolf_den' })">Emit POI Completed</button>
        <button type="button" @click="worldEventSignal(TRIGGER_TYPE.MANUAL, { targetId: debugWorldEventId })">Trigger World Event Manually</button>
        <button type="button" @click="worldEventDebugView = worldEventProcessingService.eligibility.previewWorldEventEligibility(debugWorldEventId, { regionId: 'meadows', worldDay: timeState.day, worldTime: timeState })">Preview World Event Eligibility</button>
        <button type="button" @click="worldEventDebugView = worldEventDatabase.validate()">Validate World Event Definitions</button>
        <button type="button" @click="worldEventDebugView = processWorldEventsForCurrentTime()">Process Due World Events</button>
        <pre v-if="worldEventDebugView" class="salvage-debug">{{ JSON.stringify(worldEventDebugView, null, 2) }}</pre>
        <button type="button" @click="Object.assign(encounterStateRepository.state.travelState, { encounterMeterValue: 0, distanceSinceLastEncounterCheck: 0, distanceSinceLastTriggeredEncounter: 0 }); saveProgress()">Reset Encounter Travel State</button>
        <button type="button" @click="encounterStateRepository.state.travelState.encounterMeterValue = 5; saveProgress()">Set Encounter Meter</button>
        <button type="button" @click="encounterStateRepository.state.travelState.encounterMeterValue = encounterStateRepository.state.travelState.encounterMeterThreshold; saveProgress()">Fill Encounter Meter</button>
        <button type="button" @click="encounterStateRepository.state.travelState.encounterMeterValue = 0; saveProgress()">Clear Encounter Meter</button>
        <button type="button" @click="encounterStateRepository.state.travelState.encounterMeterThreshold = 1; saveProgress()">Set Encounter Threshold</button>
        <button type="button" @click="debugProcessTravel(['Road'])">Simulate Road Travel</button>
        <button type="button" @click="debugProcessTravel(['Wilderness'])">Simulate Wilderness Travel</button>
        <button type="button" @click="debugProcessTravel(['SafeZone'], { isInSafeZone: true })">Simulate Safe Zone Travel</button>
        <button type="button" @click="debugProcessTravel(['Road'], { movementSource: MOVEMENT_SOURCE.FAST_TRAVEL })">Simulate Fast Travel</button>
        <button type="button" @click="debugProcessTravel(['Road'], { movementSource: MOVEMENT_SOURCE.TELEPORT })">Simulate Teleport</button>
        <button type="button" @click="debugPreviewTravel">Preview Encounter Trigger</button>
        <button type="button" @click="encounterStateRepository.state.travelState.globalEncounterCooldownUntil = null; saveProgress()">Clear Global Encounter Cooldown</button>
        <button type="button" @click="encounterStateRepository.state.travelState.encounterCheckCooldownUntil = null; saveProgress()">Clear Encounter Check Cooldown</button>
        <button type="button" @click="travelEncounterService.clearPending('Developer'); saveProgress()">Clear Pending Travel Encounter</button>
        <button type="button" @click="encounterStateRepository.state.travelState.movementBlockedByEncounter = true; encounterStateRepository.state.travelState.movementLockReason = 'EncounterPending'; saveProgress()">Lock Movement by Encounter</button>
        <button type="button" @click="travelEncounterService.clearPending('Developer unlock'); saveProgress()">Unlock Movement by Encounter</button>
        <select v-model="debugEncounterChoiceId" aria-label="Encounter choice"><option value="fight">Fight</option><option value="avoid">Avoid</option><option value="flee">Flee</option><option value="prepare">Prepare</option><option value="approach">Approach</option><option value="help_traveler">Help Traveler</option><option value="give_bandage">Give Bandage</option><option value="inspect_supplies">Inspect Supplies</option><option value="investigate_lights">Investigate Lights</option><option value="leave">Leave</option></select>
        <button type="button" @click="debugActivateEncounter()">Activate Pending Encounter</button>
        <button type="button" @click="debugEncounterView = encounterCoordinator.openPending(); encounterUiRevision += 1">Open Active Encounter Overlay</button>
        <button type="button" @click="encounterCoordinator.activeInstanceId = null; encounterUiRevision += 1">Close Encounter Overlay Bypass</button>
        <button type="button" @click="debugEncounterView = encounterCoordinator.recoverPendingEncounterState(); encounterUiRevision += 1">Recover Pending Encounter</button>
        <button type="button" @click="debugEncounterView = encounterCoordinator.debugView()">Show Complete Encounter Debug View</button>
        <button type="button" @click="debugActivateEncounter(() => 0.999)">Force Detection Critical Success</button>
        <button type="button" @click="debugActivateEncounter(() => 0)">Force Detection Critical Failure</button>
        <button type="button" @click="debugActiveEncounter() && (debugActiveEncounter().preparationState = 'Surprised'); saveProgress()">Force Player Surprised</button>
        <button type="button" @click="debugActiveEncounter() && (debugActiveEncounter().preparationState = 'Alert'); saveProgress()">Force Player Alert</button>
        <button type="button" @click="debugActiveEncounter() && (debugActiveEncounter().preparationState = 'Prepared'); saveProgress()">Force Player Prepared</button>
        <button type="button" @click="debugEncounterPresentation">Show Encounter Presentation</button>
        <button type="button" @click="debugEncounterChoice(false)">Preview Encounter Choice</button>
        <button type="button" @click="debugEncounterChoice(true)">Execute Encounter Choice</button>
        <button type="button" @click="debugActiveEncounter() && (debugActiveEncounter().choiceCounters = {}); saveProgress()">Reset Choice Counters</button>
        <button type="button" @click="debugActiveEncounter() && encounterCombatService.start(debugActiveEncounter().instanceId)">Start Encounter Combat</button>
        <button type="button" @click="debugEncounterView = debugActiveEncounter()?.pendingCombatContext">Show Encounter Combat Context</button>
        <button type="button" @click="debugActiveEncounter() && (debugEncounterView = encounterResolutionService.finalizeEncounterResolution(debugActiveEncounter().instanceId, encounterInteractionContext()))">Finalize Encounter</button>
        <button type="button" @click="debugActiveEncounter() && (debugEncounterView = encounterResolutionService.cancelPendingEncounter(debugActiveEncounter().instanceId, 'Developer cancellation')); saveProgress()">Cancel Pending Encounter</button>
        <button type="button" @click="debugActiveEncounter() && (debugActiveEncounter().pendingCombatId = null); saveProgress()">Clear Pending Combat</button>
        <button type="button" @click="debugActiveEncounter() && (debugActiveEncounter().detectionResult = null); saveProgress()">Clear Detection Result</button>
        <button type="button" @click="debugEncounterView = encounterCoordinator.lastRecoveryResult">Show Recovery Decisions</button>
        <pre v-if="debugEncounterView" class="salvage-debug">{{ JSON.stringify(debugEncounterView, null, 2) }}</pre>
        <select v-model="debugPoiInstanceId" aria-label="Developer POI instance"><option value="">Select POI</option><option v-for="instance in poiRepository.getAll()" :key="instance.instanceId" :value="instance.instanceId">{{ poiDatabase.get(instance.poiDefinitionId)?.displayName }} — {{ instance.instanceId }}</option></select>
        <button type="button" @click="debugCreatePoi">Create POI</button>
        <button type="button" @click="debugPoi(() => poiService.delete(debugPoiInstanceId))">Delete POI</button>
        <button type="button" @click="debugPoi(() => poiService.discover(debugPoiInstanceId, true))">Reveal POI</button>
        <button type="button" @click="debugPoi(() => poiService.discover(debugPoiInstanceId, false))">Hide POI</button>
        <button type="button" @click="debugPoi(() => poiService.visit(debugPoiInstanceId, timeState))">Visit POI</button>
        <button type="button" @click="debugPoi(() => poiService.complete(debugPoiInstanceId, timeState))">Complete POI</button>
        <button type="button" @click="debugPoi(() => poiService.exhaust(debugPoiInstanceId, timeState))">Exhaust POI</button>
        <button type="button" @click="debugPoi(() => poiService.reset(debugPoiInstanceId))">Reset POI</button>
        <button type="button" @click="debugRevealAllPois">Reveal All POIs</button>
        <button type="button" @click="debugResetAllPois">Reset All POIs</button>
        <button type="button" @click="debugTeleportToPoi">Teleport to POI</button>
        <button type="button" @click="debugOpenPoiOverlay">Open POI Overlay</button>
        <button type="button" @click="debugPoi(() => poiService.setFlag(debugPoiInstanceId, 'safeZoneEnabled'))">Enable Safe Zone</button>
        <button type="button" @click="debugPoi(() => poiService.clearFlag(debugPoiInstanceId, 'safeZoneEnabled'))">Disable Safe Zone</button>
        <button type="button" @click="debugPoiView = poiMarkers.find(({ instanceId }) => instanceId === debugPoiInstanceId)">Show Marker Data</button>
        <input v-model="debugPoiStateId" aria-label="POI state ID" placeholder="State ID"><button type="button" @click="debugPoi(() => poiService.changeState(debugPoiInstanceId, debugPoiStateId))">Set POI State</button>
        <input v-model="debugPoiFlag" aria-label="POI flag" placeholder="Flag"><button type="button" @click="debugPoi(() => poiService.setFlag(debugPoiInstanceId, debugPoiFlag))">Set Flag</button><button type="button" @click="debugPoi(() => poiService.clearFlag(debugPoiInstanceId, debugPoiFlag))">Clear Flag</button>
        <input v-model="debugPoiCounter" aria-label="POI counter" placeholder="Counter"><button type="button" @click="debugPoi(() => poiService.incrementCounter(debugPoiInstanceId, debugPoiCounter))">Increment Counter</button><button type="button" @click="debugPoi(() => poiService.resetCounter(debugPoiInstanceId, debugPoiCounter))">Reset Counter</button>
        <button type="button" @click="debugPoiView = poiDatabase.get(selectedDebugPoi?.poiDefinitionId)">Show POI Definition</button><button type="button" @click="debugPoiView = selectedDebugPoi">Show POI Instance</button>
        <button type="button" @click="debugPoi(() => poiDiscoveryService.evaluate(debugPoiInstanceId, currentPoiContext()))">Reveal POI by Proximity</button>
        <button type="button" @click="poiDebugRandom = () => 0.999; debugPoi(() => poiDiscoveryService.evaluate(debugPoiInstanceId, currentPoiContext()))">Force Perception Discovery Success</button>
        <button type="button" @click="poiDebugRandom = () => 0; debugPoi(() => poiDiscoveryService.evaluate(debugPoiInstanceId, currentPoiContext()))">Force Perception Discovery Failure</button>
        <button type="button" @click="debugPoi(() => poiDiscoveryService.revealByMap({ poiInstanceId: debugPoiInstanceId }, currentPoiContext()))">Reveal by Map</button>
        <button type="button" @click="debugPoi(() => poiDiscoveryService.revealByOtherPoi({ poiInstanceId: debugPoiInstanceId }, 'developer-poi', currentPoiContext()))">Reveal by Other POI</button>
        <input v-model="debugPoiActionId" aria-label="POI action ID" placeholder="Action ID">
        <button type="button" @click="debugPoiView = poiActionService.preview(debugPoiInstanceId, debugPoiActionId, currentPoiContext())">Open POI Action Preview</button>
        <button type="button" @click="poiDebugRandom = () => 0.999">Pass Next POI Check</button><button type="button" @click="poiDebugRandom = () => 0">Fail Next POI Check</button>
        <button type="button" @click="debugPoiView = poiActionService.preview(debugPoiInstanceId, debugPoiActionId, currentPoiContext())">Show Action Availability</button>
        <button type="button" @click="debugPoiView = poiActionService.preview(debugPoiInstanceId, debugPoiActionId, currentPoiContext())?.costPreview">Show Cost Preview</button>
        <button type="button" @click="debugPoiView = poiActionService.preview(debugPoiInstanceId, debugPoiActionId, currentPoiContext())?.checkPreview">Show Check Preview</button>
        <button type="button" @click="debugPoiView = poiActionService.execute(debugPoiInstanceId, debugPoiActionId, currentPoiContext())">Execute Action Without Outcome</button>
        <button type="button" @click="debugPoiView = poiActionService.clearPendingOutcome(debugPoiInstanceId)">Clear Pending Outcome</button>
        <button type="button" @click="debugPoiView = poiOutcomeService.preview(debugPoiInstanceId, selectedDebugPoi?.pendingOutcomeId)">Preview Outcome</button>
        <button type="button" @click="debugPoiView = poiOutcomeService.execute(debugPoiInstanceId, selectedDebugPoi?.pendingOutcomeId, currentPoiContext())">Execute Pending Outcome</button>
        <button type="button" @click="debugPoiView = poiOutcomeService.resolveLoot(debugPoiInstanceId, 'all', [], currentPoiContext())">Resolve POI Loot Take All</button>
        <button type="button" @click="debugPoiView = poiOutcomeService.resolveLoot(debugPoiInstanceId, 'selected', [0], currentPoiContext())">Resolve POI Loot Take Selected</button>
        <button type="button" @click="debugPoiView = poiOutcomeService.resolveLoot(debugPoiInstanceId, 'leave', [], currentPoiContext())">Resolve POI Loot Leave</button>
        <button type="button" @click="debugPoiView = poiOutcomeService.resolveCombat(debugPoiInstanceId, selectedDebugPoi?.pendingCombatId, 'Victory', currentPoiContext())">Resolve Combat Victory</button>
        <button type="button" @click="debugPoiView = poiOutcomeService.resolveCombat(debugPoiInstanceId, selectedDebugPoi?.pendingCombatId, 'Defeat', currentPoiContext())">Resolve Combat Defeat</button>
        <button type="button" @click="debugPoiView = poiOutcomeService.resolveCombat(debugPoiInstanceId, selectedDebugPoi?.pendingCombatId, 'Escaped', currentPoiContext())">Resolve Combat Escape</button>
        <button type="button" @click="debugPoiView = poiOutcomeService.resolveCombat(debugPoiInstanceId, selectedDebugPoi?.pendingCombatId, 'Cancelled', currentPoiContext())">Resolve Combat Cancelled</button>
        <button type="button" @click="debugPoiView = poiOutcomeService.finalize(debugPoiInstanceId, currentPoiContext())">Finalize Pending Outcome</button>
        <button type="button" @click="selectedDebugPoi && (selectedDebugPoi.pendingResolution = null)">Clear Pending Resolution</button>
        <pre v-if="debugPoiView" class="salvage-debug">{{ JSON.stringify(debugPoiView, null, 2) }}</pre>
        <small>Map Size: {{ meadowsMap.columns }} × {{ meadowsMap.rows }}</small>
        <div class="dev-seed">
          <input v-model="currentSeed" type="text" aria-label="Map seed" placeholder="Map seed" />
          <button type="button" @click="generateFromSeed">Generate</button>
        </div>
        <button type="button" @click="revealEntireMap">Reveal Map</button>
        <button type="button" @click="toggleFogOfWar">
          Toggle Fog: {{ fogEnabled ? 'On' : 'Off' }}
        </button>
        <button type="button" @click="toggleCoordinates">
          Coordinates: {{ showCoordinates ? 'On' : 'Off' }}
        </button>
        <button type="button" @click="showPointsOfInterest = !showPointsOfInterest">
          Points of Interest: {{ showPointsOfInterest ? 'On' : 'Off' }}
        </button>
        <button type="button" @click="showBiomeColors = !showBiomeColors">
          Biome Colors: {{ showBiomeColors ? 'On' : 'Off' }}
        </button>
        <button type="button" @click="showBlockedTiles = !showBlockedTiles">
          Blocked Tiles: {{ showBlockedTiles ? 'On' : 'Off' }}
        </button>
        <button type="button" @click="showMainComponent = !showMainComponent">
          Reachability: {{ showMainComponent ? 'On' : 'Off' }}
        </button>
        <button type="button" @click="showBiomeBoundaries = !showBiomeBoundaries">
          Biome Boundaries: {{ showBiomeBoundaries ? 'On' : 'Off' }}
        </button>
        <button type="button" @click="showPassages = !showPassages">
          Mountain Passes: {{ showPassages ? 'On' : 'Off' }}
        </button>
        <button type="button" @click="showRoads = !showRoads">Roads: {{ showRoads ? 'On' : 'Off' }}</button>
        <button type="button" @click="showGravelRoads = !showGravelRoads">Gravel Roads: {{ showGravelRoads ? 'On' : 'Off' }}</button>
        <button type="button" @click="showWoodenBridges = !showWoodenBridges">Wooden Bridges: {{ showWoodenBridges ? 'On' : 'Off' }}</button>
        <button type="button" @click="showSecondaryRoadTargets = !showSecondaryRoadTargets">Road Targets: {{ showSecondaryRoadTargets ? 'On' : 'Off' }}</button>
        <button type="button" @click="showTravelCosts = !showTravelCosts">Travel Costs: {{ showTravelCosts ? 'On' : 'Off' }}</button>
        <button type="button" @click="showPoiDetectionRanges = !showPoiDetectionRanges">POI Detection Ranges: {{ showPoiDetectionRanges ? 'On' : 'Off' }}</button>
        <button type="button" @click="showPoiIdentificationRanges = !showPoiIdentificationRanges">POI Identification Ranges: {{ showPoiIdentificationRanges ? 'On' : 'Off' }}</button>
        <button type="button" @click="showPoiDiscoveryStates = !showPoiDiscoveryStates">POI Discovery States: {{ showPoiDiscoveryStates ? 'On' : 'Off' }}</button>
        <button type="button" @click="triggerPreviewEvent">Trigger Sample Event</button>
        <div class="dev-enemy-picker">
          <select v-model="debugEnemyTemplateId" aria-label="Test combat enemy">
            <option v-for="enemy in ENEMY_TEMPLATE_LIST" :key="enemy.id" :value="enemy.id">{{ enemy.name }}</option>
          </select>
          <div v-if="selectedEnemyTemplate" class="terrain-stats">
            <strong>{{ selectedEnemyTemplate.name }} · HP {{ selectedEnemyTemplate.maxHealth }}</strong>
            <span v-for="(value, stat) in selectedEnemyTemplate.stats" :key="stat">{{ stat }}: {{ value }}</span>
            <span>Preferred initiative: {{ selectedEnemyTemplate.preferredInitiativeStats.join(', ') }}</span>
            <span>Skills: {{ selectedEnemyTemplate.skillIds.map((id) => combatManager.skillCatalog[id].name).join(', ') }}</span>
          </div>
        </div>
        <button type="button" :disabled="combatSnapshot.worldBlocked" @click="startTestCombat(COMBAT_INITIATOR.PLAYER)">Combat: Player Initiates</button>
        <button type="button" :disabled="combatSnapshot.worldBlocked" @click="startTestCombat(COMBAT_INITIATOR.ENEMY)">Combat: Enemy Initiates</button>
        <button type="button" :disabled="combatSnapshot.worldBlocked" @click="startTestCombat(COMBAT_INITIATOR.PLAYER, true)">Combat: Full HP</button>
        <button type="button" @click="debugGainLearningPoints(1)">Learning Points: +1</button>
        <button type="button" @click="debugGainLearningPoints(5)">Learning Points: +5</button>
        <button type="button" @click="debugGainLearningPoints(10)">Learning Points: +10</button>
        <button type="button" @click="debugResetLearningPoints">Learning Points: Reset</button>
        <button type="button" @click="debugLevelUp">Character: Level Up</button>
        <button type="button" @click="debugSetTime(20, 0)">World: Set Time 20:00</button>
        <button type="button" @click="debugSetTime(22, 0)">World: Set Time 22:00</button>
        <button type="button" @click="debugSetDay(timeState.day + 1)">World: Set Day +1</button>
        <button type="button" @click="debugToggleNight">World: Toggle Night</button>
        <button type="button" @click="performNightThreatCheck()">World: Trigger Threat Check</button>
        <button type="button" @click="startTestCombat(COMBAT_INITIATOR.ENEMY, false, 'grey_wolf')">World: Force Ambush</button>
        <button type="button" @click="giveWardwood(10)">World: Give Wardwood</button>
        <button type="button" @click="giveInventoryItem('dead_wardwood')">World: Give Dead Wardwood</button>
        <button type="button" @click="giveInventoryItem('torch')">World: Give Torch</button>
        <button type="button" @click="giveInventoryItem('lantern')">World: Give Lantern</button>
        <button type="button" @click="giveInventoryItem('holy_lantern')">World: Give Holy Lantern</button>
        <button type="button" @click="debugSetOldestWardwoodExpiration(timeState.day + 1)">World: Set Wardwood Expiration Day</button>
        <button type="button" @click="debugExpireOldestWardwood">World: Expire Oldest Wardwood</button>
        <button type="button" @click="buildCampfire">World: Build Campfire</button>
        <button type="button" @click="deactivateLightSource(characterState); saveProgress()">World: Remove Campfire / Light</button>
        <button type="button" @click="useFirstItem('wardwood', ITEM_USE_ACTION.LIGHT_TORCH)">World: Light Torch</button>
        <button type="button" @click="consumeLightDuration(characterState, 999); saveProgress()">World: Expire Torch</button>
        <button type="button" @click="useFirstItem('lantern', ITEM_USE_ACTION.REFUEL_LANTERN)">World: Refuel Lantern</button>
        <button type="button" @click="useFirstItem('lantern', ITEM_USE_ACTION.LIGHT_LANTERN)">World: Light Lantern</button>
        <button type="button" @click="useFirstItem('lantern', ITEM_USE_ACTION.EXTINGUISH_LANTERN)">World: Extinguish Lantern</button>
        <button type="button" @click="useFirstItem('holy_lantern', ITEM_USE_ACTION.TOGGLE_HOLY_LANTERN)">World: Toggle Holy Lantern</button>
        <button type="button" @click="debugAdvanceMinutes(30)">World: Advance Time 30 Minutes</button>
        <button type="button" @click="debugAdvanceMinutes(60)">World: Advance Time 1 Hour</button>
        <div class="terrain-stats"><strong>Protection Debug</strong><span>Active: {{ characterState.activeLightSource?.type ?? 'None' }}</span><span>Remaining: {{ characterState.activeLightSource?.remainingDurationMinutes ?? 'Infinite' }}</span><span>Wardwood FIFO: {{ wardwoodSummary.batches.map(batch => `${batch.quantity}@D${batch.expirationDay}`).join(' → ') || 'Empty' }}</span><span>Dead Wardwood: {{ characterState.deadWardwood }}</span><span>Threat Result: {{ lastThreatCheck?.reason ?? 'Not checked' }}</span></div>
        <button type="button" @click="debugGiveGold(100)">Trainer: Give 100 Gold</button>
        <button type="button" @click="openTrainer('farmer_trainer')">Trainer: Open Farmer</button>
        <button type="button" @click="openTrainer('hunter_trainer')">Trainer: Open Hunter</button>
        <button type="button" @click="openTrainer('mercenary_trainer')">Trainer: Open Mercenary</button>
        <button type="button" @click="openTrainer('mage_trainer')">Trainer: Open Mage</button>
        <button type="button" @click="openTrainer('blacksmith_trainer')">Trainer: Open Blacksmith</button>
        <button type="button" @click="openTrainer('village_hunter')">Trainer: Village Hunter</button>
        <button type="button" @click="openTrainer('city_hunter')">Trainer: City Hunter</button>
        <button type="button" @click="openTrainer('village_mercenary')">Trainer: Village Mercenary</button>
        <button type="button" @click="openTrainer('city_mercenary')">Trainer: City Mercenary</button>
        <button type="button" @click="openTrainer('village_scholar')">Trainer: Village Scholar</button>
        <button type="button" @click="openTrainer('city_scholar')">Trainer: City Scholar</button>
        <button type="button" @click="debugRevealLessons">Trainer: Reveal All Lessons</button>
        <button type="button" @click="debugResetRevealedLessons">Trainer: Reset Revealed Lessons</button>
        <button v-for="npc in Object.values(DIALOGUE_NPCS)" :key="npc.id" type="button" @click="startDialogue(npc.id)">Dialogue: {{ npc.displayName }}</button>
        <button type="button" @click="dialogueRepository.reset(); dialogueView = null; saveProgress()">Dialogue: Reset State</button>
        <button v-for="quest in questDatabase.all()" :key="quest.id" type="button" @click="debugStartQuest(quest.id)">Quest: Start {{ quest.displayName }}</button>
        <button type="button" @click="questLogOpen=true">Quest: Open Log</button>
        <button type="button" @click="emitQuestSignal('EnemyDefeated',{enemyDefinitionId:'grey_wolf',sourceId:'grey_wolf',targetIds:['grey_wolf'],quantity:1})">Quest: Defeat Grey Wolf</button>
        <button type="button" @click="emitQuestSignal('PoiDiscovered',{poiId:'wolf_den',sourceId:'wolf_den',targetIds:['wolf_den']})">Quest: Discover Wolf Den</button>
        <button v-for="npcId in Object.keys(NPC_ASSIGNMENTS)" :key="`schedule-${npcId}`" type="button" @click="npcScheduleProcessing.invalidateNpc(npcId); processNpcSchedules()">Schedule: Resolve {{ npcId }}</button>
        <button type="button" @click="debugScheduleOverride('blacksmith',MODIFIER_TYPE.TEMPORARY_BUSY,true,60)">Schedule: Blacksmith Busy 1h</button>
        <button type="button" @click="debugScheduleOverride('hunter',MODIFIER_TYPE.HIDE_NPC,true,60)">Schedule: Hide Hunter 1h</button>
        <button type="button" @click="npcScheduleModifiers.removeBySource('hunter','developer');npcScheduleProcessing.invalidateNpc('hunter');processNpcSchedules();saveProgress()">Schedule: Clear Hunter Override</button>
        <pre v-if="npcScheduleDebugView">{{ JSON.stringify(npcScheduleDebugView,null,2) }}</pre>
        <button type="button" @click="characterState.level = 2; characterState.requiredExperience = 200; saveProgress()">Trainer: Set Character Level</button>
        <button type="button" @click="characterState.stats.agility = 3; saveProgress()">Trainer: Set Attribute</button>
        <button type="button" @click="characterState.proficiencies.Archery = 'Novice'; saveProgress()">Trainer: Set Proficiency Rank</button>
        <button type="button" @click="debugMentorDiscovery('sword_master', MENTOR_DISCOVERY.RUMORED)">Mentor: Reveal Sword Master Rumor</button>
        <button type="button" @click="debugMentorDiscovery('sword_master', MENTOR_DISCOVERY.DISCOVERED)">Mentor: Discover Sword Master</button>
        <button type="button" @click="debugMentorDiscovery('sword_master', MENTOR_DISCOVERY.MET)">Mentor: Meet Sword Master</button>
        <button type="button" @click="openMentor('sword_master')">Mentor: Open Sword Master</button>
        <button type="button" @click="debugMentorQuest('sword_master', PERSONAL_QUEST_STATE.COMPLETED)">Mentor: Complete Personal Quest</button>
        <button type="button" @click="debugMentorQuest('sword_master', PERSONAL_QUEST_STATE.AVAILABLE)">Mentor: Reset Personal Quest</button>
        <button type="button" @click="debugRevealMentorLessons('sword_master')">Mentor: Reveal Lessons</button>
        <button type="button" @click="debugUnlockMentorTestData">Mentor: Unlock Test Specialization and Passive</button>
        <button v-for="mentor in MENTOR_LIST" :key="`mentor-${mentor.id}`" type="button" @click="debugMentorDiscovery(mentor.id, MENTOR_DISCOVERY.MET); openMentor(mentor.id)">Mentor: Open {{ mentor.displayName }}</button>
        <button type="button" @click="debugResetMentors">Mentor: Reset Progress</button>
        <button type="button" @click="debugGrantKnowledge('hunters_legacy')">Knowledge: Grant Hunter's Legacy</button>
        <button type="button" @click="debugGrantKnowledge('forbidden_arts')">Knowledge: Grant Forbidden Arts</button>
        <button type="button" @click="debugRemoveKnowledge('hunters_legacy')">Knowledge: Remove Hunter's Legacy</button>
        <button type="button" @click="debugGrantAllKnowledge">Knowledge: Grant All</button>
        <button type="button" @click="debugResetKnowledge">Knowledge: Reset</button>
        <button type="button" @click="showKnowledgeDebug = !showKnowledgeDebug">Knowledge: Show</button>
        <button type="button" @click="reevaluateKnowledgeLessons">Knowledge: Re-evaluate Lessons</button>
        <div v-if="showKnowledgeDebug" class="dev-seed">{{ characterState.discoveredKnowledge.join(', ') || 'No Knowledge' }}</div>
        <button type="button" @click="setDiceDebugMode('minimum')">Dice: Force Minimum</button>
        <button type="button" @click="setDiceDebugMode('maximum')">Dice: Force Maximum</button>
        <button type="button" @click="setDiceDebugMode('random')">Dice: Random</button>
        <button type="button" @click="showEnemyIntent = !showEnemyIntent">Enemy Intent: {{ showEnemyIntent ? 'On' : 'Off' }}</button>
        <button type="button" @click="showEnemyAiDebug = !showEnemyAiDebug">Enemy AI Debug: {{ showEnemyAiDebug ? 'On' : 'Off' }}</button>
        <button type="button" :disabled="!combatSnapshot.worldBlocked" @click="setDebugBlock(0)">Block: Clear</button>
        <button type="button" :disabled="!combatSnapshot.worldBlocked" @click="setDebugBlock((combatSnapshot.activeCombat?.player.stats.defense ?? 0) + 4)">Block: Maximum Guard</button>
        <div class="dev-seed">
          <input v-model.number="debugDiceRoll" type="number" min="1" max="20" aria-label="Fixed dice roll" />
          <button type="button" @click="setFixedDiceRoll">Set Roll</button>
        </div>
        <div class="dev-seed">
          <input v-model.number="debugBlockAmount" type="number" min="0" aria-label="Player Block amount" />
          <button type="button" :disabled="!combatSnapshot.worldBlocked" @click="setDebugBlock(debugBlockAmount)">Set Block</button>
        </div>
        <button type="button" @click="showSettlementInfluence = !showSettlementInfluence">Settlement Influence: {{ showSettlementInfluence ? 'On' : 'Off' }}</button>
        <button type="button" @click="showRoadConnections = !showRoadConnections">Road Connections: {{ showRoadConnections ? 'On' : 'Off' }}</button>
        <button type="button" @click="showBridges = !showBridges">Bridges: {{ showBridges ? 'On' : 'Off' }}</button>
        <button type="button" @click="showCityBounds = !showCityBounds">City Bounds: {{ showCityBounds ? 'On' : 'Off' }}</button>
        <button type="button" @click="showVillageBounds = !showVillageBounds">Village Bounds: {{ showVillageBounds ? 'On' : 'Off' }}</button>
        <button type="button" @click="showRegionZones = !showRegionZones">Region Zones: {{ showRegionZones ? 'On' : 'Off' }}</button>
        <button type="button" @click="showStartPosition = !showStartPosition">Start Position: {{ showStartPosition ? 'On' : 'Off' }}</button>
        <button type="button" @click="showBossPosition = !showBossPosition">Boss Position: {{ showBossPosition ? 'On' : 'Off' }}</button>
        <button type="button" @click="showSectorGrid = !showSectorGrid">Sector Grid: {{ showSectorGrid ? 'On' : 'Off' }}</button>
        <button type="button" data-dev-category="world" @click="showTileGrid = !showTileGrid">Tile Grid: {{ showTileGrid ? 'On' : 'Off' }}</button>
        <button type="button" @click="showEdgeZone = !showEdgeZone">Edge Zone: {{ showEdgeZone ? 'On' : 'Off' }}</button>
        <button type="button" @click="showSectorStats = !showSectorStats">Sector Counts: {{ showSectorStats ? 'On' : 'Off' }}</button>
        <button type="button" @click="showEmptySectors = !showEmptySectors">Empty Sectors: {{ showEmptySectors ? 'On' : 'Off' }}</button>
        <button type="button" @click="showDensityHeatmap = !showDensityHeatmap">Density Heatmap: {{ showDensityHeatmap ? 'On' : 'Off' }}</button>
        <button type="button" @click="showBossPath = !showBossPath">
          Boss Path: {{ showBossPath ? 'On' : 'Off' }}
        </button>
        <button type="button" @click="showTerrainStats = !showTerrainStats">
          Terrain Stats: {{ showTerrainStats ? 'On' : 'Off' }}
        </button>
        <button type="button" class="dev-controls__reset" @click="resetMap">Reset Map</button>
        <div v-if="showTerrainStats" class="terrain-stats">
          <span v-for="item in terrainPercentages" :key="item.type">{{ item.type }}: {{ item.percentage }}%</span>
          <strong>Generated: {{ meadowsMap.generationTimeMs.toFixed(1) }} ms</strong>
          <strong>Attempt: {{ meadowsMap.attempt + 1 }}</strong>
        </div>
        <div v-if="showSectorStats" class="terrain-stats">
          <span v-for="sector in meadowsMap.region.sectors" :key="sector.id">
            Sector {{ sector.column + 1 }},{{ sector.row + 1 }} — POI: {{ sector.poiCount }}, roads: {{ sector.roadCount }}
          </span>
        </div>
        <div v-if="showPointsOfInterest" class="terrain-stats">
          <strong>Static POI: {{ meadowsMap.region.staticPois.length }}</strong>
          <span v-for="item in staticPoiCounts" :key="item.type">
            {{ formatPoiType(item.type) }}: {{ item.count }} · {{ item.preferredBiomes }} · {{ item.zone }}
          </span>
        </div>
        <div v-if="showSecondaryRoadTargets" class="terrain-stats">
          <strong>Secondary branches: {{ meadowsMap.region.secondaryRoadNetwork.branches.length }}</strong>
          <span v-for="branch in meadowsMap.region.secondaryRoadNetwork.branches" :key="branch.id">
            {{ formatPoiType(branch.targetType) }} · {{ branch.startId }} → {{ branch.endId }} · {{ branch.length }} tiles
          </span>
        </div>
        <div v-if="showPoiDiscoveryStates" class="terrain-stats">
          <strong>Detected: {{ poiDiscoveryCounts.detected }}</strong>
          <strong>Identified: {{ poiDiscoveryCounts.identified }}</strong>
          <strong>Visited: {{ poiDiscoveryCounts.visited }}</strong>
          <span v-for="poi in poiRecords" :key="poi.id">
            {{ formatPoiType(poi.type) }} · {{ poiDiscovery[poi.id] ?? POI_DISCOVERY_STATE.HIDDEN }} · D{{ poi.detectionRange }}/I{{ poi.identificationRange }}
          </span>
        </div>
              </div>
            </section>
          </div>
        </Teleport>
      </section>
    </aside>

    <section class="map-section" aria-label="Game map">
      <div class="map-frame">
        <header class="map-header">
          <div>
            <p class="map-eyebrow">Map 1</p>
            <h2>{{ meadowsMap.name }}</h2>
            <small>{{ characterState.name }} · {{ characterState.gold }} Gold</small>
          </div>
          <div class="world-clock" aria-label="World time">
            <strong>Day {{ timeState.day }}</strong>
            <span>{{ formatHour(timeState.hour, timeState.minute ?? 0) }}</span>
            <span>{{ worldClockStatus.currentPeriod }}</span>
            <span>Danger: {{ currentThreat.demonTier ?? 'None' }}</span>
            <span>Encounter Chance: {{ currentThreat.level }}%</span>
            <span>Safe Zone: {{ isSafeZone(currentPlayerTile) ? 'Yes' : 'No' }}</span>
            <span>{{ worldStatus }}</span>
            <span>Light: {{ characterState.activeLightSource?.isActive ? characterState.activeLightSource.type : 'None' }}</span>
            <span v-if="characterState.activeLightSource?.remainingDurationMinutes !== null">Protection: {{ characterState.activeLightSource?.remainingDurationMinutes ?? 0 }} min</span>
            <strong v-if="characterState.activeLightSource?.remainingDurationMinutes > 0 && characterState.activeLightSource.remainingDurationMinutes <= 30">{{ characterState.activeLightSource.type }} expires in {{ characterState.activeLightSource.remainingDurationMinutes }} minutes.</strong>
            <span>Wardwood {{ characterState.wardwood }}</span>
          </div>
          <div class="map-header__actions">
            <button type="button" @click="centerMapOnPlayer">Center on Player</button>
          </div>
        </header>

        <div
          ref="mapScrollArea"
          class="map-scroll-area"
          @pointerdown="startMapDrag"
          @pointermove="moveMap"
          @pointerup="stopMapDrag"
          @pointercancel="stopMapDrag"
          @wheel.prevent="zoomMap"
          @scroll.passive="scheduleViewportUpdate"
        >
          <div
            class="map-canvas"
            :class="{ 'map-canvas--no-biomes': !showBiomeColors, 'map-canvas--grid': mapGridVisible }"
            :style="{
              width: `${meadowsMap.columns * mapTileSize}px`,
              height: `${meadowsMap.rows * mapTileSize}px`,
              '--tile-size': `${mapTileSize}px`,
            }"
          >
            <div
              v-for="tile in visibleTiles"
              :key="tile.index"
              class="map-tile"
              :class="[
                `map-tile--${tile.terrain}`,
                {
                  'map-tile--player': tile.index === playerTileIndex,
                  'map-tile--adjacent': canMoveTo(tile.index),
                  'map-tile--blocked': !isTilePassable(tile.index),
                  'map-tile--explored': fogEnabled && isTileExplored(tile.index) && !isTileVisible(tile.index),
                  'map-tile--hidden': fogEnabled && !isTileExplored(tile.index),
                  'map-tile--debug-blocked': showBlockedTiles && !tile.walkable,
                  'map-tile--debug-main': showMainComponent && meadowsMap.validation.mainComponent[tile.index],
                  'map-tile--debug-boundary': showBiomeBoundaries && biomeBoundaryIds.has(tile.index),
                  'map-tile--debug-pass': showPassages && mountainPassageIds.has(tile.index),
                  'map-tile--debug-path': showBossPath && bossPath.has(tile.index),
                  'map-tile--debug-road': showRoads && roadDebugIds.has(tile.index),
                  'map-tile--debug-gravel': showGravelRoads && gravelRoadDebugIds.has(tile.index),
                  'map-tile--debug-wooden-bridge': showWoodenBridges && woodenBridgeDebugIds.has(tile.index),
                  'map-tile--debug-road-start': showSecondaryRoadTargets && secondaryRoadStartIds.has(tile.index),
                  'map-tile--debug-road-target': showSecondaryRoadTargets && secondaryRoadTargetIds.has(tile.index),
                  'map-tile--debug-poi-detection': showPoiDetectionRanges && poiDetectionRangeIds.has(tile.index),
                  'map-tile--debug-poi-identification': showPoiIdentificationRanges && poiIdentificationRangeIds.has(tile.index),
                  'map-tile--debug-influence': showSettlementInfluence && settlementInfluenceIds.has(tile.index),
                  'map-tile--debug-connection': showRoadConnections && roadConnectionIds.has(tile.index),
                  'map-tile--debug-bridge': showBridges && bridgeDebugIds.has(tile.index),
                  'map-tile--debug-city': showCityBounds && cityBoundsIds.has(tile.index),
                  'map-tile--debug-village': showVillageBounds && villageBoundsIds.has(tile.index),
                  [`map-tile--debug-zone-${regionZoneById.get(tile.index)}`]: showRegionZones,
                  'map-tile--debug-start': showStartPosition && tile.index === meadowsMap.startIndex,
                  'map-tile--debug-boss': showBossPosition && tile.index === meadowsMap.region.boss.centerId,
                  'map-tile--debug-sector': showSectorGrid && sectorBoundaryIds.has(tile.index),
                  'map-tile--debug-edge': showEdgeZone && edgeZoneIds.has(tile.index),
                  'map-tile--debug-empty-sector': showEmptySectors && sectorByTileId.get(tile.index)?.empty,
                  'map-tile--debug-density': showDensityHeatmap,
                },
              ]"
              :style="{
                left: `${tile.column * mapTileSize}px`,
                top: `${tile.row * mapTileSize}px`,
                '--density-alpha': `${(sectorByTileId.get(tile.index)?.densityScore ?? 0) / maximumSectorDensity * 0.7}`,
              }"
              :aria-label="showCoordinates ? `${tile.terrain} tile, coordinates ${tile.column + 1}, ${tile.row + 1}` : `${tile.terrain} tile`"
              @click="inspectTile(tile.index)"
              @dblclick="movePlayerTo(tile.index)"
              @pointerenter="showTileTooltip(tile, $event)"
              @pointermove="showTileTooltip(tile, $event)"
              @pointerleave="hideTileTooltip"
            >
              <WorldTileLayers :presentation="worldTilePresentations[tile.index]" />
              <span v-if="showCoordinates" class="tile-coordinate" aria-hidden="true">
                {{ tile.column + 1 }},{{ tile.row + 1 }}
              </span>
              <span v-if="showTravelCosts && tile.walkable" class="tile-travel-cost">{{ calculateTileTravelTime(tile) / 60 }}h</span>
              <span v-if="tile.index === playerTileIndex" class="player-token" aria-label="Player">
                {{ character.icon }}
              </span>
              <button v-if="poiMarkerByTile.get(tile.index)" type="button" class="poi-framework-marker" :class="[`poi-framework-marker--${poiMarkerByTile.get(tile.index).status.toLowerCase().replaceAll(' ', '-')}`, { 'poi-framework-marker--safe': poiMarkerByTile.get(tile.index).isSafeZone }]" :title="poiMarkerByTile.get(tile.index).optionalTooltip" :aria-label="poiMarkerByTile.get(tile.index).optionalTooltip" @click.stop="openPoi(poiMarkerByTile.get(tile.index).instanceId)"><span aria-hidden="true">{{ poiMarkerByTile.get(tile.index).isSafeZone ? '⌂' : poiMarkerByTile.get(tile.index).status === 'Exhausted' ? '◇' : '◆' }}</span><small>{{ poiMarkerByTile.get(tile.index).status }}</small></button>
              <span
                v-if="getPoiState(tile) === POI_DISCOVERY_STATE.DETECTED"
                class="poi-token poi-token--detected"
                title="Unknown point of interest"
              >
                ?
              </span>
            </div>
          </div>

          <div class="zoom-indicator" aria-live="polite">
            Zoom {{ Math.round(mapZoom * 100) }}%
          </div>
        </div>

        <aside v-if="selectedTile" class="tile-inspector" aria-live="polite">
          <button type="button" aria-label="Close tile information" @click="selectedTileIndex = null">×</button>
          <p v-if="showCoordinates">{{ selectedTile.column }},{{ selectedTile.row }}</p>
          <h3>{{ selectedTile.name }}</h3>
          <strong>{{ selectedTile.type }}</strong>
          <span>{{ selectedTile.description }}</span>
          <span v-if="selectedTile.pointOfInterest">Point of interest: {{ selectedTile.pointOfInterest }}</span>
          <span v-if="selectedTile.staticPoi">Static POI: {{ formatPoiType(selectedTile.staticPoi.type) }}</span>
          <span v-if="selectedTile.discoveryState">Discovery: {{ selectedTile.discoveryState }}</span>
          <span v-if="selectedTile.travelMinutes">Travel time: {{ selectedTile.travelMinutes / 60 }} hours</span>
          <small :class="{ 'tile-inspector__visited': selectedTile.visited }">
            {{ selectedTile.visited ? 'Visited' : 'Not visited' }}
          </small>
        </aside>
      </div>
    </section>

    <PoiInteractionOverlay v-if="activePoiModel && !combatSnapshot.activeCombat" :model="activePoiModel" :busy="poiActionBusy" :message="poiUiMessage" @close="closePoi" @execute="executePoiUiAction" @resume-loot="resumePoiLoot" />
    <TrainerScreen v-if="activeTrainer" :trainer="activeTrainer" :character="characterState" @train="trainLesson" @close="closeTrainer" />
    <DialogueOverlay v-if="dialogueView" :view="dialogueView" :busy="dialogueBusy" @choose="chooseDialogue" @close="closeDialogue" />
    <div v-if="knowledgeNotification" class="knowledge-notification" role="status"><strong>New Knowledge Discovered</strong><h3>{{ knowledgeNotification.displayName }}</h3><p>{{ knowledgeNotification.description }}</p><small>Some Trainers or Mentors may now reveal new lessons.</small><button type="button" aria-label="Close Knowledge notification" @click="knowledgeNotification = null">×</button></div>
    <div v-if="lessonDiscoveryMessage" class="training-message" role="status">{{ lessonDiscoveryMessage }}<button type="button" @click="lessonDiscoveryMessage = ''">×</button></div>
    <div v-if="trainingMessage" class="training-message" role="status">{{ trainingMessage }}<button type="button" @click="trainingMessage = ''">×</button></div>

    <div v-if="levelUpPopup" class="level-up-backdrop" role="dialog" aria-modal="true" aria-labelledby="level-up-title">
      <section class="level-up-popup"><small>Character Progression</small><h2 id="level-up-title">Level Up!</h2><strong>Level {{ levelUpPopup.level }}</strong><p>+{{ levelUpPopup.learningPointsGained }} Learning Points</p><p>Current LP: {{ levelUpPopup.currentLearningPoints }}</p><button type="button" @click="levelUpPopup = null">Continue</button></section>
    </div>

    <nav class="hud-action-bar" aria-label="Game panels">
      <button v-for="panel in GAME_PANELS" :key="panel.id" type="button" :class="{ active: activePanel === panel.id }" :title="`${panel.label} — ${panel.tooltip}${panel.shortcut ? ` — Shortcut: ${panel.shortcut.toUpperCase()}` : ''}`" @click="panelManager.toggle(panel.id)">
        <kbd v-if="panel.shortcut">{{ panel.shortcut.toUpperCase() }}</kbd><span>{{ panel.label }}</span>
      </button>
    </nav>

    <Transition name="hud-panel">
      <div v-if="activePanel" class="hud-panel-backdrop" @click.self="panelManager.close()">
        <section class="hud-panel" role="dialog" aria-modal="true" :aria-labelledby="`${activePanel}-panel-title`">
          <header><div><small>Game Menu</small><h2 :id="`${activePanel}-panel-title`">{{ GAME_PANELS.find(({ id }) => id === activePanel)?.label }}</h2></div><button type="button" aria-label="Close panel" @click="panelManager.close()">×</button></header>

          <div v-if="activePanel === 'character'" class="hud-panel__content character-sheet">
            <section><h3>General</h3><p>{{ characterState.name }}</p><p>{{ characterState.gold }} Gold</p></section>
            <section><h3>Progression</h3><dl><div><dt>Level</dt><dd>{{ characterState.level }}</dd></div><div><dt>XP</dt><dd>{{ characterState.experience }}</dd></div><div><dt>XP Required</dt><dd>{{ characterState.requiredExperience }}</dd></div><div><dt>Learning Points</dt><dd>{{ characterState.learningPoints }}</dd></div><div><dt>Lifetime LP Earned</dt><dd>{{ characterState.lifetimeLearningPointsEarned }}</dd></div><div><dt>Lifetime LP Spent</dt><dd>{{ characterState.lifetimeLearningPointsSpent }}</dd></div></dl></section>
            <section><h3>Combat</h3><p>HP {{ characterState.health.current }} / {{ calculatedCharacter.maximumHealth }}</p><p>Weapon: {{ calculatedCharacter.equippedWeapon?.displayName ?? 'Unarmed' }}</p><p>Armor Rating: {{ calculatedCharacter.armorRating }}</p></section>
            <section><h3>Final Stats</h3><dl><div v-for="attribute in ATTRIBUTE_DEFINITIONS" :key="attribute.id"><dt>{{ attribute.name }}</dt><dd>{{ calculatedCharacter.finalStats[attribute.id] }}</dd></div></dl></section>
            <section><h3>Resistances</h3><dl><div v-for="(value, resistance) in calculatedCharacter.resistances" :key="resistance"><dt>{{ resistance }}</dt><dd>{{ value }}</dd></div></dl></section>
            <section><h3>Proficiencies</h3><dl><div v-for="proficiency in PROFICIENCY_NAMES" :key="proficiency" :title="`${calculatedCharacter.proficiencyValues[proficiency].currentRank} · Base ${calculatedCharacter.proficiencyValues[proficiency].baseValue} · Bonus +${calculatedCharacter.proficiencyValues[proficiency].bonusValue} · Effective ${calculatedCharacter.proficiencyValues[proficiency].effectiveValue} · Rank Cap ${calculatedCharacter.proficiencyValues[proficiency].currentRankCap} · Maximum Cap ${calculatedCharacter.proficiencyValues[proficiency].maximumCap}`"><dt>{{ proficiency }}</dt><dd><strong>{{ calculatedCharacter.proficiencyValues[proficiency].currentRank }}</strong> {{ calculatedCharacter.proficiencyValues[proficiency].baseValue }} / {{ calculatedCharacter.proficiencyValues[proficiency].currentRankCap }} · Bonus +{{ calculatedCharacter.proficiencyValues[proficiency].bonusValue }} · Effective {{ calculatedCharacter.proficiencyValues[proficiency].effectiveValue }}</dd></div></dl></section>
            <section><h3>Mentors Met</h3><p v-if="!characterState.metMentorIds.length">None</p><p v-for="mentorId in characterState.metMentorIds" :key="mentorId">{{ MENTORS[mentorId]?.displayName ?? mentorId }}</p></section>
            <section><h3>Specializations</h3><p v-if="!characterState.specializations.length">None</p><p v-for="id in characterState.specializations" :key="id">{{ id }}</p></section>
            <section><h3>Passive Skills</h3><p v-if="!characterState.passiveSkills.length">None</p><p v-for="id in characterState.passiveSkills" :key="id">{{ id }}</p></section>
            <section><h3>Learning History</h3><p v-if="!characterState.learningRecords.length">No mentor lessons learned.</p><p v-for="record in characterState.learningRecords" :key="`${record.teacherId}-${record.lessonId}`">{{ record.lessonId }} — {{ MENTORS[record.teacherId]?.displayName ?? record.teacherId }}</p></section>
            <section><h3>Book Collection</h3><p>Books Found {{ bookCollection.found }} / {{ bookCollection.total }}</p><details><summary>Book Journal</summary><p v-if="!bookCollection.journal.length">No Knowledge Books found.</p><article v-for="entry in bookCollection.journal" :key="entry.bookId"><strong>{{ entry.title }}</strong><p>{{ entry.known ? 'Known' : 'Not Known' }} · {{ entry.foundDate ?? 'Unknown date' }}</p><small>Source: {{ typeof entry.source === 'object' ? (entry.source.id ?? entry.source.type ?? 'Unknown') : (entry.source ?? 'Unknown') }}</small></article></details></section>
            <section class="equipment-summary"><h3>Equipment Summary</h3><div class="equipment-summary__list"><span v-for="entry in equipmentEntries" :key="entry.id"><b>{{ entry.name }}</b>{{ entry.item?.displayName ?? 'Empty' }}</span></div></section>
          </div>

          <div v-else-if="activePanel === 'skills'" class="hud-panel__content panel-columns">
            <section><h3>Combat Skills</h3><article v-for="skill in characterCombatSkills" :key="skill.id"><strong>{{ skill.name }}</strong><p>{{ skill.description }}</p></article></section>
            <section><h3>Proficiencies</h3><details v-for="category in PROFICIENCY_CATEGORIES" :key="category.id" class="proficiency-category"><summary><strong>{{ category.name }}</strong><span>{{ category.proficiencies.length }}</span></summary><article v-for="proficiency in category.proficiencies" :key="proficiency" :title="`Current Rank: ${calculatedCharacter.proficiencyValues[proficiency].currentRank}; Base Value: ${calculatedCharacter.proficiencyValues[proficiency].baseValue}; Bonus Value: ${calculatedCharacter.proficiencyValues[proficiency].bonusValue}; Effective Value: ${calculatedCharacter.proficiencyValues[proficiency].effectiveValue}; Current Rank Cap: ${calculatedCharacter.proficiencyValues[proficiency].currentRankCap}; Maximum Cap: ${calculatedCharacter.proficiencyValues[proficiency].maximumCap}`"><strong>{{ proficiency }} · {{ calculatedCharacter.proficiencyValues[proficiency].currentRank }}</strong><p>{{ calculatedCharacter.proficiencyValues[proficiency].baseValue }} / {{ calculatedCharacter.proficiencyValues[proficiency].currentRankCap }} · Bonus +{{ calculatedCharacter.proficiencyValues[proficiency].bonusValue }} · Effective {{ calculatedCharacter.proficiencyValues[proficiency].effectiveValue }}</p><p>{{ PROFICIENCY_DESCRIPTIONS[proficiency] ?? 'A general adventuring proficiency.' }}</p></article></details></section>
          </div>

          <div v-else-if="activePanel === 'equipment'" class="hud-panel__content panel-columns">
            <section><h3>Equipment</h3><div class="equipment-grid"><button v-for="entry in equipmentEntries" :key="entry.id" type="button" class="equipment-slot" :class="{ filled: entry.item, selected: selectedEquipmentItem === entry.item && entry.item }" @click="selectedEquipmentItem = entry.item" @dblclick="unequipSlot(entry.id)"><span class="equipment-slot__image"><img v-if="entry.item?.icon" :src="entry.item.icon" :alt="entry.item.displayName"><i v-else aria-hidden="true">{{ equipmentSlotIcon(entry.id) }}</i></span><strong>{{ entry.name }}</strong><small>{{ entry.item?.displayName ?? 'Empty' }}</small></button></div><small>Double-click an equipped slot to unequip.</small></section>
            <section class="item-details"><h3>Item Details</h3><ItemTooltip v-if="selectedEquipmentItem" :item="selectedEquipmentItem" :character="characterState" /><p v-else>Select an equipped item to inspect it.</p></section>
            <section class="equipment-summary"><h3>Item Database Preview</h3><div class="item-database-preview"><button v-for="item in ITEM_LIST" :key="item.id" type="button" :class="{ selected: selectedItemDefinition?.id === item.id }" @click="selectedItemDefinition = item"><span aria-hidden="true">◇</span><strong>{{ item.displayName }}</strong><small>{{ item.itemType }} · {{ item.quality }}</small></button></div><button type="button" :disabled="!selectedItemDefinition?.equipSlots.length" @click="equipPreviewItem(selectedItemDefinition)">Equip Selected</button></section>
            <section class="equipment-summary"><h3>Shared Item Tooltip</h3><ItemTooltip v-if="selectedItemDefinition" :item="selectedItemDefinition" :character="characterState" /></section>
          </div>

          <div v-else-if="activePanel === 'inventory'" class="hud-panel__content inventory-panel">
            <section class="inventory-toolbar">
              <div><h3>Inventory</h3><strong>{{ characterState.gold }} Gold</strong></div>
              <label>Search<input v-model="inventorySearch" type="search" placeholder="Search by item name"></label>
              <label>Filter<select v-model="inventoryFilter"><option v-for="filter in inventoryFilters" :key="filter">{{ filter }}</option></select></label>
              <label>Sort<select v-model="inventorySort"><option v-for="sort in inventorySorts" :key="sort">{{ sort }}</option></select></label>
            </section>
            <section class="inventory-list" aria-label="Inventory item list">
              <p v-if="!inventoryEntries.length">No matching items.</p>
              <article v-for="entry in inventoryEntries" :key="entry.instance.instanceId" :class="{ selected: selectedInventoryInstanceId === entry.instance.instanceId }" @contextmenu.prevent="inventoryContextInstanceId = entry.instance.instanceId">
                <button type="button" @click="inspectInventoryItem(entry)" @dblclick="performDefaultInventoryAction(entry)"><span aria-hidden="true">{{ entry.instance.favorite ? '★' : '◇' }}</span><strong>{{ entry.definition.displayName }}</strong><small>{{ entry.definition.itemType }}</small><b v-if="entry.instance.quantity > 1">×{{ entry.instance.quantity }}</b></button>
                <menu v-if="inventoryContextInstanceId === entry.instance.instanceId" class="inventory-context">
                  <button v-if="entry.definition.equipSlots.length" type="button" @click="equipInventoryItem(entry)">Equip</button>
                  <template v-if="entry.definition.id === 'wardwood'"><button type="button" @click="useInventoryItem(entry, ITEM_USE_ACTION.BUILD_CAMPFIRE)">Build Campfire</button><button type="button" @click="useInventoryItem(entry, ITEM_USE_ACTION.LIGHT_TORCH)">Light Torch</button><button type="button" @click="useInventoryItem(entry, ITEM_USE_ACTION.REFUEL_LANTERN)">Refuel Lantern</button></template>
                  <template v-else-if="entry.definition.id === 'lantern'"><button type="button" @click="useInventoryItem(entry, ITEM_USE_ACTION.LIGHT_LANTERN)">Light</button><button type="button" @click="useInventoryItem(entry, ITEM_USE_ACTION.EXTINGUISH_LANTERN)">Extinguish</button><button type="button" @click="useInventoryItem(entry, ITEM_USE_ACTION.REFUEL_LANTERN)">Refuel</button></template>
                  <button v-else-if="entry.definition.id === 'holy_lantern'" type="button" @click="useInventoryItem(entry, ITEM_USE_ACTION.TOGGLE_HOLY_LANTERN)">Toggle Holy Lantern</button>
                  <button v-else-if="entry.definition.itemType === ITEM_TYPE.CONSUMABLE" type="button" @click="useInventoryItem(entry)">Use</button>
                  <button v-if="[ITEM_TYPE.BOOK, ITEM_TYPE.SCROLL].includes(entry.definition.itemType)" type="button" @click="useInventoryItem(entry)">Use</button>
                  <button type="button" @click="toggleFavorite(entry)">{{ entry.instance.favorite ? 'Remove Favorite' : 'Favorite' }}</button>
                  <button type="button" @click="inspectInventoryItem(entry)">Inspect</button>
                  <button v-if="isPotentiallySalvageable(entry.definition)" type="button" :disabled="!salvageActionState(entry)?.ok" :title="salvageActionState(entry)?.message ?? salvageActionState(entry)?.code" @click="requestSalvage(entry)">Salvage</button>
                  <button v-if="entry.definition.bookData?.kind !== BOOK_KIND.KNOWLEDGE_BOOK" type="button" :disabled="entry.instance.favorite || entry.definition.protected || entry.instance.state?.protected || [ITEM_TYPE.QUEST_ITEM, ITEM_TYPE.KEY_ITEM].includes(entry.definition.itemType)" @click="requestDestroy(entry)">Destroy</button>
                  <button type="button" @click="inventoryContextInstanceId = null">Close</button>
                </menu>
              </article>
            </section>
            <section class="inventory-inspect"><h3>Inspect</h3><ItemTooltip v-if="selectedInventoryEntry" :item="selectedInventoryEntry.definition" :character="characterState" /><button v-if="selectedInventoryEntry && isPotentiallySalvageable(selectedInventoryEntry.definition)" type="button" :disabled="!salvageActionState(selectedInventoryEntry)?.ok" @click="requestSalvage(selectedInventoryEntry)">Salvage</button><p v-if="selectedInventoryEntry && isPotentiallySalvageable(selectedInventoryEntry.definition) && !salvageActionState(selectedInventoryEntry)?.ok">{{ salvageActionState(selectedInventoryEntry)?.message ?? salvageActionState(selectedInventoryEntry)?.code }}</p><div v-if="selectedInventoryEntry?.definition.id === 'wardwood'"><strong>Wardwood: {{ wardwoodSummary.quantity }}</strong><p v-if="wardwoodSummary.daysUntilExpiration !== null">{{ wardwoodSummary.nextExpiringQuantity }} pieces will lose their power in {{ wardwoodSummary.daysUntilExpiration }} day(s).</p></div><p v-if="!selectedInventoryEntry">Select an item to inspect it. Double-click performs its default action.</p></section>
          </div>

          <div v-else-if="activePanel === 'journal'" class="hud-panel__content"><section><h3>Journal</h3><p>No journal entries yet.</p></section></div>
          <div v-else-if="activePanel === 'knowledge'" class="hud-panel__content"><section><h3>Discovered Knowledge</h3><p v-if="!getDiscoveredKnowledge(characterState).length">No Knowledge discovered in this run.</p><article v-for="entry in getDiscoveredKnowledge(characterState)" :key="entry.knowledgeId"><strong>{{ entry.definition.displayName }}</strong><small>{{ entry.definition.category }}</small><p>{{ entry.definition.description }}</p><p>Source: {{ entry.sourceType }} — {{ entry.sourceId ?? 'Unknown' }}</p><p>Discovery Day: {{ entry.discoveredDay ?? 'Unknown' }}</p></article></section></div>
          <div v-else-if="activePanel === 'library'" class="hud-panel__content"><section><h3>Character Library</h3><p>Books Found {{ bookCollection.found }} / {{ bookCollection.total }} · {{ bookCollection.completionPercentage }}%</p><div class="inventory-toolbar"><label>Search<input v-model="librarySearch" type="search" placeholder="Search books"></label><label>Category<select v-model="libraryCategory"><option value="">All</option><option v-for="category in Object.values(BOOK_CATEGORY)" :key="category">{{ category }}</option></select></label><label>Book Type<select v-model="libraryBookType"><option value="">All</option><option v-for="type in Object.values(BOOK_KIND)" :key="type" :value="type">{{ type.replaceAll('_', ' ') }}</option></select></label><label>Sort<select v-model="librarySort"><option value="name">Name</option><option value="date">Found Date</option><option value="status">Status</option></select></label></div><p v-if="!libraryEntries.length">No matching books.</p><article v-for="entry in libraryEntries" :key="entry.bookId"><strong>{{ entry.title }}</strong><p>{{ entry.bookType.replaceAll('_', ' ') }} · {{ entry.category }} · {{ entry.status }}</p><small>{{ entry.foundDate ?? 'Unknown date' }} · {{ typeof entry.source === 'object' ? (entry.source.id ?? entry.source.type ?? 'Unknown source') : (entry.source ?? 'Unknown source') }}</small></article></section></div>
          <div v-else-if="activePanel === 'recipes'" class="hud-panel__content panel-columns">
            <section><h3>Recipe Journal</h3><div class="inventory-toolbar"><label>Search<input v-model="recipeSearch" type="search" placeholder="Search known recipes"></label><label>Category<select v-model="recipeCategory"><option value="">All</option><option v-for="category in Object.values(RECIPE_CATEGORY)" :key="category">{{ category }}</option></select></label><label>Station<select v-model="recipeStation"><option v-for="station in Object.values(STATION_TYPE)" :key="station">{{ station }}</option></select></label></div><p v-if="!knownRecipes.length">No matching known recipes.</p><button v-for="recipe in knownRecipes" :key="recipe.id" type="button" :class="{ selected: selectedRecipeId === recipe.id }" @click="selectedRecipeId = recipe.id"><strong>{{ recipe.displayName }}</strong><small>{{ recipe.category }} · {{ recipe.requiredStationType }}</small></button></section>
            <section><h3>Crafting</h3><template v-if="selectedRecipePreview"><h4>{{ selectedRecipePreview.recipe.displayName }}</h4><p>{{ selectedRecipePreview.recipe.description }}</p><p>Craft time: {{ selectedRecipePreview.recipe.craftTime }} minutes</p><h4>Ingredients</h4><p v-for="entry in selectedRecipePreview.ingredients" :key="entry.itemDefinitionId">{{ entry.displayName }}: {{ entry.owned }} / {{ entry.required }}</p><p v-for="blocker in selectedRecipePreview.blockers" :key="blocker.code">{{ blocker.message }}</p><p>Maximum craftable: {{ selectedRecipePreview.maxCraftable }}</p><div><button type="button" :disabled="!selectedRecipePreview.ok" @click="craftRecipe(1)">Craft ×1</button><button type="button" :disabled="selectedRecipePreview.maxCraftable < 5" @click="craftRecipe(5)">Craft ×5</button><button type="button" :disabled="selectedRecipePreview.maxCraftable < 1" @click="craftRecipe('max')">Craft Max</button></div><p>{{ craftingMessage }}</p></template><p v-else>Select a recipe.</p></section>
          </div>
          <div v-else class="hud-panel__content"><section><h3>Settings</h3><p>Settings controls will be added here later.</p></section></div>
        </section>
      </div>
    </Transition>

    <Teleport to="body">
      <div v-if="activeMerchant" class="merchant-backdrop" @click.self="closeMerchant">
        <section class="merchant-window" role="dialog" aria-modal="true" aria-labelledby="merchant-title">
          <header class="merchant-header"><div><small>{{ activeMerchant.merchantType }}</small><h2 id="merchant-title">{{ activeMerchant.displayName }}</h2><p>{{ activeMerchant.description }}</p><p>{{ activeMerchant.tags.join(' · ') }}</p><small v-for="hint in activeMerchant.optionalStockHints" :key="hint">{{ hint }}</small></div><div><strong>Player Gold: {{ characterState.gold }}</strong><strong>Merchant Gold: {{ activeMerchantStock.currentGoldReserve }}</strong><button type="button" @click="closeMerchant">Close</button></div></header>
          <p v-if="merchantMessage" class="merchant-message">{{ merchantMessage }}</p>
          <div class="merchant-layout">
            <section><h3>Merchant Stock</h3><div class="merchant-toolbar"><input v-model="merchantSearch" type="search" placeholder="Search stock"><select v-model="merchantFilter"><option value="">All Types</option><option v-for="type in Object.values(ITEM_TYPE)" :key="type">{{ type }}</option></select><select v-model="merchantSort"><option value="name">Name</option><option value="price">Price</option></select></div><article v-for="row in merchantStockEntries" :key="row.entry.itemDefinitionId" class="merchant-row"><input v-model="selectedBuyIds" type="checkbox" :value="row.entry.itemDefinitionId"><button type="button" @click="merchantSelectedItem = row.item"><strong>{{ row.item.displayName }}</strong><small>{{ row.item.itemType }} · Stock {{ row.entry.quantity }} · {{ merchantBuyPrice(row).unitPrice }} Gold each</small></button><input v-model.number="buyQuantities[row.entry.itemDefinitionId]" type="number" min="1" :max="row.entry.quantity" placeholder="1"><button type="button" @click="buyMerchantItem(row.entry.itemDefinitionId, buyQuantities[row.entry.itemDefinitionId] ?? 1)">Buy</button></article></section>
            <section><h3>Item Details</h3><ItemTooltip v-if="merchantSelectedItem" :item="merchantSelectedItem" :character="characterState" /><p v-if="merchantSelectedItem">Buy: {{ calculateTransactionPrice(merchantSelectedItem, activeMerchant, 'buy').unitPrice }} Gold · Sell: {{ calculateTransactionPrice(merchantSelectedItem, activeMerchant, 'sell').unitPrice }} Gold</p><p v-if="merchantSelectedItem?.bookData">Current usefulness does not restrict purchase.</p><p v-if="!merchantSelectedItem">Select an item.</p></section>
            <section><h3>Player Inventory</h3><article v-for="entry in merchantInventoryEntries" :key="entry.instance.instanceId" class="merchant-row"><input v-model="selectedSellIds" type="checkbox" :value="entry.instance.instanceId"><button type="button" @click="merchantSelectedItem = entry.definition"><strong>{{ entry.definition.displayName }}</strong><small>{{ entry.instance.quantity }} · {{ entry.instance.favorite ? 'Favorite' : 'Not Favorite' }} · {{ entry.definition.protected || entry.instance.state?.protected ? 'Protected' : 'Unprotected' }} · {{ entry.acceptance.accepted ? `${merchantSellPrice(entry).unitPrice} Gold` : 'Not accepted' }}</small></button><input v-model.number="sellQuantities[entry.instance.instanceId]" type="number" min="1" :max="entry.instance.quantity" placeholder="1"><button type="button" :disabled="!entry.acceptance.accepted" @click="sellMerchantItem(entry.instance.instanceId, sellQuantities[entry.instance.instanceId] ?? 1)">Sell</button></article></section>
          </div>
          <footer class="merchant-summary"><div><h3>Buy Selected</h3><p>{{ selectedBuyIds.join(', ') || 'None' }}</p><strong v-if="buySummary.ok">Total {{ buySummary.totalPrice }} Gold · After {{ buySummary.playerGoldAfter }} Gold</strong><strong v-else>{{ buySummary.code }}</strong><button type="button" :disabled="!selectedBuyIds.length || !buySummary.ok" @click="buySelectedMerchantItems">Confirm Buy Selected</button></div><div><h3>Sell Selected</h3><p>{{ selectedSellIds.length }} selected</p><strong v-if="sellSummary.ok">Total {{ sellSummary.totalPrice }} Gold · Merchant after {{ sellSummary.merchantGoldAfter }} Gold</strong><strong v-else>{{ sellSummary.code }}</strong><button type="button" :disabled="!selectedSellIds.length || !sellSummary.ok" @click="sellSelectedMerchantItems">Confirm Sell Selected</button></div><div><h3>Developer Stock</h3><button type="button" @click="refreshActiveMerchant">Refresh Merchant Stock</button><button type="button" @click="resetActiveMerchant">Reset Merchant Stock</button><small>Refresh source: {{ activeMerchantStock.optionalRefreshSource }}</small></div></footer>
        </section>
      </div>
    </Teleport>

    <div v-if="pendingDestroyInstanceId" class="inventory-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="destroy-title">
      <section class="inventory-modal"><h2 id="destroy-title">Destroy item?</h2><p>This action permanently removes the item.</p><div><button type="button" @click="pendingDestroyInstanceId = null">Cancel</button><button type="button" class="danger" @click="confirmDestroy">Destroy</button></div></section>
    </div>

    <div v-if="pendingSalvageInstanceId && salvagePreview" class="inventory-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="salvage-title">
      <section class="inventory-modal salvage-confirmation"><small>Salvage Preview</small><h2 id="salvage-title">{{ salvagePreview.item?.displayName ?? 'Salvage unavailable' }}</h2><template v-if="salvagePreview.ok"><p>Quality: {{ salvagePreview.quality }}</p><h3>Possible Materials</h3><ul><li v-for="material in salvagePreview.possibleMaterials" :key="material.materialItemDefinitionId">{{ material.displayName }} ×{{ material.minimumQuantity }}–{{ material.maximumQuantity }} · {{ Math.round(material.chance * 100) }}%</li></ul><h3>Requirements</h3><p>{{ salvagePreview.requirements.length ? salvagePreview.requirements.map((entry) => entry.required).join(', ') : 'None' }}</p><strong class="danger-text">This item will be permanently destroyed. This cannot be undone.</strong><div><button type="button" @click="pendingSalvageInstanceId = null">Cancel</button><button type="button" class="danger" @click="confirmSalvage">Salvage</button></div></template><p v-else>{{ salvagePreview.message ?? salvagePreview.code }}</p></section>
    </div>

    <div v-if="activeLootReward" class="inventory-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="loot-title">
      <section class="inventory-modal loot-rewards"><small>Loot Rewards</small><h2 id="loot-title">{{ activeLootReward.sourceName }}</h2><h3>Rewards</h3><ul><li v-for="(entry, index) in activeLootReward.entries" :key="`${entry.type}-${index}`"><input v-model="selectedLootEntryIndices" type="checkbox" :value="index" :aria-label="`Select ${entry.displayName}`"><span class="loot-reward-icon" aria-hidden="true">{{ entry.icon }}</span><strong>{{ entry.type === 'gold' ? `${entry.quantity} ${entry.displayName}` : entry.displayName }}</strong><span v-if="entry.type !== 'gold' && entry.quantity > 1"> ×{{ entry.quantity }}</span><small v-if="entry.quality">{{ entry.quality }}</small></li></ul><div class="loot-reward-actions"><button type="button" @click="leaveLoot">Leave</button><button type="button" :disabled="!selectedLootEntryIndices.length" @click="takeSelectedLoot">Take Selected</button><button type="button" @click="takeAllLoot">Take All</button></div></section>
    </div>

    <div v-if="eventResultMessage && !eventSnapshot.activeEvent" class="event-result-message" role="status">
      {{ eventResultMessage }} · Gold: {{ characterState.gold }}
      <button type="button" aria-label="Dismiss event message" @click="eventResultMessage = ''">×</button>
    </div>

    <EncounterOverlay
      v-if="activeEncounterModel && !encounterCoordinator.suspended && !activeLootReward && !combatSnapshot.worldBlocked"
      :model="activeEncounterModel"
      :busy="encounterChoiceBusy"
      :message="encounterUiMessage"
      @execute-choice="executeEncounterUiChoice"
      @continue="continueEncounterUi"
    />

    <EventModal
      v-if="eventSnapshot.activeEvent"
      :event="eventSnapshot.activeEvent"
      :options="eventSnapshot.options"
      :message="eventSnapshot.lastMessage"
      @choose="chooseEventOption"
      @close="closeActiveEvent"
    />

    <CombatView
      v-if="combatSnapshot.activeCombat"
      :combat="combatSnapshot.activeCombat"
      :show-enemy-intent="showEnemyIntent"
      :show-enemy-ai-debug="showEnemyAiDebug"
      @select-initiative="selectCombatInitiative"
      @select-skill="selectCombatSkill"
      @set-block="setDebugBlock"
      @victory="finishTestCombat(COMBAT_RESULT.VICTORY)"
      @return-main-menu="returnToMainMenuAfterDefeat"
      @cancel="cancelTestCombat"
    />

    <div
      v-if="hoveredTile"
      class="tile-tooltip"
      :style="{ left: `${tooltipPosition.x}px`, top: `${tooltipPosition.y}px` }"
    >
      <strong>{{ terrainDetails[hoveredTile.terrain].name }}</strong>
      <span v-if="getPoiState(hoveredTile) === POI_DISCOVERY_STATE.DETECTED">Unknown point of interest</span>
      <span v-else-if="hoveredTile.staticPoiId && isPoiIdentityVisible(hoveredTile)">{{ formatPoiType(staticPoiById.get(hoveredTile.staticPoiId)?.type) }}</span>
      <span v-if="showTravelCosts && hoveredTile.walkable">Travel: {{ calculateTileTravelTime(hoveredTile) / 60 }} hours</span>
      <span :class="{ 'tile-tooltip__visited': visitedTiles.has(hoveredTile.index) }">
        {{ visitedTiles.has(hoveredTile.index) ? 'Visited' : 'Not visited' }}
      </span>
    </div>

    <div
      v-if="showMapIntro"
      class="map-intro"
      role="button"
      tabindex="0"
      aria-label="Close map introduction"
      @click="closeMapIntro"
      @keydown.enter="closeMapIntro"
      @keydown.space.prevent="closeMapIntro"
    >
      <div class="map-intro__dialog">
        <p>Entering</p>
        <h2>Map 1 — Meadows</h2>
        <div class="loading-track" role="progressbar" aria-label="Loading map" aria-valuemin="0" aria-valuemax="100" :aria-valuenow="loadingProgress">
          <div class="loading-fill" :style="{ width: `${loadingProgress}%` }"></div>
        </div>
        <strong>{{ loadingProgress }}%</strong>
        <span v-if="loadingProgress < 100">Loading map…</span>
        <span v-else>Click anywhere to continue</span>
      </div>
    </div>
  </main>
</template>

<style scoped>
.poi-framework-marker{position:absolute;inset:12%;z-index:7;display:grid;place-items:center;border:2px solid #fbbf24;border-radius:50%;background:#111827e6;color:#fde68a;font-size:1.15rem;cursor:pointer}.poi-framework-marker small{position:absolute;top:100%;padding:.1rem .25rem;border-radius:.25rem;background:#020617;color:#fff;font-size:.42rem;white-space:nowrap}.poi-framework-marker--visited{border-color:#60a5fa}.poi-framework-marker--completed{border-color:#34d399}.poi-framework-marker--exhausted{border-color:#94a3b8;opacity:.65}.poi-framework-marker--safe{box-shadow:0 0 0 3px #22c55e99}.poi-framework-marker--combat-pending{border-color:#ef4444;animation:pulse 1s infinite}.poi-framework-marker--loot-pending{border-color:#c084fc}
.game-screen {
  position: relative;
  display: grid;
  grid-template-columns: 18rem minmax(0, 1fr);
  min-height: 100vh;
  background: #020617;
  color: #e2e8f0;
}

.player-panel {
  position: relative;
  z-index: 1;
  padding: 1.5rem;
  border-right: 2px solid #475569;
  background: linear-gradient(180deg, #172033 0%, #0f172a 100%);
  box-shadow: 8px 0 30px rgb(0 0 0 / 35%);
}

.player-header {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid #475569;
}

.player-icon {
  display: grid;
  width: 3.5rem;
  height: 3.5rem;
  place-items: center;
  border: 2px solid #818cf8;
  border-radius: 0.75rem;
  background: #1e293b;
  font-size: 2rem;
}

.panel-caption,
.map-eyebrow {
  color: #a5b4fc;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.player-class {
  margin-top: 0.2rem;
  color: #f8fafc;
  font-size: 1.35rem;
  font-weight: 900;
  text-transform: uppercase;
}

.resource-section {
  display: grid;
  gap: 1.1rem;
  margin-top: 1.75rem;
}

.resource-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.45rem;
  color: #e2e8f0;
  font-size: 0.8rem;
  font-weight: 800;
}

.resource-track {
  height: 0.9rem;
  overflow: hidden;
  border: 1px solid #64748b;
  border-radius: 999px;
  background: #020617;
}

.resource-fill {
  width: 100%;
  height: 100%;
}

.resource-fill--health {
  background: linear-gradient(90deg, #991b1b, #ef4444);
}

.resource-fill--mana {
  background: linear-gradient(90deg, #1e40af, #3b82f6);
}

.stats-section {
  margin-top: 2.25rem;
}

.dev-controls {
  position: absolute;
  right: 1rem;
  bottom: 1rem;
  left: 1rem;
  z-index: 5;
}

.dev-tools-backdrop {
  position: fixed;
  z-index: 200;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: rgb(2 6 23 / 78%);
  backdrop-filter: blur(4px);
}

.dev-tools-window {
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  width: min(58rem, calc(100vw - 2rem));
  max-height: min(48rem, calc(100vh - 2rem));
  overflow: hidden;
  border: 1px solid #64748b;
  border-radius: 0.9rem;
  background: #0b1220;
  box-shadow: 0 1.5rem 5rem rgb(0 0 0 / 55%);
}

.dev-tools-window__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.9rem 1rem;
  border-bottom: 1px solid #334155;
  background: #111827;
}

.dev-tools-window__header small {
  color: #94a3b8;
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.dev-tools-window__header h2 {
  margin: 0.1rem 0 0;
  color: #f8fafc;
  font-size: 1.15rem;
}

.dev-tools-filter {
  display: grid;
  grid-template-columns: minmax(12rem, 1fr) minmax(11rem, 0.65fr) auto auto;
  align-items: end;
  gap: 0.65rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #334155;
  background: #0f172a;
}

.dev-tools-filter label {
  display: grid;
  gap: 0.25rem;
}

.dev-tools-filter label > span {
  color: #94a3b8;
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.dev-tools-filter input,
.dev-tools-filter select {
  width: 100%;
  min-width: 0;
  padding: 0.5rem 0.6rem;
  border: 1px solid #475569;
  border-radius: 0.4rem;
  outline: none;
  background: #020617;
  color: #f8fafc;
  font-size: 0.75rem;
}

.dev-tools-filter input:focus,
.dev-tools-filter select:focus {
  border-color: #818cf8;
  box-shadow: 0 0 0 2px rgb(99 102 241 / 20%);
}

.dev-tools-filter__count {
  padding-bottom: 0.55rem;
  color: #94a3b8;
  font-size: 0.68rem;
  white-space: nowrap;
}

.dev-tools-window .dev-tools-filter__clear {
  white-space: nowrap;
}

.dev-controls__menu > button[hidden],
.dev-controls__menu > .dev-seed[hidden] {
  display: none;
}

.dev-controls__menu {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(11rem, 100%), 1fr));
  grid-auto-rows: minmax(2.75rem, auto);
  align-content: start;
  align-items: stretch;
  gap: 0.45rem;
  padding: 1rem;
  overflow-y: auto;
}

.dev-controls__menu > * {
  min-width: 0;
}

.dev-controls__menu > small,
.dev-controls__menu > .dev-seed,
.dev-controls__menu > .dev-enemy-picker,
.dev-controls__menu > .terrain-stats {
  grid-column: 1 / -1;
}

.dev-controls__menu > small {
  color: #94a3b8;
  font-size: 0.68rem;
  font-weight: 800;
}

.dev-seed {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.35rem;
}

.dev-seed input {
  min-width: 0;
  padding: 0.4rem;
  border: 1px solid #64748b;
  border-radius: 0.35rem;
  background: #020617;
  color: #f8fafc;
  font-size: 0.7rem;
}

.dev-enemy-picker { display: grid; grid-template-columns: minmax(12rem, 0.6fr) minmax(18rem, 1.4fr); gap: 0.5rem; }
.dev-enemy-picker select { min-width: 0; padding: 0.5rem; border: 1px solid #64748b; border-radius: 0.35rem; background: #020617; color: #f8fafc; }
.dev-enemy-picker .terrain-stats { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.dev-enemy-picker .terrain-stats strong { grid-column: 1 / -1; }

.terrain-stats {
  display: grid;
  gap: 0.2rem;
  padding: 0.5rem;
  border-radius: 0.4rem;
  background: #0f172a;
  color: #cbd5e1;
  font-size: 0.65rem;
}

.dev-controls button,
.dev-tools-window button {
  width: 100%;
  min-width: 0;
  min-height: 2.75rem;
  padding: 0.45rem 0.65rem;
  border: 1px solid #64748b;
  border-radius: 0.4rem;
  background: #1e293b;
  color: #e2e8f0;
  font-size: 0.75rem;
  font-weight: 800;
  line-height: 1.25;
  text-align: left;
  overflow-wrap: anywhere;
  white-space: normal;
  transition: background-color 120ms ease, border-color 120ms ease;
}

.dev-controls .dev-controls__toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-style: dashed;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.dev-controls button:hover,
.dev-tools-window button:hover {
  border-color: #a5b4fc;
  background: #334155;
}

.dev-tools-window .dev-controls__reset {
  border-color: #7f1d1d;
  color: #fecaca;
}

.dev-tools-window .dev-tools-window__close {
  display: grid;
  width: 2.25rem;
  height: 2.25rem;
  place-items: center;
  padding: 0;
  border-color: #475569;
  font-size: 1.35rem;
  line-height: 1;
  text-align: center;
}

.dev-controls__menu > select,
.dev-controls__menu > input {
  width: 100%;
  min-width: 0;
  min-height: 2.75rem;
  padding: 0.45rem 0.6rem;
  border: 1px solid #64748b;
  border-radius: 0.4rem;
  background: #020617;
  color: #f8fafc;
}

.dev-controls__menu > pre {
  grid-column: 1 / -1;
  max-width: 100%;
  overflow: auto;
}

.game-screen{display:block;min-height:100vh;overflow:hidden}.player-panel{position:fixed;z-index:40;top:5.5rem;left:1rem;width:min(15rem,calc(100vw - 2rem));max-height:calc(100vh - 12rem);overflow:auto;padding:1rem;border:1px solid #64748b;border-radius:.75rem;background:rgb(15 23 42 / 92%);backdrop-filter:blur(8px);box-shadow:0 1rem 3rem #0009}.player-panel .game-navigation,.player-panel .time-actions{display:none}.player-header{padding-bottom:.75rem}.player-icon{width:2.7rem;height:2.7rem;font-size:1.4rem}.resource-section{gap:.7rem;margin-top:.9rem}.resource-fill--xp{background:linear-gradient(90deg,#92400e,#fbbf24)}.hud-weapon{padding:.55rem;border:1px solid #475569;border-radius:.4rem;background:#020617;font-weight:800}.dev-controls{position:static;margin-top:1rem}.map-section{min-height:100vh;padding:.5rem}.map-frame{height:calc(100vh - 1rem)}.map-header{padding-left:17rem}.hud-action-bar{position:fixed;z-index:80;right:50%;bottom:1rem;display:flex;gap:.45rem;padding:.5rem;border:1px solid #64748b;border-radius:.7rem;background:rgb(2 6 23 / 94%);box-shadow:0 .8rem 2rem #000;transform:translateX(50%);backdrop-filter:blur(8px)}.hud-action-bar button{display:flex;align-items:center;gap:.4rem;padding:.5rem .7rem;border:1px solid #475569;border-radius:.4rem;background:#111827;color:#e2e8f0;cursor:pointer}.hud-action-bar button.active{border-color:#fbbf24;background:#78350f;color:#fff}.hud-action-bar kbd{display:grid;min-width:1.7rem;height:1.7rem;place-items:center;border:1px solid #94a3b8;border-radius:.25rem;background:#020617;font-weight:900}.hud-panel-backdrop{position:fixed;z-index:70;inset:0;display:grid;place-items:center;padding:4rem 1rem 6rem;background:rgb(2 6 23 / 38%);backdrop-filter:blur(2px)}.hud-panel{width:min(58rem,100%);max-height:100%;overflow:hidden;border:1px solid #64748b;border-radius:.8rem;background:rgb(11 18 32 / 97%);box-shadow:0 2rem 5rem #000}.hud-panel>header{display:flex;align-items:center;justify-content:space-between;padding:1rem 1.2rem;border-bottom:1px solid #334155;background:#111827}.hud-panel>header small{color:#a5b4fc;text-transform:uppercase}.hud-panel>header h2{font-size:1.5rem;font-weight:900}.hud-panel>header button{padding:.4rem .65rem;border:1px solid #64748b;border-radius:.35rem;background:#1e293b;color:#fff}.hud-panel__content{max-height:calc(100vh - 13rem);overflow:auto;padding:1rem}.hud-panel__content section{padding:1rem;border:1px solid #334155;border-radius:.55rem;background:#0f172a}.hud-panel__content h3{margin-bottom:.7rem;color:#fbbf24;font-weight:900}.hud-panel__content article{padding:.65rem 0;border-bottom:1px solid #334155}.panel-columns,.character-sheet{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.8rem}.character-sheet dl,.item-details dl{display:grid;grid-template-columns:repeat(2,1fr);gap:.45rem}.character-sheet dl div,.item-details dl div{padding:.5rem;background:#020617}.equipment-slot{display:flex;width:100%;justify-content:space-between;margin:.35rem 0;padding:.65rem;border:1px solid #334155;border-radius:.35rem;background:#020617;color:#e2e8f0}.equipment-slot.filled{border-color:#818cf8}.hud-panel-enter-active,.hud-panel-leave-active{transition:opacity .16s ease}.hud-panel-enter-from,.hud-panel-leave-to{opacity:0}

.equipment-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.65rem}.equipment-grid .equipment-slot{display:grid;grid-template-columns:1fr;gap:.25rem;min-height:8.5rem;margin:0;padding:.45rem;text-align:center}.equipment-grid .equipment-slot.selected{border-color:#fbbf24;box-shadow:0 0 0 2px #92400e}.equipment-slot__image{display:grid;height:5.5rem;place-items:center;overflow:hidden;border:1px solid #334155;border-radius:.3rem;background:linear-gradient(145deg,#111827,#020617)}.equipment-slot__image img{width:100%;height:100%;object-fit:cover}.equipment-slot__image i{color:#64748b;font-size:2.4rem;font-style:normal}.equipment-slot.filled .equipment-slot__image{border-color:#22c55e;background:radial-gradient(circle,#173c25,#020617)}.equipment-slot small{overflow:hidden;color:#94a3b8;font-size:.65rem;text-overflow:ellipsis;white-space:nowrap}.proficiency-category{margin:.5rem 0;border:1px solid #334155;border-radius:.4rem;background:#020617}.proficiency-category summary{display:flex;justify-content:space-between;padding:.7rem;cursor:pointer}.proficiency-category summary span{color:#94a3b8}.proficiency-category article{padding:.65rem .8rem}.equipment-summary{grid-column:1/-1;min-height:max-content}.equipment-summary__list{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.45rem}.equipment-summary__list span{display:flex;flex-direction:column;padding:.5rem;border:1px solid #334155;border-radius:.35rem;background:#020617;color:#94a3b8}.equipment-summary__list b{color:#e2e8f0}.character-sheet{padding-bottom:3rem}

.lp-counter{cursor:help;color:#fde68a}.level-up-backdrop{position:fixed;z-index:260;inset:0;display:grid;place-items:center;padding:1rem;background:rgb(2 6 23 / 78%);backdrop-filter:blur(5px)}.level-up-popup{width:min(28rem,100%);padding:2rem;border:2px solid #fbbf24;border-radius:.8rem;background:linear-gradient(145deg,#1e293b,#0f172a);color:#f8fafc;text-align:center;box-shadow:0 2rem 5rem #000}.level-up-popup small{color:#fbbf24;letter-spacing:.15em;text-transform:uppercase}.level-up-popup h2{margin:.5rem 0;font-size:2rem;font-weight:950}.level-up-popup strong{font-size:1.4rem}.level-up-popup p{margin-top:.55rem}.level-up-popup button{margin-top:1.25rem;padding:.65rem 1.2rem;border:1px solid #fbbf24;border-radius:.4rem;background:#78350f;color:#fff;font-weight:900}

.training-message{position:fixed;z-index:270;top:1rem;left:50%;display:flex;gap:1rem;padding:.75rem 1rem;border:1px solid #22c55e;border-radius:.45rem;background:#052e16;color:#dcfce7;transform:translateX(-50%)}.training-message button{border:0;background:transparent;color:#fff}
.knowledge-notification{position:fixed;z-index:275;top:1rem;right:1rem;width:min(24rem,calc(100vw - 2rem));padding:1rem 2.5rem 1rem 1rem;border:1px solid #a78bfa;border-radius:.6rem;background:#1e1b4b;color:#ede9fe;box-shadow:0 1rem 3rem #000}.knowledge-notification>strong{color:#c4b5fd;text-transform:uppercase}.knowledge-notification h3{margin:.35rem 0;font-size:1.2rem;font-weight:900}.knowledge-notification small{display:block;margin-top:.6rem;color:#ddd6fe}.knowledge-notification button{position:absolute;top:.35rem;right:.45rem;border:0;background:transparent;color:#fff;font-size:1.2rem}

@media (max-width: 760px) {
  .dev-tools-backdrop {
    padding: 0.5rem;
  }

  .dev-tools-window {
    width: calc(100vw - 1rem);
    max-height: calc(100vh - 1rem);
  }

  .dev-tools-filter {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }

  .dev-tools-filter__count,
  .dev-tools-filter__clear {
    align-self: stretch;
  }

  .dev-controls__menu {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    padding: 0.65rem;
  }
}

@media (max-width: 480px) {
  .dev-tools-filter,
  .dev-controls__menu,
  .dev-enemy-picker {
    grid-template-columns: minmax(0, 1fr);
  }
}

.game-navigation {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: .5rem;
  margin-top: auto;
}

.game-navigation button {
  padding: .65rem;
  border: 1px solid #818cf8;
  border-radius: .45rem;
  background: #1e293b;
  color: #fff;
  font-weight: 800;
}

.game-navigation .game-navigation__new { border-color: #f87171; color: #fecaca; }

.time-actions {
  position: relative;
  margin-top: .65rem;
}

.time-actions button {
  width: 100%;
  padding: .55rem .65rem;
  border: 1px solid #64748b;
  border-radius: .45rem;
  background: #1e293b;
  color: #e2e8f0;
  font-size: .72rem;
  font-weight: 800;
  text-align: left;
}

.time-actions__toggle {
  display: flex;
  justify-content: space-between;
}

.time-actions__menu {
  position: absolute;
  z-index: 20;
  top: calc(100% + .35rem);
  right: 0;
  left: 0;
  display: grid;
  max-height: 48vh;
  gap: .3rem;
  padding: .5rem;
  overflow-y: auto;
  border: 1px solid #475569;
  border-radius: .55rem;
  background: #020617;
  box-shadow: 0 12px 28px #000;
}

.time-actions .time-actions__rest { border-color: #34d399; color: #a7f3d0; }

.move-counter { color: #c7d2fe; font-weight: 800; }

.section-title {
  color: #c7d2fe;
  font-size: 0.8rem;
  font-weight: 900;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.stats-list {
  display: grid;
  gap: 0.65rem;
  margin-top: 0.85rem;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0.9rem;
  border: 1px solid #475569;
  border-radius: 0.65rem;
  background: #1e293b;
}

.stat-row dt {
  color: #cbd5e1;
  font-weight: 700;
}

.stat-row dd {
  color: #ffffff;
  font-weight: 900;
}

.map-section {
  min-width: 0;
  padding: 1.5rem;
  overflow: hidden;
  background: radial-gradient(circle at center, #1e293b 0%, #0f172a 50%, #020617 100%);
}

.map-frame {
  position: relative;
  width: 100%;
  height: calc(100vh - 3rem);
  overflow: hidden;
  border: 3px solid #64748b;
  border-radius: 1.25rem;
  background: #111827;
  box-shadow: 0 20px 50px rgb(0 0 0 / 45%);
}

.tile-tooltip {
  position: fixed;
  z-index: 30;
  padding: 0.4rem 0.65rem;
  border: 1px solid #a5b4fc;
  border-radius: 0.4rem;
  background: rgb(15 23 42 / 96%);
  color: #f8fafc;
  font-size: 0.75rem;
  font-weight: 800;
  pointer-events: none;
  box-shadow: 0 8px 18px rgb(0 0 0 / 45%);
}

.tile-tooltip strong,
.tile-tooltip span {
  display: block;
}

.tile-tooltip span {
  margin-top: 0.25rem;
  color: #fca5a5;
  font-size: 0.65rem;
}

.tile-tooltip .tile-tooltip__visited {
  color: #86efac;
}

.tile-inspector {
  position: absolute;
  z-index: 5;
  right: 1rem;
  bottom: 1rem;
  width: min(20rem, calc(100% - 2rem));
  padding: 1rem;
  border: 2px solid #818cf8;
  border-radius: 0.75rem;
  background: rgb(15 23 42 / 96%);
  color: #e2e8f0;
  box-shadow: 0 15px 35px rgb(0 0 0 / 60%);
}

.tile-inspector > button {
  position: absolute;
  top: 0.45rem;
  right: 0.65rem;
  color: #cbd5e1;
  font-size: 1.4rem;
}

.tile-inspector > p {
  color: #a5b4fc;
  font-size: 0.7rem;
  font-weight: 900;
  letter-spacing: 0.15em;
}

.tile-inspector > h3 {
  margin-top: 0.3rem;
  color: #ffffff;
  font-size: 1.25rem;
  font-weight: 900;
}

.tile-inspector > strong,
.tile-inspector > span,
.tile-inspector > small {
  display: block;
  margin-top: 0.45rem;
}

.tile-inspector > strong {
  color: #c7d2fe;
  font-size: 0.75rem;
  text-transform: uppercase;
}

.tile-inspector > span {
  color: #cbd5e1;
  font-size: 0.85rem;
  line-height: 1.45;
}

.tile-inspector > small {
  color: #fca5a5;
  font-weight: 800;
}

.tile-inspector > .tile-inspector__visited {
  color: #86efac;
}

.map-header {
  display: flex;
  height: 5rem;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
  border-bottom: 2px solid #64748b;
  background: #0f172a;
}

.map-header h2 {
  margin-top: 0.15rem;
  color: #f8fafc;
  font-size: 1.5rem;
  font-weight: 900;
}

.world-clock {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: .55rem 1rem;
  border: 1px solid #475569;
  border-radius: .65rem;
  background: #020617;
  color: #e2e8f0;
}

.world-clock strong { color: #f8fafc; }
.world-clock span:last-child { color: #fbbf24; font-weight: 800; }

.map-header__actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.map-header__actions > p {
  color: #94a3b8;
  font-weight: 800;
}

.map-header__actions > button {
  padding: 0.55rem 0.85rem;
  border: 2px solid #818cf8;
  border-radius: 0.55rem;
  background: #312e81;
  color: #f8fafc;
  font-size: 0.75rem;
  font-weight: 800;
  transition: background-color 120ms ease, border-color 120ms ease;
}

.map-header__actions > button:hover {
  border-color: #c7d2fe;
  background: #4338ca;
}

.map-scroll-area {
  position: relative;
  height: calc(100% - 5rem);
  overflow: auto;
  padding: 0;
  background: #16251a;
  cursor: grab;
  touch-action: none;
  user-select: none;
  scrollbar-color: #64748b #0f172a;
  scrollbar-width: thin;
  contain: strict;
  will-change: scroll-position;
}

.map-scroll-area--dragging {
  cursor: grabbing;
}

.map-canvas {
  position: relative;
  overflow: hidden;
  background: #000000;
}

.map-canvas--no-biomes .map-tile:not(.map-tile--hidden) :deep(.world-layer--ground) {
  background: #334155 !important;
}

.map-tile {
  position: absolute;
  display: grid;
  width: var(--tile-size);
  height: var(--tile-size);
  place-items: center;
  border: 1px solid transparent;
  color: #d1fae5;
  font-size: 2rem;
  text-shadow: 0 2px 4px #000000;
  image-rendering: pixelated;
  contain: strict;
  content-visibility: auto;
}

.map-canvas--grid .map-tile {
  border-color: rgb(15 23 42 / 55%);
}

.tile-coordinate {
  position: absolute;
  z-index: 3;
  top: 0.3rem;
  left: 0.35rem;
  padding: 0.12rem 0.28rem;
  border-radius: 0.25rem;
  background: rgb(2 6 23 / 78%);
  color: #f8fafc;
  font-size: clamp(0.55rem, calc(var(--tile-size) * 0.1), 0.75rem);
  font-weight: 900;
  line-height: 1;
  text-shadow: none;
}

.map-tile--adjacent {
  cursor: pointer;
  box-shadow: inset 0 0 0 3px rgb(199 210 254 / 65%);
}

.map-tile--adjacent:hover {
  filter: brightness(1.25);
  box-shadow: inset 0 0 0 4px #c7d2fe;
}

.map-tile--player {
  z-index: 1;
  box-shadow: inset 0 0 0 4px #fbbf24, 0 0 20px rgb(251 191 36 / 65%);
}

.map-tile.map-tile--hidden {
  border-color: #000000 !important;
  background: #000000 !important;
  color: transparent !important;
  box-shadow: inset 0 0 18px #000000 !important;
  filter: none !important;
}

.map-tile.map-tile--hidden .poi-token {
  color: #ffffff !important;
}

.map-tile.map-tile--hidden :deep(.world-layer) {
  visibility: hidden;
}

.map-tile.map-tile--explored {
  border-color: transparent;
  color: #94a39a;
  box-shadow: inset 0 0 0 999px rgb(71 85 75 / 52%);
  filter: none !important;
}

.player-token {
  position: relative;
  z-index: 8;
  display: grid;
  width: 65%;
  height: 65%;
  place-items: center;
  border: 3px solid #fde68a;
  border-radius: 50%;
  background: #1e293b;
  font-size: calc(var(--tile-size) * .38);
  box-shadow: 0 5px 12px rgb(0 0 0 / 65%);
}

.map-canvas--grid .map-tile.map-tile--explored {
  border-color: #26352a;
}

.poi-token {
  position: absolute;
  z-index: 2;
  right: 8%;
  bottom: 7%;
  display: grid;
  width: 40%;
  height: 40%;
  place-items: center;
  border: 2px solid #fde68a;
  border-radius: 50%;
  background: #422006;
  color: #fef3c7;
  font-size: calc(var(--tile-size) * 0.2);
}
.static-poi-token {
  border-color: #c4b5fd;
  background: #312e81;
  color: #f5f3ff;
}

.poi-token.poi-token--detected {
  inset: 0;
  width: 100%;
  height: 100%;
  border: 4px dashed #f8fafc;
  border-radius: 0;
  background: rgb(30 41 59 / 82%);
  color: #ffffff;
  font-size: calc(var(--tile-size) * 0.62);
  font-weight: 1000;
  line-height: 1;
  text-shadow: 0 3px 8px #000000;
  box-shadow: inset 0 0 18px rgb(129 140 248 / 55%);
  pointer-events: none;
}

.map-tile--debug-blocked {
  box-shadow: inset 0 0 0 5px #ef4444 !important;
}

.map-tile--debug-main {
  outline: 3px solid #22c55e;
  outline-offset: -4px;
}

.map-tile--debug-path {
  background: #854d0e !important;
  box-shadow: inset 0 0 0 6px #facc15 !important;
}

.map-tile--debug-boundary {
  outline: 2px solid #f472b6;
  outline-offset: -2px;
}

.map-tile--debug-pass {
  box-shadow: inset 0 0 0 4px #facc15 !important;
}
.map-tile--debug-road { box-shadow: inset 0 0 0 5px #f59e0b !important; }
.map-tile--debug-influence { outline: 3px solid #a3e635; outline-offset: -4px; }
.map-tile--debug-connection { background: #92400e !important; }
.map-tile--debug-bridge { box-shadow: inset 0 0 0 7px #38bdf8 !important; }
.map-tile--debug-city { outline: 4px solid #c084fc; outline-offset: -5px; }
.map-tile--debug-village { outline: 4px solid #fb7185; outline-offset: -5px; }
.map-tile--debug-zone-civilization { box-shadow: inset 0 0 0 4px rgb(250 204 21 / 70%) !important; }
.map-tile--debug-zone-frontier { box-shadow: inset 0 0 0 4px rgb(249 115 22 / 70%) !important; }
.map-tile--debug-zone-wilds { box-shadow: inset 0 0 0 4px rgb(34 197 94 / 70%) !important; }
.map-tile--debug-zone-bossRegion { box-shadow: inset 0 0 0 5px rgb(220 38 38 / 85%) !important; }
.map-tile--debug-start { outline: 7px solid #22d3ee !important; outline-offset: -8px; }
.map-tile--debug-boss { outline: 7px solid #ef4444 !important; outline-offset: -8px; }
.map-tile--debug-sector { outline: 2px solid #22d3ee; outline-offset: -2px; }
.map-tile--debug-edge { box-shadow: inset 0 0 0 4px rgb(168 85 247 / 65%) !important; }
.map-tile--debug-empty-sector { background: #7f1d1d !important; }
.map-tile--debug-density::after {
  position: absolute;
  inset: 0;
  background: rgb(239 68 68 / var(--density-alpha));
  content: '';
  pointer-events: none;
}

.zoom-indicator {
  position: sticky;
  right: 1rem;
  bottom: 1rem;
  float: right;
  padding: 0.5rem 0.75rem;
  border: 1px solid #64748b;
  border-radius: 0.5rem;
  background: rgb(15 23 42 / 92%);
  color: #e2e8f0;
  font-size: 0.75rem;
  font-weight: 800;
  pointer-events: none;
}

.map-tile--grassland {
  background: #416b3b;
}

.map-tile--flower_field {
  background: #4d7844;
  color: #fde68a;
}

.map-tile--tall_grass {
  background: #52733a;
  color: #bef264;
}

.map-tile--forest {
  background: #355b37;
  color: #bbf7d0;
}

.map-tile--rocky_hills {
  background: #4b5563;
  color: #d1d5db;
}

.map-tile--lake {
  background: #1d4e72;
  color: #bae6fd;
}

.map-tile--sea {
  border-color: #164e63;
  background: #075985;
  color: #bae6fd;
}

.map-tile--mountains {
  border-color: #3f3f46;
  background: #52525b;
  color: #e4e4e7;
}
.map-tile--river { background: #2563a5; color: #bfdbfe; }
.map-tile--road, .map-tile--city_street { background: #8b6b45; color: #f5deb3; }
.map-tile--gravel_road { background: #756b58; color: #e7ddc8; }
.map-tile--wooden_bridge { background: #76502f; color: #f5d0a9; }
.map-tile--debug-gravel { box-shadow: inset 0 0 0 5px #fbbf24 !important; }
.map-tile--debug-wooden-bridge { box-shadow: inset 0 0 0 7px #22d3ee !important; }
.map-tile--debug-road-start { outline: 7px solid #22c55e !important; outline-offset: -8px; }
.map-tile--debug-road-target { outline: 7px solid #f472b6 !important; outline-offset: -8px; }
.map-tile--debug-poi-detection { outline: 3px solid #38bdf8 !important; outline-offset: -4px; }
.map-tile--debug-poi-identification { box-shadow: inset 0 0 0 5px rgb(250 204 21 / 70%) !important; }
.tile-travel-cost {
  position: absolute;
  right: 2px;
  bottom: 1px;
  z-index: 4;
  padding: 0 2px;
  border-radius: 2px;
  background: rgb(2 6 23 / 82%);
  color: #f8fafc;
  font-size: 9px;
  line-height: 1.2;
}

.event-result-message {
  position: fixed;
  z-index: 90;
  right: 1.25rem;
  bottom: 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.8rem 1rem;
  border: 1px solid #facc15;
  border-radius: 0.5rem;
  background: #111827;
  color: #fef3c7;
  box-shadow: 0 12px 32px #000;
}
.map-tile--bridge { background: #9a6b32; color: #e0f2fe; }
.map-tile--farm { background: #9a7b36; color: #fef08a; }
.map-tile--city_wall { background: #4b5563; color: #e5e7eb; }
.map-tile--city_gate { background: #6b4f32; color: #fde68a; }
.map-tile--city_market { background: #a16207; color: #fef3c7; }
.map-tile--city_residential { background: #7c5b45; color: #ffedd5; }
.map-tile--village_house { background: #76543a; color: #fed7aa; }
.map-tile--village_square { background: #9a7247; color: #fef3c7; }
.map-tile--inn { background: #7f1d1d; color: #fde68a; }
.map-tile--ruins { background: #57534e; color: #d6d3d1; }
.map-tile--bandit_camp { background: #713f12; color: #fca5a5; }
.map-tile--shrine { background: #6d28d9; color: #f5d0fe; }
.map-tile--cave { background: #27272a; color: #d4d4d8; }

.map-tile--blocked {
  cursor: not-allowed;
}

.map-intro {
  position: absolute;
  z-index: 10;
  inset: 0;
  display: grid;
  padding: 1.5rem;
  cursor: pointer;
  place-items: center;
  background: rgb(2 6 23 / 92%);
}

.map-intro__dialog {
  width: min(100%, 36rem);
  padding: 3rem 2rem;
  border: 2px solid #a5b4fc;
  border-radius: 1rem;
  background: #0f172a;
  box-shadow: 0 25px 60px #000000;
  text-align: center;
}

.map-intro__dialog p {
  color: #a5b4fc;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.35em;
  text-transform: uppercase;
}

.map-intro__dialog h2 {
  margin-top: 1rem;
  color: #f8fafc;
  font-size: clamp(2.3rem, 6vw, 3.75rem);
  font-weight: 900;
}

.map-intro__dialog span {
  display: block;
  margin-top: 2rem;
  color: #94a3b8;
  font-size: 0.85rem;
}

.loading-track {
  height: 0.9rem;
  margin-top: 2rem;
  overflow: hidden;
  border: 1px solid #64748b;
  border-radius: 999px;
  background: #020617;
}

.loading-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #4338ca, #818cf8);
  transition: width 80ms linear;
}

.map-intro__dialog strong {
  display: block;
  margin-top: 0.55rem;
  color: #c7d2fe;
  font-size: 0.8rem;
}

@media (max-width: 760px) {
  .player-panel{top:4.5rem;left:.5rem;width:12rem;max-height:10rem;padding:.65rem}.player-panel .resource-section{grid-template-columns:repeat(2,1fr)}.player-panel .player-header,.player-panel .hud-weapon{display:none}.map-header{padding-left:0}.hud-action-bar{bottom:.4rem;width:calc(100vw - .8rem);justify-content:center;gap:.2rem;padding:.3rem}.hud-action-bar button{flex-direction:column;gap:.1rem;padding:.3rem;font-size:.65rem}.hud-action-bar kbd{min-width:1.35rem;height:1.35rem}.panel-columns,.character-sheet{grid-template-columns:1fr}.hud-panel-backdrop{padding:2rem .5rem 4.5rem}.hud-panel__content{max-height:calc(100vh - 9rem)}

  .map-section {
    padding: 1rem;
  }

  .map-frame {
    height: calc(100vh - 2rem);
  }

}
.item-database-preview{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.45rem}.item-database-preview button{display:grid;grid-template-columns:auto 1fr;gap:.15rem .5rem;align-items:center;padding:.55rem;border:1px solid #334155;border-radius:.35rem;background:#020617;color:#e2e8f0;text-align:left}.item-database-preview button.selected{border-color:#818cf8;background:#1e1b4b}.item-database-preview button span{grid-row:1/3;font-size:1.5rem}.item-database-preview button small{color:#94a3b8}
.inventory-panel{display:grid;grid-template-columns:minmax(20rem,1.4fr) minmax(18rem,1fr);gap:.8rem}.inventory-toolbar{grid-column:1/-1;display:grid;grid-template-columns:1fr minmax(12rem,2fr) 1fr 1fr;align-items:end;gap:.7rem}.inventory-toolbar>div{display:flex;align-items:center;justify-content:space-between}.inventory-toolbar label{display:grid;gap:.25rem;color:#94a3b8;font-size:.75rem;font-weight:800}.inventory-toolbar input,.inventory-toolbar select{width:100%;padding:.55rem;border:1px solid #475569;border-radius:.35rem;background:#020617;color:#e2e8f0}.inventory-list{display:grid;align-content:start;grid-template-columns:repeat(2,minmax(0,1fr));gap:.45rem}.inventory-list article{position:relative;padding:0;border:1px solid #334155!important;border-radius:.4rem;background:#020617}.inventory-list article.selected{border-color:#fbbf24!important}.inventory-list article>button{display:grid;width:100%;grid-template-columns:auto 1fr auto;gap:.25rem .55rem;align-items:center;padding:.65rem;text-align:left;color:#e2e8f0}.inventory-list article>button span{grid-row:1/3;font-size:1.35rem;color:#fbbf24}.inventory-list article>button small{grid-column:2;color:#94a3b8}.inventory-list article>button b{grid-column:3;grid-row:1/3}.inventory-context{position:absolute;z-index:4;top:80%;right:.3rem;display:grid;min-width:9rem;padding:.35rem;border:1px solid #64748b;border-radius:.4rem;background:#111827;box-shadow:0 1rem 2rem #000}.inventory-context button{padding:.4rem;text-align:left;color:#e2e8f0}.inventory-context button:hover{background:#334155}.inventory-context button:disabled{opacity:.35}.inventory-modal-backdrop{position:fixed;z-index:150;inset:0;display:grid;place-items:center;padding:1rem;background:#020617cc}.inventory-modal{width:min(28rem,100%);padding:1.4rem;border:1px solid #818cf8;border-radius:.7rem;background:#0f172a;box-shadow:0 2rem 5rem #000}.inventory-modal h2{margin:.25rem 0 .8rem;font-size:1.5rem;font-weight:900}.inventory-modal>div{display:flex;justify-content:flex-end;gap:.6rem;margin-top:1rem}.inventory-modal button{padding:.6rem 1rem;border:1px solid #64748b;border-radius:.35rem;background:#1e293b;color:#fff}.inventory-modal button.danger{border-color:#ef4444;background:#7f1d1d}.loot-rewards small{color:#fbbf24;font-weight:900;text-transform:uppercase}.loot-rewards ul{margin:1rem 0;padding-left:1.2rem;list-style:disc}.loot-rewards>button{width:100%;border-color:#fbbf24;background:#78350f;font-weight:900}@media(max-width:760px){.inventory-panel{grid-template-columns:1fr}.inventory-toolbar{grid-template-columns:1fr 1fr}.inventory-list{grid-template-columns:1fr}}
.merchant-backdrop{position:fixed;z-index:220;inset:0;display:grid;place-items:center;padding:1rem;background:#020617df}.merchant-window{display:grid;width:min(96rem,98vw);height:min(58rem,95vh);grid-template-rows:auto auto 1fr auto;overflow:hidden;border:1px solid #a78bfa;border-radius:.8rem;background:#0b1220;color:#e2e8f0;box-shadow:0 2rem 6rem #000}.merchant-header{display:flex;justify-content:space-between;gap:2rem;padding:1rem 1.3rem;border-bottom:1px solid #334155;background:#111827}.merchant-header>div{display:grid;gap:.25rem}.merchant-header h2{font-size:1.5rem;font-weight:900}.merchant-header small{color:#fbbf24}.merchant-header button,.merchant-summary button,.merchant-row>button:last-child{padding:.45rem .7rem;border:1px solid #64748b;border-radius:.35rem;background:#1e293b}.merchant-message{padding:.5rem 1rem;background:#312e81;color:#fff}.merchant-layout{display:grid;min-height:0;grid-template-columns:1.2fr .8fr 1.2fr;gap:.7rem;padding:.8rem}.merchant-layout>section{overflow:auto;padding:.7rem;border:1px solid #334155;border-radius:.5rem;background:#0f172a}.merchant-layout h3,.merchant-summary h3{margin-bottom:.5rem;color:#fbbf24;font-weight:900}.merchant-toolbar{display:grid;grid-template-columns:2fr 1fr 1fr;gap:.35rem;margin-bottom:.6rem}.merchant-toolbar input,.merchant-toolbar select,.merchant-row input[type=number]{min-width:0;padding:.4rem;border:1px solid #475569;border-radius:.3rem;background:#020617;color:#fff}.merchant-row{display:grid;grid-template-columns:auto 1fr 4rem auto;gap:.4rem;align-items:center;padding:.45rem;border-bottom:1px solid #263449}.merchant-row>button:nth-child(2){display:grid;text-align:left}.merchant-row small{color:#94a3b8}.merchant-summary{display:grid;grid-template-columns:1fr 1fr 1fr;gap:.8rem;padding:.8rem 1rem;border-top:1px solid #334155;background:#111827}.merchant-summary>div{display:grid;gap:.35rem}.merchant-summary button:disabled,.merchant-row button:disabled{opacity:.4}@media(max-width:900px){.merchant-layout{grid-template-columns:1fr}.merchant-window{overflow:auto}.merchant-summary{grid-template-columns:1fr}}
</style>
