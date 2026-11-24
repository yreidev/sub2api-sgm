<template>
  <div>
    <p class="scroll-hint">{{ t('modelPlaza.table.scrollHint') }}</p>
    <span class="sr-only" role="status" aria-live="polite" aria-atomic="true">{{ copyAnnouncement }}</span>
    <div ref="host"></div>
    <Teleport :disabled="!scrollArea" :to="scrollArea">
    <table :class="table.content()" data-slot="table-content" class="w-full min-w-[1000px] table-auto border-collapse text-sm tabular-nums">
      <colgroup>
        <col class="model-column" />
        <col span="7" />
      </colgroup>
      <thead :class="table.header()" data-slot="table-header">
        <tr :class="table.row()" data-slot="table-row"
          class="table-head-row text-xs font-semibold uppercase tracking-wider"
        >
          <th :class="table.column()" data-slot="table-column"
            rowspan="2"
            class="col-sep-r py-2.5 text-left align-middle"
          >
            {{ t('modelPlaza.table.model') }}
          </th>
          <th :class="table.column()" data-slot="table-column" colspan="3" class="pz-bg th-center pt-2 text-center">
            <div class="pz-title border-b pb-2 font-semibold">
              {{ t('modelPlaza.table.paidPrice') }}
              <span class="pz-unit ml-1 normal-case font-normal">{{ t('modelPlaza.table.unitPerMillion') }}</span>
            </div>
          </th>
          <th :class="table.column()" data-slot="table-column"
            colspan="3"
            class="col-sep-l th-center pt-2 text-center"
          >
            <div class="official-title border-b pb-2 plaza-muted">
              {{ t('modelPlaza.table.officialPrice') }}
              <span class="ml-1 normal-case font-normal plaza-muted">{{ t('modelPlaza.table.unitPerMillion') }}</span>
            </div>
          </th>
          <th :class="table.column()" data-slot="table-column"
            rowspan="2"
            class="col-sep-l th-right py-2.5 text-right align-middle"
          >
            {{ t('modelPlaza.table.rate') }}
          </th>
        </tr>
        <tr :class="table.row()" data-slot="table-row"
          class="table-subhead-row text-left text-[11px] font-medium uppercase leading-4 tracking-wide plaza-muted"
        >
          <th :class="table.column()" data-slot="table-column" class="pz-bg px-3 py-2 font-medium">{{ t('modelPlaza.table.input') }}</th>
          <th :class="table.column()" data-slot="table-column" class="pz-bg px-3 py-2 font-medium">{{ t('modelPlaza.table.output') }}</th>
          <th :class="table.column()" data-slot="table-column" class="pz-bg px-3 py-2 font-medium">{{ t('modelPlaza.table.cache') }}</th>
          <th :class="table.column()" data-slot="table-column" class="col-sep-l px-3 py-2 font-medium">
            {{ t('modelPlaza.table.input') }}
          </th>
          <th :class="table.column()" data-slot="table-column" class="px-3 py-2 font-medium">{{ t('modelPlaza.table.output') }}</th>
          <th :class="table.column()" data-slot="table-column" class="px-3 py-2 font-medium">{{ t('modelPlaza.table.cache') }}</th>
        </tr>
      </thead>
      <tbody :class="table.body()" data-slot="table-body">
        <tr :class="table.row()" data-slot="table-row"
          v-for="{ model: m, period, key } in rows"
          :key="key"
          class="pricing-row"
        >
          <!-- 模型名 + 非 token 计费模式徽章;分时时段行额外标注时段 -->
          <td :class="table.cell()" data-slot="table-cell" class="col-sep-r py-2.5 align-middle">
            <div class="flex flex-wrap items-center gap-1.5">
              <span class="inline-flex min-w-0 items-center gap-1">
                <span class="model-name min-w-0">{{ m.name }}</span>
                <HeroButton
                  icon-only
                  size="sm"
                  class="copy-model-btn"
                  :data-copied="copiedRowKey === key ? 'true' : undefined"
                  :title="t('modelPlaza.table.copyModelId', { model: m.name })"
                  :aria-label="t('modelPlaza.table.copyModelId', { model: m.name })"
                  @press="handleCopyModel(key, m.name)"
                >
                  <Icon :name="copiedRowKey === key ? 'check' : 'copy'" size="sm" aria-hidden="true" />
                </HeroButton>
              </span>
              <!-- 时段徽章紧跟模型名,其余徽章排在后面,空间不足时先换行的是它们 -->
              <span
                v-if="period"
                class="model-meta-badge inline-flex items-center whitespace-nowrap font-mono"
                :title="timePricingRowHint(m)"
              >
                <span v-if="m.time_pricing?.weekdays_only" class="mr-1 font-sans">{{
                  t('modelPlaza.table.timePricingWeekdays')
                }}</span>
                {{ formatTimeWindow(period) }}
              </span>
              <span
                v-if="platform && m.platform !== platform"
                :class="[
                  'inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium',
                  platformBadgeLightClass(m.platform)
                ]"
              >
                {{ platformLabel(m.platform) }}
              </span>
              <span
                v-if="billingMode(m) !== BILLING_MODE_TOKEN"
                class="model-meta-badge"
              >
                {{ billingModeLabel(m) }}
              </span>
              <span
                v-if="m.long_context_basis === 'marginal'"
                class="model-meta-badge"
                :title="t('modelPlaza.table.tierHintMarginal')"
              >
                {{ t('modelPlaza.table.marginalBadge') }}
              </span>
              <span
                v-for="([effort, multiplier]) in reasoningEffortMultipliers(m)"
                :key="effort"
                class="model-effort-badge"
                :title="t('modelPlaza.table.reasoningMultiplierHint', { effort, multiplier })"
                :data-reasoning-effort="effort"
              >
                {{ t('modelPlaza.table.reasoningMultiplierBadge', { effort, multiplier }) }}
              </span>
            </div>
          </td>

          <!-- token 计费:输入 / 输出 / 缓存(写/读),有阶梯时每档一行;档位标签只放输入列,其余列按行对齐 -->
          <template v-if="billingMode(m) === BILLING_MODE_TOKEN">
            <td :class="table.cell()" data-slot="table-cell" class="pz-cell paid-price px-3 py-2.5 align-middle font-mono font-semibold">
              <template v-if="tokenIntervals(m).length">
                <div
                  v-for="(iv, idx) in tokenIntervals(m)"
                  :key="idx"
                  class="price-tier whitespace-nowrap text-xs leading-5"
                >
                  <span class="mr-1 font-sans font-normal plaza-muted" :title="tierHint(m)">{{ tierLabel(iv) }}</span>
                  {{ paidPerMillion(iv.input_price, period) }}
                </div>
              </template>
              <template v-else>{{ paidPerMillion(m.pricing?.input_price, period) }}</template>
            </td>
            <td :class="table.cell()" data-slot="table-cell" class="pz-cell paid-price px-3 py-2.5 align-middle font-mono font-semibold">
              <template v-if="tokenIntervals(m).length">
                <div
                  v-for="(iv, idx) in tokenIntervals(m)"
                  :key="idx"
                  class="price-tier whitespace-nowrap text-xs leading-5"
                  :title="tierHint(m)"
                >
                  {{ paidPerMillion(iv.output_price, period) }}
                </div>
              </template>
              <template v-else>{{ paidPerMillion(m.pricing?.output_price, period) }}</template>
            </td>
            <td :class="table.cell()" data-slot="table-cell" class="pz-cell px-3 py-2.5 align-middle">
              <template v-if="hasTierCachePricing(tokenIntervals(m))">
                <div
                  v-for="(iv, idx) in tokenIntervals(m)"
                  :key="idx"
                  class="price-tier paid-cache whitespace-nowrap font-mono text-xs leading-5"
                  :title="tierHint(m)"
                >
                  <template v-if="iv.cache_write_price != null || iv.cache_write_1h_price != null || iv.cache_write_12h_price != null || iv.cache_read_price != null">
                    <span class="font-sans font-normal plaza-muted">{{ t('modelPlaza.table.cacheWriteShort') }}</span>
                    {{ paidPerMillion(iv.cache_write_price, period) }}
                    <span class="ml-1 font-sans plaza-muted">{{ t('modelPlaza.table.cacheReadShort') }}</span>
                    {{ paidPerMillion(iv.cache_read_price, period) }}
                    <div v-if="iv.cache_write_1h_price != null || iv.cache_write_12h_price != null" class="cache-windows">
                      <span class="font-sans plaza-muted">{{ t('modelPlaza.table.cacheWriteShort') }}</span>
                      <span v-if="iv.cache_write_1h_price != null">(1h {{ paidPerMillion(iv.cache_write_1h_price, period) }})</span>
                      <span v-if="iv.cache_write_12h_price != null">(12h {{ paidPerMillion(iv.cache_write_12h_price, period) }})</span>
                    </div>
                  </template>
                  <span v-else class="plaza-muted">-</span>
                </div>
              </template>
              <div
                v-else-if="hasCachePricing(m)"
                class="paid-cache space-y-0.5 font-mono text-xs"
              >
                <div>
                  <span class="mr-1 font-sans font-normal plaza-muted">{{ t('modelPlaza.table.cacheWrite') }}</span>
                  {{ paidPerMillion(m.pricing?.cache_write_price, period)
                  }}<template v-if="m.pricing?.cache_write_1h_price != null"
                    ><span class="font-sans font-normal plaza-muted"> (1h </span>{{ paidPerMillion(m.pricing.cache_write_1h_price, period)
                    }}<span class="font-sans font-normal plaza-muted">)</span></template
                  ><template v-if="m.pricing?.cache_write_12h_price != null"
                    ><span class="font-sans font-normal plaza-muted"> (12h </span>{{ paidPerMillion(m.pricing.cache_write_12h_price, period)
                    }}<span class="font-sans font-normal plaza-muted">)</span></template
                  >
                </div>
                <div>
                  <span class="mr-1 font-sans font-normal plaza-muted">{{ t('modelPlaza.table.cacheRead') }}</span>
                  {{ paidPerMillion(m.pricing?.cache_read_price, period) }}
                </div>
              </div>
              <span v-else class="plaza-muted">-</span>
            </td>
          </template>

          <!-- 按次 / 按图片计费:实付区整体合并,阶梯芯片或单一按次价 -->
          <template v-else>
            <td :class="table.cell()" data-slot="table-cell" colspan="3" class="pz-cell px-3 py-2.5 align-middle">
              <div
                v-if="requestIntervals(m).length"
                class="flex flex-wrap items-center gap-1.5"
              >
                <span
                  v-for="(iv, idx) in requestIntervals(m)"
                  :key="idx"
                  class="request-tier-chip inline-flex items-center gap-1 font-mono text-xs"
                >
                  <span class="font-sans plaza-muted">{{ tierLabel(iv) }}</span>
                  {{ paidRequestPrice(m, iv.per_request_price)
                  }}<span class="font-sans plaza-muted">{{ perUnitSuffix(m) }}</span>
                </span>
              </div>
              <template v-else-if="m.pricing?.per_request_price != null">
                <span class="paid-price font-mono font-semibold">
                  {{ paidRequestPrice(m, m.pricing.per_request_price) }}
                </span>
                <span class="ml-1 text-xs plaza-muted">{{ perUnitSuffix(m) }}</span>
              </template>
              <span v-else class="plaza-muted">-</span>
            </td>
          </template>

          <!-- 官方价格(参考价,不乘倍率;官方有阶梯时每档一行) -->
          <td :class="table.cell()" data-slot="table-cell"
            class="col-sep-l official-price px-3 py-2.5 align-middle font-mono text-xs"
          >
            <template v-if="officialIntervals(m).length">
              <div
                v-for="(iv, idx) in officialIntervals(m)"
                :key="idx"
                class="price-tier whitespace-nowrap leading-5"
              >
                <span class="mr-1 font-sans plaza-muted" :title="t('modelPlaza.table.tierHint')">{{ tierLabel(iv) }}</span>
                {{ official(iv.input_price) }}
              </div>
            </template>
            <template v-else>{{ official(m.official_pricing?.input_price) }}</template>
          </td>
          <td :class="table.cell()" data-slot="table-cell" class="official-price px-3 py-2.5 align-middle font-mono text-xs">
            <template v-if="officialIntervals(m).length">
              <div
                v-for="(iv, idx) in officialIntervals(m)"
                :key="idx"
                class="price-tier whitespace-nowrap leading-5"
                :title="t('modelPlaza.table.tierHint')"
              >
                {{ official(iv.output_price) }}
              </div>
            </template>
            <template v-else>{{ official(m.official_pricing?.output_price) }}</template>
          </td>
          <td :class="table.cell()" data-slot="table-cell" class="px-3 py-2.5 align-middle">
            <template v-if="hasTierCachePricing(officialIntervals(m))">
              <div
                v-for="(iv, idx) in officialIntervals(m)"
                :key="idx"
                class="price-tier official-price whitespace-nowrap font-mono text-xs leading-5"
                :title="t('modelPlaza.table.tierHint')"
              >
                <template v-if="iv.cache_write_price != null || iv.cache_write_1h_price != null || iv.cache_write_12h_price != null || iv.cache_read_price != null">
                  <span class="font-sans plaza-muted">{{ t('modelPlaza.table.cacheWriteShort') }}</span>
                  {{ official(iv.cache_write_price) }}
                  <span class="ml-1 font-sans plaza-muted">{{ t('modelPlaza.table.cacheReadShort') }}</span>
                  {{ official(iv.cache_read_price) }}
                  <div v-if="iv.cache_write_1h_price != null || iv.cache_write_12h_price != null" class="cache-windows">
                    <span class="font-sans plaza-muted">{{ t('modelPlaza.table.cacheWriteShort') }}</span>
                    <span v-if="iv.cache_write_1h_price != null">(1h {{ official(iv.cache_write_1h_price) }})</span>
                    <span v-if="iv.cache_write_12h_price != null">(12h {{ official(iv.cache_write_12h_price) }})</span>
                  </div>
                </template>
                <span v-else class="plaza-muted">-</span>
              </div>
            </template>
            <div
              v-else-if="m.official_pricing && hasOfficialCache(m.official_pricing)"
              class="official-price space-y-0.5 font-mono text-xs"
            >
              <div>
                <span class="mr-1 font-sans font-normal plaza-muted">{{ t('modelPlaza.table.cacheWrite') }}</span>
                {{ official(m.official_pricing.cache_write_price)
                }}<template v-if="m.official_pricing.cache_write_1h_price != null"
                  ><span class="font-sans plaza-muted"> (1h </span>{{ official(m.official_pricing.cache_write_1h_price)
                  }}<span class="font-sans plaza-muted">)</span></template
                ><template v-if="m.official_pricing.cache_write_12h_price != null"
                  ><span class="font-sans plaza-muted"> (12h </span>{{ official(m.official_pricing.cache_write_12h_price)
                  }}<span class="font-sans plaza-muted">)</span></template
                >
              </div>
              <div>
                <span class="mr-1 font-sans font-normal plaza-muted">{{ t('modelPlaza.table.cacheRead') }}</span>
                {{ official(m.official_pricing.cache_read_price) }}
              </div>
            </div>
            <span v-else class="plaza-muted">-</span>
          </td>

          <!-- 折扣倍率(分时时段行展示 生效倍率×时段倍率;生图独立倍率行展示独立倍率;专属倍率划线展示原倍率) -->
          <td :class="table.cell()" data-slot="table-cell"
            class="col-sep-l td-right py-2.5 text-right align-middle font-mono text-xs"
          >
            <span
              v-if="period"
              class="rate-accent font-bold"
              :title="t('modelPlaza.table.timePricingRateHint', { rate: effectiveRate, multiplier: period.multiplier })"
              >{{ periodRate(period) }}x</span
            >
            <span
              v-else-if="usesIndependentMediaRate(m)"
              class="rate-value font-bold"
              >{{ requestRate(m) }}x</span
            >
            <template v-else-if="hasCustomRate">
              <span class="mr-1 plaza-muted line-through">{{ rateMultiplier }}x</span>
              <span class="rate-accent font-bold">{{ effectiveRate }}x</span>
            </template>
            <span v-else class="rate-value font-bold">{{ effectiveRate }}x</span>
          </td>
        </tr>
      </tbody>
    </table>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { tableVariants } from '@heroui/styles'
