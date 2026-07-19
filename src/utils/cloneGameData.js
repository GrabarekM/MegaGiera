import { isProxy, toRaw } from 'vue'

function unwrapReactiveValue(value, seen) {
  const source = isProxy(value) ? toRaw(value) : value
  if (source === null || typeof source !== 'object') return source
  if (seen.has(source)) return seen.get(source)
  if (source instanceof Date) return new Date(source)
  if (Array.isArray(source)) {
    const result = []
    seen.set(source, result)
    for (const entry of source) result.push(unwrapReactiveValue(entry, seen))
    return result
  }
  if (source instanceof Map) {
    const result = new Map()
    seen.set(source, result)
    for (const [key, entry] of source) result.set(unwrapReactiveValue(key, seen), unwrapReactiveValue(entry, seen))
    return result
  }
  if (source instanceof Set) {
    const result = new Set()
    seen.set(source, result)
    for (const entry of source) result.add(unwrapReactiveValue(entry, seen))
    return result
  }
  const result = {}
  seen.set(source, result)
  for (const [key, entry] of Object.entries(source)) result[key] = unwrapReactiveValue(entry, seen)
  return result
}

export function cloneGameData(value) {
  return structuredClone(unwrapReactiveValue(value, new WeakMap()))
}
