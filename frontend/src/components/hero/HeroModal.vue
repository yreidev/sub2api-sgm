<template>
  <div ref="host" style="display: contents"></div>
  <Teleport v-if="body" :to="body"><slot /></Teleport>
</template>
<script setup lang="ts">
import { createElement as h } from 'react'
import { Modal } from '@heroui/react'
import { shallowRef } from 'vue'
import '@/styles/public-palette.css'
import { useReactHost } from '@/components/hero/useReactHost'

const props = defineProps<{ label: string; dismissible?: boolean; dialogClass?: string }>()
const emit = defineEmits<{ close: [] }>()
const body = shallowRef<HTMLDivElement | null>(null)
const setBody = (el: HTMLDivElement | null) => { body.value = el }
const host = useReactHost(() => h(Modal.Backdrop, {
  variant: 'blur',
  className: 'public-palette sgm-modal-backdrop',
  isOpen: true, isDismissable: !!props.dismissible, isKeyboardDismissDisabled: !props.dismissible,
  onOpenChange: open => { if (!open) emit('close') },
}, h(Modal.Container, { scroll: 'inside' }, h(Modal.Dialog, {
  className: ['public-palette', 'sgm-auth-modal', props.dialogClass].filter(Boolean).join(' '),
  'aria-label': props.label,
}, h(Modal.Body, null, h('div', { ref: setBody }))))))
</script>