import { computed, onBeforeUnmount, ref, shallowRef } from 'vue'
import { createElement } from 'react'
import { Table } from '@heroui/react'
import HeroButton from '@/components/hero/HeroButton.vue'
import { useReactHost } from '@/components/hero/useReactHost'
import { useI18n } from 'vue-i18n'
import Icon from '@/components/icons/Icon.vue'
import { useClipboard } from '@/composables/useClipboard'
import { formatScaled, resolveIntervalPrices } from '@/utils/pricing'
import { platformBadgeLightClass, platformLabel } from '@/utils/platformColors'
import {
  BILLING_MODE_TOKEN,
  BILLING_MODE_IMAGE,
  BILLING_MODE_VIDEO,
  REASONING_EFFORT_LEVELS,
  type BillingMode
} from '@/constants/channel'
import type { PlazaModel, PlazaTimePricingPeriod } from '@/api/modelPlaza'
import type { UserPricingInterval } from '@/api/channels'

function reasoningEffortMultipliers(model: PlazaModel): [string, number][] {
  const multipliers = model.pricing?.reasoning_effort_multipliers
  return REASONING_EFFORT_LEVELS.flatMap(effort => {
    const multiplier = multipliers?.[effort]
    return typeof multiplier === 'number' && Number.isFinite(multiplier) && multiplier > 0
      ? [[effort, multiplier] as [string, number]]
      : []
  })
}

