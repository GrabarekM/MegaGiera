export const SUPPORTED_DICE = Object.freeze([4, 6, 8, 10, 12, 20])

export class DiceService {
  constructor(random = Math.random) {
    this.random = random
    this.mode = 'random'
    this.fixedRoll = null
  }

  setMode(mode = 'random') {
    if (!['random', 'minimum', 'maximum'].includes(mode)) throw new RangeError(`Unsupported dice mode: ${mode}`)
    this.mode = mode
    this.fixedRoll = null
  }

  setFixedRoll(value) {
    if (!Number.isInteger(value) || value < 1) throw new RangeError('A fixed roll must be a positive integer.')
    this.fixedRoll = value
    this.mode = 'fixed'
  }

  roll(sides) {
    if (!SUPPORTED_DICE.includes(sides)) throw new RangeError(`Unsupported die: d${sides}`)
    if (this.mode === 'minimum') return 1
    if (this.mode === 'maximum') return sides
    if (this.mode === 'fixed') return Math.min(this.fixedRoll, sides)
    return Math.floor(this.random() * sides) + 1
  }
}
