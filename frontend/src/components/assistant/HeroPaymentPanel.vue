<template>
  <div ref="host" class="min-w-0" v-bind="$attrs"></div>
  <Teleport v-if="content" :to="content"><slot /></Teleport>
</template>

<script setup lang="ts">
import { createElement } from 'react'
import { Card } from '@heroui/react'
import { shallowRef } from 'vue'
import { useReactHost } from '@/components/hero/useReactHost'

defineOptions({ inheritAttrs: false })
const content = shallowRef<HTMLDivElement | null>(null)
function setContent(element: HTMLDivElement | null) {
  content.value = element
}
const host = useReactHost(() => createElement(Card, {
  className: 'sgm-assistant-panel min-w-0',
  children: createElement(Card.Content, null, createElement('div', { ref: setContent })),
}))
</script>