const props = defineProps<{
  models: PlazaModel[]
  groupName?: string
  platform?: string
  /** 分组默认倍率。 */
  rateMultiplier: number
  /** 用户专属倍率;与默认不同,实付价按此计算并划线展示原倍率。 */
  userRateMultiplier?: number | null
  /** 生图独立倍率:true 时图片计费模型的实付倍率取 imageRateMultiplier,不取分组/专属倍率。 */
  imageRateIndependent?: boolean
  imageRateMultiplier?: number | null
  /** 视频独立倍率开启时，覆盖分组/用户专属倍率，与后端视频计费保持一致。 */
  videoRateIndependent?: boolean
  videoRateMultiplier?: number | null
  /**
   * 高峰窗口描述(含倍率与服务器时区标注),空串/缺省 = 分组未启用高峰。
   * 表格所有价格均为不含高峰因子的口径,该窗口仅用于分时时段行的 tooltip 披露:
   * 与高峰重叠的部分实付还会再乘高峰倍率。
   */
  peakWindow?: string
  peakRateMultiplier?: number | null
}>()

const { t } = useI18n()
const { copyToClipboard } = useClipboard()
const copiedRowKey = ref<string | null>(null)
const copyAnnouncement = ref('')
let copyResetTimer: ReturnType<typeof setTimeout> | null = null
let copySequence = 0
let disposed = false

