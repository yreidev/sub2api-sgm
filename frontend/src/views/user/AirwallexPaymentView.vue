<template>
  <AppLayout>
    <div class="sgm-gw-scope mx-auto max-w-lg space-y-5 py-8">
      <div v-if="loading" class="sgm-gw-card flex items-center justify-center py-20">
        <span class="sgm-gw-spinner" role="status" aria-live="polite" :aria-label="t('common.loading')"></span>
      </div>

      <div v-else-if="errorMessage" role="alert" class="sgm-gw-card p-8 text-center">
        <div class="sgm-gw-icon sgm-gw-icon--danger mx-auto mb-4">
          <Icon name="exclamationCircle" size="xl" />
        </div>
        <h3 class="sgm-gw-title">{{ t('payment.airwallexLoadFailed') }}</h3>
        <p class="sgm-gw-muted mt-2 text-sm leading-relaxed">{{ errorMessage }}</p>
        <button type="button" class="sgm-gw-btn sgm-gw-btn--primary mt-6" @click="router.push('/purchase')">
          {{ t('payment.result.backToRecharge') }}
        </button>
      </div>

      <div v-else class="sgm-gw-card p-8" role="status" aria-live="polite">
        <div class="flex flex-col items-center space-y-4 py-2 text-center">
          <div class="sgm-gw-icon sgm-gw-icon--accent">
            <span class="sgm-gw-spinner" aria-hidden="true"></span>
          </div>
          <p class="sgm-gw-muted max-w-sm text-sm leading-relaxed">{{ t('payment.qr.payInNewWindowHint') }}</p>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { paymentAPI } from '@/api/payment'
import Icon from '@/components/icons/Icon.vue'
import {
  readCheckoutSnapshot,
  type PaymentRecoverySnapshot,
} from '@/components/payment/paymentFlow'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const loading = ref(true)
const errorMessage = ref('')
let disposed = false

onUnmounted(() => { disposed = true })

function queryString(key: string): string {
  const value = route.query[key]
  if (Array.isArray(value)) return value[0] || ''
  return typeof value === 'string' ? value : ''
}

function buildSuccessUrl(snapshot: PaymentRecoverySnapshot): string {
  const url = new URL('/payment/result', window.location.origin)
  const orderId = queryString('order_id')
  const outTradeNo = queryString('out_trade_no')
  const resumeToken = queryString('resume_token')

  if (orderId || snapshot.orderId > 0) url.searchParams.set('order_id', orderId || String(snapshot.orderId))
  if (outTradeNo || snapshot.outTradeNo) url.searchParams.set('out_trade_no', outTradeNo || snapshot.outTradeNo)
  if (resumeToken || snapshot.resumeToken) url.searchParams.set('resume_token', resumeToken || snapshot.resumeToken)
  return url.toString()
}

onMounted(async () => {
  const orderId = queryString('order_id')
  const snapshot = readCheckoutSnapshot(window.localStorage, authStore.user?.id, 'airwallex', {
    orderId: orderId ? Number(orderId) : undefined,
    outTradeNo: queryString('out_trade_no'),
    resumeToken: queryString('resume_token'),
  })
  const checkoutLocale = locale.value.toLowerCase().startsWith('zh') ? 'zh' : 'en'

  if (!snapshot) {
    loading.value = false
    errorMessage.value = t('payment.airwallexMissingParams')
    return
  }

  try {
    if (authStore.user) {
      // The authenticated order lookup also checks ownership of legacy, unscoped snapshots.
      const { data: order } = await paymentAPI.getOrder(snapshot.orderId)
      if (disposed) return
      if (order.status !== 'PENDING') {
        const result = new URL(buildSuccessUrl(snapshot))
        await router.replace({ path: result.pathname, query: Object.fromEntries(result.searchParams) })
        return
      }
    }
    const airwallex = await import('@airwallex/components-sdk')
    if (disposed) return
    const result = await airwallex.init({
      env: snapshot.paymentEnv === 'prod' ? 'prod' : 'demo',
      enabledElements: ['payments'],
      locale: checkoutLocale,
    })
    if (disposed) return

    loading.value = false
    const checkoutOptions = {
      intent_id: snapshot.intentId,
      client_secret: snapshot.clientSecret,
      currency: snapshot.currency || 'CNY',
      country_code: snapshot.countryCode || 'CN',
      successUrl: buildSuccessUrl(snapshot),
    }
    if (!result.payments) {
      throw new Error(t('payment.airwallexLoadFailed'))
    }
    const redirectResult = result.payments.redirectToCheckout(checkoutOptions)

    if (typeof redirectResult === 'string' && redirectResult) {
      window.location.assign(redirectResult)
    }
  } catch (err: unknown) {
    loading.value = false
    errorMessage.value = err instanceof Error && err.message
      ? err.message
      : t('payment.airwallexLoadFailed')
  }
})
</script>

