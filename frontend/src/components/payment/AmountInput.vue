<template>
  <div class="space-y-4">
    <!-- Quick Amount Buttons -->
    <div>
      <p v-if="!inline" class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
        {{ t('payment.quickAmounts') }}
      </p>
      <div :class="inline ? 'sgm-recharge-amounts' : 'grid grid-cols-3 gap-x-4 gap-y-4 pt-2 max-[389px]:grid-cols-2'">
        <template v-for="amt in filteredAmounts" :key="amt">
          <HeroPaymentControl
            v-if="inline"
            :label="amountNumber.format(amt)"
            :currency="paymentCurrency"
            :detail="secondLine(amt)"
            :badge="quoteFor(amt).percent > 0 ? badgeText(amt) : undefined"
            :selected="modelValue === amt"
            :data-testid="`quick-amount-${amt}`"
            @press="selectAmount(amt)"
          />
          <button
            v-else
            type="button"
            :class="[
              'relative min-w-0 rounded-xl border px-3 py-3 text-center font-medium transition-all duration-150 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 dark:focus-visible:outline-primary-400 active:scale-[0.985] motion-reduce:transition-none motion-reduce:active:scale-100',
              modelValue === amt
                ? 'border-primary-500 bg-primary-50/85 text-primary-800 shadow-sm ring-1 ring-inset ring-primary-500 dark:border-primary-400 dark:bg-primary-900/35 dark:text-primary-200 dark:ring-primary-400/70'
                : quoteFor(amt).percent > 0
                  ? 'border-red-200/90 bg-white text-gray-800 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:border-red-300 hover:bg-red-50/30 dark:border-red-500/35 dark:bg-dark-800/80 dark:text-gray-100 dark:hover:border-red-400/60 dark:hover:bg-dark-700/80'
                  : 'border-gray-200/90 bg-white text-gray-800 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:border-gray-300 hover:bg-gray-50/70 dark:border-dark-600 dark:bg-dark-800/80 dark:text-gray-100 dark:hover:border-dark-500 dark:hover:bg-dark-700/80',
            ]"
            :aria-pressed="modelValue === amt"
            :data-testid="`quick-amount-${amt}`"
            @click="selectAmount(amt)"
          >
            <!-- 促销价签（单行）：仅命中档位的金额显示；红底白字、内圈点线、右侧圆孔、整体旋转 -->
            <span
              v-if="quoteFor(amt).percent > 0"
              class="pointer-events-none absolute -right-2 -top-3 z-10 rotate-12"
              data-testid="quick-amount-bonus-badge"
            >
              <span
                class="relative flex items-center gap-1 whitespace-nowrap rounded bg-red-600 py-0.5 pl-1.5 pr-1 text-[11px] font-extrabold leading-tight tracking-tight text-white tabular-nums shadow-md ring-2 ring-white before:pointer-events-none before:absolute before:inset-[2px] before:rounded-sm before:border before:border-dotted before:border-white/70 dark:ring-dark-800"
              >
                <span>{{ badgeText(amt) }}</span>
                <span class="h-1 w-1 shrink-0 rounded-full bg-white"></span>
              </span>
            </span>
            <span class="block text-base font-semibold tabular-nums">{{ amt }}</span>
            <!-- 配置了优惠阶梯时，所有按钮都显示第二行，保持高度一致：赠金显示到账 USD，折扣显示折后实付 -->
            <span
              v-if="bonusTiers.length > 0"
              :class="[
                'mt-0.5 block text-[11px] font-normal leading-tight tabular-nums',
                quoteFor(amt).percent > 0 ? 'text-red-600 dark:text-red-300' : 'text-gray-500 dark:text-dark-400',
              ]"
              data-testid="quick-amount-credited"
            >{{ secondLine(amt) }}</span>
          </button>
        </template>
      </div>
    </div>

    <!-- Custom Amount Input -->
    <div>
      <label v-if="!inline" :for="inputId" class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
        {{ t('payment.customAmount') }}
      </label>
      <HeroPaymentControl
        v-if="inline"
        :amount="customText"
        :label="t('payment.customAmount') + ' (' + paymentCurrency + ')'"
        :currency="paymentCurrency"
        :placeholder="placeholderText"
        :error="error"
        @input="updateAmount"
      />
      <div v-else class="relative">
        <span
          aria-hidden="true"
          class="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm font-medium text-gray-500 dark:text-dark-300"
        >
          {{ currencySymbol(currency) }}
        </span>
        <input
          :id="inputId"
          :aria-invalid="Boolean(error)"
          :aria-describedby="error ? inputId + '-error' : undefined"
          :aria-label="t('payment.customAmount')"
          type="text"
          inputmode="decimal"
          :value="customText"
          :placeholder="placeholderText"
          :class="[
            'input min-h-12 w-full py-3 pl-3.5 pr-16 text-base font-medium tabular-nums shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:border-gray-300 dark:hover:border-dark-500',
            error ? 'input-error' : '',
          ]"
          @input="handleInput"
        />
      </div>
      <p v-if="error && !inline" :id="inputId + '-error'" role="alert" class="mt-2 text-sm text-red-700 dark:text-red-300">{{ error }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineAsyncComponent, useId, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { RechargeBonusTier } from '@/types/payment'
import { formatRechargeBonusNumber, quoteRechargeBonus, type RechargeBonusMode } from '@/utils/rechargeBonus'
import { currencySymbol, formatPaymentAmount, normalizePaymentCurrency } from './currency'

const props = withDefaults(defineProps<{
  inline?: boolean
  error?: string
  amounts?: number[]
  modelValue: number | null
  min?: number
  max?: number
  /** 充值优惠阶梯（按 min_amount 升序）；为空时不显示价签与第二行 */
  bonusTiers?: RechargeBonusTier[]
  /** 阶梯模式：bonus 赠金 / discount 折扣 */
  bonusMode?: RechargeBonusMode
  /** 充值倍率（1 支付币种 = multiplier USD），用于计算到账金额 */
  multiplier?: number
  /** 支付币种（折扣模式第二行实付金额的币种与精度） */
  currency?: string
}>(), {
  amounts: () => [10, 20, 50, 100, 200, 500, 1000, 2000, 5000],
  min: 0,
  max: 0,
  bonusTiers: () => [],
  bonusMode: 'bonus',
  multiplier: 1,
  currency: undefined,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | null]
}>()

const { t, locale } = useI18n()
const amountNumber = computed(() => new Intl.NumberFormat(locale?.value, { maximumFractionDigits: 2 }))
const paymentCurrency = computed(() => normalizePaymentCurrency(props.currency))

const HeroPaymentControl = defineAsyncComponent(() => import('@/components/assistant/HeroPaymentControl.vue'))
const inputId = useId()
const customText = ref('')

// 0 = no limit
const filteredAmounts = computed(() =>
  props.amounts.filter((a) => (props.min <= 0 || a >= props.min) && (props.max <= 0 || a <= props.max))
)

function currencyDigits(): number {
  if (!props.currency) return 2
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: props.currency }).resolvedOptions().maximumFractionDigits ?? 2
  } catch {
    return 2
  }
}

