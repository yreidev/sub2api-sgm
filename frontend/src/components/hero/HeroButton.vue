<template>
  <span ref="host" :style="{ display: fullWidth ? 'block' : 'contents' }"></span>
  <Teleport :disabled="!button" :to="button"><slot /></Teleport>
</template>

<script setup lang="ts">
import { createElement } from 'react'
import { Button } from '@heroui/react'
import { getCurrentInstance, shallowRef, useAttrs } from 'vue'
import { useReactHost } from '@/components/hero/useReactHost'

defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<{
  type?: 'button' | 'submit' | 'reset'
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  iconOnly?: boolean
  fullWidth?: boolean
}>(), { type: 'button', variant: 'ghost' })
const emit = defineEmits<{ press: [] }>()
const attrs = useAttrs()
const button = shallowRef<HTMLButtonElement | null>(null)
const scopeId = getCurrentInstance()?.vnode.scopeId
const setButton = (element: HTMLButtonElement | null) => { button.value = element }
const host = useReactHost(() => {
  const { class: className, style: _style, ...rest } = attrs
  return createElement(Button, {
    ...rest, ...(scopeId && { [scopeId]: '' }), className: className as string,
    type: props.type, variant: props.variant, ...(props.size && { size: props.size }), isDisabled: props.disabled,
    isIconOnly: props.iconOnly, fullWidth: props.fullWidth, onPress: () => emit('press'), ref: setButton,
  })
}, true)
</script>