async function handleCopyModel(rowKey: string, modelName: string) {
  const sequence = ++copySequence
  const ok = await copyToClipboard(modelName)
  if (!ok || disposed || sequence !== copySequence) return
  copiedRowKey.value = rowKey
  copyAnnouncement.value = `${t('common.copied')}: ${modelName}`
  if (copyResetTimer) clearTimeout(copyResetTimer)
  copyResetTimer = setTimeout(() => {
    copyResetTimer = null
    if (disposed) return
    if (copiedRowKey.value === rowKey) {
      copiedRowKey.value = null
      copyAnnouncement.value = ''
    }
  }, 1600)
}

onBeforeUnmount(() => {
  disposed = true
  if (copyResetTimer) {
    clearTimeout(copyResetTimer)
    copyResetTimer = null
  }
})
// Native merged cells preserve grouped headers and the per-request price spanning three columns.
const table = tableVariants({ variant: 'secondary' })
const scrollArea = shallowRef<HTMLDivElement | null>(null)
const setScrollArea = (el: HTMLDivElement | null) => { scrollArea.value = el }
const host = useReactHost(() => createElement(Table, { variant: 'secondary' },
  createElement(Table.ScrollContainer, {
    ref: setScrollArea, className: 'plaza-pricing-table', tabIndex: 0, role: 'region',
    'aria-label': props.groupName ? t('modelPlaza.table.groupPrices', { group: props.groupName }) : t('modelPlaza.table.paidPrice'),
  })), true)

