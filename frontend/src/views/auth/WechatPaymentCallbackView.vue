<template>
  <div class="public-palette payment-callback-page">
    <div class="payment-callback-shell">
      <div class="payment-callback-card">
        <h1 class="payment-callback-heading">
          {{ callbackTitleText }}
        </h1>
        <p class="payment-callback-intro mt-2">
          {{ errorMessage || callbackProcessingText }}
        </p>

        <div
          v-if="!errorMessage"
          role="status"
          aria-live="polite"
          :aria-label="callbackProcessingText"
          class="mt-6 flex items-center justify-center py-10"
        >
          <div
            class="payment-callback-spinner h-9 w-9 animate-spin motion-reduce:animate-none rounded-full"
            aria-hidden="true"
          ></div>
        </div>

        <div
          v-else
          role="alert"
          class="payment-callback-notice mt-6"
        >
          <p class="payment-callback-notice-text text-sm">
            {{ errorMessage }}
          </p>
          <HeroButton variant="primary"
            class="btn btn-primary mt-4"
            type="button"
            @press="goBackToPayment"
          >
            {{ backToPaymentText }}
          </HeroButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import HeroButton from '@/components/hero/HeroButton.vue'
import 'virtual:sgm-heroui.css'
import '@/styles/public-palette.css'
import '@fontsource/ibm-plex-sans/latin-400.css'
import '@fontsource/ibm-plex-sans/latin-500.css'
import '@fontsource/ibm-plex-sans/latin-600.css'
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

const errorMessage = ref('')

watch(errorMessage, (message) => {
  if (message) {
    appStore.showError(message)
  }
})

const callbackProcessingText = computed(() => t('auth.wechatPayment.callbackProcessing'))
const callbackTitleText = computed(() => t('auth.wechatPayment.callbackTitle'))
const backToPaymentText = computed(() => t('auth.wechatPayment.backToPayment'))

function readQueryString(key: string): string {
  const value = route.query[key]
  if (Array.isArray(value)) {
    return typeof value[0] === 'string' ? value[0] : ''
  }
  return typeof value === 'string' ? value : ''
}

function parseFragmentParams(): URLSearchParams {
  const raw = typeof window !== 'undefined' ? window.location.hash : ''
  const hash = raw.startsWith('#') ? raw.slice(1) : raw
  return new URLSearchParams(hash)
}

function normalizeRedirectPath(path: string | null | undefined): string {
  const value = (path || '').trim()
  if (!value) return '/purchase'
  if (!value.startsWith('/')) return '/purchase'
  if (value.startsWith('//') || value.includes('://')) return '/purchase'
  if (value === '/payment') return '/purchase'
  if (value.startsWith('/payment?')) return '/purchase' + value.slice('/payment'.length)
  return value
}

function appendQueryParam(query: Record<string, string>, key: string, value: string) {
  if (value) {
    query[key] = value
  }
}

function goBackToPayment() {
  void router.replace('/purchase')
}

onMounted(async () => {
  const fragment = parseFragmentParams()
  const readParam = (key: string) => fragment.get(key) || readQueryString(key)

  const error = readParam('error') || readParam('err_msg') || readParam('errmsg')
  const errorDescription = readParam('error_description') || readParam('message')

  if (error) {
    errorMessage.value = errorDescription || error
    return
  }

  const resumeToken = readParam('wechat_resume_token')
  const openid = readParam('openid')
  const state = readParam('state')
  const scope = readParam('scope')
  const paymentType = readParam('payment_type')
  const amount = readParam('amount')
  const orderType = readParam('order_type')
  const planId = readParam('plan_id')
  const redirectURL = new URL(
    normalizeRedirectPath(readParam('redirect')),
    window.location.origin,
  )

  if (!resumeToken && !openid) {
    errorMessage.value = t('auth.wechatPayment.callbackMissingResumeToken')
    return
  }

  const query: Record<string, string> = {
    ...Object.fromEntries(redirectURL.searchParams.entries()),
    wechat_resume: '1',
  }

  if (resumeToken) {
    query.wechat_resume_token = resumeToken
  } else {
    query.openid = openid
    appendQueryParam(query, 'state', state)
    appendQueryParam(query, 'scope', scope)
    appendQueryParam(query, 'payment_type', paymentType)
    appendQueryParam(query, 'amount', amount)
    appendQueryParam(query, 'order_type', orderType)
    appendQueryParam(query, 'plan_id', planId)
  }

  await router.replace({
    path: redirectURL.pathname,
    query,
  })
})
</script>

