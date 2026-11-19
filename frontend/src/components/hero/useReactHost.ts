import { createRoot, type Root } from 'react-dom/client'
import { flushSync } from 'react-dom'
import type { ReactNode } from 'react'
import { shallowRef, watch, watchPostEffect } from 'vue'

// Vue owns the host element and data. React owns its descendants.
export function useReactHost(render: () => ReactNode, synchronous = false) {
  const host = shallowRef<HTMLElement | null>(null)
  let root: Root | undefined
  watch(host, (element, _, onCleanup) => {
    if (!element) return
    root = createRoot(element)
    onCleanup(() => {
      root?.unmount()
      root = undefined
    })
  }, { flush: 'sync' })
  watchPostEffect(() => {
    if (!host.value || !root) return
    const element = render()
    if (synchronous) flushSync(() => root?.render(element))
    else root.render(element)
  })
  return host
}
