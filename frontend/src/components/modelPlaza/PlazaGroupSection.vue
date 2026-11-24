<template>
  <HeroCard as="section" class="plaza-group" :aria-label="group.name">
    <!-- 分组头部:名称/平台/倍率徽章/专属/订阅徽章 + 描述 -->
    <header class="group-heading">
      <div class="flex flex-wrap items-center gap-2">
        <h2 class="min-w-0">
          <GroupBadge
            :name="group.name"
            :platform="group.platform as GroupPlatform"
            :subscription-type="(group.subscription_type || 'standard') as SubscriptionType"
            :rate-multiplier="group.rate_multiplier"
            :user-rate-multiplier="group.user_rate_multiplier ?? null"
            :peak-rate-enabled="group.peak_rate_enabled"
            :peak-start="group.peak_start"
            :peak-end="group.peak_end"
            :peak-rate-multiplier="group.peak_rate_multiplier"
            always-show-rate
            :truncate="false"
          />
        </h2>
        <span
          :class="groupChip" data-slot="chip"
          v-if="group.is_exclusive"
          class="plaza-badge plaza-badge-exclusive"
        >
          <Icon name="shield" size="xs" class="h-3 w-3" />
          {{ t('modelPlaza.badges.exclusive') }}
        </span>
        <span
          :class="groupChip" data-slot="chip"
          v-if="group.subscription_type === 'subscription'"
          class="plaza-badge plaza-badge-subscription"
        >
          {{ t('modelPlaza.badges.subscription') }}
        </span>
      </div>
      <p v-if="group.description" class="group-description">
        {{ group.description }}
      </p>
      <p
        v-if="peakNote"
        class="group-peak-note"
      >
        <Icon name="clock" size="xs" class="h-3 w-3 shrink-0" />
        {{ peakNote }}
      </p>
      <p
        v-if="longContextNote"
        class="group-info-note"
      >
        <Icon name="infoCircle" size="xs" class="h-3 w-3 shrink-0" />
        {{ longContextNote }}
      </p>
    </header>

    <!-- 模型价格表:整行(含 hover 底色/分区底色)顶到卡片边缘,左右留白由表格首列/末列的 padding 提供 -->
    <div class="pricing-frame">
      <PlazaModelPricingTable
        v-if="group.models.length > 0"
        :models="group.models"
        :group-name="group.name"
        :platform="group.platform"
        :rate-multiplier="group.rate_multiplier"
        :user-rate-multiplier="group.user_rate_multiplier ?? null"
        :image-rate-independent="group.image_rate_independent"
        :image-rate-multiplier="group.image_rate_multiplier"
        :video-rate-independent="group.video_rate_independent"
        :video-rate-multiplier="group.video_rate_multiplier"
        :peak-window="peakWindow"
        :peak-rate-multiplier="group.peak_rate_multiplier"
      />
      <p v-else class="group-empty">
        {{ t('modelPlaza.detail.noModels') }}
      </p>
    </div>
  </HeroCard>
</template>

<script setup lang="ts">
import { chipVariants } from '@heroui/styles'
import HeroCard from '@/components/hero/HeroCard.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Icon from '@/components/icons/Icon.vue'
import GroupBadge from '@/components/common/GroupBadge.vue'
import PlazaModelPricingTable from './PlazaModelPricingTable.vue'
import type { ModelPlazaGroup } from '@/api/modelPlaza'
import type { GroupPlatform, SubscriptionType } from '@/types'
import { hasPeakRate, formatPeakRateWindow, serverTimezoneLabel } from '@/utils/peak-rate'
import { useAppStore } from '@/stores/app'

const groupChip = chipVariants({ size: 'sm' }).base()
const props = defineProps<{
  group: ModelPlazaGroup
}>()

const { t } = useI18n()
const appStore = useAppStore()

/** 高峰窗口描述(含倍率与服务器时区标注);分组未启用高峰为空串。 */
const peakWindow = computed(() => {
  if (!hasPeakRate(props.group)) return ''
  return formatPeakRateWindow(
    props.group,
    serverTimezoneLabel(appStore.cachedPublicSettings?.server_utc_offset)
  )
})

const peakNote = computed(() => {
  if (!peakWindow.value) return ''
  return t('modelPlaza.detail.peakNote', {
    window: peakWindow.value,
    multiplier: props.group.peak_rate_multiplier
  })
})

/**
 * 分组关闭了长上下文阶梯、但组内有模型官方带阶梯时提示:实付列只展示基础档,
 * 官方阶梯仅供参考。字段缺失(旧后端)不提示。
 */
const longContextNote = computed(() => {
  if (props.group.long_context_pricing_enabled !== false) return ''
  const hasOfficialLadder = props.group.models.some(
    (m) => (m.official_pricing?.intervals?.length ?? 0) > 1
  )
  return hasOfficialLadder ? t('modelPlaza.detail.longContextDisabledNote') : ''
})
</script>

<style scoped>
.plaza-group[data-slot="card"] {
  padding: 0;
  gap: 0;
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 18px;
  background: var(--panel);
  box-shadow: var(--shadow-card, 0 1px 2px rgb(22 43 52 / 5%), 0 4px 12px -2px rgb(22 43 52 / 5%));
}
.pricing-frame {
  container-type: inline-size;
}
.group-heading {
  padding: 1.25rem 1.25rem 1.125rem;
  border-bottom: 1px solid var(--line-subtle, var(--line));
  background: var(--panel);
  overflow-wrap: anywhere;
}
.group-heading h2 > :deep(span) {
  max-width: 100%;
  font-size: 1rem;
  line-height: 1.5;
  font-variant-numeric: tabular-nums;
}

.plaza-badge {
  display: inline-flex;
  align-items: center;
  gap: .25rem;
  border-radius: 6px;
  padding: .15rem .5rem;
  font-size: .75rem;
  line-height: 1.35;
  font-weight: 500;
}
.plaza-badge-exclusive {
  background: var(--tint);
  color: var(--accent);
  box-shadow: inset 0 0 0 1px var(--line);
}
.plaza-badge-subscription {
  background: var(--accent-soft, var(--tint));
  color: var(--accent);
  box-shadow: inset 0 0 0 1px var(--line);
}

.group-description {
  margin-top: .55rem;
  font-size: .875rem;
  line-height: 1.6;
  color: var(--muted);
}
.group-peak-note {
  margin-top: .45rem;
  display: inline-flex;
  align-items: center;
  gap: .3rem;
  font-size: .75rem;
  line-height: 1.5;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: var(--warning-soft-foreground, #8a5009);
}
.dark .group-peak-note {
  color: var(--warning-soft-foreground, #f4c56a);
}
.group-info-note {
  margin-top: .4rem;
  display: flex;
  align-items: center;
  gap: .3rem;
  font-size: .75rem;
  line-height: 1.5;
  color: var(--muted);
}
.group-empty {
  padding: 1.25rem;
  text-align: center;
  font-size: .875rem;
  color: var(--muted);
}
</style>
