<template>
  <HeroModal :label="t('profile.totp.loginTitle')" :dismissible="!verifying" @close="$emit('cancel')">
    <!-- Header -->
    <div class="mb-6 text-center">
      <div class="totp-badge mx-auto flex h-12 w-12 items-center justify-center rounded-2xl">
        <svg class="h-6 w-6" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.6">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      </div>
      <h3 class="totp-title mt-4">
        {{ t('profile.totp.loginTitle') }}
      </h3>
      <p class="totp-hint mt-2">
        {{ t('profile.totp.loginHint') }}
      </p>
      <p v-if="userEmailMasked" class="totp-account mt-2.5">
        {{ userEmailMasked }}
      </p>
    </div>

    <!-- Code Input -->
    <div class="mb-6">
      <div ref="otpHost" class="totp-otp-host flex justify-center"></div>
      <!-- Loading indicator -->
      <div v-if="verifying" role="status" aria-live="polite" class="totp-verifying mt-3.5 flex items-center justify-center gap-2 text-sm">
        <div class="totp-spinner h-4 w-4 animate-spin motion-reduce:animate-none rounded-full" aria-hidden="true"></div>
        {{ t('common.verifying') }}
      </div>
    </div>

    <!-- Cancel button only -->
    <HeroButton variant="secondary"
      type="button"
      full-width class="btn btn-secondary totp-cancel-btn"
      :disabled="verifying"
      @press="$emit('cancel')"
    >
      {{ t('common.cancel') }}
    </HeroButton>
  </HeroModal>
</template>

<script setup lang="ts">
import HeroButton from '@/components/hero/HeroButton.vue'
import HeroModal from '@/components/hero/HeroModal.vue'
import { ref, nextTick } from 'vue'
import { createElement as h } from 'react'
import { InputOTP } from '@heroui/react'
import { useReactHost } from '@/components/hero/useReactHost'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores'

defineProps<{
  tempToken: string
  userEmailMasked?: string
}>()

const emit = defineEmits<{
  verify: [code: string]
  cancel: []
}>()

const { t } = useI18n()
const appStore = useAppStore()

const verifying = ref(false)
const code = ref('')
let input: HTMLInputElement | null = null
const setInput = (el: HTMLInputElement | null) => { input = el }
const otpHost = useReactHost(() => h(InputOTP, {
  maxLength: 6, inputMode: 'numeric', pattern: '^[0-9]*$', autoComplete: 'one-time-code',
  'aria-label': t('profile.totp.loginTitle'), autoFocus: true, ref: setInput,
  value: code.value, isDisabled: verifying.value,
  pasteTransformer: text => text.replace(/[^0-9]/g, '').slice(0, 6),
  onChange: value => {
    code.value = value
    if (value.length === 6 && !verifying.value) emit('verify', value)
  },
  children: h(InputOTP.Group, null, Array.from({ length: 6 }, (_, index) => h(InputOTP.Slot, { key: index, index }))),
}))

defineExpose({
  setVerifying: (value: boolean) => { verifying.value = value },
  setError: (message: string) => {
    if (message) appStore.showError(message)
    code.value = ''
    nextTick(() => input?.focus())
  },
})
</script>

<style scoped>
.totp-badge {
  border: 1px solid var(--line);
  background: var(--tint);
  color: var(--accent);
  box-shadow: var(--shadow-xs);
}

.totp-title {
  margin: 0;
  font-size: 1.25rem;
  line-height: 1.3;
  font-weight: 600;
  letter-spacing: -0.02em;
  text-wrap: balance;
  color: var(--ink);
}

.totp-hint {
  font-size: 0.875rem;
  line-height: 1.55;
  color: var(--muted);
}

.totp-account {
  display: inline-block;
  border-radius: 9999px;
  border: 1px solid var(--line-subtle);
  background: var(--panel-subtle);
  padding: 0.25rem 0.75rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--ink);
}

.totp-otp-host :deep(.input-otp) {
  justify-content: center;
  width: 100%;
  max-width: 19rem;
}

.totp-otp-host :deep(.input-otp__group) {
  width: 100%;
  max-width: 19rem;
  gap: 0.5rem;
}

.totp-otp-host :deep(.input-otp__slot) {
  flex: 1 1 0;
  min-width: 0;
  max-width: 2.75rem;
  height: 3.125rem;
  border-radius: 10px;
  border: 1px solid var(--field-line);
  background: var(--field);
  color: var(--ink);
  box-shadow: var(--shadow-xs);
  font-family: "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
  font-variant-numeric: tabular-nums;
  transition:
    border-color var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out),
    background-color var(--duration-fast) var(--ease-out);
}

@media (max-width: 419px) {
  .totp-otp-host :deep(.input-otp__group) {
    gap: 0.375rem;
  }
}

.totp-otp-host :deep(.input-otp__slot:hover),
.totp-otp-host :deep(.input-otp__slot[data-hovered="true"]) {
  border-color: var(--field-line-hover);
  background: var(--field);
}

.totp-otp-host :deep(.input-otp__slot[data-filled="true"]) {
  border-color: var(--line-strong);
  background: var(--panel);
}

.totp-otp-host :deep(.input-otp__slot[data-active="true"]) {
  border-color: var(--focus);
  background: var(--panel);
  box-shadow: var(--ring-focus);
}

.totp-otp-host :deep(.input-otp__slot-value) {
  font-size: 1.25rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--ink);
}

.totp-otp-host :deep(.input-otp__caret) {
  background: var(--accent);
}

.totp-verifying {
  color: var(--muted);
}

.totp-spinner {
  border: 2px solid var(--line);
  border-top-color: var(--accent);
}

.totp-cancel-btn {
  min-height: 46px;
  border-radius: 10px;
  border: 1px solid var(--field-line);
  font-size: 0.9375rem;
  font-weight: 500;
  --button-bg: var(--panel-elevated);
  --button-bg-hover: var(--tint);
  --button-bg-pressed: var(--tint-strong);
  --button-fg: var(--ink);
  background: var(--panel-elevated);
  background-image: none;
  color: var(--ink);
  box-shadow: var(--shadow-xs), var(--shadow-inset-top);
  transition:
    background-color var(--duration-fast) var(--ease-out),
    border-color var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out),
    transform var(--duration-fast) var(--ease-out);
}

.totp-cancel-btn:hover:not(:disabled),
.totp-cancel-btn[data-hovered="true"]:not(:disabled) {
  background: var(--tint);
  border-color: var(--field-line-hover);
}

.dark .totp-cancel-btn {
  --button-bg-hover: var(--tint-strong);
  --button-bg-pressed: var(--tint);
}

.dark .totp-cancel-btn:hover:not(:disabled),
.dark .totp-cancel-btn[data-hovered="true"]:not(:disabled) {
  background: var(--tint-strong);
  border-color: var(--field-line-hover);
}

.totp-cancel-btn:active:not(:disabled),
.totp-cancel-btn[data-pressed="true"]:not(:disabled) {
  background: var(--tint-strong);
  transform: scale(0.985);
}

button.totp-cancel-btn:focus-visible,
button.totp-cancel-btn[data-focus-visible="true"] {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
  border-color: var(--focus);
  box-shadow: var(--ring-focus);
}

@media (prefers-reduced-motion: reduce) {
  .totp-otp-host :deep(.input-otp__slot),
  .totp-cancel-btn {
    transition: none;
  }

  .totp-spinner {
    animation: none;
  }

  .totp-cancel-btn:active:not(:disabled),
  .totp-cancel-btn[data-pressed="true"]:not(:disabled) {
    transform: none;
  }
}
</style>
