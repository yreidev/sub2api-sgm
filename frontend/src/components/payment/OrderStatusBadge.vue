<template>
  <span
    class="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset"
    :class="statusBadge.class"
  >
    <span aria-hidden="true" class="h-1.5 w-1.5 shrink-0 rounded-full" :class="statusBadge.dot"></span>
    <span>{{ statusLabel }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { paymentSettlementState } from './paymentFlow'
import type { OrderStatus } from '@/types/payment'

const props = defineProps<{
  status: OrderStatus
  paidAt?: string
}>()

const { t } = useI18n()

interface StatusVisual {
  key: string
  class: string
  dot: string
}

const statusMap: Record<OrderStatus, StatusVisual> = {
  PENDING: {
    key: 'payment.status.pending',
    class: 'bg-amber-50 text-amber-800 ring-amber-600/20 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/25',
    dot: 'bg-amber-500 dark:bg-amber-400',
  },
  PAID: {
    key: 'payment.status.paid',
    class: 'bg-sky-50 text-sky-800 ring-sky-600/20 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-400/25',
    dot: 'bg-sky-500 dark:bg-sky-400',
  },
  RECHARGING: {
    key: 'payment.status.recharging',
    class: 'bg-sky-50 text-sky-800 ring-sky-600/20 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-400/25',
    dot: 'bg-sky-500 dark:bg-sky-400',
  },
  COMPLETED: {
    key: 'payment.status.completed',
    class: 'bg-emerald-50 text-emerald-800 ring-emerald-600/20 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/25',
    dot: 'bg-emerald-500 dark:bg-emerald-400',
  },
  EXPIRED: {
    key: 'payment.status.expired',
    class: 'bg-slate-100 text-slate-600 ring-slate-500/15 dark:bg-slate-500/15 dark:text-slate-300 dark:ring-slate-400/20',
    dot: 'bg-slate-400 dark:bg-slate-400',
  },
  CANCELLED: {
    key: 'payment.status.cancelled',
    class: 'bg-slate-100 text-slate-600 ring-slate-500/15 dark:bg-slate-500/15 dark:text-slate-300 dark:ring-slate-400/20',
    dot: 'bg-slate-400 dark:bg-slate-400',
  },
  FAILED: {
    key: 'payment.status.failed',
    class: 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-400/25',
    dot: 'bg-red-500 dark:bg-red-400',
  },
  REFUND_REQUESTED: {
    key: 'payment.status.refund_requested',
    class: 'bg-orange-50 text-orange-800 ring-orange-600/20 dark:bg-orange-500/15 dark:text-orange-300 dark:ring-orange-400/25',
    dot: 'bg-orange-500 dark:bg-orange-400',
  },
  REFUNDING: {
    key: 'payment.status.refunding',
    class: 'bg-orange-50 text-orange-800 ring-orange-600/20 dark:bg-orange-500/15 dark:text-orange-300 dark:ring-orange-400/25',
    dot: 'bg-orange-500 dark:bg-orange-400',
  },
  REFUND_PENDING: {
    key: 'payment.status.refund_pending',
    class: 'bg-orange-50 text-orange-800 ring-orange-600/20 dark:bg-orange-500/15 dark:text-orange-300 dark:ring-orange-400/25',
    dot: 'bg-orange-500 dark:bg-orange-400',
  },
  REFUNDED: {
    key: 'payment.status.refunded',
    class: 'bg-violet-50 text-violet-800 ring-violet-600/20 dark:bg-violet-500/15 dark:text-violet-300 dark:ring-violet-400/25',
    dot: 'bg-violet-500 dark:bg-violet-400',
  },
  PARTIALLY_REFUNDED: {
    key: 'payment.status.partially_refunded',
    class: 'bg-violet-50 text-violet-800 ring-violet-600/20 dark:bg-violet-500/15 dark:text-violet-300 dark:ring-violet-400/25',
    dot: 'bg-violet-500 dark:bg-violet-400',
  },
  REFUND_FAILED: {
    key: 'payment.status.refund_failed',
    class: 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-400/25',
    dot: 'bg-red-500 dark:bg-red-400',
  },
}

const fallbackVisual = {
  class: 'bg-slate-100 text-slate-600 ring-slate-500/15 dark:bg-slate-500/15 dark:text-slate-300 dark:ring-slate-400/20',
  dot: 'bg-slate-400 dark:bg-slate-400',
}

const creditFailedVisual = {
  class: 'bg-amber-50 text-amber-800 ring-amber-600/25 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/25',
  dot: 'bg-amber-500 dark:bg-amber-400',
}

const isCreditFailed = computed(() =>
  paymentSettlementState({ status: props.status, paid_at: props.paidAt }) === 'credit_failed'
)

const statusLabel = computed(() => {
  if (isCreditFailed.value) return t('payment.result.creditFailed')
  const entry = statusMap[props.status]
  return entry ? t(entry.key) : props.status
})

const statusBadge = computed(() => {
  if (isCreditFailed.value) return creditFailedVisual
  const entry = statusMap[props.status]
  return entry ?? fallbackVisual
})
</script>
