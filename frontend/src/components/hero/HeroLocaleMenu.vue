<template><div ref="host"></div></template>
<script setup lang="ts">
import { createElement as h } from 'react'
import { Button, Dropdown, Label } from '@heroui/react'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { availableLocales, setLocale } from '@/i18n'
import { useReactHost } from '@/components/hero/useReactHost'

const { locale } = useI18n()
const switching = ref(false)
async function select(code: string) {
  if (switching.value || locale.value === code) return
  switching.value = true
  try {
    await setLocale(code)
    window.location.reload()
  } finally {
    switching.value = false
  }
}
const host = useReactHost(() => {
  const current = availableLocales.find(item => item.code === locale.value)
  return h(Dropdown, null,
    h(Button, { variant: 'ghost', isDisabled: switching.value, 'aria-label': current?.name },
      current?.flag, h('span', { className: 'hidden sm:inline' }, current?.code.toUpperCase())),
    h(Dropdown.Popover, { className: 'public-menu public-palette', placement: 'bottom end',
      children: h(Dropdown.Menu, { 'aria-label': current?.name },
        availableLocales.map(item => h(Dropdown.Item, { key: item.code, id: item.code, textValue: item.name, onAction: () => select(item.code) },
          h(Label, null, item.flag + ' ' + item.name)))) }))
})
</script>
