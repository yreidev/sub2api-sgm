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
.auth-wrap {
  display: flex;
  justify-content: center;
  padding-block: clamp(1.75rem, 6vw, 4.25rem);
}

.auth-card[data-slot="card"] {
  display: block;
  isolation: isolate;
  position: relative;
  width: min(100%, 31rem);
  padding: clamp(1.375rem, 4vw, 2.5rem);
  border: 1px solid var(--line);
  border-radius: 18px;
  background: var(--panel);
  box-shadow: var(--shadow-card), var(--shadow-inset-top);
  overflow-wrap: anywhere;
}

.auth-card::before {
  position: absolute;
  content: "";
  z-index: -1;
  inset: 0 0 auto auto;
  width: 50%;
  height: 5.5rem;
  border-top-right-radius: inherit;
  background: url('../../assets/sgm-balance-wave.webp') center / cover;
  opacity: var(--wave-opacity);
  mix-blend-mode: multiply;
  mask-image: linear-gradient(212deg, #000 10%, transparent 72%);
  pointer-events: none;
}

.dark .auth-card::before {
  mix-blend-mode: screen;
  filter: invert(1) hue-rotate(180deg) brightness(1.4);
}

.auth-card :deep(.auth-heading) {
  margin: 0;
  font-size: clamp(1.6875rem, 4vw, 1.9375rem);
  line-height: 1.22;
  font-weight: 500;
  letter-spacing: -0.03em;
  text-wrap: balance;
  color: var(--ink);
}

.auth-card :deep(.auth-intro) {
  margin-top: 0.5rem;
  font-size: 0.9375rem;
  line-height: 1.6;
  color: var(--muted);
}

.auth-card :deep(.auth-text) {
  color: var(--ink);
}

.auth-card :deep(.auth-muted),
.auth-card :deep(.auth-footer-text) {
  color: var(--muted);
}

.auth-card :deep(.auth-emphasis) {
  font-weight: 500;
  color: var(--ink);
}

.auth-card :deep(.auth-optional) {
  margin-inline-start: 0.25rem;
  font-size: 0.75rem;
  font-weight: 400;
  color: var(--muted);
}

.auth-card :deep(.input-label) {
  display: block;
  margin-bottom: 0.4375rem;
  font-size: 0.9375rem;
  font-weight: 500;
  line-height: 1.4;
  letter-spacing: -0.005em;
  color: var(--ink);
}

.auth-card :deep(.input-hint) {
  margin-top: 0.375rem;
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--muted);
}

.auth-card :deep(.input[data-slot="input"]),
.auth-card :deep(.input) {
  min-height: 46px;
  border-radius: 10px;
  border: 1px solid var(--field-line);
  background: var(--field);
  color: var(--ink);
  font-size: 1rem;
  box-shadow: var(--shadow-xs);
  transition:
    border-color var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out),
    background-color var(--duration-fast) var(--ease-out);
}

.auth-card :deep(.input[data-slot="input"]::placeholder),
.auth-card :deep(.input::placeholder) {
  color: var(--muted);
  opacity: 1;
}

.auth-card :deep(.input[data-slot="input"]:hover:not(:disabled):not([readonly]):not(:focus):not(.input-error)),
.auth-card :deep(.input:hover:not(:disabled):not([readonly]):not(:focus):not(.input-error)) {
  border-color: var(--field-line-hover);
  background: var(--field);
}

.auth-card :deep(.input[data-slot="input"]:focus),
.auth-card :deep(.input[data-slot="input"][data-focused="true"]),
.auth-card :deep(.input:focus) {
  outline: 2px solid transparent;
  outline-offset: 2px;
  border-color: var(--focus);
  background: var(--field);
  box-shadow: var(--ring-focus);
}

.auth-card :deep(.input[data-slot="input"].input-error),
.auth-card :deep(.input.input-error) {
  border-color: #dc2626;
}

.auth-card :deep(.input[data-slot="input"].input-error:hover:not(:disabled):not([readonly])),
.auth-card :deep(.input.input-error:hover:not(:disabled):not([readonly])) {
  border-color: #b91c1c;
}

