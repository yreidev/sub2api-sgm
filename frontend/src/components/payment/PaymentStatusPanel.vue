<template>
  <div class="psp-root min-w-0 space-y-4 [&_button]:min-h-11" :class="{ 'sgm-recharge-status': hero }">
    <!-- ═══ Terminal States: show result, user clicks to return ═══ -->

    <!-- Success -->
    <template v-if="outcome === 'success'">
      <component :is="hero ? HeroPaymentPanel : 'div'" :class="hero ? undefined : 'card p-6'">
        <div class="flex flex-col items-center space-y-4 py-4" role="status" aria-live="polite">
          <div class="psp-icon psp-icon--success">
            <Icon name="check" size="lg" />
          </div>
          <p class="psp-title text-center">
            {{ props.orderType === 'subscription' ? t('payment.result.subscriptionSuccess') : t('payment.result.success') }}
          </p>
          <div v-if="paidOrder" class="psp-well w-full">
            <div class="space-y-2.5 text-sm">
              <div class="flex items-center justify-between gap-4">
                <span class="psp-muted">{{ t('payment.orders.orderId') }}</span>
                <span class="psp-value font-mono tabular-nums">#{{ paidOrder.id }}</span>
              </div>
              <div v-if="paidOrder.out_trade_no" class="flex items-start justify-between gap-4">
                <span class="psp-muted shrink-0">{{ t('payment.orders.orderNo') }}</span>
                <span class="psp-value min-w-0 break-all text-right font-mono text-xs tabular-nums sm:text-sm">{{ paidOrder.out_trade_no }}</span>
              </div>
              <div class="psp-divider flex items-baseline justify-between gap-4 border-t pt-2.5">
                <span class="psp-muted">{{ t('payment.orders.amount') }}</span>
                <span class="psp-value text-right tabular-nums">
                  {{ creditedAmountSymbol }}{{ paidOrder.amount.toFixed(2) }}
                  <span v-if="(paidOrder.bonus_amount ?? 0) > 0" class="psp-bonus ml-1 text-xs font-medium">
                    ({{ t('payment.orders.bonusIncluded', { amount: creditedAmountSymbol + (paidOrder.bonus_amount ?? 0).toFixed(2) }) }})
                  </span>
                </span>
              </div>
              <div class="flex items-baseline justify-between gap-4">
                <span class="psp-muted">{{ t('payment.orders.payAmount') }}</span>
                <span class="psp-value psp-amount-accent tabular-nums">{{ formatGatewayAmount(paidOrder.pay_amount, paidOrder.currency) }}</span>
              </div>
            </div>
          </div>
          <HeroPaymentControl v-if="hero" primary :label="t('common.confirm')" @press="handleDone" />
          <button v-else class="btn btn-primary" @click="handleDone">{{ t('common.confirm') }}</button>
        </div>
      </component>
    </template>

    <!-- Cancelled -->
    <template v-else-if="outcome === 'cancelled'">
      <component :is="hero ? HeroPaymentPanel : 'div'" :class="hero ? undefined : 'card p-6'">
        <div class="flex flex-col items-center space-y-4 py-4 text-center" role="status" aria-live="polite">
          <div class="psp-icon psp-icon--neutral">
            <svg class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p class="psp-title">{{ t('payment.qr.cancelled') }}</p>
          <p class="psp-muted max-w-sm text-sm leading-relaxed">{{ t('payment.qr.cancelledDesc') }}</p>
          <HeroPaymentControl v-if="hero" primary :label="t('common.confirm')" @press="handleDone" />
          <button v-else class="btn btn-primary" @click="handleDone">{{ t('common.confirm') }}</button>
        </div>
      </component>
    </template>

    <!-- Refunded -->
    <component :is="hero ? HeroPaymentPanel : 'div'" v-else-if="outcome === 'refunded'" :class="hero ? undefined : 'card p-6'">
      <div class="flex flex-col items-center space-y-4 py-4 text-center">
        <div class="psp-icon psp-icon--refunded">
          <svg class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.9" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
          </svg>
        </div>
        <p role="status" aria-live="polite" class="psp-title">{{ t('payment.status.refunded') }}</p>
        <div class="psp-order-chip">
          <span class="psp-muted">{{ t('payment.orders.orderNo') }}</span>
          <span class="psp-value break-all font-mono text-xs tabular-nums sm:text-sm">{{ displayOrderNumber }}</span>
        </div>
        <HeroPaymentControl v-if="hero" primary :label="t('payment.result.chooseAmountAgain')" @press="handleDone" />
        <button v-else type="button" class="btn btn-primary" @click="handleDone">{{ t('payment.result.backToRecharge') }}</button>
      </div>
    </component>

    <!-- Expired / Failed -->
    <template v-else-if="outcome === 'expired' || outcome === 'failed'">
      <component :is="hero ? HeroPaymentPanel : 'div'" :class="hero ? undefined : 'card p-6'">
        <div class="flex flex-col items-center space-y-4 py-4 text-center" role="status" aria-live="polite">
          <div :class="['psp-icon', outcome === 'failed' ? 'psp-icon--danger' : 'psp-icon--warning']">
            <svg v-if="outcome === 'failed'" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <svg v-else class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.9" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p class="psp-title">{{ t(outcome === 'failed' ? 'payment.result.failed' : 'payment.qr.expired') }}</p>
          <p v-if="outcome === 'expired'" class="psp-muted max-w-sm text-sm leading-relaxed">{{ t('payment.qr.expiredDesc') }}</p>
          <HeroPaymentControl v-if="hero" primary :label="t('common.confirm')" @press="handleDone" />
          <button v-else class="btn btn-primary" @click="handleDone">{{ t('common.confirm') }}</button>
        </div>
      </component>
    </template>

    <!-- Settling / Credit Failed / Expiry Verification -->
    <component :is="hero ? HeroPaymentPanel : 'div'" v-else-if="settlement || awaitingExpiryCheck" :class="hero ? undefined : 'card p-6'">
      <div class="flex flex-col items-center space-y-3.5 py-4 text-center" role="status" aria-live="polite">
        <template v-if="settlement === 'credit_failed'">
          <div class="psp-icon psp-icon--warning">
            <svg class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.9" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>
          <p class="psp-title">{{ t('payment.result.creditFailed') }}</p>
          <p class="psp-muted max-w-md text-sm leading-relaxed">{{ t('payment.result.creditFailedHint') }}</p>
          <div class="psp-order-chip">
            <span class="psp-muted">{{ t('payment.orders.orderNo') }}</span>
            <span class="psp-value break-all font-mono text-xs tabular-nums sm:text-sm">{{ displayOrderNumber }}</span>
          </div>
        </template>
        <template v-else>
          <div class="psp-icon psp-icon--accent">
            <span class="psp-spinner" aria-hidden="true"></span>
          </div>
          <p class="psp-title">{{ t(settlement ? 'dashboard.assistantSetup.settling' : 'payment.qr.waitingPayment') }}</p>
        </template>
        <HeroPaymentControl v-if="hero" :label="t('dashboard.assistantSetup.checkOrder')" @press="pollStatus" />
        <button v-else type="button" class="btn btn-secondary" @click="pollStatus">{{ t('dashboard.assistantSetup.checkOrder') }}</button>
      </div>
    </component>

    <!-- ═══ Active States: QR or Popup waiting ═══ -->

    <!-- Mobile Alipay app handoff. The QR fallback stays hidden until launch timeout. -->
    <template v-else-if="isMobileAlipayDeepLink">
      <template v-if="!deepLinkFallbackVisible">
        <component :is="hero ? HeroPaymentPanel : 'div'" :class="hero ? undefined : 'card p-6'">
          <div class="flex flex-col items-center space-y-4 py-4 text-center">
            <HeroPaymentMessage v-if="hero && deepLinkState === 'launching'" loading :text="t('payment.qr.alipayOpening')" />
            <div
              v-else-if="deepLinkState === 'launching'"
              class="h-10 w-10 animate-spin rounded-full border-4 border-[#00AEEF] border-t-transparent motion-reduce:animate-none"
              aria-hidden="true"
            ></div>
            <div
              v-else
              class="psp-icon psp-icon--alipay"
            >
              <Icon name="checkCircle" size="lg" />
            </div>
            <p class="psp-title">
              {{ deepLinkState === 'backgrounded' ? t('payment.qr.alipayContinueInApp') : t('payment.qr.alipayOpening') }}
            </p>
            <p class="psp-muted max-w-sm text-sm leading-relaxed">{{ t('payment.qr.alipayWaitingHint') }}</p>
            <template v-if="deepLinkState === 'backgrounded'">
              <HeroPaymentControl v-if="hero" primary :label="t('payment.qr.reopenAlipay')" data-test="reopen-alipay" @press="reopenAlipay" />
              <button v-else
                data-test="reopen-alipay"
                class="btn btn-alipay inline-flex items-center gap-2 text-sm"
                @click="reopenAlipay"
              >
                <Icon name="externalLink" size="sm" />
                {{ t('payment.qr.reopenAlipay') }}
              </button>
            </template>
          </div>
        </component>
        <component :is="hero ? HeroPaymentPanel : 'div'" :class="hero ? undefined : 'card p-4 text-center'">
          <div class="py-1 text-center">
            <p class="psp-muted text-sm">{{ t('payment.qr.expiresIn') }}</p>
            <p class="psp-countdown mt-1">{{ countdownDisplay }}</p>
            <p class="psp-subtle mt-1 text-xs">{{ t('payment.qr.waitingPayment') }}</p>
          </div>
        </component>
      </template>
      <template v-else>
        <component :is="hero ? HeroPaymentPanel : 'div'" data-test="alipay-qr-fallback" :class="hero ? undefined : 'card p-6'">
          <div class="flex flex-col items-center space-y-4">
            <div class="text-center">
              <p class="psp-title">{{ t('payment.qr.alipayFallbackTitle') }}</p>
              <p class="psp-muted mt-1 text-sm leading-relaxed">{{ t('payment.qr.alipayFallbackHint') }}</p>
            </div>
            <div class="psp-well w-full space-y-2 text-sm">
              <div class="flex items-start justify-between gap-4">
                <span class="psp-muted">{{ t('payment.orders.payAmount') }}</span>
                <span class="psp-value psp-amount-accent tabular-nums">{{ displayPaymentAmount }}</span>
              </div>
              <div class="flex items-start justify-between gap-4">
                <span class="psp-muted shrink-0">{{ t('payment.orders.orderNo') }}</span>
                <span class="psp-value max-w-[70%] break-all text-right font-mono text-xs tabular-nums">
                  {{ displayOrderNumber }}
                </span>
              </div>
              <div class="flex items-start justify-between gap-4">
                <span class="psp-muted">{{ t('payment.qr.expiresIn') }}</span>
                <span class="psp-value tabular-nums">{{ countdownDisplay }}</span>
              </div>
            </div>
            <div :class="['relative max-w-full rounded-xl border-2 p-2.5 shadow-sm sm:p-4', qrBorderClass]">
              <canvas ref="qrCanvas" class="mx-auto !h-auto max-w-full rounded-md"></canvas>
              <div class="pointer-events-none absolute inset-0 flex items-center justify-center">
                <span :class="['rounded-full p-2 shadow-md ring-2 ring-white', qrLogoBgClass]">
                  <img :src="qrLogoIcon" alt="" class="h-5 w-5 brightness-0 invert" />
                </span>
              </div>
            </div>
            <p class="psp-muted text-center text-sm leading-6">
              {{ t('payment.qr.alipaySaveAndScanHint') }}
            </p>
            <div class="grid w-full gap-2 sm:grid-cols-2">
              <HeroPaymentControl v-if="hero" primary :label="t('payment.qr.reopenAlipay')" data-test="reopen-alipay" @press="reopenAlipay" />
              <button v-else
                data-test="reopen-alipay"
                class="btn btn-alipay inline-flex items-center justify-center gap-2"
                @click="reopenAlipay"
              >
                <Icon name="externalLink" size="sm" />
                {{ t('payment.qr.reopenAlipay') }}
              </button>
              <HeroPaymentControl v-if="hero" :label="t('payment.qr.saveQRCode')" data-test="save-alipay-qr" @press="saveQRCode" />
              <button v-else
                data-test="save-alipay-qr"
                class="btn btn-secondary inline-flex items-center justify-center gap-2"
                @click="saveQRCode"
              >
                <Icon name="download" size="sm" />
                {{ t('payment.qr.saveQRCode') }}
              </button>
            </div>
            <HeroPaymentControl v-if="hero" :label="t(props.waitForCredit ? 'payment.qr.cancelOrder' : 'payment.result.backToRecharge')" :disabled="cancelling" @press="props.waitForCredit ? handleCancel() : handleDone()" />
            <button v-else class="btn btn-secondary w-full" :disabled="cancelling" @click="props.waitForCredit ? handleCancel() : handleDone()">
              {{ t(props.waitForCredit ? 'payment.qr.cancelOrder' : 'payment.result.backToRecharge') }}
            </button>
          </div>
        </component>
      </template>
    </template>

    <!-- QR Code Mode -->
    <template v-else-if="showQRCode">
      <component :is="hero ? HeroPaymentPanel : 'div'" :class="hero ? undefined : 'card p-6'">
        <div class="flex flex-col items-center space-y-4">
          <p class="psp-title text-center">{{ scanTitle }}</p>
          <div :class="['relative max-w-full rounded-xl border-2 p-2.5 shadow-sm sm:p-4', qrBorderClass]">
            <canvas ref="qrCanvas" class="mx-auto !h-auto max-w-full rounded-md"></canvas>
            <!-- Brand logo overlay -->
            <div class="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span :class="['rounded-full p-2 shadow-md ring-2 ring-white', qrLogoBgClass]">
                <img :src="qrLogoIcon" alt="" class="h-5 w-5 brightness-0 invert" />
              </span>
            </div>
          </div>
          <p v-if="scanHint" class="psp-muted text-center text-sm leading-relaxed">{{ scanHint }}</p>
          <template v-if="payUrl">
            <HeroPaymentControl v-if="hero" data-testid="reopen-payment-window" :label="t('payment.qr.openPayWindow')" @press="reopenPopup" />
            <button v-else type="button" data-testid="reopen-payment-window" class="btn btn-secondary text-sm" @click="reopenPopup">
              {{ t('payment.qr.openPayWindow') }}
            </button>
          </template>
        </div>
      </component>
      <component :is="hero ? HeroPaymentPanel : 'div'" :class="hero ? undefined : 'card p-4 text-center'">
        <div class="py-1 text-center">
          <p class="psp-muted text-sm">{{ t('payment.qr.expiresIn') }}</p>
          <p class="psp-countdown mt-1">{{ countdownDisplay }}</p>
          <p class="psp-subtle mt-1 text-xs">{{ t('payment.qr.waitingPayment') }}</p>
        </div>
      </component>
      <HeroPaymentControl v-if="hero" :label="cancelling ? t('common.processing') : t('payment.qr.cancelOrder')" :disabled="cancelling" @press="handleCancel" />
      <button v-else class="btn btn-secondary w-full" :disabled="cancelling" @click="handleCancel">
        {{ cancelling ? t('common.processing') : t('payment.qr.cancelOrder') }}
      </button>
    </template>

    <!-- Waiting for Popup/Redirect Mode -->
    <template v-else>
      <component :is="hero ? HeroPaymentPanel : 'div'" :class="hero ? undefined : 'card p-6'">
        <div class="flex flex-col items-center space-y-4 py-4 text-center">
          <HeroPaymentMessage v-if="hero" loading :text="t('payment.qr.waitingPayment')" />
          <div v-else class="h-10 w-10 animate-spin rounded-full border-4 border-primary-500 border-t-transparent motion-reduce:animate-none" aria-hidden="true"></div>
          <p class="psp-muted max-w-sm text-sm leading-relaxed">{{ t('payment.qr.payInNewWindowHint') }}</p>
          <template v-if="payUrl">
            <HeroPaymentControl v-if="hero" data-testid="reopen-payment-window" :label="t('payment.qr.openPayWindow')" @press="reopenPopup" />
            <button v-else type="button" data-testid="reopen-payment-window" class="btn btn-secondary text-sm" @click="reopenPopup">
              {{ t('payment.qr.openPayWindow') }}
            </button>
          </template>
        </div>
      </component>
      <component :is="hero ? HeroPaymentPanel : 'div'" :class="hero ? undefined : 'card p-4 text-center'">
        <div class="py-1 text-center">
          <p class="psp-countdown mt-1">{{ countdownDisplay }}</p>
          <p class="psp-subtle mt-1 text-xs">{{ t('payment.qr.waitingPayment') }}</p>
        </div>
      </component>
      <HeroPaymentControl v-if="hero" :label="cancelling ? t('common.processing') : t('payment.qr.cancelOrder')" :disabled="cancelling" @press="handleCancel" />
      <button v-else class="btn btn-secondary w-full" :disabled="cancelling" @click="handleCancel">
        {{ cancelling ? t('common.processing') : t('payment.qr.cancelOrder') }}
      </button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { defineAsyncComponent, ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePaymentStore } from '@/stores/payment'
