<template>
  <main class="sgm-pay-stage flex min-h-screen items-center justify-center px-4 py-8">
    <div class="w-full max-w-md">
      <!-- Loading -->
      <div v-if="loading" class="sgm-pay-card flex items-center justify-center py-20">
        <span class="sgm-spinner" role="status" aria-live="polite" :aria-label="t('common.loading')"></span>
      </div>
      <div v-else class="sgm-pay-card space-y-6">
        <!-- Status Header -->
        <div class="flex flex-col items-center text-center" role="status" aria-live="polite">
          <div v-if="isSuccess" class="sgm-result-icon sgm-result-icon--success">
            <svg class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.1" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div v-else-if="creditFailed" class="sgm-result-icon sgm-result-icon--warning">
            <svg class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.9" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>
          <div v-else-if="isPending" class="sgm-result-icon sgm-result-icon--pending">
            <span class="sgm-spinner sgm-spinner--pending" aria-hidden="true"></span>
          </div>
          <div v-else-if="isRefunded" class="sgm-result-icon sgm-result-icon--refunded">
            <svg class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.9" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
            </svg>
          </div>
          <div v-else class="sgm-result-icon sgm-result-icon--danger">
            <svg class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.1" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 class="sgm-result-title mt-4">
            {{ statusTitle }}
          </h1>
          <p v-if="isPending" class="sgm-result-hint mt-2">
            {{ t(creditFailed ? 'payment.result.creditFailedHint' : 'payment.result.processingHint') }}
          </p>
        </div>

        <!-- Order Info -->
        <div v-if="order" class="sgm-result-well">
          <dl class="sgm-result-list text-sm">
            <div v-if="hasOrderId(order)" class="sgm-result-row">
              <dt class="sgm-result-label">{{ t('payment.orders.orderId') }}</dt>
              <dd class="sgm-result-value font-mono tabular-nums">#{{ order.id }}</dd>
            </div>
            <div v-if="order.out_trade_no" class="sgm-result-row">
              <dt class="sgm-result-label shrink-0">{{ t('payment.orders.orderNo') }}</dt>
              <dd class="sgm-result-value min-w-0 break-all text-right font-mono text-xs tabular-nums sm:text-sm">{{ order.out_trade_no }}</dd>
            </div>
            <div v-if="hasAmountFields(order)" class="sgm-result-row">
              <dt class="sgm-result-label">{{ t('payment.orders.baseAmount') }}</dt>
              <dd class="sgm-result-value tabular-nums">{{ formatGatewayAmount(baseAmount) }}</dd>
            </div>
            <div v-if="hasAmountFields(order) && order.fee_rate > 0" class="sgm-result-row">
              <dt class="sgm-result-label">{{ t('payment.orders.fee') }} ({{ order.fee_rate }}%)</dt>
              <dd class="sgm-result-value tabular-nums">{{ formatGatewayAmount(feeAmount) }}</dd>
            </div>
            <div v-if="hasAmountFields(order)" class="sgm-result-row">
              <dt class="sgm-result-label">{{ t('payment.orders.payAmount') }}</dt>
              <dd class="sgm-result-pay tabular-nums">{{ formatGatewayAmount(order.pay_amount) }}</dd>
            </div>
            <div v-if="hasAmountFields(order) && orderBonusAmount(order) > 0" class="sgm-result-row">
              <dt class="sgm-result-label">{{ t('payment.orders.bonusAmount') }}</dt>
              <dd class="sgm-result-bonus tabular-nums">+${{ orderBonusAmount(order).toFixed(2) }}</dd>
            </div>
            <div v-if="hasAmountFields(order) && (order.amount !== order.pay_amount || orderBonusAmount(order) > 0)" class="sgm-result-row">
              <dt class="sgm-result-label">{{ t('payment.orders.creditedAmount') }}</dt>
              <dd class="sgm-result-value tabular-nums">{{ order.order_type === 'balance' ? '$' + order.amount.toFixed(2) : formatGatewayAmount(order.amount) }}</dd>
            </div>
            <div v-if="hasPaymentType(order)" class="sgm-result-row">
              <dt class="sgm-result-label">{{ t('payment.orders.paymentMethod') }}</dt>
              <dd class="sgm-result-value">{{ t(paymentMethodI18nKey(order.payment_type), normalizedOrderPaymentType(order.payment_type)) }}</dd>
            </div>
            <div class="sgm-result-row">
              <dt class="sgm-result-label">{{ t('payment.orders.status') }}</dt>
              <dd><OrderStatusBadge :status="displayOrderStatus(order.status)" :paid-at="order.paid_at" /></dd>
            </div>
          </dl>
        </div>

        <!-- EasyPay return info (when no order loaded) -->
        <div v-else-if="returnInfo" class="sgm-result-well">
          <dl class="sgm-result-list text-sm">
            <div v-if="returnInfo.outTradeNo" class="sgm-result-row">
              <dt class="sgm-result-label shrink-0">{{ t('payment.orders.orderId') }}</dt>
              <dd class="sgm-result-value min-w-0 break-all text-right font-mono text-xs tabular-nums sm:text-sm">{{ returnInfo.outTradeNo }}</dd>
            </div>
            <div v-if="returnInfo.money" class="sgm-result-row">
              <dt class="sgm-result-label">{{ t('payment.orders.payAmount') }}</dt>
              <dd class="sgm-result-pay tabular-nums">{{ formatGatewayAmount(Number(returnInfo.money) || 0) }}</dd>
            </div>
            <div v-if="returnInfo.type" class="sgm-result-row">
              <dt class="sgm-result-label">{{ t('payment.orders.paymentMethod') }}</dt>
              <dd class="sgm-result-value">{{ t(paymentMethodI18nKey(returnInfo.type), normalizedOrderPaymentType(returnInfo.type)) }}</dd>
            </div>
          </dl>
        </div>

        <!-- Actions -->
        <div class="sgm-result-actions">
          <button
            v-if="showHomeAction"
            type="button"
            class="sgm-pay-btn sgm-pay-btn--primary w-full"
            @click="returnHome"
          >
            {{ t('dashboard.assistantSetup.backHome') }}
          </button>
          <button
            v-if="(showHomeAction && isPending) || creditFailed"
            type="button"
            class="sgm-pay-btn sgm-pay-btn--secondary w-full"
            @click="checkAgain"
          >
            {{ t('dashboard.assistantSetup.checkOrder') }}
          </button>
          <div v-if="!showHomeAction" class="flex flex-wrap gap-3">
            <button
              v-if="!creditFailed"
              type="button"
              class="sgm-pay-btn sgm-pay-btn--secondary flex-1"
              @click="router.push('/purchase')"
            >
              {{ t('payment.result.backToRecharge') }}
            </button>
            <button
              type="button"
              class="sgm-pay-btn sgm-pay-btn--primary flex-1"
              @click="router.push('/orders')"
            >
              {{ t('payment.result.viewOrders') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import OrderStatusBadge from '@/components/payment/OrderStatusBadge.vue'
import {
  PAYMENT_RECOVERY_STORAGE_KEY,
  assistantPaymentStorageKey,
  clearPaymentRecoverySnapshot,
  isAssistantOrder,
  rememberAssistantOrder,
  readPaymentRecoverySnapshot,
  paymentSettlementState,
} from '@/components/payment/paymentFlow'
import { usePaymentStore } from '@/stores/payment'
import { useAuthStore } from '@/stores/auth'
import { paymentAPI } from '@/api/payment'
import type { PublicOrderVerifyResult } from '@/api/payment'
import type { OrderStatus, PaymentOrder } from '@/types/payment'
import { formatPaymentAmount, normalizePaymentCurrency } from '@/components/payment/currency'
import { normalizePaymentMethodForDisplay, paymentMethodI18nKey } from './paymentUx'

const i18n = useI18n()
const { t } = i18n
const route = useRoute()
const router = useRouter()
const paymentStore = usePaymentStore()
const authStore = useAuthStore()

type ResolvedOrder = PaymentOrder | PublicOrderVerifyResult

const order = ref<ResolvedOrder | null>(null)
const loading = ref(true)
const currency = ref('CNY')
const assistantResult = ref(false)
const sawCreditFailure = ref(false)
const waitForCredit = computed(() => assistantResult.value || sawCreditFailure.value)
const showHomeAction = computed(() => assistantResult.value || (authStore.isAuthenticated && !authStore.isAdmin))
let recoveryKey = PAYMENT_RECOVERY_STORAGE_KEY
let matchedRecovery: string | null = null
let checkAgain = () => {}

function returnHome() {
  void router.push({ path: '/dashboard', query: { view: 'simple', recharge: isSuccess.value || isRefunded.value || (creditFailed.value && !assistantResult.value) ? undefined : '1' } })
}

interface ReturnInfo {
  outTradeNo: string
  money: string
  type: string
  tradeStatus: string
}
const returnInfo = ref<ReturnInfo | null>(null)

const SUCCESS_STATUSES = new Set(['COMPLETED', 'PAID', 'RECHARGING'])
const PENDING_STATUSES = new Set(['PENDING', 'CREATED', 'WAITING', 'PROCESSING'])
const STATUS_REFRESH_INTERVAL_MS = 2000
const STATUS_REFRESH_MAX_ATTEMPTS = 15

let statusRefreshTimer: ReturnType<typeof setTimeout> | null = null
let userBalanceRefreshStarted = false
const refreshAttempts = ref(0)

/** 充值金额 = pay_amount / (1 + fee_rate/100)，fee_rate=0 时等于 pay_amount */
const baseAmount = computed(() => {
  if (!hasAmountFields(order.value)) return 0
  const feeRate = Number(order.value.fee_rate) || 0
  if (feeRate <= 0) return order.value.pay_amount ?? 0
  return Math.round((order.value.pay_amount / (1 + feeRate / 100)) * 100) / 100
})

/** 手续费 = pay_amount - baseAmount */
const feeAmount = computed(() => {
  if (!hasAmountFields(order.value)) return 0
  const feeRate = Number(order.value.fee_rate) || 0
  if (feeRate <= 0) return 0
  return Math.round((order.value.pay_amount - baseAmount.value) * 100) / 100
})

const localeCode = computed(() => {
  const raw = i18n.locale as unknown
  if (typeof raw === 'string') return raw
  if (raw && typeof raw === 'object' && 'value' in raw) {
    return String((raw as { value?: string }).value || '')
  }
  return undefined
})

const isSuccess = computed(() => {
  return isSuccessStatus(order.value?.status)
})

const creditFailed = computed(() => !!order.value && paymentSettlementState(order.value) === 'credit_failed')
const isPending = computed(() => creditFailed.value || isPendingStatus(order.value?.status))
const isRefunded = computed(() => order.value?.status === 'REFUNDED')

const statusTitle = computed(() => {
  if (isRefunded.value) return t('payment.status.refunded')
  if (creditFailed.value) return t('payment.result.creditFailed')
  if (isSuccess.value) {
    return t('payment.result.success')
  }
  if (isPending.value) {
    return t('payment.result.processing')
  }
  return t('payment.result.failed')
})

function normalizedOrderPaymentType(paymentType: string): string {
  return normalizePaymentMethodForDisplay(paymentType || '') || paymentType || ''
}

function formatGatewayAmount(value: number): string {
  return formatPaymentAmount(value, currency.value, localeCode.value)
}

function setResolvedOrder(nextOrder: ResolvedOrder | null): void {
  order.value = nextOrder
  if (nextOrder && authStore.user) {
    assistantResult.value = isAssistantOrder(window.localStorage, authStore.user.id,
      hasOrderId(nextOrder) ? nextOrder.id : 0, nextOrder.out_trade_no)
  }
  if (nextOrder && paymentSettlementState(nextOrder) === 'credit_failed') sawCreditFailure.value = true
  if (nextOrder && 'currency' in nextOrder && nextOrder.currency) {
    currency.value = normalizePaymentCurrency(nextOrder.currency)
  }
  refreshUserBalanceForSuccessfulOrder(nextOrder)
}

function refreshUserBalanceForSuccessfulOrder(nextOrder: ResolvedOrder | null): void {
  if (!nextOrder || userBalanceRefreshStarted || normalizeOrderStatus(nextOrder.status) !== 'COMPLETED') {
    return
  }
  if ('order_type' in nextOrder && nextOrder.order_type !== 'balance') {
    return
  }

  userBalanceRefreshStarted = true
  void authStore.refreshUser().catch(() => {
    // The order result remains authoritative even if refreshing profile data fails.
  })
}

function hasOrderId(nextOrder: ResolvedOrder | null): nextOrder is PaymentOrder {
  return !!nextOrder && 'id' in nextOrder && typeof nextOrder.id === 'number'
}

function hasAmountFields(nextOrder: ResolvedOrder | null): nextOrder is PaymentOrder {
  return !!nextOrder && 'pay_amount' in nextOrder && typeof nextOrder.pay_amount === 'number' && 'amount' in nextOrder && typeof nextOrder.amount === 'number'
}

/** 充值赠送额度（USD）；老接口/订阅订单没有该字段时视为 0 */
function orderBonusAmount(target: unknown): number {
  const value = (target as { bonus_amount?: unknown } | null | undefined)?.bonus_amount
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0
}

function hasPaymentType(nextOrder: ResolvedOrder | null): nextOrder is PaymentOrder {
  return !!nextOrder && 'payment_type' in nextOrder && typeof nextOrder.payment_type === 'string' && nextOrder.payment_type.trim() !== ''
}

function normalizeOrderStatus(status: string | null | undefined): string {
  return String(status || '').trim().toUpperCase()
}

function displayOrderStatus(status: string): OrderStatus {
  return normalizeOrderStatus(status) as OrderStatus
}

function isSuccessStatus(status: string | null | undefined): boolean {
  const normalized = normalizeOrderStatus(status)
  return waitForCredit.value ? normalized === 'COMPLETED' : SUCCESS_STATUSES.has(normalized)
}

function isPendingStatus(status: string | null | undefined): boolean {
  const normalized = normalizeOrderStatus(status)
  return PENDING_STATUSES.has(normalized) || (waitForCredit.value && (normalized === 'PAID' || normalized === 'RECHARGING'))
}

function readRouteQueryString(key: string): string {
  const value = route.query[key]
  if (Array.isArray(value)) {
    return typeof value[0] === 'string' ? value[0] : ''
  }
  return typeof value === 'string' ? value : ''
}

function restoreRecoverySnapshot(context: {
  resumeToken: string
  routeOrderId: number
  routeOutTradeNo: string
}) {
  if (typeof window === 'undefined') {
    return null
  }

  const userId = authStore.user?.id
  const keys = userId ? [assistantPaymentStorageKey(userId), PAYMENT_RECOVERY_STORAGE_KEY] : [PAYMENT_RECOVERY_STORAGE_KEY]
  if (!context.resumeToken && !context.routeOrderId && !context.routeOutTradeNo) return null
  for (const key of keys) {
    const raw = window.localStorage.getItem(key)
    const restored = readPaymentRecoverySnapshot(raw, {
      resumeToken: context.resumeToken || undefined,
      allowExpired: key !== PAYMENT_RECOVERY_STORAGE_KEY,
    })
    if (!restored) continue
    if (!context.resumeToken) {
      if (context.routeOrderId && restored.orderId !== context.routeOrderId) continue
      if (context.routeOutTradeNo && restored.outTradeNo !== context.routeOutTradeNo) continue
    }
    recoveryKey = key
    matchedRecovery = raw
    assistantResult.value = key !== PAYMENT_RECOVERY_STORAGE_KEY
    if (assistantResult.value && userId) rememberAssistantOrder(window.localStorage, userId, restored)
    return restored
  }
  return null
}

async function resolveOrderFromResumeToken(resumeToken: string): Promise<ResolvedOrder | null> {
  try {
    const result = await paymentAPI.resolveOrderPublicByResumeToken(resumeToken)
    return result.data
  } catch (_err: unknown) {
    return null
  }
}

async function resolveOrderFromOutTradeNo(outTradeNo: string): Promise<ResolvedOrder | null> {
  try {
    const result = await paymentAPI.verifyOrder(outTradeNo)
    return result.data
  } catch (_err: unknown) {
    try {
      const result = await paymentAPI.verifyOrderPublic(outTradeNo)
      return result.data
    } catch (_innerErr: unknown) {
      return null
    }
  }
}

function clearStatusRefreshTimer(): void {
  if (statusRefreshTimer !== null) {
    clearTimeout(statusRefreshTimer)
    statusRefreshTimer = null
  }
}

function clearRecoverySnapshot(): void {
  if (!matchedRecovery || window.localStorage.getItem(recoveryKey) !== matchedRecovery) return
  const matched = readPaymentRecoverySnapshot(matchedRecovery, { allowExpired: true })
  if (order.value && matched && (hasOrderId(order.value)
    ? order.value.id !== matched.orderId
    : order.value.out_trade_no !== matched.outTradeNo)) return
  clearPaymentRecoverySnapshot(window.localStorage, recoveryKey)
}

function clearRecoverySnapshotForTerminalStatus(order: ResolvedOrder): void {
  if (paymentSettlementState(order) === 'credit_failed') return
  const status = order.status
  if (waitForCredit.value ? normalizeOrderStatus(status) === 'COMPLETED' : !isPendingStatus(status)) {
    clearRecoverySnapshot()
  }
}

function scheduleStatusRefresh(refreshOrder: (() => Promise<ResolvedOrder | null>) | null): void {
  clearStatusRefreshTimer()
  if (!refreshOrder || !isPending.value || refreshAttempts.value >= STATUS_REFRESH_MAX_ATTEMPTS) {
    return
  }

  statusRefreshTimer = setTimeout(async () => {
    refreshAttempts.value += 1
    const refreshedOrder = await refreshOrder()
    if (refreshedOrder) {
      setResolvedOrder(refreshedOrder)
      clearRecoverySnapshotForTerminalStatus(refreshedOrder)
    }

    if (isPending.value) {
      scheduleStatusRefresh(refreshOrder)
    }
  }, STATUS_REFRESH_INTERVAL_MS)
}

onMounted(async () => {
  const resumeToken = readRouteQueryString('resume_token')
  const routeOrderId = Number(readRouteQueryString('order_id')) || 0
  let outTradeNo = readRouteQueryString('out_trade_no')
  let orderId = 0
  let resumeTokenLookupFailed = false

  const restored = restoreRecoverySnapshot({
    resumeToken,
    routeOrderId,
    routeOutTradeNo: outTradeNo,
  })
  if (restored?.orderId) {
    orderId = restored.orderId
  }
  if (restored?.currency) {
    currency.value = normalizePaymentCurrency(restored.currency)
  }
  if (!outTradeNo && restored?.outTradeNo) {
    outTradeNo = restored.outTradeNo
  }

  if (resumeToken) {
    const resolvedOrder = await resolveOrderFromResumeToken(resumeToken)
    if (resolvedOrder) {
      setResolvedOrder(resolvedOrder)
      if (!orderId) {
        orderId = hasOrderId(resolvedOrder) ? resolvedOrder.id : 0
      }
    } else if (routeOrderId > 0) {
      resumeTokenLookupFailed = true
      orderId = routeOrderId
    } else {
      resumeTokenLookupFailed = true
    }
  } else if (routeOrderId > 0) {
    orderId = routeOrderId
  }

  const hasLegacyFallbackContext = readRouteQueryString('trade_status').trim() !== ''
  const shouldUsePublicOutTradeNo = outTradeNo !== '' && (hasLegacyFallbackContext || routeOrderId > 0 || orderId > 0)

  if (!order.value && orderId && (!resumeToken || routeOrderId > 0)) {
    try {
      setResolvedOrder(await paymentStore.pollOrderStatus(orderId))
    } catch (_err: unknown) {
      // Order lookup failed, will try legacy fallback below when possible.
    }
  }

  if (!order.value && shouldUsePublicOutTradeNo && (!resumeToken || resumeTokenLookupFailed)) {
    const legacyOrder = await resolveOrderFromOutTradeNo(outTradeNo)
    if (legacyOrder) {
      setResolvedOrder(legacyOrder)
      if (!orderId) {
        orderId = hasOrderId(legacyOrder) ? legacyOrder.id : 0
      }
    }
  }

  if (!order.value && !orderId && outTradeNo && hasLegacyFallbackContext) {
    returnInfo.value = {
      outTradeNo,
      money: String(route.query.money || ''),
      type: String(route.query.type || ''),
      tradeStatus: String(route.query.trade_status || ''),
    }
  }

  const refreshOrder = async (): Promise<ResolvedOrder | null> => {
    if (resumeToken) {
      const resolvedOrder = await resolveOrderFromResumeToken(resumeToken)
      if (resolvedOrder) {
        return resolvedOrder
      }
    }

    if (orderId) {
      try {
        return await paymentStore.pollOrderStatus(orderId)
      } catch (_err: unknown) {
        // Fall through to legacy public verification when order polling is unavailable.
      }
    }

    if (shouldUsePublicOutTradeNo) {
      return await resolveOrderFromOutTradeNo(outTradeNo)
    }

    return null
  }

  checkAgain = () => {
    refreshAttempts.value = 0
    scheduleStatusRefresh(refreshOrder)
  }
  if (isPending.value) {
    scheduleStatusRefresh(refreshOrder)
  } else if (order.value) {
    clearRecoverySnapshotForTerminalStatus(order.value)
  } else if (returnInfo.value && !assistantResult.value) {
    clearRecoverySnapshot()
  }
  loading.value = false
})

onBeforeUnmount(() => {
  clearStatusRefreshTimer()
})
</script>

<style scoped>
.sgm-pay-stage {
  --pr-page: #f4f7f8;
  --pr-panel: #ffffff;
  --pr-panel-subtle: #f7fafa;
  --pr-ink: #162b34;
  --pr-muted: #4d636b;
  --pr-line: #d4e0e2;
  --pr-line-subtle: #e4ecee;
  --pr-line-strong: #b6c8cc;
  --pr-control-border: #819496;
  --pr-control-border-hover: #5c767b;
  --pr-accent: #195762;
  --pr-accent-hover: #12454f;
  --pr-accent-active: #0e3840;
  --pr-on-accent: #ffffff;
  --pr-focus: #126c7a;
  --pr-ring-focus: 0 0 0 3px rgb(18 108 122 / 18%);
  --pr-shadow-card: 0 1px 2px rgb(22 43 52 / 5%), 0 8px 24px -6px rgb(22 43 52 / 9%);
  --pr-shadow-btn-primary: 0 1px 2px rgb(18 69 79 / 24%), inset 0 1px 0 rgb(255 255 255 / 16%);
  --pr-bonus: #b45309;
  --pr-icon-success-bg: #ecfdf5;
  --pr-icon-success-fg: #059669;
  --pr-icon-success-ring: rgb(5 150 105 / 18%);
  --pr-icon-pending-bg: #ebf5f4;
  --pr-icon-pending-fg: #195762;
  --pr-icon-pending-ring: rgb(25 87 98 / 18%);
  --pr-icon-warning-bg: #fffbeb;
  --pr-icon-warning-fg: #d97706;
  --pr-icon-warning-ring: rgb(217 119 6 / 20%);
  --pr-icon-refunded-bg: #f5f3ff;
  --pr-icon-refunded-fg: #7c3aed;
  --pr-icon-refunded-ring: rgb(124 58 237 / 18%);
  --pr-icon-danger-bg: #fef2f2;
  --pr-icon-danger-fg: #dc2626;
  --pr-icon-danger-ring: rgb(220 38 38 / 18%);
  background:
    radial-gradient(ellipse 65% 45% at 85% 0%, rgb(208 235 232 / 55%), transparent 65%),
    var(--pr-page);
  color: var(--pr-ink);
}

.dark .sgm-pay-stage {
  --pr-page: #0d1b20;
  --pr-panel: #14272d;
  --pr-panel-subtle: #102127;
  --pr-ink: #e6f2f2;
  --pr-muted: #9db6bc;
  --pr-line: #29434b;
  --pr-line-subtle: rgb(255 255 255 / 8%);
  --pr-line-strong: #3d5d67;
  --pr-control-border: #58757d;
  --pr-control-border-hover: #7697a0;
  --pr-accent: #8ad3cd;
  --pr-accent-hover: #a2ded9;
  --pr-accent-active: #72c4bd;
  --pr-on-accent: #0b242a;
  --pr-focus: #8ad3cd;
  --pr-ring-focus: 0 0 0 3px rgb(138 211 205 / 24%);
  --pr-shadow-card: 0 8px 28px rgb(0 0 0 / 38%), inset 0 1px 0 rgb(255 255 255 / 6%);
  --pr-shadow-btn-primary: 0 1px 2px rgb(0 0 0 / 35%), inset 0 1px 0 rgb(255 255 255 / 24%);
  --pr-bonus: #fbbf24;
  --pr-icon-success-bg: rgb(16 185 129 / 14%);
  --pr-icon-success-fg: #34d399;
  --pr-icon-success-ring: rgb(52 211 153 / 24%);
  --pr-icon-pending-bg: rgb(138 211 205 / 14%);
  --pr-icon-pending-fg: #8ad3cd;
  --pr-icon-pending-ring: rgb(138 211 205 / 24%);
  --pr-icon-warning-bg: rgb(245 158 11 / 14%);
  --pr-icon-warning-fg: #fbbf24;
  --pr-icon-warning-ring: rgb(251 191 36 / 24%);
  --pr-icon-refunded-bg: rgb(139 92 246 / 14%);
  --pr-icon-refunded-fg: #c4b5fd;
  --pr-icon-refunded-ring: rgb(196 181 253 / 24%);
  --pr-icon-danger-bg: rgb(239 68 68 / 14%);
  --pr-icon-danger-fg: #f87171;
  --pr-icon-danger-ring: rgb(248 113 113 / 24%);
  background:
    radial-gradient(ellipse 65% 45% at 85% 0%, rgb(27 62 68 / 45%), transparent 65%),
    var(--pr-page);
}

.sgm-pay-card {
  padding: 2rem 1.75rem;
  border: 1px solid var(--pr-line);
  border-radius: 1.125rem;
  background: var(--pr-panel);
  box-shadow: var(--pr-shadow-card);
}

@media (max-width: 479px) {
  .sgm-pay-card {
    padding: 1.5rem 1.25rem;
  }
}

.sgm-result-icon {
  display: flex;
  height: 4.25rem;
  width: 4.25rem;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
}

.sgm-result-icon--success {
  background: var(--pr-icon-success-bg);
  color: var(--pr-icon-success-fg);
  box-shadow: inset 0 0 0 1px var(--pr-icon-success-ring);
}

.sgm-result-icon--pending {
  background: var(--pr-icon-pending-bg);
  color: var(--pr-icon-pending-fg);
  box-shadow: inset 0 0 0 1px var(--pr-icon-pending-ring);
}

.sgm-result-icon--warning {
  background: var(--pr-icon-warning-bg);
  color: var(--pr-icon-warning-fg);
  box-shadow: inset 0 0 0 1px var(--pr-icon-warning-ring);
}

.sgm-result-icon--refunded {
  background: var(--pr-icon-refunded-bg);
  color: var(--pr-icon-refunded-fg);
  box-shadow: inset 0 0 0 1px var(--pr-icon-refunded-ring);
}

.sgm-result-icon--danger {
  background: var(--pr-icon-danger-bg);
  color: var(--pr-icon-danger-fg);
  box-shadow: inset 0 0 0 1px var(--pr-icon-danger-ring);
}

.sgm-result-title {
  color: var(--pr-ink);
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1.3;
  letter-spacing: -0.025em;
  text-wrap: balance;
}

.sgm-result-hint {
  max-width: 24rem;
  color: var(--pr-muted);
  font-size: 0.875rem;
  line-height: 1.6;
}

.sgm-result-well {
  padding: 0.875rem 1.125rem;
  border: 1px solid var(--pr-line-subtle);
  border-radius: 0.875rem;
  background: var(--pr-panel-subtle);
}

.sgm-result-list {
  display: grid;
  font-variant-numeric: tabular-nums;
}

.sgm-result-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding-block: 0.5rem;
}

.sgm-result-row + .sgm-result-row {
  border-top: 1px solid var(--pr-line-subtle);
}

.sgm-result-label {
  color: var(--pr-muted);
}

.sgm-result-value {
  color: var(--pr-ink);
  font-weight: 500;
}

.sgm-result-pay {
  color: var(--pr-accent);
  font-size: 1rem;
  font-weight: 600;
}

.sgm-result-bonus {
  color: var(--pr-bonus);
  font-weight: 600;
}

.sgm-result-actions {
  display: grid;
  gap: 0.625rem;
}

.sgm-pay-btn {
  display: inline-flex;
  min-height: 2.75rem;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.625rem 1.125rem;
  border-radius: 0.625rem;
  font-size: 0.9375rem;
  font-weight: 500;
  line-height: 1.4;
  cursor: pointer;
  transition: background-color 150ms cubic-bezier(0.22, 1, 0.36, 1),
    border-color 150ms cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 150ms cubic-bezier(0.22, 1, 0.36, 1),
    transform 150ms cubic-bezier(0.22, 1, 0.36, 1);
}

.sgm-pay-btn:focus-visible {
  outline: 2px solid var(--pr-focus, #126c7a);
  outline-offset: 2px;
  box-shadow: var(--pr-ring-focus);
}

.sgm-pay-btn:active {
  transform: scale(0.985);
}

.sgm-pay-btn--primary {
  border: 1px solid transparent;
  background: var(--pr-accent);
  color: var(--pr-on-accent);
  box-shadow: var(--pr-shadow-btn-primary);
}

.sgm-pay-btn--primary:hover {
  background: var(--pr-accent-hover);
}

.sgm-pay-btn--primary:active {
  background: var(--pr-accent-active);
}

.sgm-pay-btn--secondary {
  border: 1px solid var(--pr-control-border);
  background: var(--pr-panel);
  color: var(--pr-ink);
  box-shadow: 0 1px 2px rgb(22 43 52 / 4%);
}

.sgm-pay-btn--secondary:hover {
  border-color: var(--pr-control-border-hover);
  background: var(--pr-panel-subtle);
}

.sgm-spinner {
  display: block;
  height: 2rem;
  width: 2rem;
  border-radius: 9999px;
  border: 3px solid color-mix(in srgb, var(--pr-accent) 22%, transparent);
  border-top-color: var(--pr-accent);
  animation: sgm-pr-spin 0.85s linear infinite;
}

.sgm-spinner--pending {
  height: 1.875rem;
  width: 1.875rem;
}

@keyframes sgm-pr-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .sgm-pay-btn,
  .sgm-spinner {
    transition: none;
    animation: none;
  }

  .sgm-pay-btn:active {
    transform: none;
  }
}
</style>