.auth-card :deep(.input[data-slot="input"].input-error:focus),
.auth-card :deep(.input[data-slot="input"].input-error[data-focused="true"]),
.auth-card :deep(.input.input-error:focus) {
  border-color: #dc2626;
  box-shadow: 0 0 0 3px rgb(220 38 38 / 16%);
}

.dark .auth-card :deep(.input[data-slot="input"].input-error),
.dark .auth-card :deep(.input.input-error) {
  border-color: #f87171;
}

.dark .auth-card :deep(.input[data-slot="input"].input-error:hover:not(:disabled):not([readonly])),
.dark .auth-card :deep(.input.input-error:hover:not(:disabled):not([readonly])) {
  border-color: #fca5a5;
}

.dark .auth-card :deep(.input[data-slot="input"].input-error:focus),
.dark .auth-card :deep(.input[data-slot="input"].input-error[data-focused="true"]),
.dark .auth-card :deep(.input.input-error:focus) {
  border-color: #f87171;
  box-shadow: 0 0 0 3px rgb(248 113 113 / 24%);
}

.auth-card :deep(.input[data-slot="input"].auth-input-valid),
.auth-card :deep(.input.auth-input-valid) {
  border-color: #059669;
}

.auth-card :deep(.input[data-slot="input"].auth-input-valid:focus),
.auth-card :deep(.input[data-slot="input"].auth-input-valid[data-focused="true"]),
.auth-card :deep(.input.auth-input-valid:focus) {
  border-color: #059669;
  box-shadow: 0 0 0 3px rgb(5 150 105 / 16%);
}

.dark .auth-card :deep(.input[data-slot="input"].auth-input-valid),
.dark .auth-card :deep(.input.auth-input-valid) {
  border-color: #34d399;
}

.dark .auth-card :deep(.input[data-slot="input"].auth-input-valid:focus),
.dark .auth-card :deep(.input[data-slot="input"].auth-input-valid[data-focused="true"]),
.dark .auth-card :deep(.input.auth-input-valid:focus) {
  border-color: #34d399;
  box-shadow: 0 0 0 3px rgb(52 211 153 / 22%);
}

.auth-card :deep(.input[data-slot="input"][readonly]),
.auth-card :deep(.input[readonly]),
.auth-card :deep(.input[data-slot="input"]:disabled),
.auth-card :deep(.input:disabled) {
  background: var(--panel-subtle);
  border-color: var(--line);
  color: var(--muted);
  box-shadow: none;
}

.auth-card :deep(.input[data-slot="input"][readonly]),
.auth-card :deep(.input[readonly]) {
  opacity: 1;
}

.auth-card :deep(.input[data-slot="input"]:disabled:not([readonly])),
.auth-card :deep(.input:disabled:not([readonly])) {
  opacity: 0.72;
  cursor: not-allowed;
}

.auth-card :deep(.input[data-slot="input"].pl-11),
.auth-card :deep(.input.pl-11) {
  padding-inline-start: 2.75rem;
}

.auth-card :deep(.input[data-slot="input"].pr-10),
.auth-card :deep(.input.pr-10) {
  padding-inline-end: 2.5rem;
}

.auth-card :deep(.input[data-slot="input"].pr-11),
.auth-card :deep(.input.pr-11) {
  padding-inline-end: 2.75rem;
}

.auth-card :deep(.auth-input-icon),
.auth-card :deep(.relative > .pointer-events-none svg:not(.auth-input-icon-valid)) {
  color: var(--muted);
  opacity: 0.88;
  transition:
    color var(--duration-fast) var(--ease-out),
    opacity var(--duration-fast) var(--ease-out);
}

.auth-card :deep(.relative:focus-within .auth-input-icon),
.auth-card :deep(.relative:focus-within > .pointer-events-none svg:not(.auth-input-icon-valid)) {
  color: var(--accent);
  opacity: 1;
}

.auth-card :deep(.auth-input-icon-valid) {
  color: #059669;
  opacity: 1;
}

.dark .auth-card :deep(.auth-input-icon-valid) {
  color: #34d399;
}

.auth-card :deep(.button.absolute) {
  position: absolute;
  inset-block: 0;
  inset-inline-end: 0;
  height: 100%;
  min-width: 44px;
  padding-inline: 0.625rem;
  border-radius: 0 10px 10px 0;
  background: transparent;
  --button-bg: transparent;
  --button-bg-hover: transparent;
  --button-bg-pressed: transparent;
  color: var(--muted);
  transition: color var(--duration-fast) var(--ease-out);
}