import { useAppStore } from '@/stores'
import { paymentAPI } from '@/api/payment'
import { extractI18nErrorMessage } from '@/utils/apiError'
import { getPaymentPopupFeatures, isBuiltInAlipayMethod, isBuiltInWxpayMethod } from '@/components/payment/providerConfig'
import { currencySymbol, formatPaymentAmount, normalizePaymentCurrency } from '@/components/payment/currency'
import { paymentSettlementState, type SettlementState } from './paymentFlow'
import type { PaymentOrder } from '@/types/payment'
import Icon from '@/components/icons/Icon.vue'
import QRCode from 'qrcode'
import alipayIcon from '@/assets/icons/alipay.svg'
import wxpayIcon from '@/assets/icons/wxpay.svg'
import paymentIcon from '@/assets/icons/payment.svg'
import {
  createAlipayDeepLinkLauncher,
  type AlipayDeepLinkLauncher,
  type AlipayDeepLinkState,
} from './alipayDeepLink'

const HeroPaymentMessage = defineAsyncComponent(() => import('@/components/assistant/HeroPaymentMessage.vue'))
const HeroPaymentPanel = defineAsyncComponent(() => import('@/components/assistant/HeroPaymentPanel.vue'))
const HeroPaymentControl = defineAsyncComponent(() => import('@/components/assistant/HeroPaymentControl.vue'))
const props = defineProps<{
  orderId: number
  amount?: number
  payAmount?: number
  qrCode: string
  expiresAt: string
  paymentType: string
  payUrl?: string
  orderType?: string
  currency?: string
  outTradeNo?: string
  mobileAlipayDeepLink?: boolean
  waitForCredit?: boolean
  hero?: boolean
  initialSettlement?: SettlementState
  initiallyRefunded?: boolean
}>()

