export function calculateFollowScroll({
  scrollLeft,
  scrollTop,
  viewportWidth,
  viewportHeight,
  contentWidth,
  contentHeight,
  playerCenterX,
  playerCenterY,
  safeZoneRatio = 0.28,
}) {
  const safeLeft = scrollLeft + viewportWidth * safeZoneRatio
  const safeRight = scrollLeft + viewportWidth * (1 - safeZoneRatio)
  const safeTop = scrollTop + viewportHeight * safeZoneRatio
  const safeBottom = scrollTop + viewportHeight * (1 - safeZoneRatio)
  let left = scrollLeft
  let top = scrollTop

  if (playerCenterX < safeLeft) left = playerCenterX - viewportWidth * safeZoneRatio
  else if (playerCenterX > safeRight) left = playerCenterX - viewportWidth * (1 - safeZoneRatio)

  if (playerCenterY < safeTop) top = playerCenterY - viewportHeight * safeZoneRatio
  else if (playerCenterY > safeBottom) top = playerCenterY - viewportHeight * (1 - safeZoneRatio)

  return {
    left: Math.min(Math.max(0, left), Math.max(0, contentWidth - viewportWidth)),
    top: Math.min(Math.max(0, top), Math.max(0, contentHeight - viewportHeight)),
  }
}
