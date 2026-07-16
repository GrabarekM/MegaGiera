import { EVENT_RESULT } from '../../engine/events/eventManager.js'

export const enginePreviewEvent = Object.freeze({
  id: 'dev-engine-preview',
  title: 'An Unexpected Find',
  description: 'This data-only event exists to verify the Event Engine manually.',
  conditions: [],
  results: [],
  flags: { blocksMovement: true, allowManualClose: false },
  options: [
    {
      id: 'take-coins',
      text: 'Take the coins',
      conditions: [],
      results: [
        { type: EVENT_RESULT.ADD_GOLD, amount: 10 },
        { type: EVENT_RESULT.ADVANCE_TIME, hours: 1 },
        { type: EVENT_RESULT.SET_FLAG, key: 'dev_preview_completed', value: true },
        { type: EVENT_RESULT.MESSAGE, text: 'You gained 10 gold.' },
        { type: EVENT_RESULT.END_EVENT },
      ],
    },
    {
      id: 'leave',
      text: 'Leave it alone',
      conditions: [],
      results: [
        { type: EVENT_RESULT.MESSAGE, text: 'You leave the find untouched.' },
        { type: EVENT_RESULT.END_EVENT },
      ],
    },
  ],
})
