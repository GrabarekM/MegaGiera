export function getTileAt(map, row, column) {
  if (!map || !Array.isArray(map.tiles) || !Number.isInteger(map.rows) || !Number.isInteger(map.columns)) return null
  if (!Number.isInteger(row) || !Number.isInteger(column)) return null
  if (row < 0 || column < 0 || row >= map.rows || column >= map.columns) return null
  return map.tiles[row * map.columns + column] ?? null
}

export function canPlayerEnterTile(map, row, column) {
  return getTileAt(map, row, column)?.walkable === true
}

export function resolveMovementIntent(map, position, deltaRow, deltaColumn) {
  if (!position || !Number.isInteger(position.row) || !Number.isInteger(position.column)) {
    return { moved: false, reason: 'invalid-position', position: null, tile: null }
  }
  const row = position.row + deltaRow
  const column = position.column + deltaColumn
  const tile = getTileAt(map, row, column)
  if (!tile) return { moved: false, reason: 'outside-map', position: { ...position }, tile: null }
  if (tile.walkable !== true) return { moved: false, reason: 'blocked', position: { ...position }, tile }
  return { moved: true, reason: null, position: { row, column }, tile }
}
