<template>
  <div ref="host"></div>
  <Teleport v-if="trigger" :to="trigger"><slot name="trigger" /></Teleport>
  <Teleport v-if="body" :to="body"><slot /></Teleport>
</template>
<script setup lang="ts">
import { createElement as h } from 'react'
import { Disclosure } from '@heroui/react'
import { shallowRef } from 'vue'
import { useReactHost } from '@/components/hero/useReactHost'

const trigger = shallowRef<HTMLSpanElement | null>(null)
const body = shallowRef<HTMLDivElement | null>(null)
const setTrigger = (el: HTMLSpanElement | null) => { trigger.value = el }
const setBody = (el: HTMLDivElement | null) => { body.value = el }
const host = useReactHost(() => h(Disclosure, null,
  h(Disclosure.Heading, null, h(Disclosure.Trigger, null, h('span', { ref: setTrigger, style: { display: 'contents' } }))),
  h(Disclosure.Content, null, h(Disclosure.Body, null, h('div', { ref: setBody })))), true)
</script>
