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
  border: 1px solid var(--ui-leather);
  border-radius: 0.18rem;
  background: var(--ui-wood-raised);
  color: var(--ui-parchment-light);
  box-shadow: var(--ui-frame-shadow);
  font-size: 1.5rem;
  font-weight: 800;
  font-family: var(--ui-font-display);
  transition: background-color 140ms ease, border-color 140ms ease, transform 100ms ease;
}

.game-button:hover:not(:disabled) {
  border-color: var(--ui-gold);
  background: #505149;
}

.game-button:active:not(:disabled) {
  transform: translateY(1px);
}

.game-button:disabled {
  cursor: not-allowed;
  border-color: #594b3c;
  background: #332d27;
  color: #817563;
  opacity: 1;
  box-shadow: none;
}
</style>
