<script setup>
defineProps({
  character: {
    type: Object,
    required: true,
  },
  selected: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['select'])
</script>

<template>
  <button
    type="button"
    class="character-card"
    :class="{ 'character-card--selected': selected }"
    :aria-pressed="selected"
    @click="$emit('select', character)"
  >
    <span class="block text-6xl" aria-hidden="true">{{ character.icon }}</span>
    <span class="character-card__name">
      {{ character.name }}
    </span>
    <span class="character-card__description">
      {{ character.shortDescription }}
    </span>
  </button>
</template>

<style scoped>
.character-card {
  padding: 1.5rem;
  border: 2px solid #64748b;
  border-radius: 1rem;
  background: rgb(15 23 42 / 92%);
  color: #e2e8f0;
  text-align: left;
  box-shadow: 0 8px 24px rgb(0 0 0 / 45%);
  transition: transform 180ms ease, border-color 180ms ease, background-color 180ms ease;
}

.character-card:hover {
  transform: translateY(-4px);
  border-color: #c7d2fe;
  background: #1e293b;
}

.character-card--selected {
  border: 3px solid #a5b4fc;
  background: #312e81;
  color: #ffffff;
}

.character-card__name {
  display: block;
  margin-top: 1.25rem;
  color: inherit;
  font-size: 1.5rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.character-card__description {
  display: block;
  margin-top: 0.5rem;
  color: #cbd5e1;
  font-size: 0.95rem;
}
</style>