.auth-card :deep(.button.absolute:hover:not(:disabled)),
.auth-card :deep(.button.absolute[data-hovered="true"]:not(:disabled)) {
  color: var(--ink);
  background: transparent;
}

.auth-card :deep(.button.absolute:focus-visible),
.auth-card :deep(.button.absolute[data-focus-visible="true"]) {
  outline: 2px solid transparent;
  outline-offset: -2px;
  color: var(--accent);
  box-shadow: inset 0 0 0 2px var(--focus);
}

.auth-card :deep(.btn-primary) {
  min-height: 46px;
  border-radius: 10px;
  border: 1px solid transparent;
  font-size: 0.9375rem;
  font-weight: 500;
  --button-bg: var(--accent);
  --button-bg-hover: var(--accent-hover);
  --button-bg-pressed: var(--accent-active);
  --button-fg: var(--on-accent);
  color: var(--on-accent);
  background: var(--accent);
  background-image: none;
  box-shadow: var(--shadow-btn-primary);
  transition:
    background-color var(--duration-fast) var(--ease-out),
    border-color var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out),
    transform var(--duration-fast) var(--ease-out),
    opacity var(--duration-fast) var(--ease-out);
}

.auth-card :deep(.btn-primary:hover:not(:disabled)),
.auth-card :deep(.btn-primary[data-hovered="true"]:not(:disabled)) {
  background: var(--accent-hover);
  background-image: none;
  filter: none;
}

.auth-card :deep(.btn-primary:active:not(:disabled)),
.auth-card :deep(.btn-primary[data-pressed="true"]:not(:disabled)) {
  background: var(--accent-active);
  transform: scale(0.985);
}

.auth-card :deep(.btn-primary:focus-visible),
.auth-card :deep(.btn-primary[data-focus-visible="true"]) {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
  box-shadow: var(--ring-focus);
}

.auth-card :deep(.btn-primary:disabled) {
  opacity: 0.56;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

.auth-card :deep(.btn-secondary) {
  min-height: 46px;
  border-radius: 10px;
  border: 1px solid var(--field-line);
  font-size: 0.9375rem;
  font-weight: 500;
  --button-bg: var(--panel-elevated);
  --button-bg-hover: var(--tint);
  --button-bg-pressed: var(--tint-strong);
  --button-fg: var(--ink);
  color: var(--ink);
  background: var(--panel-elevated);
  background-image: none;
  box-shadow: var(--shadow-xs), var(--shadow-inset-top);
  transition:
    background-color var(--duration-fast) var(--ease-out),
    border-color var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out),
    transform var(--duration-fast) var(--ease-out),
    opacity var(--duration-fast) var(--ease-out);
}

.auth-card :deep(.btn-secondary:hover:not(:disabled)),
.auth-card :deep(.btn-secondary[data-hovered="true"]:not(:disabled)) {
  background: var(--tint);
  border-color: var(--field-line-hover);
  color: var(--ink);
  box-shadow: var(--shadow-xs);
}

.dark .auth-card :deep(.btn-secondary) {
  --button-bg-hover: var(--tint-strong);
  --button-bg-pressed: var(--tint);
}

.dark .auth-card :deep(.btn-secondary:hover:not(:disabled)),
.dark .auth-card :deep(.btn-secondary[data-hovered="true"]:not(:disabled)) {
  background: var(--tint-strong);
  border-color: var(--field-line-hover);
}

.auth-card :deep(.btn-secondary:active:not(:disabled)),
.auth-card :deep(.btn-secondary[data-pressed="true"]:not(:disabled)) {
  background: var(--tint-strong);
  transform: scale(0.985);
}

.auth-card :deep(.btn-secondary:focus-visible),
.auth-card :deep(.btn-secondary[data-focus-visible="true"]) {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
  border-color: var(--focus);
  box-shadow: var(--ring-focus);
}

