<template><div ref="host"></div></template>

<script setup lang="ts">
import { createElement } from 'react'
import { Toast, ToastQueue } from '@heroui/react'
import { onBeforeUnmount, watch } from 'vue'
import '@/styles/public-palette.css'
import { useAppStore } from '@/stores/app'
import { useReactHost } from '@/components/hero/useReactHost'

const appStore = useAppStore()
const queue = new ToastQueue()
const keys = new Map<string, string>()
const variants = { error: 'danger', info: 'accent', success: 'success', warning: 'warning' } as const
const host = useReactHost(() => createElement(Toast.Provider, { queue, className: 'public-palette', placement: 'bottom', width: 'min(26rem, calc(100vw - 2rem))' }))

// The store owns notification lifetimes across route changes.
watch(() => [...appStore.toasts], (items) => {
  for (const [id, key] of keys) {
    if (!items.some(item => item.id === id)) {
      keys.delete(id)
      queue.close(key)
    }
  }
  for (const item of items) {
    if (!keys.has(item.id)) {
      keys.set(item.id, queue.add({
        title: item.title || item.message,
        description: item.title ? item.message : undefined,
        variant: variants[item.type],
      }, { onClose: () => appStore.hideToast(item.id) }))
    }
  }
}, { immediate: true })
onBeforeUnmount(() => queue.destroy())
</script>
