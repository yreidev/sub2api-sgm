<template>
  <PublicLayout>
    <div class="auth-wrap">
      <HeroCard class="auth-card">
        <slot />
        <div v-if="$slots.footer" class="auth-links"><slot name="footer" /></div>
      </HeroCard>
    </div>
  </PublicLayout>
</template>

<script setup lang="ts">
import HeroCard from '@/components/hero/HeroCard.vue'
import PublicLayout from './PublicLayout.vue'
</script>

<style scoped>
.auth-wrap { display: flex; justify-content: center; padding-block: clamp(1.5rem, 6vw, 4.25rem); }
.auth-card[data-slot="card"] { display: block;
  isolation: isolate;
  position: relative;
  width: min(100%, 31rem);
  padding: clamp(1.25rem, 4vw, 2.5rem);
  border: 1px solid var(--line);
  border-radius: 18px;
  background: var(--panel);
  overflow-wrap: anywhere;
}
.auth-card::before {
  position: absolute;
  content: "";
  z-index: -1;
  inset: 0 0 auto auto;
  width: 48%;
  height: 5rem;
  border-top-right-radius: inherit;
  background: url('../../assets/sgm-balance-wave.webp') center / cover;
  opacity: var(--wave-opacity);
  mask-image: linear-gradient(210deg, #000, transparent 68%);
}
.auth-card :deep(.auth-heading) { margin: 0; font-size: clamp(1.75rem, 4vw, 2rem); line-height: 1.23; font-weight: 500; letter-spacing: -.03em; color: var(--ink); }
.auth-card :deep(.auth-intro) { margin-top: .5rem; line-height: 1.55; color: var(--muted); }
.auth-card :deep(.input-label) { font-size: .9375rem; font-weight: 500; color: var(--ink); }
.auth-card :deep(.input) { min-height: 46px; border-radius: 10px; background: var(--field); color: var(--ink); font-size: 1rem; }
.auth-card :deep(.input:not(.input-error)) { border-color: var(--field-line); }
.auth-card :deep(.input:focus) { outline: 2px solid var(--focus); outline-offset: 1px; box-shadow: none; }
.auth-card :deep(.input.pl-11) { padding-inline-start: 2.75rem; }
.auth-card :deep(.input.pr-11) { padding-inline-end: 2.75rem; }
.auth-card :deep(.button.absolute) { position: absolute; inset-block: 0; inset-inline-end: 0; height: 100%; min-width: 44px; padding-inline: .625rem; }
.auth-card :deep(.input-hint) { color: var(--muted); }
.auth-card :deep(.btn-primary) { min-height: 46px; border-radius: 10px; color: var(--on-accent); background: var(--accent); box-shadow: none; }
.auth-card :deep(.btn-primary:hover:not(:disabled)) { filter: brightness(.93); }
.auth-links { margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--line); font-size: .9375rem; text-align: center; }
.auth-links :deep(a), .auth-card :deep(a.text-primary-600) { color: var(--accent); }
.auth-links :deep(a) { display: inline-flex; align-items: center; min-height: 44px; }
</style>