<style scoped>
.payment-callback-page {
  min-height: 100dvh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: clamp(2rem, 6vw, 4.5rem) 1rem;
  background: var(--page);
  color: var(--ink);
  font-family: "IBM Plex Sans", "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif;
}

.payment-callback-shell {
  width: min(100%, 36rem);
}

.payment-callback-card {
  position: relative;
  isolation: isolate;
  padding: clamp(1.5rem, 4vw, 2.25rem);
  border-radius: 18px;
  border: 1px solid var(--line);
  background: var(--panel);
  box-shadow: var(--shadow-card), var(--shadow-inset-top);
  overflow-wrap: anywhere;
}

.payment-callback-card::before {
  position: absolute;
  content: "";
  z-index: -1;
  inset: 0 0 auto auto;
  width: 48%;
  height: 5rem;
  border-top-right-radius: inherit;
  background: url('../../assets/sgm-balance-wave.webp') center / cover;
  opacity: var(--wave-opacity);
  mix-blend-mode: multiply;
  mask-image: linear-gradient(212deg, #000 10%, transparent 72%);
  pointer-events: none;
}

.dark .payment-callback-card::before {
  mix-blend-mode: screen;
  filter: invert(1) hue-rotate(180deg) brightness(1.4);
}

.payment-callback-heading {
  margin: 0;
  font-size: clamp(1.375rem, 3.2vw, 1.625rem);
  line-height: 1.26;
  font-weight: 500;
  letter-spacing: -0.025em;
  text-wrap: balance;
  color: var(--ink);
}

.payment-callback-intro {
  font-size: 0.9375rem;
  line-height: 1.6;
  color: var(--muted);
}

.payment-callback-spinner {
  border: 3px solid var(--line);
  border-top-color: var(--accent);
}

.payment-callback-notice {
  border-radius: 12px;
  border: 1px solid var(--line);
  background: var(--panel-subtle);
  padding: 1rem;
}

.payment-callback-notice-text {
  line-height: 1.55;
  color: var(--ink);
}

.payment-callback-card :deep(.btn-primary) {
  min-height: 44px;
  border-radius: 10px;
  border: 1px solid transparent;
  padding-inline: 1.125rem;
  font-size: 0.9375rem;
  font-weight: 500;
  --button-bg: var(--accent);
  --button-bg-hover: var(--accent-hover);
  --button-bg-pressed: var(--accent-active);
  --button-fg: var(--on-accent);
  color: var(--on-accent);
  background: var(--accent);
  background-image: none;
  box-shadow: var(--shadow-btn-primary);
  transition:
    background-color var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out),
    transform var(--duration-fast) var(--ease-out);
}

.payment-callback-card :deep(.btn-primary:hover:not(:disabled)),
.payment-callback-card :deep(.btn-primary[data-hovered="true"]:not(:disabled)) {
  background: var(--accent-hover);
  background-image: none;
}

.payment-callback-card :deep(.btn-primary:active:not(:disabled)),
.payment-callback-card :deep(.btn-primary[data-pressed="true"]:not(:disabled)) {
  background: var(--accent-active);
  transform: scale(0.985);
}

.payment-callback-card :deep(.btn-primary:focus-visible),
.payment-callback-card :deep(.btn-primary[data-focus-visible="true"]) {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
  box-shadow: var(--ring-focus);
}

@media (prefers-reduced-motion: reduce) {
  .payment-callback-card :deep(.btn-primary) {
    transition: none;
  }

  .payment-callback-spinner {
    animation: none;
  }

  .payment-callback-card :deep(.btn-primary:active:not(:disabled)),
  .payment-callback-card :deep(.btn-primary[data-pressed="true"]:not(:disabled)) {
    transform: none;
  }
}
</style>
