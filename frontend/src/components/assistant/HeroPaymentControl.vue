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