.auth-card :deep(.btn-secondary:disabled) {
  opacity: 0.55;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

.auth-card :deep(.auth-divider) {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.auth-card :deep(.auth-divider-line) {
  height: 1px;
  flex: 1;
  background: var(--line);
}

.auth-card :deep(.auth-divider-label) {
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.01em;
  color: var(--muted);
}

.auth-card :deep(.auth-subpanel) {
  border-radius: 14px;
  border: 1px solid var(--line);
  background: var(--panel-subtle);
  padding: 1rem;
}

.auth-card :deep(.auth-option-card) {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: var(--panel);
  padding: 0.75rem;
  font-size: 0.875rem;
  color: var(--ink);
  transition:
    border-color var(--duration-fast) var(--ease-out),
    background-color var(--duration-fast) var(--ease-out);
}

.auth-card :deep(.auth-option-card:hover) {
  border-color: var(--line-strong);
  background: var(--tint);
}

.auth-card :deep(.auth-avatar) {
  border: 1px solid var(--line);
}

.auth-card :deep(.auth-resend-countdown) {
  cursor: not-allowed;
  font-size: 0.875rem;
  font-variant-numeric: tabular-nums;
  color: var(--muted);
  opacity: 0.78;
}

.auth-card :deep(.auth-resend-btn) {
  min-height: 44px;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--accent);
  border-radius: 10px;
  padding-inline: 0.75rem;
  --button-bg: transparent;
  --button-bg-hover: var(--tint);
  --button-bg-pressed: var(--tint-strong);
  --button-fg: var(--accent);
  transition:
    color var(--duration-fast) var(--ease-out),
    background-color var(--duration-fast) var(--ease-out);
}

.auth-card :deep(.auth-resend-btn:hover:not(:disabled)),
.auth-card :deep(.auth-resend-btn[data-hovered="true"]:not(:disabled)) {
  color: var(--accent-hover);
  background: var(--tint);
}

.auth-links {
  margin-top: 1.5rem;
  padding-top: 1.125rem;
  border-top: 1px solid var(--line-subtle);
  font-size: 0.9375rem;
  text-align: center;
  color: var(--muted);
}

.auth-links :deep(a),
.auth-card :deep(.auth-link),
.auth-card :deep(a.text-primary-600) {
  color: var(--accent);
  font-weight: 500;
  text-underline-offset: 4px;
  transition: color var(--duration-fast) var(--ease-out);
}

.auth-links :deep(a:hover),
.auth-card :deep(.auth-link:hover),
.auth-card :deep(a.text-primary-600:hover) {
  color: var(--accent-hover);
  text-decoration: underline;
}

.auth-links :deep(a) {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
}

.auth-links :deep(.auth-back-btn) {
  margin-inline: auto;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 44px;
  padding-inline: 0.75rem;
  border-radius: 10px;
  color: var(--muted);
  --button-bg: transparent;
  --button-bg-hover: var(--tint);
  --button-bg-pressed: var(--tint-strong);
  --button-fg: var(--muted);
  transition:
    color var(--duration-fast) var(--ease-out),
    background-color var(--duration-fast) var(--ease-out);
}

.auth-links :deep(.auth-back-btn:hover:not(:disabled)),
.auth-links :deep(.auth-back-btn[data-hovered="true"]:not(:disabled)) {
  color: var(--ink);
  background: var(--tint);
}

@media (prefers-reduced-motion: reduce) {
  .auth-card :deep(.input[data-slot="input"]),
  .auth-card :deep(.input),
  .auth-card :deep(.auth-input-icon),
  .auth-card :deep(.relative > .pointer-events-none svg:not(.auth-input-icon-valid)),
  .auth-card :deep(.button.absolute),
  .auth-card :deep(.btn-primary),
  .auth-card :deep(.btn-secondary),
  .auth-card :deep(.auth-option-card),
  .auth-card :deep(.auth-resend-btn),
  .auth-links :deep(a),
  .auth-card :deep(.auth-link),
  .auth-card :deep(a.text-primary-600),
  .auth-links :deep(.auth-back-btn) {
    transition: none;
  }

  .auth-card :deep(.btn-primary:active:not(:disabled)),
  .auth-card :deep(.btn-primary[data-pressed="true"]:not(:disabled)),
  .auth-card :deep(.btn-secondary:active:not(:disabled)),
  .auth-card :deep(.btn-secondary[data-pressed="true"]:not(:disabled)) {
    transform: none;
  }
}
</style>
