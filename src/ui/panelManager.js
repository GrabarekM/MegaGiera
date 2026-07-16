export const GAME_PANELS = Object.freeze([
  Object.freeze({ id: 'character', label: 'Character', shortcut: 'c', tooltip: 'Open Character Sheet' }),
  Object.freeze({ id: 'skills', label: 'Skills', shortcut: 'k', tooltip: 'Open Skills' }),
  Object.freeze({ id: 'equipment', label: 'Equipment', shortcut: 'i', tooltip: 'Open Equipment' }),
  Object.freeze({ id: 'journal', label: 'Journal', shortcut: 'j', tooltip: 'Open Journal' }),
  Object.freeze({ id: 'settings', label: 'Settings', shortcut: null, tooltip: 'Open Settings' }),
])

const SHORTCUTS = Object.freeze(Object.fromEntries(GAME_PANELS.filter((panel) => panel.shortcut).map((panel) => [panel.shortcut, panel.id])))

export function isTextInputTarget(target) {
  const tag = target?.tagName?.toLowerCase()
  return Boolean(target?.isContentEditable || ['input', 'textarea', 'select'].includes(tag))
}

export function createPanelManager(initialPanel = null) {
  let activePanel = initialPanel
  const listeners = new Set()
  const notify = () => listeners.forEach((listener) => listener(activePanel))
  return {
    get activePanel() { return activePanel },
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener) },
    toggle(panelId) {
      if (!GAME_PANELS.some(({ id }) => id === panelId)) return false
      activePanel = activePanel === panelId ? null : panelId
      notify(); return true
    },
    close() { if (activePanel === null) return false; activePanel = null; notify(); return true },
    handleKey(event) {
      if (isTextInputTarget(event.target)) return false
      if (event.key === 'Escape') return this.close()
      const panelId = SHORTCUTS[event.key.toLowerCase()]
      return panelId ? this.toggle(panelId) : false
    },
  }
}
