<template>
  <DataTable :columns="columns" :data="orders" :loading="loading">
    <template #cell-id="{ value }">
      <span class="font-mono text-sm tabular-nums text-gray-600 dark:text-dark-300">#{{ value }}</span>
    </template>
    <template #cell-out_trade_no="{ value }">
      <span class="font-mono text-xs tabular-nums text-gray-900 sm:text-sm dark:text-white">{{ value }}</span>
    </template>
    <template v-if="showUser" #cell-user_email="{ value, row }">
      <div class="text-sm">
        <span class="font-medium text-gray-900 dark:text-white">{{ value || row.user_name || '#' + row.user_id }}</span>
        <span v-if="row.user_notes" class="ml-1 text-xs text-gray-500 dark:text-dark-400">({{ row.user_notes }})</span>
      </div>
    </template>
    <template #cell-pay_amount="{ value, row }">
      <div class="text-sm tabular-nums">
        <span class="font-semibold text-gray-900 dark:text-white">{{ paymentAmountSymbol(row) }}{{ value.toFixed(2) }}</span>
        <span v-if="row.fee_rate > 0" class="ml-1 text-xs text-gray-500 dark:text-dark-400" :title="t('payment.orders.fee') + ': ' + row.fee_rate + '%'">
          ({{ t('payment.orders.fee') }} {{ row.fee_rate }}%)
        </span>
        <div v-if="row.amount !== row.pay_amount || (row.bonus_amount ?? 0) > 0" class="mt-0.5 text-xs text-gray-500 dark:text-dark-400">
          {{ t('payment.orders.creditedAmount') }}: {{ creditedAmountSymbol }}{{ row.amount.toFixed(2) }}
          <span v-if="(row.bonus_amount ?? 0) > 0" class="ml-1 font-medium text-amber-700 dark:text-amber-400">
            ({{ t('payment.orders.bonusIncluded', { amount: creditedAmountSymbol + (row.bonus_amount ?? 0).toFixed(2) }) }})
          </span>
        </div>
      </div>
    </template>
    <template #cell-payment_type="{ value }">
      <span class="inline-flex items-center rounded-md bg-gray-100/80 px-2 py-0.5 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-500/10 dark:bg-dark-700/70 dark:text-gray-200 dark:ring-white/10">
        {{ t('payment.methods.' + value, value) }}
      </span>
    </template>
    <template #cell-status="{ row }">
      <OrderStatusBadge :status="row.status" :paid-at="row.paid_at" />
    </template>
    <template #cell-created_at="{ value }">
      <span class="text-xs tabular-nums text-gray-500 dark:text-dark-400">{{ formatDate(value) }}</span>
    </template>
    <template #cell-actions="{ row }">
      <slot name="actions" :row="row" />
    </template>
  </DataTable>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { PaymentOrder } from '@/types/payment'
import type { Column } from '@/components/common/types'
import DataTable from '@/components/common/DataTable.vue'
import OrderStatusBadge from '@/components/payment/OrderStatusBadge.vue'
import { currencySymbol } from '@/components/payment/currency'

const { t } = useI18n()

const props = defineProps<{
  orders: PaymentOrder[]
  loading: boolean
  showUser?: boolean
}>()

function formatDate(dateStr: string) { return new Date(dateStr).toLocaleString() }

const creditedAmountSymbol = currencySymbol('USD')

function paymentAmountSymbol(order: PaymentOrder): string {
  return currencySymbol(order.currency)
}

const columns = computed((): Column[] => {
  const cols: Column[] = [
    { key: 'id', label: t('payment.orders.orderId') },
    { key: 'out_trade_no', label: t('payment.orders.orderNo') },
  ]
  if (props.showUser) {
    cols.push({ key: 'user_email', label: t('payment.admin.colUser') })
  }
  cols.push(
    { key: 'pay_amount', label: t('payment.orders.payAmount') },
    { key: 'payment_type', label: t('payment.orders.paymentMethod') },
    { key: 'status', label: t('payment.orders.status') },
    { key: 'created_at', label: t('payment.orders.createdAt') },
    { key: 'actions', label: t('common.actions') },
  )
  return cols
})
</script>
