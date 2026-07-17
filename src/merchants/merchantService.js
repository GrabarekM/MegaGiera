import { createItemInstance, resolveItemInstance } from '../items/itemInstance.js'
import { ITEM_TYPE } from '../items/itemConstants.js'
import { MERCHANT_DEFINITIONS } from './merchantDefinitions.js'
import { calculateTransactionPrice } from './merchantPriceCalculator.js'
import { MERCHANT_RESULT, STOCK_REFRESH_SOURCE, TRANSACTION_TYPE } from './merchantConstants.js'
import { refreshMerchantStock } from './merchantStock.js'

let transactionSequence = 1
const fail = (code, data = {}) => ({ ok: false, code, ...data })
const success = (data = {}) => ({ ok: true, code: MERCHANT_RESULT.TRANSACTION_SUCCESS, ...data })
const mergeSelections = (selections, key) => [...selections.reduce((map, selection) => { const id = selection[key]; const previous = map.get(id); map.set(id, previous ? { ...previous, quantity: previous.quantity + selection.quantity } : { ...selection }) ; return map }, new Map()).values()]

export function merchantAcceptsItem(merchant, item) {
  if (!merchant || !item) return { accepted: false, reason: MERCHANT_RESULT.ITEM_NOT_ACCEPTED }
  if (merchant.rejectedItemIds.includes(item.id) || merchant.rejectedItemTypes.includes(item.itemType) || item.tags.some((tag) => merchant.rejectedTags.includes(tag))) return { accepted: false, reason: MERCHANT_RESULT.ITEM_NOT_ACCEPTED }
  const accepted = merchant.acceptedItemIds.includes(item.id) || merchant.acceptedItemTypes.includes(item.itemType) || merchant.acceptedCategories.includes(item.category) || item.tags.some((tag) => merchant.acceptedTags.includes(tag))
  return { accepted, reason: accepted ? null : MERCHANT_RESULT.ITEM_NOT_ACCEPTED }
}

export class MerchantService {
  constructor({ character, inventoryManager, merchantState, wardwoodService = null, runId, seed, getWorldTime = () => ({ day: null, hour: null }) }) { this.character = character; this.inventory = inventoryManager; this.state = merchantState; this.wardwood = wardwoodService; this.runId = runId; this.seed = seed; this.getWorldTime = getWorldTime; this.lastResult = null }
  merchant(merchantId) { return MERCHANT_DEFINITIONS[merchantId] ?? null }
  stock(merchantId) { return this.state?.[merchantId] ?? null }

  validateBuy(merchantId, selections) {
    const merchant = this.merchant(merchantId); const stock = this.stock(merchantId)
    if (!merchant || !stock) return fail(MERCHANT_RESULT.MERCHANT_NOT_FOUND)
    const normalized = mergeSelections(selections, 'itemDefinitionId'); const lines = []
    for (const selection of normalized) { if (!Number.isInteger(selection.quantity) || selection.quantity <= 0) return fail(MERCHANT_RESULT.INVALID_QUANTITY); const entry = stock.stockEntries.find((item) => item.itemDefinitionId === selection.itemDefinitionId); if (!entry) return fail(MERCHANT_RESULT.ITEM_NOT_IN_STOCK, { itemDefinitionId: selection.itemDefinitionId }); if (selection.quantity > entry.quantity) return fail(MERCHANT_RESULT.STOCK_LIMIT_REACHED); if (entry.purchaseLimit !== null && entry.purchased + selection.quantity > entry.purchaseLimit) return fail(MERCHANT_RESULT.STOCK_LIMIT_REACHED); const item = resolveItemInstance(createItemInstance(entry.itemDefinitionId)); if (!item) return fail(MERCHANT_RESULT.ITEM_NOT_IN_STOCK); lines.push({ entry, item, ...calculateTransactionPrice(item, merchant, TRANSACTION_TYPE.BUY, selection.quantity, entry.priceOverride) }) }
    const totalPrice = lines.reduce((sum, line) => sum + line.totalPrice, 0)
    return this.character.gold < totalPrice ? fail(MERCHANT_RESULT.INSUFFICIENT_PLAYER_GOLD, { totalPrice }) : success({ merchant, stock, lines, totalPrice, playerGoldAfter: this.character.gold - totalPrice })
  }

  buySelected(merchantId, selections) {
    const validation = this.validateBuy(merchantId, selections); if (!validation.ok) return this.remember(validation)
    const time = this.getWorldTime(); const records = []
    for (const line of validation.lines) { line.entry.quantity -= line.quantity; line.entry.purchased += line.quantity; if (line.item.id === 'wardwood' && this.wardwood) this.wardwood.addBatch(line.quantity, time.day ?? 1, { id: `merchant-${merchantId}-${transactionSequence}` }); else this.inventory.add(createItemInstance(line.item.id, { quantity: line.quantity })); records.push(this.record(merchantId, TRANSACTION_TYPE.BUY, line, time)) }
    validation.stock.stockEntries = validation.stock.stockEntries.filter(({ quantity }) => quantity > 0)
    this.character.gold -= validation.totalPrice; validation.stock.currentGoldReserve += validation.totalPrice
    return this.remember(success({ lines: validation.lines, totalPrice: validation.totalPrice, records, playerGoldAfter: this.character.gold, merchantGoldAfter: validation.stock.currentGoldReserve }))
  }
  buy(merchantId, itemDefinitionId, quantity = 1) { return this.buySelected(merchantId, [{ itemDefinitionId, quantity }]) }

