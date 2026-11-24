<template><div ref="host" class="min-w-0"></div></template>

<script setup lang="ts">
import { createElement } from 'react'
import { PaymentControl, type PaymentControlProps } from './PaymentControls'
import { useReactHost } from '@/components/hero/useReactHost'

const props = withDefaults(defineProps<Omit<PaymentControlProps, 'onInput' | 'onPress'>>(), { selected: undefined })
const emit = defineEmits<{ press: []; input: [value: string] }>()
const host = useReactHost(() => createElement(PaymentControl, {
  ...props,
  onPress: () => emit('press'),
  onInput: (value: string) => emit('input', value),
}))
</script>

<style scoped>
:deep(.sgm-payment-action) {
  transition: background-color var(--duration-fast, 150ms) var(--ease-out, cubic-bezier(0.22, 1, 0.36, 1)),
    border-color var(--duration-fast, 150ms) var(--ease-out, cubic-bezier(0.22, 1, 0.36, 1)),
    box-shadow var(--duration-fast, 150ms) var(--ease-out, cubic-bezier(0.22, 1, 0.36, 1)),
    transform var(--duration-fast, 150ms) var(--ease-out, cubic-bezier(0.22, 1, 0.36, 1));
}

:deep(.sgm-payment-action:not(:disabled):not([aria-disabled="true"]):not([data-disabled="true"]):active) {
  transform: scale(0.985);
}

:deep(.sgm-payment-submit:not(:disabled):not([aria-disabled="true"]):not([data-disabled="true"])) {
  box-shadow: var(--shadow-btn-primary, 0 1px 2px rgb(18 69 79 / 24%), inset 0 1px 0 rgb(255 255 255 / 16%));
}

@media (prefers-reduced-motion: reduce) {
  :deep(.sgm-payment-action) {
    transition: none;
  }

  :deep(.sgm-payment-action:not(:disabled):not([aria-disabled="true"]):not([data-disabled="true"]):active) {
    transform: none;
  }
}
</style>