function quoteFor(amt: number) {
  return quoteRechargeBonus(props.bonusTiers, amt, {
    multiplier: props.multiplier,
    mode: props.bonusMode,
    currencyDigits: currencyDigits(),
  })
}

// 价签文案：赠金「+20%」，折扣「20% OFF」
function badgeText(amt: number): string {
  const percent = formatRechargeBonusNumber(quoteFor(amt).percent)
  return props.bonusMode === 'discount' ? `${percent}% OFF` : `+${percent}%`
}

function secondLine(amt: number): string {
  const quote = quoteFor(amt)
  if (props.bonusMode === 'discount') {
    return t('payment.rechargeBonus.payShort', { amount: formatPaymentAmount(quote.payBase, paymentCurrency.value, locale?.value, props.inline ? 'code' : 'narrowSymbol') })
  }
  return t('payment.rechargeBonus.creditedShort', { amount: props.inline ? formatPaymentAmount(quote.credited, 'USD', locale?.value, 'code') : '$' + quote.credited.toFixed(2) })
}

const placeholderText = computed(() => {
  if (props.min > 0 && props.max > 0) return `${props.min} - ${props.max}`
  if (props.min > 0) return `≥ ${props.min}`
  if (props.max > 0) return `≤ ${props.max}`
  return t('payment.enterAmount')
})

const AMOUNT_PATTERN = /^\d*(\.\d{0,2})?$/

function selectAmount(amt: number) {
  customText.value = String(amt)
  emit('update:modelValue', amt)
}

function handleInput(e: Event) {
  const input = e.target as HTMLInputElement
  const val = input.value
  if (!AMOUNT_PATTERN.test(val)) {
    input.value = customText.value
    return
  }
  updateAmount(val)
}

function updateAmount(val: string) {
  if (!AMOUNT_PATTERN.test(val)) return
  customText.value = val
  if (val === '') {
    emit('update:modelValue', null)
    return
  }
  const num = parseFloat(val)
  if (!isNaN(num) && num > 0) {
    emit('update:modelValue', num)
  } else {
    emit('update:modelValue', null)
  }
}

watch(() => props.modelValue, (v) => {
  if (v !== null && String(v) !== customText.value) {
    customText.value = String(v)
  }
}, { immediate: true })
</script>