const PER_MILLION = 1_000_000

/**
 * 展示顺序:
 * 1. token 计费的排在前,按图/按次计费的沉到末尾——它们的官方 token 价与实付的按张/按次价不同量纲,混排无意义;
 * 2. 组内按官方输出价从高到低,无官方价的排最后;
 * 3. 同价按名称降序(新版本号在前,如 gpt-5.6 先于 gpt-5.5)。
 */
const sortedModels = computed(() => {
  return [...props.models].sort((a, b) => {
    const ta = billingMode(a) === BILLING_MODE_TOKEN
    const tb = billingMode(b) === BILLING_MODE_TOKEN
    if (ta !== tb) return ta ? -1 : 1
    const pa = a.official_pricing?.output_price ?? null
    const pb = b.official_pricing?.output_price ?? null
    if (pa != null && pb != null && pa !== pb) return pb - pa
    if (pa != null && pb == null) return -1
    if (pa == null && pb != null) return 1
    return b.name.localeCompare(a.name)
  })
})

const effectiveRate = computed(() => props.userRateMultiplier ?? props.rateMultiplier)
const hasCustomRate = computed(
  () => props.userRateMultiplier != null && props.userRateMultiplier !== props.rateMultiplier
)

function billingMode(m: PlazaModel): BillingMode {
  return (m.pricing?.billing_mode || BILLING_MODE_TOKEN) as BillingMode
}

function billingModeLabel(m: PlazaModel): string {
  return billingMode(m) === BILLING_MODE_IMAGE
    ? t('modelPlaza.table.perImage')
    : t('modelPlaza.table.perRequest')
}

/** 价格统一保底 2 位小数,更长的有效小数原样保留。 */
const MIN_DECIMALS = 2

/** 表格行:每个模型一行标准价;配置了分时倍率的模型再按时段各加一行。 */
interface PlazaRow {
  model: PlazaModel
  period: PlazaTimePricingPeriod | null
  key: string
}

const rows = computed<PlazaRow[]>(() =>
  sortedModels.value.flatMap((m) => {
    const base: PlazaRow = { model: m, period: null, key: `${m.platform}:${m.name}` }
    const periodRows = timePeriods(m).map<PlazaRow>((p, idx) => ({
      model: m,
      period: p,
      key: `${m.platform}:${m.name}:${idx}`
    }))
    return [base, ...periodRows]
  })
)

/** 时段行的生效倍率 = 生效倍率 × 时段倍率(去掉浮点噪声)。 */
function periodRate(period: PlazaTimePricingPeriod): number {
  return Math.round(effectiveRate.value * period.multiplier * 1000) / 1000
}

/** 实付价 = 渠道单价 × 生效倍率(时段行再乘时段倍率),按 $/1M token 展示。 */
function paidPerMillion(value: number | null | undefined, period: PlazaTimePricingPeriod | null = null): string {
  if (value == null) return '-'
  const rate = period ? periodRate(period) : effectiveRate.value
  return formatScaled(value * rate, PER_MILLION, MIN_DECIMALS)
}

/** 图片和视频分别使用对应的独立倍率开关。 */
function usesIndependentMediaRate(m: PlazaModel): boolean {
  return (billingMode(m) === BILLING_MODE_IMAGE && props.imageRateIndependent === true) ||
    (billingMode(m) === BILLING_MODE_VIDEO && props.videoRateIndependent === true)
}

/** 非 token 行的生效倍率，图片和视频可分别覆盖通用倍率。 */
function requestRate(m: PlazaModel): number {
  if (billingMode(m) === BILLING_MODE_VIDEO && props.videoRateIndependent === true) {
    return Math.max(0, props.videoRateMultiplier ?? 1)
  }
  return billingMode(m) === BILLING_MODE_IMAGE && props.imageRateIndependent === true
    ? (props.imageRateMultiplier ?? 1)
    : effectiveRate.value
}

