<template>
  <component :is="isPopup ? 'div' : AppLayout" :class="isPopup ? 'sgm-gw-stage min-h-screen' : ''">
    <div class="sgm-gw-scope mx-auto max-w-lg space-y-5 py-8" :class="isPopup ? 'px-4' : ''">
      <div v-if="loading" class="sgm-gw-card flex items-center justify-center py-20">
        <span class="sgm-gw-spinner" role="status" aria-live="polite" :aria-label="t('common.loading')"></span>
      </div>
      <div v-else-if="initError" role="alert" class="sgm-gw-card p-8 text-center">
        <div class="sgm-gw-icon sgm-gw-icon--danger mx-auto mb-4">
          <Icon name="exclamationCircle" size="xl" />
        </div>
        <h3 class="sgm-gw-title">{{ t('payment.stripeLoadFailed') }}</h3>
        <p class="sgm-gw-muted mt-2 text-sm leading-relaxed">{{ initError }}</p>
        <button type="button" class="sgm-gw-btn sgm-gw-btn--primary mt-6" @click="router.push('/purchase')">
          {{ t('payment.result.backToRecharge') }}
        </button>
      </div>
      <template v-else>
        <!-- 金额头部 -->
        <div v-if="order" class="sgm-gw-card overflow-hidden">
          <div class="sgm-stripe-banner px-6 py-6 text-center">
            <p class="text-sm font-medium text-white">{{ t('payment.actualPay') }}</p>
            <p class="mt-1.5 text-3xl font-bold tracking-tight tabular-nums text-white">{{ formatGatewayAmount(order.pay_amount) }}</p>
          </div>
        </div>

        <!-- 微信二维码展示 -->
        <template v-if="wechatQrUrl">
          <div class="sgm-gw-card p-6">
            <div class="flex flex-col items-center space-y-4">
              <p class="sgm-gw-title text-center">{{ t('payment.qr.scanWxpay') }}</p>
              <div class="relative max-w-full rounded-xl border-2 border-[#2BB741]/80 bg-emerald-50/60 p-2.5 shadow-sm sm:p-4 dark:border-[#2BB741]/60 dark:bg-emerald-950/20">
                <img :src="wechatQrUrl" alt="WeChat Pay QR" class="aspect-square h-auto w-56 max-w-full rounded-lg bg-white p-1" />
                <div class="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <span class="rounded-full bg-[#2BB741] p-2 shadow-md ring-2 ring-white">
                    <svg class="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm3.636 4.35c-2.084 0-3.993.672-5.363 1.844-1.188.982-2.004 2.308-2.004 3.862 0 1.207.546 2.355 1.483 3.285.114.113.238.213.358.321l-.105.42c-.021.084-.042.17-.042.253 0 .168.126.258.282.258.065 0 .126-.025.18-.058l1.27-.765a.69.69 0 0 1 .58-.086c.96.282 1.99.437 3.043.437 2.633 0 5.03-.972 6.4-2.5.782-.87 1.258-1.901 1.258-3.006 0-3.328-3.325-6.006-7.34-6.006zm-3.21 3.09c.52 0 .94.429.94.957a.949.949 0 0 1-.94.955.949.949 0 0 1-.94-.955c0-.528.42-.957.94-.957zm4.739 0c.52 0 .94.429.94.957a.949.949 0 0 1-.94.955.949.949 0 0 1-.94-.955c0-.528.42-.957.94-.957z"/></svg>
                  </span>
                </div>
              </div>
              <p class="sgm-gw-muted text-center text-sm leading-relaxed">{{ t('payment.qr.scanWxpayHint') }}</p>
            </div>
          </div>
          <div class="sgm-gw-card px-4 py-3.5 text-center">
            <p class="sgm-gw-muted inline-flex items-center justify-center gap-2 text-sm">
              <span class="h-2 w-2 animate-pulse rounded-full bg-emerald-500 motion-reduce:animate-none" aria-hidden="true"></span>
              {{ t('payment.qr.waitingPayment') }}
            </p>
          </div>
        </template>

        <!-- 支付宝跳转状态 -->
        <template v-else-if="redirecting">
          <div class="sgm-gw-card p-8" role="status" aria-live="polite">
            <div class="flex flex-col items-center space-y-4 py-2 text-center">
              <div class="sgm-gw-icon sgm-gw-icon--alipay">
                <div class="h-8 w-8 animate-spin rounded-full border-[3px] border-[#00AEEF] border-t-transparent motion-reduce:animate-none" aria-hidden="true"></div>
              </div>
              <p class="sgm-gw-muted max-w-sm text-sm leading-relaxed">{{ t('payment.qr.payInNewWindowHint') }}</p>
            </div>
          </div>
        </template>

        <!-- 成功状态 -->
        <template v-else-if="stripeSuccess">
          <div class="sgm-gw-card p-8 text-center" role="status" aria-live="polite">
            <div class="flex flex-col items-center gap-3 py-2">
              <div class="sgm-gw-icon sgm-gw-icon--success">
                <Icon name="check" size="lg" />
              </div>
              <p class="sgm-gw-title">{{ t('payment.result.success') }}</p>
              <p class="sgm-gw-muted text-sm leading-relaxed">{{ t('payment.stripeSuccessProcessing') }}</p>
            </div>
          </div>
        </template>

        <!-- 无指定方式或未知方式时展示完整 Payment Element -->
        <template v-else-if="showPaymentElement">
          <div class="sgm-gw-card p-6">
            <div id="stripe-payment-element" class="min-h-[200px]"></div>
            <p v-if="stripeError" role="alert" class="sgm-gw-alert mt-4">{{ stripeError }}</p>
            <button
              type="button"
              class="btn btn-stripe sgm-stripe-submit mt-6 min-h-11 w-full py-3 text-base font-medium focus:ring-0 motion-reduce:transition-none"
              :disabled="stripeSubmitting || !stripeReady"
              @click="handleGenericPay"
            >
              <span v-if="stripeSubmitting" class="flex items-center justify-center gap-2">
                <span class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent motion-reduce:animate-none" aria-hidden="true"></span>
                {{ t('common.processing') }}
              </span>
              <span v-else>{{ t('payment.stripePay') }}</span>
            </button>
          </div>
          <div class="text-center">
            <button type="button" class="sgm-gw-btn sgm-gw-btn--secondary" @click="router.push('/purchase')">
              {{ t('payment.result.backToRecharge') }}
            </button>
          </div>
        </template>

        <!-- 错误状态 -->
        <div v-if="stripeError && !showPaymentElement" class="sgm-gw-card p-5">
          <p role="alert" class="sgm-gw-alert">{{ stripeError }}</p>
          <button type="button" class="sgm-gw-btn sgm-gw-btn--secondary mt-4 w-full" @click="router.push('/purchase')">
            {{ t('payment.result.backToRecharge') }}
          </button>
        </div>
      </template>
    </div>
  </component>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { usePaymentStore } from '@/stores/payment'
import { paymentAPI } from '@/api/payment'
import { extractI18nErrorMessage } from '@/utils/apiError'
import { isMobileDevice } from '@/utils/device'
import { formatPaymentAmount, normalizePaymentCurrency } from '@/components/payment/currency'
import { useAuthStore } from '@/stores/auth'
import { paymentSettlementState, readCheckoutSnapshot } from '@/components/payment/paymentFlow'
import type { PaymentOrder } from '@/types/payment'
import type { Stripe, StripeElements } from '@stripe/stripe-js'
import AppLayout from '@/components/layout/AppLayout.vue'
import Icon from '@/components/icons/Icon.vue'

const i18n = useI18n()
const { t } = i18n
const route = useRoute()
const router = useRouter()
const paymentStore = usePaymentStore()
const authStore = useAuthStore()

// 弹窗模式：指定支付宝或微信方式时跳过 AppLayout
const isPopup = computed(() => !!route.query.method)

const loading = ref(true)
const initError = ref('')
const stripeError = ref('')
const stripeSubmitting = ref(false)
const stripeSuccess = ref(false)
const stripeReady = ref(false)
const order = ref<PaymentOrder | null>(null)
const currency = ref('CNY')
const wechatQrUrl = ref('')
const redirecting = ref(false)
const showPaymentElement = ref(false)

let disposed = false
let stripeInstance: Stripe | null = null
let elementsInstance: StripeElements | null = null
let redirectTimer: ReturnType<typeof setTimeout> | null = null

onMounted(async () => {
  const orderId = Number(route.query.order_id)
  const method = String(route.query.method || '')
  const resumeToken = route.query.resume_token
  const outTradeNo = route.query.out_trade_no
  const restored = typeof resumeToken !== 'object' && typeof outTradeNo !== 'object'
    ? readCheckoutSnapshot(window.localStorage, authStore.user?.id, 'stripe', { orderId, resumeToken, outTradeNo })
    : null

  if (!orderId || !restored) {
    loading.value = false
    initError.value = t('payment.stripeMissingParams')
    return
  }

  try {
    const clientSecret = restored.clientSecret
    currency.value = normalizePaymentCurrency(restored.currency)
    const res = await paymentAPI.getOrder(orderId)
    if (disposed) return
    if (res.data.status !== 'PENDING') {
      await router.replace({ path: '/payment/result', query: { order_id: String(orderId), resume_token: restored.resumeToken || undefined } })
      return
    }
    order.value = res.data
    if (res.data.currency) {
      currency.value = normalizePaymentCurrency(res.data.currency)
    }

    await paymentStore.fetchConfig()
    const publishableKey = paymentStore.config?.stripe_publishable_key
    if (!publishableKey) { initError.value = t('payment.stripeNotConfigured'); return }

    const { loadStripe } = await import('@stripe/stripe-js/pure')
    const stripe = await loadStripe(publishableKey)
    if (disposed) return
    if (!stripe) { initError.value = t('payment.stripeLoadFailed'); return }

    stripeInstance = stripe
    loading.value = false

    // 指定方式直接确认，无需渲染完整 Payment Element
    if (method === 'alipay') {
      await confirmAlipay(stripe, clientSecret, orderId)
    } else if (method === 'wechat_pay') {
      await confirmWechatPay(stripe, clientSecret)
    } else {
      // 未指定方式时渲染完整 Payment Element
      showPaymentElement.value = true
      await nextTick()
      mountPaymentElement(stripe, clientSecret)
    }
  } catch (err: unknown) {
    initError.value = extractI18nErrorMessage(err, t, 'payment.errors', t('payment.stripeLoadFailed'))
  } finally {
    loading.value = false
  }
})

const localeCode = computed(() => {
  const raw = i18n.locale as unknown
  if (typeof raw === 'string') return raw
  if (raw && typeof raw === 'object' && 'value' in raw) {
    return String((raw as { value?: string }).value || '')
  }
  return undefined
})

function formatGatewayAmount(value: number): string {
  return formatPaymentAmount(value, currency.value, localeCode.value)
}

async function confirmAlipay(stripe: Stripe, clientSecret: string, orderId: number) {
  redirecting.value = true
  const returnUrl = window.location.origin + '/payment/result?order_id=' + orderId + '&status=success'
  const { error } = await stripe.confirmAlipayPayment(clientSecret, { return_url: returnUrl })
  if (error) {
    redirecting.value = false
    stripeError.value = error.message || t('payment.result.failed')
  }
  // 无错误时 Stripe 会自动跳转
}

async function confirmWechatPay(stripe: Stripe, clientSecret: string) {
  const { paymentIntent, error } = await (stripe as Stripe & {
    confirmWechatPayPayment: (cs: string, opts: Record<string, unknown>) => Promise<{ paymentIntent?: { status: string; next_action?: { wechat_pay_display_qr_code?: { image_data_url?: string } } }; error?: { message?: string } }>
  }).confirmWechatPayPayment(clientSecret, {
    payment_method_options: { wechat_pay: { client: isMobileDevice() ? 'mobile_web' : 'web' } },
  })

  if (error) {
    stripeError.value = error.message || t('payment.result.failed')
    return
  }

  // 从 next_action 中提取二维码
  const qrData = paymentIntent?.next_action?.wechat_pay_display_qr_code?.image_data_url
  if (qrData) {
    wechatQrUrl.value = qrData
    // 轮询支付完成状态
    startPolling()
  } else if (paymentIntent?.status === 'succeeded') {
    stripeSuccess.value = true
    scheduleClose()
  } else {
    stripeError.value = t('payment.result.failed')
  }
}

function mountPaymentElement(stripe: Stripe, clientSecret: string) {
  if (disposed) return
  const isDark = document.documentElement.classList.contains('dark')
  const elements = stripe.elements({
    clientSecret,
    appearance: { theme: isDark ? 'night' : 'stripe', variables: { borderRadius: '8px' } },
  })
  elementsInstance = elements
  const paymentElement = elements.create('payment', {
    layout: 'tabs',
    paymentMethodOrder: ['alipay', 'wechat_pay', 'card', 'link'],
  } as Record<string, unknown>)
  paymentElement.mount('#stripe-payment-element')
  paymentElement.on('ready', () => { stripeReady.value = true })
}

async function handleGenericPay() {
  if (!stripeInstance || !elementsInstance || stripeSubmitting.value) return
  stripeSubmitting.value = true
  stripeError.value = ''
  try {
    const { error } = await stripeInstance.confirmPayment({
      elements: elementsInstance,
      confirmParams: {
        return_url: window.location.origin + '/payment/result?order_id=' + route.query.order_id + '&status=success',
      },
      redirect: 'if_required',
    })
    if (error) {
      stripeError.value = error.message || t('payment.result.failed')
    } else {
      stripeSuccess.value = true
      scheduleClose()
    }
  } catch (err: unknown) {
    stripeError.value = extractI18nErrorMessage(err, t, 'payment.errors', t('payment.result.failed'))
  } finally {
    stripeSubmitting.value = false
  }
}

let pollTimer: ReturnType<typeof setInterval> | null = null

function startPolling() {
  const orderId = Number(route.query.order_id)
  if (!orderId || disposed) return
  pollTimer = setInterval(async () => {
    const o = await paymentStore.pollOrderStatus(orderId)
    if (!o || disposed) return
    if (paymentSettlementState(o) === 'credit_failed') {
      if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
      wechatQrUrl.value = ''
      await router.replace({ path: '/payment/result', query: { order_id: String(orderId) } })
      return
    }
    if (o.status === 'COMPLETED' || o.status === 'PAID') {
      if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
      stripeSuccess.value = true
      wechatQrUrl.value = ''
      scheduleClose()
    }
  }, 3000)
}

function scheduleClose() {
  if (disposed) return
  if (window.opener) {
    redirectTimer = setTimeout(() => { window.close() }, 2000)
  } else {
    redirectTimer = setTimeout(() => {
      router.push({ path: '/payment/result', query: { order_id: String(route.query.order_id || ''), status: 'success' } })
    }, 2000)
  }
}

onUnmounted(() => {
  disposed = true
  if (redirectTimer) clearTimeout(redirectTimer)
  if (pollTimer) clearInterval(pollTimer)
})
</script>

<style scoped>
.sgm-gw-stage {
  background:
    radial-gradient(ellipse 65% 45% at 85% 0%, rgb(208 235 232 / 50%), transparent 65%),
    #f4f7f8;
}

.dark .sgm-gw-stage {
  background:
    radial-gradient(ellipse 65% 45% at 85% 0%, rgb(27 62 68 / 45%), transparent 65%),
    #0d1b20;
}

.sgm-gw-scope {
  --gw-panel: #ffffff;
  --gw-panel-subtle: #f7fafa;
  --gw-ink: #162b34;
  --gw-muted: #4d636b;
  --gw-line: #d4e0e2;
  --gw-line-strong: #b6c8cc;
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
  --gw-success-bg: #ecfdf5;
  --gw-success-fg: #059669;
  --gw-success-ring: rgb(5 150 105 / 18%);
  --gw-alipay-bg: #f0f9ff;
  --gw-alipay-ring: rgb(0 174 239 / 22%);
}

.dark .sgm-gw-scope {
  --gw-panel: #14272d;
  --gw-panel-subtle: #102127;
  --gw-ink: #e6f2f2;
  --gw-muted: #9db6bc;
  --gw-line: #29434b;
  --gw-line-strong: #3d5d67;
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
  --gw-success-bg: rgb(16 185 129 / 14%);
  --gw-success-fg: #34d399;
  --gw-success-ring: rgb(52 211 153 / 24%);
  --gw-alipay-bg: rgb(0 174 239 / 14%);
  --gw-alipay-ring: rgb(56 189 248 / 24%);
}

.sgm-gw-card {
  border: 1px solid var(--gw-line);
  border-radius: 1.125rem;
  background: var(--gw-panel);
  box-shadow: var(--gw-shadow-card);
}

.sgm-stripe-banner {
  background: linear-gradient(135deg, #635bff 0%, #4f46e5 100%);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 20%);
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

.sgm-gw-icon--success {
  background: var(--gw-success-bg);
  color: var(--gw-success-fg);
  box-shadow: inset 0 0 0 1px var(--gw-success-ring);
}

.sgm-gw-icon--alipay {
  background: var(--gw-alipay-bg);
  box-shadow: inset 0 0 0 1px var(--gw-alipay-ring);
}

.sgm-gw-alert {
  padding: 0.75rem 0.875rem;
  border: 1px solid var(--gw-danger-border);
  border-radius: 0.625rem;
  background: var(--gw-danger-bg);
  color: var(--gw-danger-fg);
  font-size: 0.875rem;
  line-height: 1.5;
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

.sgm-gw-btn:focus-visible,
.sgm-stripe-submit:focus-visible {
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
