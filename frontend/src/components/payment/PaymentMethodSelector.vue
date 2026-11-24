<template>
  <div>
    <label v-if="!inline" class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
      {{ t('payment.paymentMethod') }}
    </label>
    <div
      data-testid="payment-method-grid"
      :class="inline ? 'grid grid-cols-1 gap-2' : 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4'"
    >
      <template v-for="method in sortedMethods" :key="method.type">
        <HeroPaymentControl
          v-if="inline"
          :label="methodLabel(method)"
          :icon="methodIcon(method.type)"
          :detail="method.fee_rate > 0 ? t('payment.fee') + ' ' + method.fee_rate + '%' : undefined"
          :selected="selected === method.type"
          :disabled="!method.available"
          @press="emit('select', method.type)"
        />
        <button
          v-else
          type="button"
          :title="methodLabel(method)"
          :disabled="!method.available"
          :aria-pressed="selected === method.type"
          :class="[
            'relative flex h-[60px] min-w-0 flex-col items-center justify-center rounded-xl border px-3 transition-all duration-150 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 dark:focus-visible:outline-primary-400 active:scale-[0.985] motion-reduce:transition-none motion-reduce:active:scale-100',
            !method.available
              ? 'cursor-not-allowed border-gray-200/80 bg-gray-50/80 opacity-50 active:scale-100 dark:border-dark-700 dark:bg-dark-800/50'
              : selected === method.type
                ? methodSelectedClass(method.type)
                : 'border-gray-200/90 bg-white text-gray-800 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:border-gray-300 hover:bg-gray-50/70 dark:border-dark-600 dark:bg-dark-800/80 dark:text-gray-100 dark:hover:border-dark-500 dark:hover:bg-dark-700/70',
          ]"
          @click="method.available && emit('select', method.type)"
        >
          <span class="flex w-full min-w-0 items-center justify-center gap-2">
            <img :src="methodIcon(method.type)" alt="" class="h-7 w-7 shrink-0 object-contain" />
            <span class="flex min-w-0 flex-col items-start leading-tight">
              <span data-testid="payment-method-label" class="block w-full truncate text-base font-semibold">
                {{ methodLabel(method) }}
              </span>
              <span
                v-if="method.fee_rate > 0"
                class="text-[11px] font-medium tabular-nums tracking-wide text-gray-500 dark:text-dark-400"
              >
                {{ t('payment.fee') }} {{ method.fee_rate }}%
              </span>
            </span>
          </span>
        </button>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { METHOD_ORDER, isBuiltInAlipayMethod, isBuiltInWxpayMethod } from './providerConfig'
import alipayIcon from '@/assets/icons/alipay.svg'
import wxpayIcon from '@/assets/icons/wxpay.svg'
import stripeIcon from '@/assets/icons/stripe.svg'
import airwallexIcon from '@/assets/icons/airwallex.svg'
import paymentIcon from '@/assets/icons/payment.svg'

export interface PaymentMethodOption {
  type: string
  display_name?: string
  fee_rate: number
  available: boolean
}

const props = defineProps<{
  methods: PaymentMethodOption[]
  selected: string
  inline?: boolean
}>()

const emit = defineEmits<{
  select: [type: string]
}>()

const { t } = useI18n()
const HeroPaymentControl = defineAsyncComponent(() => import('@/components/assistant/HeroPaymentControl.vue'))

const METHOD_ICONS: Record<string, string> = {
  alipay: alipayIcon,
  wxpay: wxpayIcon,
  stripe: stripeIcon,
  airwallex: airwallexIcon,
  credit_card: paymentIcon,
}

const sortedMethods = computed(() => {
  const order: readonly string[] = METHOD_ORDER
  return [...props.methods].sort((a, b) => {
    const ai = order.indexOf(a.type)
    const bi = order.indexOf(b.type)
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
  })
})

function methodIcon(type: string): string {
  if (isBuiltInAlipayMethod(type)) return METHOD_ICONS.alipay
  if (isBuiltInWxpayMethod(type)) return METHOD_ICONS.wxpay
  if (type === 'airwallex') return METHOD_ICONS.airwallex
  return METHOD_ICONS[type] || paymentIcon
}

function methodLabel(method: PaymentMethodOption): string {
  return method.display_name || t(`payment.methods.${method.type}`, method.type)
}

function methodSelectedClass(type: string): string {
  if (isBuiltInAlipayMethod(type)) return 'border-[#02A9F1] bg-sky-50/85 text-gray-900 shadow-sm ring-1 ring-inset ring-[#02A9F1] dark:bg-sky-950/50 dark:text-gray-100'
  if (isBuiltInWxpayMethod(type)) return 'border-[#09BB07] bg-emerald-50/85 text-gray-900 shadow-sm ring-1 ring-inset ring-[#09BB07] dark:bg-emerald-950/50 dark:text-gray-100'
  if (type === 'stripe') return 'border-[#676BE5] bg-indigo-50/85 text-gray-900 shadow-sm ring-1 ring-inset ring-[#676BE5] dark:bg-indigo-950/50 dark:text-gray-100'
  if (type === 'airwallex') return 'border-[#FF6B3D] bg-orange-50/85 text-gray-900 shadow-sm ring-1 ring-inset ring-[#FF6B3D] dark:border-[#FF8E3C] dark:bg-orange-950/50 dark:text-gray-100 dark:ring-[#FF8E3C]'
  return 'border-primary-500 bg-primary-50/85 text-gray-900 shadow-sm ring-1 ring-inset ring-primary-500 dark:bg-primary-950/50 dark:text-gray-100'
}
</script>
