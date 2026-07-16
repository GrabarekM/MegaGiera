<script setup>
defineProps({
  label: {
    type: String,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['click'])
</script>

<template>
  <button
    type="button"
    :disabled="disabled"
    class="game-button"
    @click="$emit('click')"
  >
    {{ label }}
  </button>
</template>

<style scoped>
.game-button {
  min-width: 13rem;
  padding: 0.9rem 2.5rem;
  border: 3px solid #c7d2fe;
  border-radius: 1rem;
  background: #4338ca;
  color: #f8fafc;
  box-shadow: 0 8px 24px rgb(0 0 0 / 55%);
  font-size: 1.5rem;
  font-weight: 800;
  transition: transform 180ms ease, background-color 180ms ease, border-color 180ms ease;
}

.game-button:hover:not(:disabled) {
  transform: scale(1.05);
  border-color: #ffffff;
  background: #4f46e5;
}

.game-button:active:not(:disabled) {
  transform: scale(0.96);
}

.game-button:disabled {
  cursor: not-allowed;
  border-color: #64748b;
  background: #1e293b;
  color: #cbd5e1;
  opacity: 0.8;
  box-shadow: none;
}
</style>
