<template>
  <span ref="host" style="display: contents"></span>
  <Teleport v-if="label" :to="label"><slot /></Teleport>
</template>
<script setup lang="ts">
import { createElement as h } from 'react'
import { Checkbox } from '@heroui/react'
import { getCurrentInstance, shallowRef, useAttrs } from 'vue'
import { useReactHost } from '@/components/hero/useReactHost'

defineOptions({ inheritAttrs: false })
const model = defineModel<boolean>({ required: true })
const attrs = useAttrs()
const scopeId = getCurrentInstance()?.vnode.scopeId
const label = shallowRef<HTMLSpanElement | null>(null)
const setLabel = (el: HTMLSpanElement | null) => { label.value = el }
const host = useReactHost(() => h(Checkbox, {
  ...(scopeId && { [scopeId]: '' }),
  id: attrs.id as string, className: attrs.class as string, isSelected: model.value,
  onChange: selected => { model.value = selected },
}, h(Checkbox.Content, null, h(Checkbox.Control, null, h(Checkbox.Indicator)), h('span', { ref: setLabel }))), true)
</script>
