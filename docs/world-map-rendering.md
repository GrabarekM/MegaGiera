# World map rendering

The world generator owns gameplay data. The renderer only converts each existing tile into a deterministic presentation model; it must never change terrain, walkability, POIs, paths, encounters, saves, camera state, zoom, or tile dimensions.

## Layer contract

Layers are ordered as: Ground, Transitions, Roads, Details, Objects, Trees, Buildings, POI, Player, Effects, UI. `worldRenderDefinitions.js` contains terrain, road, and object metadata. `worldTilePresentation.js` resolves neighbor-aware transitions and road connections. `WorldTileLayers.vue` draws those resolved layers. `MenuThree.vue` keeps viewport virtualization, interaction, fog, movement highlights, player placement, and UI.

## Adding final assets

1. Add an atlas URL and crop rectangles to `terrainTileVisuals.js` for ground variants.
2. Add or update the terrain entry in `worldRenderDefinitions.js`. Keep identifiers aligned with generated terrain values.
3. Replace the matching CSS placeholder in `WorldTileLayers.vue` with an atlas crop or a dedicated sprite component. Do not add terrain-specific conditions to `MenuThree.vue`.
4. Preserve deterministic selection by using the presentation resolver's seed and tile index.
5. Add transition and road masks to definitions instead of modifying generation data.
6. Run the presentation, terrain visual, full test suite, and production build; visually inspect normal, fogged, debug-grid, movement, and zoom states.

Grid lines are intentionally disabled during normal play. Coordinates, sector debugging, or the Dev Tools `Tile Grid` switch enable them. Roads and transitions use neighboring tiles, so imported art should include compatible north/east/south/west edges. Large objects should retain a separate shadow layer and must not change collision behavior.