type PaymentOutcome = 'success' | 'cancelled' | 'expired' | 'failed' | 'refunded'

const emit = defineEmits<{ done: []; success: []; settled: [outcome: PaymentOutcome] }>()

const i18n = useI18n()
const { t } = i18n
const paymentStore = usePaymentStore()
const appStore = useAppStore()

const qrCanvas = ref<HTMLCanvasElement | null>(null)
const qrUrl = ref('')
const remainingSeconds = ref(0)
const cancelling = ref(false)
const paidOrder = ref<PaymentOrder | null>(null)
const settlement = ref<SettlementState>(props.initialSettlement ?? null)
const awaitingExpiryCheck = ref(false)
const deepLinkState = ref<AlipayDeepLinkState>('idle')
const deepLinkFallbackVisible = ref(false)
const paymentCurrency = computed(() => normalizePaymentCurrency(props.currency))
const creditedAmountSymbol = currencySymbol('USD')
const localeCode = computed(() => {
  const raw = i18n.locale as unknown
  if (typeof raw === 'string') return raw
  if (raw && typeof raw === 'object' && 'value' in raw) {
    return String((raw as { value?: string }).value || '')
  }
  return undefined
})

// A null outcome means the order is still active.
const outcome = ref<PaymentOutcome | null>(props.initiallyRefunded ? 'refunded' : null)

