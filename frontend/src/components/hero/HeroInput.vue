<template><span ref="host" style="display: contents"></span></template>

<script setup lang="ts">
import { createElement, type FormEvent } from 'react'
import { Input } from '@heroui/react'
import { getCurrentInstance, useAttrs } from 'vue'
import { useReactHost } from '@/components/hero/useReactHost'

defineOptions({ inheritAttrs: false })
const props = defineProps<{
  modelValue?: string
  type?: string
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  autofocus?: boolean
  autocomplete?: string
  maxlength?: string | number
  inputmode?: 'text' | 'numeric' | 'email' | 'url' | 'tel' | 'search' | 'decimal' | 'none'
}>()
const emit = defineEmits<{ 'update:modelValue': [value: string]; input: [event: Event]; keyup: [event: KeyboardEvent] }>()
const attrs = useAttrs()
const scopeId = getCurrentInstance()?.vnode.scopeId
let input: HTMLInputElement | null = null
let composing = false
const setInput = (el: HTMLInputElement | null) => { input = el }

function update(event: FormEvent<HTMLInputElement>) {
  if (!composing && !(event.nativeEvent as InputEvent).isComposing) emit('update:modelValue', event.currentTarget.value)
  emit('input', event.nativeEvent)
}

const host = useReactHost(() => {
  const value = props.modelValue ?? ''
  if (input && !composing && input.value !== value) input.value = value
  const { class: className, style: _style, ...rest } = attrs
  return createElement(Input, {
    ...rest, ...(scopeId && { [scopeId]: '' }), ref: setInput, className: className as string,
    type: props.type, disabled: props.disabled, readOnly: props.readonly, required: props.required,
    autoFocus: props.autofocus, autoComplete: props.autocomplete, inputMode: props.inputmode,
    maxLength: props.maxlength == null ? undefined : Number(props.maxlength),
    // Keep the native editor in control during IME composition and autofill.
    defaultValue: value, onInput: update,
    onCompositionStart: () => { composing = true },
    onCompositionEnd: event => { composing = false; emit('update:modelValue', event.currentTarget.value) },
    onKeyUp: event => emit('keyup', event.nativeEvent),
  })
}, true)
</script>