/** 非 token 单价乘该行生效倍率，不换算为每百万 token。 */
function paidRequestPrice(m: PlazaModel, value: number | null | undefined): string {
  if (value == null) return '-'
  return formatScaled(value * requestRate(m), 1, MIN_DECIMALS)
}

/** 官方参考价不乘倍率。 */
function official(value: number | null | undefined): string {
  if (value == null) return '-'
  return formatScaled(value, PER_MILLION, MIN_DECIMALS)
}

/** 非 token 计费的单位后缀:按图片 → “/ 张”,按次 → “/ 次”。 */
function perUnitSuffix(m: PlazaModel): string {
  return billingMode(m) === BILLING_MODE_IMAGE
    ? t('modelPlaza.table.perUnitImage')
    : t('modelPlaza.table.perUnitRequest')
}

function hasCachePricing(m: PlazaModel): boolean {
  return m.pricing?.cache_write_price != null || m.pricing?.cache_write_1h_price != null || m.pricing?.cache_write_12h_price != null || m.pricing?.cache_read_price != null
}

function hasOfficialCache(o: NonNullable<PlazaModel['official_pricing']>): boolean {
  return o.cache_write_price != null || o.cache_read_price != null || o.cache_write_1h_price != null || o.cache_write_12h_price != null
}

/** 分时倍率时段(后端只给出倍率 ≠ 1 的时段,已升序)。 */
function timePeriods(m: PlazaModel): PlazaTimePricingPeriod[] {
  return m.time_pricing?.periods ?? []
}

/**
 * 时段行 tooltip:仅工作日生效的配置换用带周末回落说明的文案;
 * 分组启用高峰倍率时追加披露——本行价格不含高峰因子,与高峰窗口重叠的部分实付再乘高峰倍率。
 */
function timePricingRowHint(m: PlazaModel): string {
  const key = m.time_pricing?.weekdays_only
    ? 'modelPlaza.table.timePricingRowHintWeekdays'
    : 'modelPlaza.table.timePricingRowHint'
  let hint = t(key, { timezone: m.time_pricing?.timezone })
  if (props.peakWindow) {
    hint += t('modelPlaza.table.timePricingRowHintPeak', {
      window: props.peakWindow,
      multiplier: props.peakRateMultiplier ?? 1
    })
  }
  return hint
}

/** “00:30–08:30”;整分钟的 HH:mm:ss 省略秒。 */
function formatTimeWindow(p: PlazaTimePricingPeriod): string {
  const clock = (v: string) => v.replace(/^(\d{2}:\d{2}):00$/, '$1')
  return `${clock(p.start_time)}–${clock(p.end_time)}`
}

/** 上下文档位按下限升序展示(后端已升序,此处兜底)。 */
function sortByContext(intervals: UserPricingInterval[]): UserPricingInterval[] {
  return [...intervals].sort((a, b) => a.min_tokens - b.min_tokens)
}

/** token 模式的阶梯定价(内联进输入/输出/缓存列)。 */
function tokenIntervals(m: PlazaModel): UserPricingInterval[] {
  return sortByContext(m.pricing?.intervals ?? []).map(iv => resolveIntervalPrices(iv, m.pricing!))
}

/** 官方阶梯(后端按目录规则合成,不受分组开关影响)。 */
function officialIntervals(m: PlazaModel): UserPricingInterval[] {
  return sortByContext(m.official_pricing?.intervals ?? [])
}

/** 任一档带缓存价才按档渲染缓存列;否则沿用平价的写入/读取两行。 */
function hasTierCachePricing(intervals: UserPricingInterval[]): boolean {
  return intervals.some((iv) =>
    iv.cache_write_price != null || iv.cache_write_1h_price != null || iv.cache_write_12h_price != null || iv.cache_read_price != null ||
    iv.cache_write_multiplier != null || iv.cache_read_multiplier != null
  )
}

/** 档位说明:整单按档计价,或(平台旧规则)仅超出部分按档计价。 */
function tierHint(m: PlazaModel): string {
  return m.long_context_basis === 'marginal'
    ? t('modelPlaza.table.tierHintMarginal')
    : t('modelPlaza.table.tierHint')
}


/** 按次/按图模式的阶梯定价(仅保留配了按次价的档位)。 */
function requestIntervals(m: PlazaModel): UserPricingInterval[] {
  return (m.pricing?.intervals ?? []).filter((iv) => iv.per_request_price != null)
}

/**
 * 档位标签:优先后端/管理员给出的 tier_label,否则按区间生成统一形态——
 * 有上限为「≤上限」,末档为「>下限」;档位升序排列,相邻的 ≤100K / ≤200K 即表示 (100K,200K]。
 */