let pollTimer: ReturnType<typeof setInterval> | null = null
let countdownTimer: ReturnType<typeof setInterval> | null = null
let verifyAttempts = 0
let lastVerifyAt = 0
let alipayLauncher: AlipayDeepLinkLauncher | null = null

const VERIFY_RETRY_INTERVAL_MS = 15000
const VERIFY_RETRY_MAX_ATTEMPTS = 6

const isAlipay = computed(() => isBuiltInAlipayMethod(props.paymentType))
const isWxpay = computed(() => isBuiltInWxpayMethod(props.paymentType))
const isMobileAlipayDeepLink = computed(() => props.mobileAlipayDeepLink === true && isAlipay.value && !!qrUrl.value)
const showQRCode = computed(() => !!qrUrl.value && (!isMobileAlipayDeepLink.value || deepLinkFallbackVisible.value))

const qrBorderClass = computed(() => {
  if (isAlipay.value) return 'border-[#00AEEF]/80 bg-sky-50/70 dark:border-[#00AEEF]/60 dark:bg-sky-950/20'
  if (isWxpay.value) return 'border-[#2BB741]/80 bg-emerald-50/70 dark:border-[#2BB741]/60 dark:bg-emerald-950/20'
  if (props.hero) return 'border-[var(--border,#d4e0e2)] bg-white'
  return 'border-gray-200 bg-white dark:border-dark-600 dark:bg-dark-800'
})

