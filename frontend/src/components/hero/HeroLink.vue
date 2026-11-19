<template>
  <component :is="to == null ? 'a' : RouterLink" v-bind="to == null ? {} : { to }" :class="styles" data-slot="link"><slot /></component>
</template>

<script setup lang="ts">
import { computed, resolveComponent } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import { buttonVariants, linkVariants } from '@heroui/styles'
// Resolve the app-registered Vue Router component so navigation and modified clicks use the router.
const RouterLink = resolveComponent('RouterLink')
const props = defineProps<{ to?: RouteLocationRaw; variant?: 'primary' | 'outline' | 'ghost' }>()
const styles = computed(() => props.variant ? buttonVariants({ variant: props.variant }) : linkVariants().base())
</script>
