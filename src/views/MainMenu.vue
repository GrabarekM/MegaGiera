<script setup>
import GameButton from '../components/GameButton.vue'
import { gameConfig } from '../data/gameConfig.js'

defineProps({ saveInfo: { type: Object, default: null }, saveError: { type: String, default: '' }, busy: Boolean })
defineEmits(['new-run', 'quick-start', 'continue', 'delete-save'])
</script>

<template>
  <main class="min-h-screen bg-black text-white">
    <header class="grid h-[20vh] place-items-center px-6 text-center">
      <h1 class="text-5xl font-black uppercase tracking-wider sm:text-7xl">{{ gameConfig.title }}</h1>
    </header>
    <section class="grid h-[80vh] place-items-center px-6 pb-[12vh]">
      <div class="menu-actions">
        <div v-if="saveInfo" class="save-summary">
          <strong>Current run</strong>
          <span>{{ saveInfo.characterName }} · {{ saveInfo.moveCount }} moves</span>
          <small>Last saved: {{ saveInfo.updatedAt }}</small>
        </div>
        <div v-if="saveError" class="save-error" role="alert">
          <strong>Save could not be loaded</strong>
          <span>The save may be corrupted or from an unsupported game version.</span>
          <button type="button" @click="$emit('delete-save')">Delete Save</button>
        </div>
        <div data-testid="main-new-run"><GameButton label="New Run" :disabled="busy" @click="$emit('new-run')" /></div>
        <div data-testid="main-quick-start"><GameButton label="Quick Start" :disabled="busy" @click="$emit('quick-start')" /></div>
        <div data-testid="main-continue"><GameButton label="Continue" :disabled="busy || !saveInfo" @click="$emit('continue')" /></div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.menu-actions { display: grid; width: min(24rem, 100%); gap: 1rem; text-align: center; }
.save-summary, .save-error { display: grid; gap: .35rem; padding: 1rem; border: 1px solid #475569; border-radius: .75rem; background: #0f172a; color: #e2e8f0; }
.save-summary small { color: #94a3b8; }
.save-error { border-color: #991b1b; color: #fecaca; }
.save-error button { margin-top: .5rem; padding: .55rem; border: 1px solid #f87171; border-radius: .45rem; background: #450a0a; color: #fff; }
</style>