const qrLogoBgClass = computed(() => {
  if (isAlipay.value) return 'bg-[#00AEEF]'
  if (isWxpay.value) return 'bg-[#2BB741]'
  return 'bg-gray-400'
})

const qrLogoIcon = computed(() => {
  if (isAlipay.value) return alipayIcon
  if (isWxpay.value) return wxpayIcon
  return paymentIcon
})

const scanTitle = computed(() => {
  if (isAlipay.value) return t('payment.qr.scanAlipay')
  if (isWxpay.value) return t('payment.qr.scanWxpay')
  return t('payment.qr.scanToPay')
})

const scanHint = computed(() => {
  if (isAlipay.value) return t('payment.qr.scanAlipayHint')
  if (isWxpay.value) return t('payment.qr.scanWxpayHint')
  return ''
})

const countdownDisplay = computed(() => {
  const m = Math.floor(remainingSeconds.value / 60)
  const s = remainingSeconds.value % 60
  return m.toString().padStart(2, '0') + ':' + s.toString().padStart(2, '0')
})

const displayPaymentAmount = computed(() => formatGatewayAmount(props.payAmount || props.amount || 0))
const displayOrderNumber = computed(() => props.outTradeNo || `#${props.orderId}`)

function formatGatewayAmount(value: number, currency?: string | null): string {
  return formatPaymentAmount(value, currency || paymentCurrency.value, localeCode.value, props.hero ? 'code' : 'narrowSymbol')
}

function isSuccessStatus(status: string | null | undefined): boolean {
  return status === 'COMPLETED' || status === 'PAID' || status === 'RECHARGING'
}

function reopenPopup() {
  if (props.payUrl) {
    const win = window.open(props.payUrl, 'paymentPopup', getPaymentPopupFeatures())
    if (!win || win.closed) {
      window.location.href = props.payUrl
    }
  }
}