<style scoped>
.sgm-gw-scope {
  --gw-panel: #ffffff;
  --gw-panel-subtle: #f7fafa;
  --gw-ink: #162b34;
  --gw-muted: #4d636b;
  --gw-line: #d4e0e2;
  --gw-control-border: #819496;
  --gw-control-border-hover: #5c767b;
  --gw-accent: #195762;
  --gw-accent-hover: #12454f;
  --gw-on-accent: #ffffff;
  --gw-focus: #126c7a;
  --gw-ring-focus: 0 0 0 3px rgb(18 108 122 / 18%);
  --gw-shadow-card: 0 1px 2px rgb(22 43 52 / 5%), 0 6px 20px -4px rgb(22 43 52 / 8%);
  --gw-shadow-btn-primary: 0 1px 2px rgb(18 69 79 / 24%), inset 0 1px 0 rgb(255 255 255 / 16%);
  --gw-danger-bg: #fef2f2;
  --gw-danger-fg: #b42318;
  --gw-danger-border: rgb(220 38 38 / 20%);
  --gw-accent-soft: #ebf5f4;
  --gw-accent-ring: rgb(25 87 98 / 18%);
}

.dark .sgm-gw-scope {
  --gw-panel: #14272d;
  --gw-panel-subtle: #102127;
  --gw-ink: #e6f2f2;
  --gw-muted: #9db6bc;
  --gw-line: #29434b;
  --gw-control-border: #58757d;
  --gw-control-border-hover: #7697a0;
  --gw-accent: #8ad3cd;
  --gw-accent-hover: #a2ded9;
  --gw-on-accent: #0b242a;
  --gw-focus: #8ad3cd;
  --gw-ring-focus: 0 0 0 3px rgb(138 211 205 / 24%);
  --gw-shadow-card: 0 8px 28px rgb(0 0 0 / 38%), inset 0 1px 0 rgb(255 255 255 / 6%);
  --gw-shadow-btn-primary: 0 1px 2px rgb(0 0 0 / 35%), inset 0 1px 0 rgb(255 255 255 / 24%);
  --gw-danger-bg: rgb(239 68 68 / 14%);
  --gw-danger-fg: #f87171;
  --gw-danger-border: rgb(248 113 113 / 24%);
  --gw-accent-soft: rgb(138 211 205 / 14%);
  --gw-accent-ring: rgb(138 211 205 / 24%);
}

.sgm-gw-card {
  border: 1px solid var(--gw-line);
  border-radius: 1.125rem;
  background: var(--gw-panel);
  box-shadow: var(--gw-shadow-card);
}

.sgm-gw-title {
  color: var(--gw-ink);
  font-size: 1.125rem;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: -0.02em;
  text-wrap: balance;
}

.sgm-gw-muted {
  color: var(--gw-muted);
}

.sgm-gw-icon {
  display: flex;
  height: 4rem;
  width: 4rem;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
}

.sgm-gw-icon--danger {
  background: var(--gw-danger-bg);
  color: var(--gw-danger-fg);
  box-shadow: inset 0 0 0 1px var(--gw-danger-border);
}

.sgm-gw-icon--accent {
  background: var(--gw-accent-soft);
  box-shadow: inset 0 0 0 1px var(--gw-accent-ring);
}

.sgm-gw-btn {
  display: inline-flex;
  min-height: 2.75rem;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  border-radius: 0.625rem;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 150ms cubic-bezier(0.22, 1, 0.36, 1),
    border-color 150ms cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 150ms cubic-bezier(0.22, 1, 0.36, 1),
    transform 150ms cubic-bezier(0.22, 1, 0.36, 1);
}

.sgm-gw-btn:focus-visible {
  outline: 2px solid var(--gw-focus, #126c7a);
  outline-offset: 2px;
  box-shadow: var(--gw-ring-focus);
}

.sgm-gw-btn:active {
  transform: scale(0.985);
}

.sgm-gw-btn--primary {
  border: 1px solid transparent;
  background: var(--gw-accent);
  color: var(--gw-on-accent);
  box-shadow: var(--gw-shadow-btn-primary);
}

.sgm-gw-btn--primary:hover {
  background: var(--gw-accent-hover);
}

.sgm-gw-btn--secondary {
  border: 1px solid var(--gw-control-border);
  background: var(--gw-panel);
  color: var(--gw-ink);
  box-shadow: 0 1px 2px rgb(22 43 52 / 4%);
}

.sgm-gw-btn--secondary:hover {
  border-color: var(--gw-control-border-hover);
  background: var(--gw-panel-subtle);
}

.sgm-gw-spinner {
  display: block;
  height: 2rem;
  width: 2rem;
  border-radius: 9999px;
  border: 3px solid color-mix(in srgb, var(--gw-accent) 22%, transparent);
  border-top-color: var(--gw-accent);
  animation: sgm-gw-spin 0.85s linear infinite;
}

@keyframes sgm-gw-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .sgm-gw-btn,
  .sgm-gw-spinner {
    transition: none;
    animation: none;
  }

  .sgm-gw-btn:active {
    transform: none;
  }
}
</style>
