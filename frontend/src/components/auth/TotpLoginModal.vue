<template>
  <HeroModal :label="t('profile.totp.loginTitle')" :dismissible="!verifying" @close="$emit('cancel')">
    <!-- Header -->
    <div class="mb-6 text-center">
      <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
        <svg class="h-6 w-6 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      </div>
      <h3 class="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
        {{ t('profile.totp.loginTitle') }}
      </h3>
      <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
        {{ t('profile.totp.loginHint') }}
      </p>
      <p v-if="userEmailMasked" class="mt-1 text-sm font-medium text-gray-700 dark:text-gray-300">
        {{ userEmailMasked }}
      </p>
    </div>

    <!-- Code Input -->
    <div class="mb-6">
      <div ref="otpHost" class="flex justify-center"></div>
      <!-- Loading indicator -->
      <div v-if="verifying" class="mt-3 flex items-center justify-center gap-2 text-sm text-gray-500">
        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500"></div>
        {{ t('common.verifying') }}
      </div>
    </div>

    <!-- Cancel button only -->
    <HeroButton variant="secondary"
      type="button"
      full-width class="btn btn-secondary"
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