function setOutcome(next: PaymentOutcome) {
  if (outcome.value === next) return
  outcome.value = next
  emit('settled', next)
}

async function renderQR() {
  await nextTick()
  if (!showQRCode.value || !qrCanvas.value || !qrUrl.value) return
  await QRCode.toCanvas(qrCanvas.value, qrUrl.value, {
    width: 220, margin: 2,
    errorCorrectionLevel: 'M',
  })
}

function updateDeepLinkState(state: AlipayDeepLinkState) {
  deepLinkState.value = state
  if (state === 'fallback') {
    deepLinkFallbackVisible.value = true
    renderQR()
  } else if (state === 'backgrounded') {
    deepLinkFallbackVisible.value = false
  }
}

function reopenAlipay() {
  alipayLauncher?.launch()
}

function saveQRCode() {
  const canvas = qrCanvas.value
  if (!canvas) return
  const link = document.createElement('a')
  link.href = canvas.toDataURL('image/png')
  link.download = `alipay-${props.outTradeNo || props.orderId}.png`
  document.body.appendChild(link)
  link.click()
  link.remove()
}

async function tryRecoverPendingOrder(order: PaymentOrder): Promise<PaymentOrder> {
  if (!isWxpay.value && !isAlipay.value) return order
  const outTradeNo = String(order.out_trade_no || '').trim()
  if (!outTradeNo) return order
  const normalizedStatus = String(order.status || '').trim().toUpperCase()
  if (normalizedStatus !== 'PENDING') return order
  const now = Date.now()
  if (verifyAttempts >= VERIFY_RETRY_MAX_ATTEMPTS || now - lastVerifyAt < VERIFY_RETRY_INTERVAL_MS) {
    return order
  }

  lastVerifyAt = now
  verifyAttempts += 1
  try {
    const result = await paymentAPI.verifyOrder(outTradeNo)
    return result.data ?? order
  } catch {
    return order
  }
}

let pollInFlight = false
async function pollStatus() {
  if (!props.orderId || outcome.value) return
  // 防重入：接口（含 verifyOrder 二次确认）响应慢于 3 秒轮询间隔时避免并发重叠请求。
  if (pollInFlight) return
  pollInFlight = true
  try {
    let order = await paymentStore.pollOrderStatus(props.orderId)
    if (!order) return
    // 已进入终态则不再处理迟到的响应。
    if (outcome.value) return
    order = await tryRecoverPendingOrder(order)
    if (outcome.value) return
    const nextSettlement = paymentSettlementState(order)
    if (nextSettlement && (nextSettlement === 'credit_failed' || props.waitForCredit || settlement.value)) {
      settlement.value = nextSettlement
      if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null }
      alipayLauncher?.dispose()
      alipayLauncher = null
      return
    }
    if (isSuccessStatus(order.status)) {
      cleanup()
      paidOrder.value = order
      setOutcome('success')
      emit('success')
    } else if (order.status === 'REFUNDED') {
      cleanup()
      setOutcome('refunded')
    } else if (order.status === 'CANCELLED') {
      cleanup()
      setOutcome('cancelled')
    } else if (order.status === 'EXPIRED' || order.status === 'FAILED') {
      cleanup()
      setOutcome(props.waitForCredit && order.status === 'FAILED' ? 'failed' : 'expired')
    }
  } finally {
    pollInFlight = false
  }
}

function startCountdown(seconds: number) {
  remainingSeconds.value = Math.max(0, seconds)
  const deadline = Date.now() + remainingSeconds.value * 1000
  if (remainingSeconds.value <= 0) {
    handleCountdownEnd()
    return
  }
  countdownTimer = setInterval(() => {
    remainingSeconds.value = Math.max(0, Math.floor((deadline - Date.now()) / 1000))
    if (remainingSeconds.value <= 0) handleCountdownEnd()
  }, 1000)
}

function handleCountdownEnd() {
  if (props.waitForCredit) {
    awaitingExpiryCheck.value = true
    if (countdownTimer) {
      clearInterval(countdownTimer)
      countdownTimer = null
    }
    alipayLauncher?.dispose()
    alipayLauncher = null
    void pollStatus()
    return
  }
  setOutcome('expired')
  cleanup()
}

async function handleCancel() {
  if (!props.orderId || cancelling.value) return
  cancelling.value = true
  try {
    await paymentAPI.cancelOrder(props.orderId)
    if (props.waitForCredit) {
      await pollStatus()
      return
    }
    cleanup()
    setOutcome('cancelled')
  } catch (err: unknown) {
    appStore.showError(extractI18nErrorMessage(err, t, 'payment.errors', t('common.error')))
  } finally {
    cancelling.value = false
  }
}

function handleDone() { cleanup(); emit('done') }

