<script setup>
import { computed } from 'vue'
import { createItemTooltipModel } from '../items/itemTooltip.js'
const props = defineProps({ item: { type: Object, required: true }, character: { type: Object, default: null } })
const model = computed(() => createItemTooltipModel(props.item, props.character))
</script>

<template>
  <article class="item-tooltip" role="tooltip">
    <div class="item-tooltip__icon" :data-icon-id="model.iconId" aria-hidden="true">◇</div>
    <header><h4>{{ model.name }}</h4><p>{{ model.itemType }}<span v-if="model.category"> · {{ model.category }}</span></p><strong>{{ model.quality }}</strong></header>
    <p>{{ model.description }}</p>
    <dl v-if="model.bookType"><div><dt>Book Type</dt><dd>{{ model.bookType }}</dd></div><div><dt>Category</dt><dd>{{ model.category }}</dd></div><div><dt>Manual Tier</dt><dd>{{ model.manualTier ?? 'None' }}</dd></div><div><dt>Current Availability</dt><dd>{{ model.availability }}</dd></div><div><dt>Protected</dt><dd>{{ model.protected ? 'Yes' : 'No' }}</dd></div></dl>
    <dl><div><dt>Value</dt><dd>{{ model.value }} Gold</dd></div></dl>
    <dl v-if="model.weaponStats"><div><dt>Base Damage</dt><dd>{{ model.weaponStats.baseDamage }} {{ model.weaponStats.damageType }}</dd></div><div><dt>Range</dt><dd>{{ model.weaponStats.attackRange }}</dd></div><div><dt>Attack Speed</dt><dd>{{ model.weaponStats.attackSpeed }}</dd></div><div><dt>Hands</dt><dd>{{ model.weaponStats.handsRequired }}</dd></div><div v-if="model.proficiency"><dt>Proficiency</dt><dd>{{ model.proficiency }}</dd></div></dl>
    <dl v-if="model.armorRating !== null"><div><dt>Armor Rating</dt><dd>{{ model.armorRating }}</dd></div><div><dt>Maximum HP Bonus</dt><dd>{{ model.maximumHpBonus }}</dd></div></dl>
    <section v-if="model.equipSlots.length"><h5>Equipment Slots</h5><p>{{ model.equipSlots.join(', ') }}</p></section>
    <section><h5>Salvageable</h5><p>{{ model.salvageable ? 'Yes' : 'No' }}</p><ul v-if="model.salvageMaterials.length"><li v-for="material in model.salvageMaterials" :key="material.id">{{ material.displayName }}: {{ material.minimum }}–{{ material.maximum }}</li></ul></section>
    <section v-if="model.resistances"><h5>Resistances</h5><ul><li v-for="(value, resistance) in model.resistances" :key="resistance">{{ resistance }}: {{ value }}</li></ul></section>
    <section><h5>Requirements</h5><p v-if="!model.requirements.length">None</p><ul v-else><li v-for="requirement in model.requirements" :key="requirement">{{ requirement }}</li></ul></section>
    <section><h5>Effects</h5><p v-if="!model.effects.length">None</p><ul v-else><li v-for="effect in model.effects" :key="effect">{{ effect }}</li></ul></section>
  </article>
</template>

<style scoped>
.item-tooltip{width:min(22rem,100%);padding:1rem;border:1px solid #818cf8;border-radius:.55rem;background:#060b16;color:#e2e8f0;box-shadow:0 1rem 3rem #000}.item-tooltip__icon{float:left;display:grid;width:3rem;height:3rem;margin-right:.75rem;place-items:center;border:1px solid #475569;background:#111827;font-size:1.5rem}.item-tooltip h4{font-size:1.15rem;font-weight:900}.item-tooltip header p,.item-tooltip dt{color:#94a3b8}.item-tooltip header strong{color:#fbbf24}.item-tooltip>p{clear:both;padding-top:.8rem}.item-tooltip dl,.item-tooltip section{margin-top:.7rem;padding-top:.55rem;border-top:1px solid #334155}.item-tooltip dl div{display:flex;justify-content:space-between}.item-tooltip h5{color:#c4b5fd;font-weight:800}.item-tooltip ul{padding-left:1rem;list-style:disc}
</style>