function tierLabel(iv: UserPricingInterval): string {
  if (iv.tier_label) return iv.tier_label
  const { min_tokens: min, max_tokens: max } = iv
  return max == null ? `>${formatTokenCount(min)}` : `≤${formatTokenCount(max)}`
}

function formatTokenCount(n: number): string {
  if (n >= 1_000_000) return `${trimZero(n / 1_000_000)}M`
  if (n >= 1_000) return `${trimZero(n / 1_000)}K`
  return String(n)
}

function trimZero(n: number): string {
  return String(Math.round(n * 100) / 100)
}
</script>

<style scoped>
:deep(.plaza-pricing-table) {
  overflow-x: auto;
  scrollbar-color: var(--field-line) var(--panel);
}
:deep(.plaza-pricing-table:focus-visible) {
  outline: 2px solid var(--focus);
  outline-offset: -2px;
}
.scroll-hint {
  display: none;
  margin: 0;
  padding: .55rem 1.25rem;
  font-size: .8125rem;
  color: var(--muted);
  background: var(--panel-subtle, var(--field));
  border-bottom: 1px solid var(--line-subtle, var(--line));
}

table {
  --model-column-width: 10rem;
  font-variant-numeric: tabular-nums;
}
.model-column {
  width: var(--model-column-width);
}
thead tr:first-child th:first-child,
tbody td:first-child {
  min-width: var(--model-column-width);
}
thead tr:first-child th:last-child {
  white-space: nowrap;
}
thead th,
tbody td {
  padding-inline: .75rem;
}

