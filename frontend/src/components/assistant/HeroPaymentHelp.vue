<template><div ref="host"></div></template>

<script setup lang="ts">
import { createElement } from 'react'
import { PaymentHelp } from './PaymentHelp'
import { useReactHost } from '@/components/hero/useReactHost'

const props = defineProps<{ sanitizedHtml: string; imageUrl?: string; imageLabel: string; closeLabel: string }>()
const host = useReactHost(() => createElement(PaymentHelp, { ...props }))
</script>
