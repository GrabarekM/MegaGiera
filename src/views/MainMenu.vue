<script setup>
import GameButton from '../components/GameButton.vue'
import { gameConfig } from '../data/gameConfig.js'
import brickBackground from '../assets/dark-brick-wall.png'

defineProps({ saveInfo: { type: Object, default: null }, saveError: { type: String, default: '' }, busy: Boolean })
defineEmits(['new-run', 'quick-start', 'continue', 'delete-save'])
</script>

<template>
  <main class="main-menu" :style="{ backgroundImage: `url(${brickBackground})` }">
    <header class="main-menu__header">
      <p>Procedural Adventure RPG</p>
      <h1>{{ gameConfig.title }}</h1>
      <span>Every road begins with a choice.</span>
    </header>
    <section class="main-menu__body">
      <div class="menu-frame">
        <div class="menu-frame__ornament" aria-hidden="true"></div>
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
        <div data-testid="main-new-run"><GameButton label="New Game" :disabled="busy" @click="$emit('new-run')" /></div>
        <div data-testid="main-quick-start"><GameButton label="Quick Start (DEV)" :disabled="busy" @click="$emit('quick-start')" /></div>
        <div data-testid="main-continue"><GameButton label="Continue" :disabled="busy || !saveInfo" @click="$emit('continue')" /></div>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.main-menu{display:grid;min-height:100dvh;grid-template-rows:auto 1fr;padding:clamp(1rem,3vw,2.5rem);background-color:var(--ui-ink);background-repeat:repeat;background-size:520px;background-blend-mode:multiply;color:var(--ui-text)}.main-menu__header{display:grid;place-items:center;padding:clamp(1.5rem,6vh,4rem) 1rem 1rem;text-align:center}.main-menu__header p{color:var(--ui-gold);font-size:.72rem;font-weight:900;letter-spacing:.28em;text-transform:uppercase}.main-menu__header h1{margin:.35rem 0;color:var(--ui-parchment-light);font:900 clamp(3rem,7vw,6.2rem)/1 var(--ui-font-display);letter-spacing:.04em;text-shadow:0 4px 12px #000}.main-menu__header span{color:var(--ui-text-muted);font:italic .95rem var(--ui-font-display)}.main-menu__body{display:grid;place-items:start center;padding:clamp(1rem,5vh,3.5rem) 1rem}.menu-frame{position:relative;width:min(27rem,100%);padding:1.15rem;border:1px solid var(--ui-leather);border-radius:.25rem;background:var(--ui-wood);box-shadow:var(--ui-frame-shadow)}.menu-frame__ornament{height:.35rem;margin-bottom:1rem;border-block:1px solid #9b7042;background:var(--ui-wood-raised)}.menu-actions{display:grid;gap:.8rem;text-align:center}.menu-actions>div[data-testid] :deep(.game-button){width:100%;min-width:0;padding:.7rem 1rem;border:1px solid #9b7042;border-radius:.15rem;background:#54361f;color:#f0d99a;box-shadow:inset 0 0 0 2px #2b1d13;font:800 1.05rem var(--ui-font-display)}.menu-actions>div[data-testid] :deep(.game-button:hover:not(:disabled)){transform:none;border-color:#d4a353;background:#6b4728}.menu-actions>div[data-testid] :deep(.game-button:active:not(:disabled)){transform:translateY(1px)}.menu-actions>div[data-testid] :deep(.game-button:disabled){border-color:#594b3c;background:#332d27;color:#817563;opacity:1}.save-summary,.save-error{display:grid;gap:.35rem;padding:.8rem;border:1px solid #80603d;border-radius:.15rem;background:var(--ui-parchment);color:var(--ui-ink-on-parchment)}.save-summary strong,.save-error strong{font-family:var(--ui-font-display)}.save-summary small{color:#6d5940}.save-error{border-color:#9b493e;background:#d4b496;color:#5a211c}.save-error button{margin-top:.4rem;padding:.5rem;border:1px solid #9b493e;border-radius:.12rem;background:#6b2d25;color:#f4ded1}.save-error button:hover{background:#7d382e}@media(max-width:600px){.main-menu__header{padding-top:2rem}.main-menu__body{padding-top:1rem}}
.main-menu{background-color:#202225;background-blend-mode:normal}
.menu-frame__ornament{border-color:#777871;background:#3b3e40}
.menu-actions>div[data-testid] :deep(.game-button){border-color:#777871;background:#3b3e40;color:#e8dfbd;box-shadow:inset 0 0 0 2px #202225}
.menu-actions>div[data-testid] :deep(.game-button:hover:not(:disabled)){border-color:#b8aa61;background:#505149}
.menu-actions>div[data-testid] :deep(.game-button:disabled){border-color:#505250;background:#292b2e;color:#7f8079}
</style>
