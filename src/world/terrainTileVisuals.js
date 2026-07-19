const grasslandsAtlasUrl = new URL('../assets/tilesets/01-grasslands-tileset.png', import.meta.url).href
const flowerFieldsAtlasUrl = new URL('../assets/tilesets/02-flower-fields-tileset.png', import.meta.url).href
const meadowsAtlasUrl = new URL('../assets/tilesets/03-meadows-tileset.png', import.meta.url).href
const tallGrassAtlasUrl = new URL('../assets/tilesets/04-tall-grass-tileset.png', import.meta.url).href

const ATLAS_WIDTH = 1536
const ATLAS_HEIGHT = 1024

function gridRects(columns, rows, { startX, startY, stepX, stepY, width, height }) {
  return Array.from({ length: columns * rows }, (_, index) => ({
    x: startX + (index % columns) * stepX,
    y: startY + Math.floor(index / columns) * stepY,
    width,
    height,
  }))
}

const GRASSLAND_RECTS = gridRects(5, 2, {
  startX: 17, startY: 69, stepX: 96, stepY: 91, width: 86, height: 78,
})
const FLOWER_FIELD_RECTS = gridRects(8, 5, {
  startX: 16, startY: 64, stepX: 96, stepY: 88, width: 86, height: 78,
})
const MEADOW_RECTS = gridRects(8, 4, {
  startX: 16, startY: 63, stepX: 96, stepY: 90, width: 86, height: 78,
})
const TALL_GRASS_RECTS = gridRects(8, 4, {
  startX: 16, startY: 61, stepX: 96, stepY: 90, width: 86, height: 78,
})

const TERRAIN_ATLASES = {
  grassland: [
    { url: grasslandsAtlasUrl, rects: GRASSLAND_RECTS },
    { url: meadowsAtlasUrl, rects: MEADOW_RECTS },
  ],
  flower_field: [{ url: flowerFieldsAtlasUrl, rects: FLOWER_FIELD_RECTS }],
  tall_grass: [{ url: tallGrassAtlasUrl, rects: TALL_GRASS_RECTS }],
}

function hashString(value) {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export function getTerrainTileVisual(tile, seed = '') {
  const atlases = TERRAIN_ATLASES[tile?.terrain]
  if (!atlases?.length) return null

  const hash = hashString(`${seed}:${tile.index}:${tile.terrain}`)
  const atlas = atlases[hash % atlases.length]
  const rect = atlas.rects[Math.floor(hash / atlases.length) % atlas.rects.length]
  return { atlasUrl: atlas.url, rect }
}

export function getTerrainTileStyle(tile, tileSize, seed = '') {
  const visual = getTerrainTileVisual(tile, seed)
  if (!visual || !Number.isFinite(tileSize) || tileSize <= 0) return {}

  const scaleX = tileSize / visual.rect.width
  const scaleY = tileSize / visual.rect.height
  return {
    backgroundImage: `url("${visual.atlasUrl}")`,
    backgroundPosition: `${-visual.rect.x * scaleX}px ${-visual.rect.y * scaleY}px`,
    backgroundSize: `${ATLAS_WIDTH * scaleX}px ${ATLAS_HEIGHT * scaleY}px`,
    backgroundRepeat: 'no-repeat',
  }
}

export const SUPPORTED_TERRAIN_TILE_VISUALS = Object.freeze(Object.keys(TERRAIN_ATLASES))
