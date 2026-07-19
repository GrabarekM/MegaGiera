import test from 'node:test'
import assert from 'node:assert/strict'
import { reactive } from 'vue'
import { cloneGameData } from '../src/utils/cloneGameData.js'
import { PoiActionCostService } from '../src/poi/poiActionCostService.js'
import { POI_COST_TYPE } from '../src/poi/poiConstants.js'

test('cloneGameData deeply unwraps nested Vue proxies', () => {
  const source = reactive({ rows: [{ name: 'Wardwood', values: reactive([1, 2, 3]) }] })
  const clone = cloneGameData(source)

  assert.deepEqual(clone, { rows: [{ name: 'Wardwood', values: [1, 2, 3] }] })
  assert.notEqual(clone, source)
  assert.notEqual(clone.rows, source.rows)
})

test('POI action payment snapshots reactive wardwood batches', () => {
  const character = reactive({ inventory: [], gold: 0, wardwood: 2, wardwoodBatches: [{ quantity: 2, expiresWorldDay: 3 }] })
  const service = new PoiActionCostService()
  const result = service.pay([{ type: POI_COST_TYPE.WARDWOOD, quantity: 1 }], {
    character,
    inventoryManager: { remove: () => ({ ok: true }) },
    wardwoodService: { consume: () => ({ ok: true }) },
    worldDay: 1,
  })

  assert.equal(result.ok, true)
  assert.deepEqual(result.snapshot.batches, [{ quantity: 2, expiresWorldDay: 3 }])
})
