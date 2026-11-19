<template><component :is="as" :class="card.base()" data-slot="card"><slot /></component></template>
<script setup lang="ts">
import { cardVariants } from '@heroui/styles'
withDefaults(defineProps<{ as?: 'div' | 'section' | 'header' | 'ul' }>(), { as: 'div' })
const card = cardVariants()
</script>
