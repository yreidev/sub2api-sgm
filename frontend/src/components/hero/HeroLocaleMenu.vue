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
    h(Button, {
      variant: 'ghost',
      className: 'public-locale-trigger',
      isDisabled: switching.value,
      'aria-label': current?.name,
    },
    h('span', { className: 'public-locale-flag', 'aria-hidden': true }, current?.flag),
    h('span', { className: 'hidden sm:inline' }, current?.code.toUpperCase()),
    h('svg', {
      className: 'public-locale-chevron',
      viewBox: '0 0 16 16',
      fill: 'none',
      'aria-hidden': true,
    }, h('path', {
      d: 'M4.5 6.25L8 9.75L11.5 6.25',
      stroke: 'currentColor',
      strokeWidth: 1.6,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    }))),
    h(Dropdown.Popover, {
      className: 'public-menu public-palette',
      placement: 'bottom end',
      children: h(Dropdown.Menu, {
        'aria-label': current?.name,
        selectionMode: 'single',
        disallowEmptySelection: true,
        selectedKeys: new Set([locale.value]),
        onSelectionChange: (keys) => {
          if (keys === 'all') return
          const [next] = keys
          if (typeof next === 'string') void select(next)
        },
      },
      availableLocales.map(item => {
        const isActive = item.code === locale.value
        return h(Dropdown.Item, {
          key: item.code,
          id: item.code,
          textValue: item.name,
          className: isActive ? 'public-locale-item is-active' : 'public-locale-item',
        },
        h(Label, { className: 'public-locale-label' },
          h('span', { className: 'public-locale-flag', 'aria-hidden': true }, item.flag),
          h('span', null, item.name)),
        isActive
          ? h('svg', {
              className: 'public-locale-check',
              viewBox: '0 0 16 16',
              fill: 'none',
              'aria-hidden': true,
            }, h('path', {
              d: 'M3.5 8.5L6.5 11.5L12.5 4.75',
              stroke: 'currentColor',
              strokeWidth: 1.75,
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
            }))
          : null)
      })),
    }))
})
</script>
