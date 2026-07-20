import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

test('shared UI foundation defines the five project materials and castle-stone palette', async () => {
  const source = await readFile(new URL('../src/style.css', import.meta.url), 'utf8')
  for (const token of ['--ui-wood', '--ui-parchment', '--ui-stone', '--ui-iron', '--ui-leather']) assert.match(source, new RegExp(token))
  assert.match(source, /--ui-gold/)
  assert.match(source, /--ui-font-display/)
  assert.match(source, /--ui-wood: #292b2e/)
  assert.match(source, /--ui-ink: #17191b/)
})

test('Main Menu uses the shared medieval material direction', async () => {
  const source = await readFile(new URL('../src/views/MainMenu.vue', import.meta.url), 'utf8')
  assert.match(source, /dark-brick-wall\.png/)
  assert.match(source, /class="menu-frame"/)
  assert.match(source, /background-blend-mode:normal/)
  assert.match(source, /var\(--ui-/)
})

test('shared button defaults to the Wood material instead of the old blue prototype', async () => {
  const source = await readFile(new URL('../src/components/GameButton.vue', import.meta.url), 'utf8')
  assert.match(source, /background: var\(--ui-wood-raised\)/)
  assert.match(source, /border-color: var\(--ui-gold\)/)
  assert.doesNotMatch(source, /#4338ca|#4f46e5|#c7d2fe/)
})

test('exploration chrome uses shared materials without changing map tiles', async () => {
  const source = await readFile(new URL('../src/views/MenuThree.vue', import.meta.url), 'utf8')
  assert.match(source, /Shared material foundation/)
  assert.match(source, /\.player-panel\{border-color:var\(--ui-leather\)/)
  assert.match(source, /\.hud-action-bar\{border-color:var\(--ui-leather\)/)
  assert.match(source, /\.map-header\{border-color:var\(--ui-leather\)/)
})

test('Character Creation keeps selected Subskill descriptions full-width and stacked', async () => {
  const source = await readFile(new URL('../src/views/MenuTwo.vue', import.meta.url), 'utf8')
  assert.match(source, /\.selected-subskill-details\{grid-template-columns:1fr\}/)
  assert.match(source, /\.creation-workspace\{align-items:start\}/)
  assert.match(source, /\.identity-column\{grid-template-rows:auto auto;align-content:start\}/)
  assert.match(source, /background-blend-mode:normal/)
})

test('Character Creation weapon choices reserve visible art slots and use larger rows', async () => {
  const source = await readFile(new URL('../src/views/MenuTwo.vue', import.meta.url), 'utf8')
  assert.match(source, /class="weapon-art-placeholder"/)
  assert.match(source, /getWeaponVisual\(weapon\)/)
  assert.match(source, /min-height:4rem/)
  assert.match(source, /grid-template-columns:2\.75rem minmax\(0,1fr\) auto/)
})

test('all gameplay overlays inherit the castle-stone visual slice', async () => {
  const source = await readFile(new URL('../src/style.css', import.meta.url), 'utf8')
  for (const selector of ['.combat-window', '.dialogue-overlay', '.encounter-window', '.poi-window', '.inventory-window', '.merchant-window', '.trainer-screen', '.item-tooltip']) assert.match(source, new RegExp(selector.replace('.', '\\.')))
  assert.match(source, /Castle-stone vertical slice/)
})