function cleanup() {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
  if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null }
  alipayLauncher?.dispose()
  alipayLauncher = null
}

// Initialize on mount
qrUrl.value = props.qrCode
verifyAttempts = 0
lastVerifyAt = 0
let seconds = 30 * 60
if (props.expiresAt) {
  seconds = Math.floor((new Date(props.expiresAt).getTime() - Date.now()) / 1000)
}
if (!outcome.value) {
  if (!settlement.value) startCountdown(seconds)
  if (!outcome.value) pollTimer = setInterval(pollStatus, 3000)
}
watch([qrCanvas, qrUrl, showQRCode], () => renderQR(), { flush: 'post' })
onMounted(() => {
  if (outcome.value || settlement.value || awaitingExpiryCheck.value || !isMobileAlipayDeepLink.value) return
  alipayLauncher = createAlipayDeepLinkLauncher({
    qrCode: qrUrl.value,
    document,
    lifecycleTarget: window,
    userAgent: window.navigator.userAgent,
    assignLocation: (url) => window.location.assign(url),
    onStateChange: updateDeepLinkState,
  })
  alipayLauncher.launch()
})
onUnmounted(() => cleanup())
</script>

<style scoped>
.psp-root {
  --psp-ink: #111827;
  --psp-muted: #64748b;
  --psp-subtle: #64748b;
  --psp-well-bg: #f8fafc;
  --psp-well-border: #e2e8f0;
  --psp-divider: #e2e8f0;
  --psp-accent: #0f766e;
  --psp-tint: #ebf5f4;
  --psp-icon-neutral-bg: #f1f5f9;
  --psp-icon-neutral-fg: #475569;
  --psp-icon-neutral-ring: rgb(71 85 105 / 16%);
  --psp-icon-success-bg: #ecfdf5;
  --psp-icon-success-fg: #059669;
  --psp-icon-success-ring: rgb(5 150 105 / 18%);
  --psp-icon-warning-bg: #fffbeb;
  --psp-icon-warning-fg: #d97706;
  --psp-icon-warning-ring: rgb(217 119 6 / 20%);
  --psp-icon-danger-bg: #fef2f2;
  --psp-icon-danger-fg: #dc2626;
  --psp-icon-danger-ring: rgb(220 38 38 / 18%);
  --psp-icon-refunded-bg: #f5f3ff;
  --psp-icon-refunded-fg: #7c3aed;
  --psp-icon-refunded-ring: rgb(124 58 237 / 18%);
  --psp-icon-accent-bg: #ebf5f4;
  --psp-icon-accent-ring: rgb(25 87 98 / 16%);
  --psp-icon-alipay-bg: #f0f9ff;
  --psp-icon-alipay-fg: #0284c7;
  --psp-icon-alipay-ring: rgb(0 174 239 / 22%);
  --psp-bonus-fg: #b45309;
}

.dark .psp-root:not(.sgm-recharge-status) {
  --psp-ink: #f1f5f9;
  --psp-muted: #94a3b8;
  --psp-subtle: #94a3b8;
  --psp-well-bg: rgb(15 23 42 / 55%);
  --psp-well-border: rgb(71 85 105 / 55%);
  --psp-divider: rgb(71 85 105 / 45%);
  --psp-accent: #5eead4;
  --psp-tint: rgb(45 212 191 / 12%);
  --psp-icon-neutral-bg: rgb(51 65 85 / 55%);
  --psp-icon-neutral-fg: #cbd5e1;
  --psp-icon-neutral-ring: rgb(148 163 184 / 22%);
  --psp-icon-success-bg: rgb(16 185 129 / 14%);
  --psp-icon-success-fg: #34d399;
  --psp-icon-success-ring: rgb(52 211 153 / 24%);
  --psp-icon-warning-bg: rgb(245 158 11 / 14%);
  --psp-icon-warning-fg: #fbbf24;
  --psp-icon-warning-ring: rgb(251 191 36 / 24%);
  --psp-icon-danger-bg: rgb(239 68 68 / 14%);
  --psp-icon-danger-fg: #f87171;
  --psp-icon-danger-ring: rgb(248 113 113 / 24%);
  --psp-icon-refunded-bg: rgb(139 92 246 / 14%);
  --psp-icon-refunded-fg: #c4b5fd;
  --psp-icon-refunded-ring: rgb(196 181 253 / 24%);
  --psp-icon-accent-bg: rgb(45 212 191 / 14%);
  --psp-icon-accent-ring: rgb(94 234 212 / 24%);
  --psp-icon-alipay-bg: rgb(0 174 239 / 14%);
  --psp-icon-alipay-fg: #38bdf8;
  --psp-icon-alipay-ring: rgb(56 189 248 / 24%);
  --psp-bonus-fg: #fbbf24;
}

