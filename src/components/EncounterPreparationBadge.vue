<script setup>
defineProps({ state: { type: String, default: 'Neutral' } })
const descriptions = { Neutral: 'No side is prepared.', Alert: 'You noticed the encounter early.', Prepared: 'You will enter combat with an initiative advantage.', Surprised: 'The enemy has the initiative advantage.' }
</script>
<template><div class="encounter-preparation" :data-state="state"><strong>{{ state }}</strong><span>{{ descriptions[state] ?? descriptions.Neutral }}</span></div></template>

