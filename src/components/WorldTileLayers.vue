<script setup>
defineProps({ presentation: { type: Object, required: true } })
</script>

<template>
  <span class="world-layer world-layer--ground" :style="presentation.groundStyle" aria-hidden="true" />
  <span v-if="presentation.transitionColors.length" class="world-layer world-layer--transitions" aria-hidden="true">
    <i v-for="transition in presentation.transitionColors" :key="transition.direction" :class="`transition transition--${transition.direction}`" :style="{ '--transition-color': transition.color }" />
  </span>
  <span v-if="presentation.road" class="world-layer world-layer--roads" :class="`road--${presentation.road.type}`" aria-hidden="true">
    <i class="road-core" />
    <i v-for="direction in ['north', 'east', 'south', 'west']" v-show="presentation.road.connections[direction]" :key="direction" :class="`road-arm road-arm--${direction}`" />
  </span>
  <span v-if="presentation.detail" class="world-layer world-layer--details" :class="`detail--${presentation.detail.type}`" :style="{ '--detail-x': `${presentation.detail.x}%`, '--detail-y': `${presentation.detail.y}%` }" aria-hidden="true" />
  <span v-if="presentation.object?.shadow" class="world-layer world-layer--shadow" aria-hidden="true" />
  <span v-if="presentation.object" class="world-layer world-layer--object" :class="[`object--${presentation.object.type}`, `world-layer--${presentation.object.layer}`]" :style="{ '--object-scale': presentation.object.scale }" aria-hidden="true" />
</template>

<style scoped>
.world-layer { position:absolute; inset:0; pointer-events:none; }
.world-layer--ground { z-index:0; background-repeat:no-repeat; image-rendering:pixelated; }
.world-layer--transitions { z-index:1; overflow:hidden; }
.transition { position:absolute; display:block; background:var(--transition-color); opacity:.32; filter:blur(calc(var(--tile-size) * .055)); }
.transition--north,.transition--south { left:-6%; width:112%; height:18%; }
.transition--north { top:-8%; border-radius:0 0 55% 45%; }.transition--south { bottom:-8%; border-radius:45% 55% 0 0; }
.transition--east,.transition--west { top:-6%; width:18%; height:112%; }
.transition--east { right:-8%; border-radius:55% 0 0 45%; }.transition--west { left:-8%; border-radius:0 45% 55% 0; }
.world-layer--roads { z-index:2; }
.road-core,.road-arm { position:absolute; display:block; background:#7b6547; box-shadow:inset 0 0 0 1px rgb(42 35 27 / 28%); }
.road-core { inset:31%; border-radius:42%; transform:rotate(-3deg); }
.road-arm--north,.road-arm--south { left:35%; width:30%; height:51%; }.road-arm--north{top:0}.road-arm--south{bottom:0}
.road-arm--east,.road-arm--west { top:35%; width:51%; height:30%; }.road-arm--east{right:0}.road-arm--west{left:0}
.road--gravel .road-core,.road--gravel .road-arm { background:#777365; }
.road--stone .road-core,.road--stone .road-arm,.road--stone-bridge .road-core,.road--stone-bridge .road-arm { background:#686b68; }
.road--wood-bridge .road-core,.road--wood-bridge .road-arm { background:repeating-linear-gradient(90deg,#76583a 0 12%,#4b3828 13% 16%); }
.world-layer--details { z-index:3; background:radial-gradient(circle at var(--detail-x) var(--detail-y),rgb(230 220 148 / 48%) 0 2%,transparent 3%),radial-gradient(circle at calc(var(--detail-x) - 13%) calc(var(--detail-y) + 9%),rgb(32 45 29 / 45%) 0 3%,transparent 4%); opacity:.72; }
.detail--water { background:linear-gradient(165deg,transparent 42%,rgb(151 205 213 / 22%) 45% 48%,transparent 51%); }
.world-layer--shadow { z-index:4; inset:auto 18% 12%; height:24%; border-radius:50%; background:rgb(0 0 0 / 32%); filter:blur(3px); }
.world-layer--object { z-index:5; inset:auto 15% 12%; height:64%; transform:scale(var(--object-scale)); transform-origin:bottom; filter:drop-shadow(0 4px 2px rgb(0 0 0 / 45%)); }
.object--tree,.object--pine,.object--birch { border-radius:48% 52% 42% 45%; background:#183923; box-shadow:inset -12px -8px #10281a; }
.object--pine { clip-path:polygon(50% 0,82% 34%,68% 34%,94% 72%,61% 69%,58% 100%,42% 100%,39% 69%,7% 72%,32% 34%,18% 34%); }
.object--birch { background:#426344; box-shadow:inset 0 -8px #263f2d; }
.object--rock,.object--ruins,.object--shrine,.object--cave { border-radius:35% 42% 18% 20%; background:#55584f; box-shadow:inset -8px -9px #353934; }
.object--cave { border:calc(var(--tile-size) * .1) solid #57594f; border-bottom:0; border-radius:50% 50% 10% 10%; background:#101511; box-shadow:none; }
.object--village,.object--city,.object--camp { clip-path:polygon(50% 4%,96% 43%,84% 43%,84% 100%,16% 100%,16% 43%,4% 43%); background:#765638; box-shadow:inset -9px -8px #4b382a; }
.object--city { background:#67665d; }.object--camp { background:#6b5138; }
</style>
