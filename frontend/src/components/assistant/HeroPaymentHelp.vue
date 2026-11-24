<template><div ref="host" class="min-w-0"></div></template>

<script setup lang="ts">
import { createElement } from 'react'
import { PaymentHelp } from './PaymentHelp'
import { useReactHost } from '@/components/hero/useReactHost'

const props = defineProps<{ sanitizedHtml: string; imageUrl?: string; imageLabel: string; closeLabel: string }>()
const host = useReactHost(() => createElement(PaymentHelp, { ...props }))
</script>

<style scoped>
:deep(.sgm-payment-help-trigger) {
  border-color: var(--border, #d4e0e2);
  background: var(--surface, #ffffff);
  color: var(--foreground, #162b34);
  box-shadow: var(--shadow-xs, 0 1px 2px rgb(22 43 52 / 5%));
  transition: border-color var(--duration-fast, 150ms) var(--ease-out, cubic-bezier(0.22, 1, 0.36, 1)),
    background-color var(--duration-fast, 150ms) var(--ease-out, cubic-bezier(0.22, 1, 0.36, 1)),
    box-shadow var(--duration-fast, 150ms) var(--ease-out, cubic-bezier(0.22, 1, 0.36, 1)),
    transform var(--duration-fast, 150ms) var(--ease-out, cubic-bezier(0.22, 1, 0.36, 1));
}

:deep(.sgm-payment-help-trigger:hover) {
  border-color: var(--line-strong, #b6c8cc);
  background: var(--panel-subtle, #f7fafa);
}

:deep(.sgm-payment-help-trigger:active) {
  transform: scale(0.99);
}

@media (prefers-reduced-motion: reduce) {
  :deep(.sgm-payment-help-trigger) {
    transition: none;
  }

  :deep(.sgm-payment-help-trigger:active) {
    transform: none;
  }
}
</style>