/* SGM Light-locked hero recharge modal mode */
.psp-root.sgm-recharge-status {
  --psp-ink: var(--foreground, #162b34);
  --psp-muted: var(--muted, #4d636b);
  --psp-subtle: var(--muted, #4d636b);
  --psp-well-bg: var(--panel-subtle, #f7fafa);
  --psp-well-border: var(--border, #d4e0e2);
  --psp-divider: var(--line-subtle, #e4ecee);
  --psp-accent: var(--accent, #195762);
  --psp-tint: var(--tint, #ebf5f4);
  --psp-icon-neutral-bg: var(--default, #eaf1f1);
  --psp-icon-neutral-fg: var(--muted, #4d636b);
  --psp-icon-neutral-ring: rgb(22 43 52 / 12%);
  --psp-icon-success-bg: var(--success-soft, #e4f2ea);
  --psp-icon-success-fg: var(--success-soft-foreground, #1f5c42);
  --psp-icon-success-ring: var(--success-line, #bedcc9);
  --psp-icon-warning-bg: var(--warning-soft, #fdf5e6);
  --psp-icon-warning-fg: var(--warning-soft-foreground, #7a4c0b);
  --psp-icon-warning-ring: var(--warning-line, #ebd6ad);
  --psp-icon-danger-bg: var(--danger-soft, #fdeeee);
  --psp-icon-danger-fg: var(--danger-soft-foreground, #962b2b);
  --psp-icon-danger-ring: var(--danger-line, #efc9c9);
  --psp-icon-accent-bg: var(--tint, #ebf5f4);
  --psp-icon-accent-ring: var(--accent-line, rgb(25 87 98 / 15%));
}

.psp-title {
  color: var(--psp-ink);
  font-size: 1.125rem;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: -0.02em;
  text-wrap: balance;
}

.psp-muted {
  color: var(--psp-muted);
}

.psp-subtle {
  color: var(--psp-subtle);
}

.psp-value {
  color: var(--psp-ink);
  font-weight: 500;
}

.psp-amount-accent {
  color: var(--psp-accent);
  font-weight: 600;
}

.psp-countdown {
  color: var(--psp-ink);
  font-size: 1.75rem;
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: -0.025em;
  font-variant-numeric: tabular-nums;
}

.psp-well {
  padding: 1rem 1.125rem;
  border: 1px solid var(--psp-well-border);
  border-radius: 0.875rem;
  background: var(--psp-well-bg);
}

.psp-divider {
  border-color: var(--psp-divider);
}

.psp-order-chip {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.375rem 0.625rem;
  max-width: 100%;
  padding: 0.5rem 0.875rem;
  border: 1px solid var(--psp-well-border);
  border-radius: 0.625rem;
  background: var(--psp-well-bg);
  font-size: 0.875rem;
}

.psp-icon {
  display: flex;
  height: 3.75rem;
  width: 3.75rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
}

.psp-icon--success {
  background: var(--psp-icon-success-bg);
  color: var(--psp-icon-success-fg);
  box-shadow: inset 0 0 0 1px var(--psp-icon-success-ring);
}

.psp-icon--neutral {
  background: var(--psp-icon-neutral-bg);
  color: var(--psp-icon-neutral-fg);
  box-shadow: inset 0 0 0 1px var(--psp-icon-neutral-ring);
}

.psp-icon--refunded {
  background: var(--psp-icon-refunded-bg);
  color: var(--psp-icon-refunded-fg);
  box-shadow: inset 0 0 0 1px var(--psp-icon-refunded-ring);
}

.psp-icon--warning {
  background: var(--psp-icon-warning-bg);
  color: var(--psp-icon-warning-fg);
  box-shadow: inset 0 0 0 1px var(--psp-icon-warning-ring);
}

.psp-icon--danger {
  background: var(--psp-icon-danger-bg);
  color: var(--psp-icon-danger-fg);
  box-shadow: inset 0 0 0 1px var(--psp-icon-danger-ring);
}

.psp-icon--accent {
  background: var(--psp-icon-accent-bg);
  color: var(--psp-accent);
  box-shadow: inset 0 0 0 1px var(--psp-icon-accent-ring);
}

.psp-icon--alipay {
  background: var(--psp-icon-alipay-bg);
  color: var(--psp-icon-alipay-fg);
  box-shadow: inset 0 0 0 1px var(--psp-icon-alipay-ring);
}

.psp-bonus {
  color: var(--psp-bonus-fg);
}

.psp-spinner {
  display: block;
  height: 1.75rem;
  width: 1.75rem;
  border-radius: 9999px;
  border: 3px solid color-mix(in srgb, var(--psp-accent) 22%, transparent);
  border-top-color: var(--psp-accent);
  animation: psp-spin 0.85s linear infinite;
}

@keyframes psp-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .psp-spinner {
    animation: none;
  }
}
</style>
