<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, shallowReactive } from 'vue'
import { findPath, generateMeadowsRegion, MEADOWS_GENERATION_CONFIG, POI, poiIcons, terrainDetails, terrainIcons } from '../data/maps.js'
import { calculateTileTravelTime } from '../data/travelConfig.js'
import { STATIC_POI_CONFIG, STATIC_POI_ICONS } from '../data/staticPoiConfig.js'
import { calculateFollowScroll } from '../utils/camera.js'
import EventModal from '../components/EventModal.vue'
import { EventManager } from '../engine/events/eventManager.js'
import { enginePreviewEvent } from '../data/events/enginePreviewEvent.js'
import { cloneCharacterState, createCharacterState, restoreCharacterState } from '../game/characterState.js'
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
})

const emit = defineEmits(['ready', 'save-state', 'main-menu', 'new-run'])

const currentSeed = ref(props.run.seed)
// The map contains 10,000 tiles. Deeply proxying every tile can block the first
// render when Menu 3 is opened, so only the map's top-level properties are reactive.
const meadowsMap = shallowReactive(generateMeadowsRegion(currentSeed.value))
const initialPlayerPosition = {
  row: props.run.playerPosition.row,
  column: props.run.playerPosition.column,
}

const showMapIntro = ref(true)
const loadingProgress = ref(0)
let loadingAnimationFrame = null
const fogEnabled = ref(true)
const showTimeActions = ref(false)
const showDevTools = ref(false)
const showCoordinates = ref(false)
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
const exploredTiles = reactive(new Set(props.run.discovered))
const visitedTiles = reactive(new Set(props.run.visited))
const timeState = ref({ ...props.run.time })
const poiDiscovery = reactive({ ...(props.run.poiDiscovery ?? {}) })
const characterState = reactive(restoreCharacterState(props.run.characterState, createCharacterState({
  id: `character-${props.run.runId}`,
  name: 'Hero',
  characterClass: props.run.characterId,
})))
const eventResultMessage = ref('')
const eventManager = new EventManager({
  getGold: () => characterState.gold,
  changeGold: (amount) => { characterState.gold = Math.max(0, characterState.gold + amount) },
  getFlag: (key) => characterState.flags[key],
  setFlag: (key, value) => { characterState.flags[key] = value },
  advanceTime: ({ hours, minutes }) => {
    timeState.value = advanceTime(timeState.value, minutes === undefined
      ? { hours, reason: 'event' }
      : { minutes, reason: 'event' })
  },
  showMessage: (message) => { eventResultMessage.value = message },
}, [enginePreviewEvent])
const eventSnapshot = ref(eventManager.getSnapshot())
const unsubscribeEventManager = eventManager.subscribe((snapshot) => { eventSnapshot.value = snapshot })
const moveCount = computed(() => timeState.value.moveCount)
const currentTimeOfDay = computed(() => getTimeOfDay(timeState.value.hour, timeState.value.minute ?? 0))
const currentTimeDetails = computed(() => TIME_OF_DAY_DETAILS[currentTimeOfDay.value])
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
  return meadowsMap.tiles[index].walkable
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
  const next = advancePoiDiscovery(poiRecords.value, poiDiscovery, playerPosition.value)
  for (const key of Object.keys(poiDiscovery)) delete poiDiscovery[key]
  Object.assign(poiDiscovery, next)
}

function movePlayerTo(index) {
  if (eventSnapshot.value.movementBlocked) return
  if (didDragMap) {
    didDragMap = false
    return
  }

  if (!canMoveTo(index)) return

  playerPosition.value = {
    row: Math.floor(index / meadowsMap.columns),
    column: index % meadowsMap.columns,
  }
  visitedTiles.add(index)
  meadowsMap.tiles[index].visited = true
  revealTilesAroundPlayer()
  updatePoiDiscovery()
  timeState.value = advanceMovementTime(timeState.value, calculateTileTravelTime(meadowsMap.tiles[index]))
  saveProgress()
  followPlayerCamera()
}

function movePlayerBy(deltaRow, deltaColumn) {
  if (eventSnapshot.value.movementBlocked) return
  const nextRow = playerPosition.value.row + deltaRow
  const nextColumn = playerPosition.value.column + deltaColumn

  if (
    nextRow < 0 ||
    nextRow >= meadowsMap.rows ||
    nextColumn < 0 ||
    nextColumn >= meadowsMap.columns
  ) return

  const nextIndex = nextRow * meadowsMap.columns + nextColumn
  if (!isTilePassable(nextIndex)) return

  playerPosition.value = { row: nextRow, column: nextColumn }
  visitedTiles.add(nextIndex)
  meadowsMap.tiles[nextIndex].visited = true
  revealTilesAroundPlayer()
  updatePoiDiscovery()
  timeState.value = advanceMovementTime(timeState.value, calculateTileTravelTime(meadowsMap.tiles[nextIndex]))
  saveProgress()
  followPlayerCamera()
}

