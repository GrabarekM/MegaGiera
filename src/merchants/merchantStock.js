import { MERCHANT_DEFINITIONS, MERCHANT_LIST } from './merchantDefinitions.js'
import { STOCK_REFRESH_SOURCE } from './merchantConstants.js'

const hash = (value) => [...String(value)].reduce((result, character) => Math.imul(result ^ character.charCodeAt(0), 16777619) >>> 0, 2166136261)
const seededRandom = (seed) => { let state = hash(seed); return () => { state += 0x6D2B79F5; let value = state; value = Math.imul(value ^ value >>> 15, value | 1); value ^= value + Math.imul(value ^ value >>> 7, value | 61); return ((value ^ value >>> 14) >>> 0) / 4294967296 } }
const quantity = (definition, random) => definition.minimum + Math.floor(random() * (definition.maximum - definition.minimum + 1))
const stockEntry = (definition, amount, origin) => ({ itemDefinitionId: definition.itemDefinitionId, quantity: amount, purchaseLimit: definition.purchaseLimit, purchased: 0, isUniqueStock: definition.isUniqueStock, isProtectedStock: definition.isProtectedStock, priceOverride: definition.priceOverride, source: definition.source, origin, itemInstance: null })

export function generateMerchantStock(merchant, { seed, runId, refreshSource = STOCK_REFRESH_SOURCE.NEW_RUN, refreshCount = 0 } = {}) {
  const random = seededRandom(`${seed}:${merchant.id}:${refreshCount}`)
  const entries = []
  for (const definition of merchant.stockDefinition.fixed) { const amount = quantity(definition, random); if (amount > 0) entries.push(stockEntry(definition, amount, 'fixed')) }
  const pool = [...merchant.stockDefinition.random]
  for (let pick = 0; pick < merchant.stockDefinition.randomPicks && pool.length; pick += 1) { const total = pool.reduce((sum, item) => sum + item.weight, 0); let roll = random() * total; let index = pool.findIndex((item) => (roll -= item.weight) < 0); if (index < 0) index = pool.length - 1; const definition = pool.splice(index, 1)[0]; const amount = quantity(definition, random); if (amount > 0) entries.push(stockEntry(definition, amount, 'randomized')) }
  return { merchantId: merchant.id, stockEntries: entries, currentGoldReserve: merchant.goldReserve, generatedForRunId: runId, refreshState: { count: refreshCount, history: [{ source: refreshSource }] }, optionalRefreshSource: refreshSource, transactions: [] }
}
export function generateMerchantState(seed, runId) { return Object.fromEntries(MERCHANT_LIST.map((merchant) => [merchant.id, generateMerchantStock(merchant, { seed, runId })])) }
export function isValidMerchantState(state, runId) { return Boolean(state && MERCHANT_LIST.every(({ id }) => { const stock = state[id]; return stock?.merchantId === id && stock.generatedForRunId === runId && Number.isInteger(stock.currentGoldReserve) && stock.currentGoldReserve >= 0 && Array.isArray(stock.stockEntries) && stock.stockEntries.every((entry) => typeof entry.itemDefinitionId === 'string' && Number.isInteger(entry.quantity) && entry.quantity >= 0) })) }
export function refreshMerchantStock(state, merchantId, { seed, runId, source = STOCK_REFRESH_SOURCE.DEVELOPER } = {}) { const merchant = MERCHANT_DEFINITIONS[merchantId]; if (!merchant) return { ok: false, code: 'MERCHANT_NOT_FOUND' }; const previous = state[merchantId]; const count = (previous?.refreshState?.count ?? 0) + 1; const next = generateMerchantStock(merchant, { seed, runId, refreshSource: source, refreshCount: count }); next.refreshState.history = [...(previous?.refreshState?.history ?? []), { source }]; state[merchantId] = next; return { ok: true, stock: next } }
