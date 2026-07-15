<script setup>
defineProps({
  number: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
})
</script>

<template>
  <article class="rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:-translate-y-1 hover:border-indigo-400/40 hover:bg-white/[0.07]">
    <span class="text-sm font-semibold text-indigo-400">{{ number }}</span>
    <h3 class="mt-4 text-xl font-semibold text-white">{{ title }}</h3>
    <p class="mt-3 leading-7 text-slate-400">{{ description }}</p>
  </article>
</template>
