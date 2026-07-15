<script setup>
import { ref } from 'vue'

const menuOpen = ref(false)
const links = [
  { label: 'Start', href: '#start' },
  { label: 'Funkcje', href: '#funkcje' },
  { label: 'Kontakt', href: '#kontakt' },
]
</script>

<template>
  <header class="border-b border-white/10 bg-slate-950/80 backdrop-blur">
    <nav class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4" aria-label="Główna nawigacja">
      <a href="#start" class="flex items-center gap-3 font-semibold tracking-tight">
        <span class="grid size-9 place-items-center rounded-xl bg-indigo-500 text-white">V</span>
        Vue Starter
      </a>

      <button
        class="rounded-lg p-2 text-slate-300 md:hidden"
        type="button"
        :aria-expanded="menuOpen"
        aria-controls="mobile-menu"
        aria-label="Otwórz menu"
        @click="menuOpen = !menuOpen"
      >
        <span class="block h-0.5 w-6 bg-current" />
        <span class="mt-1.5 block h-0.5 w-6 bg-current" />
        <span class="mt-1.5 block h-0.5 w-6 bg-current" />
      </button>

      <div class="hidden items-center gap-8 md:flex">
        <a v-for="link in links" :key="link.href" :href="link.href" class="text-sm text-slate-300 transition hover:text-white">
          {{ link.label }}
        </a>
      </div>
    </nav>

    <div v-if="menuOpen" id="mobile-menu" class="border-t border-white/10 px-6 py-4 md:hidden">
      <a
        v-for="link in links"
        :key="link.href"
        :href="link.href"
        class="block rounded-lg px-3 py-2 text-slate-300 hover:bg-white/5 hover:text-white"
        @click="menuOpen = false"
      >
        {{ link.label }}
      </a>
    </div>
  </header>
</template>
