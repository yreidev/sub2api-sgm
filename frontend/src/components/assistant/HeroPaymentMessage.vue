<template><div ref="host"></div></template>

<script setup lang="ts">
import { createElement } from 'react'
import { Alert, Spinner, Typography } from '@heroui/react'
import { useReactHost } from '@/components/hero/useReactHost'

const props = defineProps<{ text?: string; sanitizedHtml?: string; heading?: string; step?: number; loading?: boolean; warning?: boolean }>()
const host = useReactHost(() => {
  if (props.loading) return createElement(Spinner, { size: 'lg', role: 'status', 'aria-label': props.text })
  if (props.heading) return [
    createElement(Typography.Heading, { key: 'title', level: 3, className: 'tracking-[-0.015em]' },
      props.step && createElement('span', { className: 'sgm-step-number tabular-nums' }, props.step), props.heading),
    props.text && createElement(Typography.Paragraph, { key: 'hint', size: 'sm' }, props.text),
  ]
  const message = props.sanitizedHtml
    ? createElement('div', { className: 'markdown-body text-sm leading-relaxed', dangerouslySetInnerHTML: { __html: props.sanitizedHtml } })
    : createElement(Alert.Description, { className: 'leading-relaxed' }, props.text)
  return createElement(Alert, {
    status: props.warning ? 'warning' : 'accent',
    role: 'status',
    className: 'sgm-payment-alert',
    children: [
      createElement(Alert.Indicator, { key: 'icon' }),
      createElement(Alert.Content, { key: 'content', children: message }),
    ],
  })
})
</script>
