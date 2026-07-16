<script setup>
defineProps({ event: { type: Object, required: true }, options: { type: Array, required: true }, message: { type: String, default: '' } })
defineEmits(['choose', 'close'])
</script>

<template>
  <div class="event-backdrop" role="presentation">
    <section class="event-modal" role="dialog" aria-modal="true" :aria-labelledby="`event-title-${event.id}`">
      <button v-if="event.flags?.allowManualClose !== false" class="event-modal__close" type="button" aria-label="Close event" @click="$emit('close')">×</button>
      <h2 :id="`event-title-${event.id}`">{{ event.title }}</h2>
      <p>{{ event.description }}</p>
      <p v-if="message" class="event-modal__message">{{ message }}</p>
      <div class="event-modal__options">
        <button v-for="option in options" :key="option.id" type="button" @click="$emit('choose', option.id)">{{ option.text }}</button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.event-backdrop { position: fixed; z-index: 100; inset: 0; display: grid; place-items: center; padding: 1.5rem; background: rgb(2 6 23 / 78%); }
.event-modal { position: relative; width: min(34rem, 100%); padding: 2rem; border: 1px solid #94a3b8; border-radius: 0.75rem; background: #111827; color: #f8fafc; box-shadow: 0 24px 80px #000; }
.event-modal h2 { margin: 0 0 1rem; font-size: 1.65rem; }
.event-modal p { color: #cbd5e1; line-height: 1.6; }
.event-modal__close { position: absolute; top: 0.75rem; right: 0.75rem; }
.event-modal__message { color: #facc15 !important; }
.event-modal__options { display: grid; gap: 0.75rem; margin-top: 1.5rem; }
.event-modal__options button { padding: 0.8rem 1rem; border: 1px solid #818cf8; border-radius: 0.5rem; background: #1e293b; color: #fff; cursor: pointer; }
.event-modal__options button:hover { background: #334155; }
</style>
