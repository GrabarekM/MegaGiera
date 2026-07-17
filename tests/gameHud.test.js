import assert from 'node:assert/strict'
import test from 'node:test'
import { createPanelManager, GAME_PANELS } from '../src/ui/panelManager.js'

const key = (value, tagName = 'DIV') => ({ key: value, target: { tagName, isContentEditable: false } })

test('C opens Character and pressing C again closes it', () => {
  const manager = createPanelManager()
  assert.equal(manager.handleKey(key('c')), true)
  assert.equal(manager.activePanel, 'character')
  manager.handleKey(key('C'))
  assert.equal(manager.activePanel, null)
})

test('K, I and J open their configured panels', () => {
  const manager = createPanelManager()
  manager.handleKey(key('k')); assert.equal(manager.activePanel, 'skills')
  manager.handleKey(key('i')); assert.equal(manager.activePanel, 'equipment')
  manager.handleKey(key('j')); assert.equal(manager.activePanel, 'journal')
})

test('Escape closes the active panel and does nothing when none is open', () => {
  const manager = createPanelManager('character')
  assert.equal(manager.handleKey(key('Escape')), true)
  assert.equal(manager.activePanel, null)
  assert.equal(manager.handleKey(key('Escape')), false)
})

test('switching panels preserves exactly one active panel', () => {
  const manager = createPanelManager()
  manager.toggle('character'); manager.toggle('skills')
  assert.equal(manager.activePanel, 'skills')
  assert.equal(typeof manager.activePanel, 'string')
})

test('shortcuts do not run while typing or editing content', () => {
  const manager = createPanelManager()
  assert.equal(manager.handleKey(key('c', 'INPUT')), false)
  assert.equal(manager.handleKey({ key: 'k', target: { tagName: 'DIV', isContentEditable: true } }), false)
  assert.equal(manager.activePanel, null)
})

test('panel configuration provides reusable labels, tooltips and shortcuts', () => {
  assert.deepEqual(GAME_PANELS.filter(({ shortcut }) => shortcut).map(({ shortcut }) => shortcut), ['c', 'k', 'i', 'b', 'j'])
  assert.ok(GAME_PANELS.every(({ tooltip }) => tooltip))
})

test('HUD renders name, HP, Gold, Level, XP and responsive panel controls', async () => {
  const { readFile } = await import('node:fs/promises')
  const source = await readFile(new URL('../src/views/MenuThree.vue', import.meta.url), 'utf8')
  for (const pattern of [/characterState\.name/, /characterState\.health\.current/, /characterState\.gold/, /characterState\.level/, /characterState\.experience/, /Points Remaining|XP/]) assert.match(source, pattern)
  assert.match(source, /v-for="panel in GAME_PANELS"/)
  assert.match(source, /activePanel === panel\.id/)
  assert.match(source, /@media \(max-width: 760px\)/)
  assert.match(source, /width:calc\(100vw - \.8rem\)/)
})

test('Skills groups proficiencies into expandable categories', async () => {
  const { readFile } = await import('node:fs/promises')
  const source = await readFile(new URL('../src/views/MenuThree.vue', import.meta.url), 'utf8')
  assert.match(source, /v-for="category in PROFICIENCY_CATEGORIES"/)
  assert.match(source, /<details/)
  assert.match(source, /<summary>/)
})

test('Equipment uses icon-ready slots and Character summary spans the full panel', async () => {
  const { readFile } = await import('node:fs/promises')
  const source = await readFile(new URL('../src/views/MenuThree.vue', import.meta.url), 'utf8')
  assert.match(source, /class="equipment-grid"/)
  assert.match(source, /entry\.item\?\.icon/)
  assert.match(source, /class="equipment-summary"/)
  assert.match(source, /\.equipment-summary\{grid-column:1\/-1/)
  assert.match(source, /\.character-sheet\{padding-bottom:3rem/)
})

test('Character Sheet exposes Book Collection and Book Journal', async () => {
  const { readFile } = await import('node:fs/promises')
  const source = await readFile(new URL('../src/views/MenuThree.vue', import.meta.url), 'utf8')
  assert.match(source, /Book Collection/)
  assert.match(source, /Books Found/)
  assert.match(source, /Book Journal/)
})