  validateSell(merchantId, selections) {
    const merchant = this.merchant(merchantId); const stock = this.stock(merchantId)
    if (!merchant || !stock) return fail(MERCHANT_RESULT.MERCHANT_NOT_FOUND)
    const normalized = mergeSelections(selections, 'instanceId'); const lines = []
    for (const selection of normalized) { if (!Number.isInteger(selection.quantity) || selection.quantity <= 0) return fail(MERCHANT_RESULT.INVALID_QUANTITY); const instance = this.inventory.find(selection.instanceId); const item = resolveItemInstance(instance); if (!instance || !item || selection.quantity > instance.quantity) return fail(MERCHANT_RESULT.INVALID_QUANTITY); if (instance.favorite) return fail(MERCHANT_RESULT.ITEM_FAVORITE, { itemDefinitionId: item.id }); if (item.protected || instance.state?.protected) return fail(MERCHANT_RESULT.ITEM_PROTECTED, { itemDefinitionId: item.id }); if ([ITEM_TYPE.QUEST_ITEM, ITEM_TYPE.KEY_ITEM].includes(item.itemType)) return fail(MERCHANT_RESULT.QUEST_ITEM_CANNOT_BE_SOLD); if (item.unsellable || item.value === 0) return fail(MERCHANT_RESULT.ITEM_UNSELLABLE); const acceptance = merchantAcceptsItem(merchant, item); if (!acceptance.accepted) return fail(acceptance.reason, { itemDefinitionId: item.id }); lines.push({ instance, item, ...calculateTransactionPrice(item, merchant, TRANSACTION_TYPE.SELL, selection.quantity) }) }
    const totalPrice = lines.reduce((sum, line) => sum + line.totalPrice, 0)
    return stock.currentGoldReserve < totalPrice ? fail(MERCHANT_RESULT.INSUFFICIENT_MERCHANT_GOLD, { totalPrice }) : success({ merchant, stock, lines, totalPrice, merchantGoldAfter: stock.currentGoldReserve - totalPrice })
  }

  sellSelected(merchantId, selections) {
    const validation = this.validateSell(merchantId, selections); if (!validation.ok) return this.remember(validation)
    const time = this.getWorldTime(); const records = []
    for (const line of validation.lines) { if (line.item.id === 'wardwood' && this.wardwood) this.wardwood.consume(line.quantity, time.day ?? 1); else this.inventory.remove(line.instance.instanceId, line.quantity); if (validation.merchant.acceptSoldItemsToStock) { const existing = validation.stock.stockEntries.find(({ itemDefinitionId }) => itemDefinitionId === line.item.id); if (existing) existing.quantity += line.quantity; else validation.stock.stockEntries.push({ itemDefinitionId: line.item.id, quantity: line.quantity, purchaseLimit: null, purchased: 0, isUniqueStock: false, isProtectedStock: false, priceOverride: null, source: 'player_sale', origin: 'player_sale', itemInstance: line.quantity === 1 ? { ...line.instance, favorite: false } : null }) } records.push(this.record(merchantId, TRANSACTION_TYPE.SELL, line, time)) }
    this.character.gold += validation.totalPrice; validation.stock.currentGoldReserve -= validation.totalPrice
    return this.remember(success({ lines: validation.lines, totalPrice: validation.totalPrice, records, playerGoldAfter: this.character.gold, merchantGoldAfter: validation.stock.currentGoldReserve }))
  }
  sell(merchantId, instanceId, quantity = 1) { return this.sellSelected(merchantId, [{ instanceId, quantity }]) }

  record(merchantId, transactionType, line, time) { const record = { transactionId: `merchant-transaction-${transactionSequence++}`, merchantId, transactionType, itemDefinitionId: line.item.id, quantity: line.quantity, unitPrice: line.unitPrice, totalPrice: line.totalPrice, worldDay: time.day ?? null, worldTime: time.hour ?? null }; this.state[merchantId].transactions.push(record); return record }
  remember(result) { this.lastResult = result; return result }
  refresh(merchantId, source = STOCK_REFRESH_SOURCE.DEVELOPER) { return this.remember(refreshMerchantStock(this.state, merchantId, { seed: this.seed, runId: this.runId, source })) }
  reset(merchantId) { return this.remember(refreshMerchantStock(this.state, merchantId, { seed: this.seed, runId: this.runId, source: STOCK_REFRESH_SOURCE.RESET })) }
  setMerchantGold(merchantId, amount) { const stock = this.stock(merchantId); if (!stock) return fail(MERCHANT_RESULT.MERCHANT_NOT_FOUND); stock.currentGoldReserve = Math.max(0, Math.trunc(amount)); return success({ currentGoldReserve: stock.currentGoldReserve }) }
  addStock(merchantId, itemDefinitionId, quantity = 1) { const stock = this.stock(merchantId); if (!stock || !resolveItemInstance(createItemInstance(itemDefinitionId))) return fail(MERCHANT_RESULT.MERCHANT_NOT_FOUND); const existing = stock.stockEntries.find((entry) => entry.itemDefinitionId === itemDefinitionId); if (existing) existing.quantity += quantity; else stock.stockEntries.push({ itemDefinitionId, quantity, purchaseLimit: null, purchased: 0, isUniqueStock: false, isProtectedStock: false, priceOverride: null, source: 'developer', origin: 'developer', itemInstance: null }); return success({ stock }) }
  removeStock(merchantId, itemDefinitionId) { const stock = this.stock(merchantId); if (!stock) return fail(MERCHANT_RESULT.MERCHANT_NOT_FOUND); stock.stockEntries = stock.stockEntries.filter((entry) => entry.itemDefinitionId !== itemDefinitionId); return success({ stock }) }
}
