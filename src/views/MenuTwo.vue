<script setup>
import { ref } from 'vue'
import CharacterCard from '../components/CharacterCard.vue'
import GameButton from '../components/GameButton.vue'
import { characterClasses } from '../data/characterClasses.js'
import { CHARACTER_DEFAULTS } from '../game/characterState.js'
import brickBackground from '../assets/dark-brick-wall.png'

const emit = defineEmits(['next'])
const selectedCharacter = ref(null)

function continueToNextMenu() {
  if (selectedCharacter.value) {
    emit('next', selectedCharacter.value)
  }
}
</script>

<template>
  <main
    class="min-h-screen bg-slate-950 px-6 py-12 text-slate-200"
    :style="{
      backgroundImage: `linear-gradient(rgba(2, 6, 23, 0.42), rgba(2, 6, 23, 0.62)), url(${brickBackground})`,
      backgroundRepeat: 'repeat',
      backgroundSize: '520px 520px',
      backgroundPosition: 'center top',
    }"
  >
    <div class="mx-auto max-w-5xl">
      <header class="text-center">
        <p class="menu-kicker">Character creation</p>
        <h1 class="menu-title">Choose your class</h1>
      </header>

      <div class="mt-12 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section class="grid grid-cols-2 gap-4" aria-label="Dostępne klasy postaci">
          <CharacterCard
            v-for="character in characterClasses"
            :key="character.id"
            :character="character"
            :selected="selectedCharacter?.id === character.id"
            @select="selectedCharacter = $event"
          />
        </section>

        <section class="grid min-h-80 place-items-center rounded-3xl border border-slate-500 bg-slate-900/90 p-8 text-center shadow-2xl shadow-black/60 backdrop-blur-sm">
          <div v-if="selectedCharacter">
            <div class="text-8xl" aria-hidden="true">{{ selectedCharacter.icon }}</div>
            <h2 class="character-name">{{ selectedCharacter.name }}</h2>
            <p class="character-description">{{ selectedCharacter.description }}</p>

            <dl class="stats-grid">
              <div v-for="(value, stat) in CHARACTER_DEFAULTS.stats" :key="stat" class="stat-card">
                <dt class="stat-label">{{ stat }}</dt>
                <dd class="stat-value">{{ value }}</dd>
              </div>
            </dl>
          </div>

          <p v-else class="empty-message">Select a class to preview your character.</p>
        </section>
      </div>

      <div class="mt-10 flex justify-center">
        <GameButton label="Continue" :disabled="!selectedCharacter" @click="continueToNextMenu" />
      </div>
    </div>
  </main>
</template>

<style scoped>
.menu-kicker {
  color: #c7d2fe;
  font-size: 0.9rem;
  font-weight: 800;
  letter-spacing: 0.35em;
  text-shadow: 0 2px 8px #000000;
  text-transform: uppercase;
}

.menu-title {
  margin-top: 0.75rem;
  color: #f8fafc;
  font-size: clamp(2.5rem, 6vw, 3.75rem);
  font-weight: 900;
  line-height: 1.1;
  text-shadow: 0 3px 10px #000000;
}

.empty-message {
  color: #e2e8f0;
  font-size: 1.25rem;
  font-weight: 600;
  text-shadow: 0 2px 8px #000000;
}

.character-name {
  margin-top: 1.25rem;
  color: #f8fafc;
  font-size: 2.25rem;
  font-weight: 900;
  line-height: 1.1;
  text-shadow: 0 3px 10px #000000;
  text-transform: uppercase;
}

.character-description {
  max-width: 32rem;
  margin: 0.9rem auto 0;
  color: #e2e8f0;
  font-size: 1rem;
  line-height: 1.6;
  text-shadow: 0 2px 6px #000000;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
  margin-top: 1.75rem;
}

.stat-card {
  padding: 0.9rem;
  border: 2px solid #818cf8;
  border-radius: 0.8rem;
  background: #1e293b;
  box-shadow: 0 5px 14px rgb(0 0 0 / 45%);
}

.stat-label {
  color: #c7d2fe;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.stat-value {
  margin-top: 0.3rem;
  color: #ffffff;
  font-size: 1.6rem;
  font-weight: 900;
  line-height: 1;
}

@media (max-width: 520px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