/* Override HeroUI Table secondary variant corners/dividers/hover so SGM tokens own the table surface. */
table[data-slot="table-content"] thead th[data-slot="table-column"] {
  background-color: var(--panel-subtle, #f7fafa);
  border-radius: 0;
  color: var(--muted);
}
:deep(.table-root--secondary) table[data-slot="table-content"] thead tr[data-slot="table-row"] th[data-slot="table-column"]:first-child,
:deep(.table-root--secondary) table[data-slot="table-content"] thead tr[data-slot="table-row"] th[data-slot="table-column"]:last-child {
  border-radius: 0;
}
table[data-slot="table-content"] thead th[data-slot="table-column"]::after {
  content: none;
}
table[data-slot="table-content"] thead th[data-slot="table-column"].pz-bg {
  background-color: var(--tint);
}
table[data-slot="table-content"] thead th[data-slot="table-column"].th-center {
  text-align: center;
}
table[data-slot="table-content"] thead th[data-slot="table-column"].th-right {
  text-align: right;
}
table[data-slot="table-content"] tbody td[data-slot="table-cell"].td-right {
  text-align: right;
}
table[data-slot="table-content"] thead tr.table-subhead-row th[data-slot="table-column"] {
  border-bottom: 1px solid var(--line);
}

table[data-slot="table-content"] .col-sep-r {
  border-inline-end: 1px solid var(--line-subtle, var(--line));
}
table[data-slot="table-content"] .col-sep-l {
  border-inline-start: 1px solid var(--line-subtle, var(--line));
}

table[data-slot="table-content"] tbody tr[data-slot="table-row"] > td[data-slot="table-cell"] {
  background-color: transparent;
  border-bottom: 1px solid var(--line-subtle, var(--line));
  transition: background-color var(--duration-fast, 150ms) var(--ease-out, cubic-bezier(0.22, 1, 0.36, 1));
}
table[data-slot="table-content"] tbody tr[data-slot="table-row"]:last-child > td[data-slot="table-cell"] {
  border-bottom: 0;
}
table[data-slot="table-content"] tbody tr[data-slot="table-row"] > td[data-slot="table-cell"].pz-cell {
  background-color: var(--tint);
}
@media (hover: hover) {
  table[data-slot="table-content"] tbody tr[data-slot="table-row"]:hover > td[data-slot="table-cell"] {
    background-color: var(--panel-subtle, #f7fafa);
  }
  table[data-slot="table-content"] tbody tr[data-slot="table-row"]:hover > td[data-slot="table-cell"].pz-cell {
    background-color: var(--tint-strong, var(--tint));
  }
}

.cache-windows {
  display: flex;
  gap: .375rem;
  color: var(--muted);
}
/* 每档的输入、输出、缓存共用行高，缓存写入时长独占第二行。 */
tr:has(.cache-windows) .price-tier {
  min-height: 2.5rem;
}
.price-tier {
  font-variant-numeric: tabular-nums;
}

.model-name {
  color: var(--ink);
  font-weight: 500;
  overflow-wrap: anywhere;
}
.copy-model-btn[data-slot="button"] {
  --button-bg: transparent;
  --button-bg-hover: var(--tint);
  --button-bg-pressed: var(--tint-strong, var(--tint));
  position: relative;
  width: 1.625rem;
  height: 1.625rem;
  min-width: 1.625rem;
  min-height: 1.625rem;
  padding: 0;
  border-radius: 6px;
  flex: none;
  color: var(--muted);
  opacity: .72;
  transition:
    color var(--duration-fast, 150ms) var(--ease-out, cubic-bezier(0.22, 1, 0.36, 1)),
    background-color var(--duration-fast, 150ms) var(--ease-out, cubic-bezier(0.22, 1, 0.36, 1)),
    opacity var(--duration-fast, 150ms) var(--ease-out, cubic-bezier(0.22, 1, 0.36, 1)),
    transform var(--duration-fast, 150ms) var(--ease-out, cubic-bezier(0.22, 1, 0.36, 1));
}
@media (pointer: coarse) {
  .copy-model-btn[data-slot="button"]::after {
    content: '';
    position: absolute;
    inset: -0.5rem;
  }
}
@media (hover: hover) {
  .pricing-row:hover .copy-model-btn[data-slot="button"] {
    opacity: 1;
  }
  .copy-model-btn[data-slot="button"]:hover {
    color: var(--ink);
    background-color: var(--tint);
    opacity: 1;
  }
}
.copy-model-btn[data-slot="button"]:active {
  transform: scale(0.94);
}
.copy-model-btn[data-slot="button"]:focus-visible,
.copy-model-btn[data-slot="button"][data-focus-visible="true"] {
  opacity: 1;
  outline: 2px solid var(--focus);
  outline-offset: 2px;
  box-shadow: none;
}
.copy-model-btn[data-slot="button"][data-copied="true"] {
  color: var(--accent);
  background-color: var(--accent-soft, var(--tint));
  opacity: 1;
}

.model-meta-badge {
  border-radius: 6px;
  border: 1px solid var(--line-subtle, var(--line));
  background-color: var(--panel-subtle, var(--tint));
  padding: .125rem .375rem;
  font-size: 10px;
  line-height: 1.35;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: var(--muted);
}
.model-effort-badge {
  border-radius: 6px;
  border: 1px solid rgb(180 116 20 / 22%);
  background-color: rgb(254 243 199 / 55%);
  padding: .125rem .375rem;
  font-size: 10px;
  line-height: 1.35;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: var(--warning-soft-foreground, #8a5009);
}
.dark .model-effort-badge {
  border-color: rgb(244 197 106 / 24%);
  background-color: rgb(244 197 106 / 12%);
  color: var(--warning-soft-foreground, #f4c56a);
}

.request-tier-chip {
  border-radius: 6px;
  border: 1px solid var(--line);
  background-color: var(--panel);
  padding: .15rem .5rem;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
  box-shadow: var(--shadow-xs, 0 1px 2px rgb(22 43 52 / 5%));
}

.pz-title {
  color: var(--accent);
  border-color: var(--line);
}
.official-title {
  border-color: var(--line);
}
.pz-unit,
.plaza-muted {
  color: var(--muted);
}
.paid-price,
.paid-cache {
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}
.official-price {
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}
.rate-value {
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}
.rate-accent {
  color: var(--accent);
  font-variant-numeric: tabular-nums;
}

@container (max-width: 999px) {
  .scroll-hint {
    display: block;
  }
  table {
    --model-column-width: 8rem;
  }
  table[data-slot="table-content"] thead tr:first-child th[data-slot="table-column"]:first-child {
    position: sticky;
    left: 0;
    z-index: 2;
    background-color: var(--panel-subtle, #f7fafa);
    border-radius: 0;
    box-shadow: inset -1px 0 0 var(--line), 6px 0 12px -4px rgb(22 43 52 / 10%);
    padding-inline: .75rem;
  }
  table[data-slot="table-content"] tbody tr[data-slot="table-row"] > td[data-slot="table-cell"]:first-child {
    position: sticky;
    left: 0;
    z-index: 1;
    background-color: var(--panel);
    border-radius: 0;
    box-shadow: inset -1px 0 0 var(--line), 6px 0 12px -4px rgb(22 43 52 / 10%);
    padding-inline: .75rem;
  }
  @media (hover: hover) {
    table[data-slot="table-content"] tbody tr[data-slot="table-row"]:hover > td[data-slot="table-cell"]:first-child {
      background-color: var(--panel-subtle, #f7fafa);
    }
  }
  .dark table[data-slot="table-content"] thead tr:first-child th[data-slot="table-column"]:first-child,
  .dark table[data-slot="table-content"] tbody tr[data-slot="table-row"] > td[data-slot="table-cell"]:first-child {
    box-shadow: inset -1px 0 0 var(--line), 8px 0 16px -4px rgb(0 0 0 / 42%);
  }
}

@media (prefers-reduced-motion: reduce) {
  table[data-slot="table-content"] tbody tr[data-slot="table-row"] > td[data-slot="table-cell"],
  .copy-model-btn[data-slot="button"] {
    transition: none;
  }
  .copy-model-btn[data-slot="button"]:active,
  .copy-model-btn[data-slot="button"][data-pressed="true"] {
    transform: none;
  }
}
</style>