function saveProgress() {
  emit('save-state', {
    playerPosition: { ...playerPosition.value },
    time: { ...timeState.value },
    discovered: [...exploredTiles],
    visited: [...visitedTiles],
    poiDiscovery: { ...poiDiscovery },
    characterState: cloneCharacterState(characterState),
  })
}

function performWaitHours(hours) {
  if (eventSnapshot.value.movementBlocked) return
  timeState.value = waitHours(timeState.value, hours)
  saveProgress()
}

function performWaitUntil(period) {
  if (eventSnapshot.value.movementBlocked) return
  timeState.value = waitUntilTimeOfDay(timeState.value, period)
  saveProgress()
}

function performRest() {
  if (eventSnapshot.value.movementBlocked) return
  timeState.value = restHours(timeState.value, 6)
  saveProgress()
}

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

function handleMovementKey(event) {
  if (showMapIntro.value) return

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
  window.addEventListener('keydown', handleMovementKey)
  window.addEventListener('resize', scheduleViewportUpdate)
})

onBeforeUnmount(() => {
  saveProgress()
  unsubscribeEventManager()
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
          <p>{{ characterState.class }}</p>
        </div>
      </header>

      <section class="game-navigation" aria-label="Game navigation">
        <button data-testid="game-main-menu" type="button" @click="$emit('main-menu')">Main Menu</button>
        <button data-testid="game-new-run" type="button" class="game-navigation__new" @click="$emit('new-run')">New Run</button>
      </section>

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
        </div>
      </section>

      <section class="resource-section" aria-label="Player resources">
        <div class="move-counter">Moves <strong>{{ moveCount }}</strong></div>
        <div class="move-counter">Level <strong>{{ characterState.level }}</strong></div>
        <div class="move-counter">Gold <strong>{{ characterState.gold }}</strong></div>
        <div>
          <div class="resource-label">
            <span>HP</span>
            <span>{{ characterState.health.current }} / {{ characterState.health.max }}</span>
          </div>
          <div class="resource-track">
            <div class="resource-fill resource-fill--health"></div>
          </div>
        </div>

      </section>

      <section class="stats-section" aria-labelledby="stats-heading">
        <h2 id="stats-heading" class="section-title">Stats</h2>
        <dl class="stats-list">
          <div class="stat-row"><dt>Might</dt><dd>{{ characterState.stats.might }}</dd></div>
          <div class="stat-row"><dt>Agility</dt><dd>{{ characterState.stats.agility }}</dd></div>
          <div class="stat-row"><dt>Wits</dt><dd>{{ characterState.stats.wits }}</dd></div>
          <div class="stat-row"><dt>Will</dt><dd>{{ characterState.stats.will }}</dd></div>
        </dl>
      </section>

      <section class="dev-controls" aria-label="Developer tools">
        <button
          type="button"
          class="dev-controls__toggle"
          :aria-expanded="showDevTools"
          @click="showDevTools = !showDevTools"
        >
          <span>Dev Tools</span>
          <span aria-hidden="true">{{ showDevTools ? '−' : '+' }}</span>
        </button>
        <div v-if="showDevTools" class="dev-controls__menu">
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
        <button type="button" @click="showSettlementInfluence = !showSettlementInfluence">Settlement Influence: {{ showSettlementInfluence ? 'On' : 'Off' }}</button>
        <button type="button" @click="showRoadConnections = !showRoadConnections">Road Connections: {{ showRoadConnections ? 'On' : 'Off' }}</button>
        <button type="button" @click="showBridges = !showBridges">Bridges: {{ showBridges ? 'On' : 'Off' }}</button>
        <button type="button" @click="showCityBounds = !showCityBounds">City Bounds: {{ showCityBounds ? 'On' : 'Off' }}</button>
        <button type="button" @click="showVillageBounds = !showVillageBounds">Village Bounds: {{ showVillageBounds ? 'On' : 'Off' }}</button>
        <button type="button" @click="showRegionZones = !showRegionZones">Region Zones: {{ showRegionZones ? 'On' : 'Off' }}</button>
        <button type="button" @click="showStartPosition = !showStartPosition">Start Position: {{ showStartPosition ? 'On' : 'Off' }}</button>
        <button type="button" @click="showBossPosition = !showBossPosition">Boss Position: {{ showBossPosition ? 'On' : 'Off' }}</button>
        <button type="button" @click="showSectorGrid = !showSectorGrid">Sector Grid: {{ showSectorGrid ? 'On' : 'Off' }}</button>
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
    </aside>

    <section class="map-section" aria-label="Game map">
      <div class="map-frame">
        <header class="map-header">
          <div>
            <p class="map-eyebrow">Map 1</p>
            <h2>{{ meadowsMap.name }}</h2>
          </div>
          <div class="world-clock" aria-label="World time">
            <strong>Day {{ timeState.day }}</strong>
            <span>{{ formatHour(timeState.hour, timeState.minute ?? 0) }}</span>
            <span>{{ currentTimeDetails.icon }} {{ currentTimeDetails.label }}</span>
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
            :class="{ 'map-canvas--no-biomes': !showBiomeColors }"
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
              <span v-if="showCoordinates" class="tile-coordinate" aria-hidden="true">
                {{ tile.column + 1 }},{{ tile.row + 1 }}
              </span>
              <span v-if="showTravelCosts && tile.walkable" class="tile-travel-cost">{{ calculateTileTravelTime(tile) / 60 }}h</span>
              <span v-if="tile.index === playerTileIndex" class="player-token" aria-label="Player">
                {{ character.icon }}
              </span>
              <span v-else-if="(!fogEnabled || isTileExplored(tile.index)) && (!getPoiState(tile) || isPoiIdentityVisible(tile))" aria-hidden="true">{{ terrainIcons[tile.terrain] }}</span>
              <span
                v-if="getPoiState(tile) === POI_DISCOVERY_STATE.DETECTED"
                class="poi-token poi-token--detected"
                title="Unknown point of interest"
              >
                ?
              </span>
              <span
                v-else-if="isPoiIdentityVisible(tile)"
                class="poi-token"
                :class="{ 'static-poi-token': tile.staticPoiId }"
                :title="tile.staticPoiId ? staticPoiById.get(tile.staticPoiId)?.type : tile.pointOfInterest"
              >
                {{ tile.staticPoiId ? STATIC_POI_ICONS[staticPoiById.get(tile.staticPoiId)?.category] : (poiIcons[tile.pointOfInterest] ?? '•') }}
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

    <div v-if="eventResultMessage && !eventSnapshot.activeEvent" class="event-result-message" role="status">
      {{ eventResultMessage }} · Gold: {{ characterState.gold }}
      <button type="button" aria-label="Dismiss event message" @click="eventResultMessage = ''">×</button>
    </div>

    <EventModal
      v-if="eventSnapshot.activeEvent"
      :event="eventSnapshot.activeEvent"
      :options="eventSnapshot.options"
      :message="eventSnapshot.lastMessage"
      @choose="chooseEventOption"
      @close="closeActiveEvent"
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
  display: grid;
  gap: 0.45rem;
  padding: 0.75rem;
  border: 1px dashed #64748b;
  border-radius: 0.75rem;
  background: rgb(2 6 23 / 72%);
  max-height: 48vh;
  overflow-y: auto;
}

.dev-controls__menu {
  display: grid;
  gap: 0.45rem;
  padding-top: 0.3rem;
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

.terrain-stats {
  display: grid;
  gap: 0.2rem;
  padding: 0.5rem;
  border-radius: 0.4rem;
  background: #0f172a;
  color: #cbd5e1;
  font-size: 0.65rem;
}

.dev-controls button {
  padding: 0.45rem 0.65rem;
  border: 1px solid #64748b;
  border-radius: 0.4rem;
  background: #1e293b;
  color: #e2e8f0;
  font-size: 0.75rem;
  font-weight: 800;
  text-align: left;
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

.dev-controls button:hover {
  border-color: #a5b4fc;
  background: #334155;
}

.dev-controls .dev-controls__reset {
  border-color: #7f1d1d;
  color: #fecaca;
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

.map-canvas--no-biomes .map-tile:not(.map-tile--hidden) {
  background: #334155 !important;
}

.map-tile {
  position: absolute;
  display: grid;
  width: var(--tile-size);
  height: var(--tile-size);
  place-items: center;
  border: 1px solid rgb(15 23 42 / 55%);
  color: #d1fae5;
  font-size: 2rem;
  text-shadow: 0 2px 4px #000000;
  contain: strict;
  content-visibility: auto;
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

.poi-token--detected {
  border-color: #f8fafc;
  background: #1e293b;
  color: #ffffff;
  font-weight: 1000;
}

.map-tile.map-tile--explored {
  border-color: #26352a;
  color: #94a39a;
  box-shadow: inset 0 0 0 999px rgb(71 85 75 / 52%);
  filter: none !important;
}

.player-token {
  display: grid;
  width: 65%;
  height: 65%;
  place-items: center;
  border: 3px solid #fde68a;
  border-radius: 50%;
  background: #1e293b;
  font-size: calc(var(--tile-size) * 0.38);
  box-shadow: 0 5px 12px rgb(0 0 0 / 65%);
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
  .game-screen {
    grid-template-columns: 1fr;
  }

  .player-panel {
    border-right: 0;
    border-bottom: 2px solid #475569;
  }

  .map-section {
    padding: 1rem;
  }

  .map-frame {
    height: 75vh;
  }

}
</style>
