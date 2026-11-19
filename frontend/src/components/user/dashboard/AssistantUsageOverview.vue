<template>
  <div class="sgm-usage-heading">
    <h2 id="assistant-usage-title">{{ t('dashboard.assistantSetup.usageOverview') }}</h2>
    <HeroButton type="button" class="sgm-usage-action" :disabled="loadingStats || loadingRecords" @press="refresh">
      <Icon name="refresh" size="sm" aria-hidden="true" />{{ t('common.refresh') }}
    </HeroButton>
  </div>

  <p v-if="statsError" role="alert">{{ t('dashboard.assistantSetup.usageStatsError') }}</p>
  <dl v-else class="sgm-usage-metrics" :aria-busy="loadingStats">
    <div><dt>{{ t('dashboard.assistantSetup.actualSpendToday') }}</dt><dd>{{ stats ? money.format(stats.total_actual_cost) : '—' }}</dd></div>
    <div><dt>{{ t('dashboard.todayRequests') }}</dt><dd>{{ stats ? stats.total_requests.toLocaleString(locale) : '—' }}</dd></div>
    <div><dt>{{ t('dashboard.todayTokens') }}</dt><dd>{{ stats ? stats.total_tokens.toLocaleString(locale) : '—' }}</dd></div>
  </dl>

  <div class="sgm-usage-heading sgm-usage-history">
    <h3>{{ t(expanded ? 'usage.title' : 'dashboard.recentUsage') }}</h3>
    <HeroButton type="button" class="sgm-usage-action" :aria-expanded="expanded" :disabled="loadingRecords" @press="changeList(!expanded, 1)">
      {{ t(expanded ? 'common.collapse' : 'dashboard.viewAllUsage') }}
    </HeroButton>
  </div>
  <p v-if="recordsError" role="alert">{{ t('usage.failedToLoad') }}</p>
  <p v-else-if="!records" role="status">{{ t('common.loading') }}</p>
  <p v-else-if="records.items.length === 0">{{ t('dashboard.noUsageRecords') }}</p>
  <ul v-else class="sgm-usage-records">
    <li v-for="record in records.items" :key="record.id">
      <HeroDisclosure>
        <template #trigger>
          <span class="sgm-usage-model sgm-assistant-code">{{ record.model }}</span>
          <time :datetime="record.created_at">{{ formatDateTimeToMinute(record.created_at, locale) }}</time>
          <span class="sgm-usage-cost">{{ money.format(record.actual_cost) }}</span>
          <span class="sgm-usage-detail-label">{{ t('dashboard.assistantSetup.requestDetails') }}<Icon name="chevronDown" size="sm" aria-hidden="true" /></span>
        </template>
        <dl class="sgm-usage-details">
          <div><dt>{{ t('dashboard.assistantSetup.requestId') }}</dt><dd>{{ record.request_id || '—' }}</dd></div>
          <div><dt>{{ t('usage.inboundEndpoint') }}</dt><dd>{{ record.inbound_endpoint || '—' }}</dd></div>
          <div><dt>{{ t('usage.duration') }}</dt><dd>{{ record.duration_ms == null ? '—' : record.duration_ms.toLocaleString(locale) + ' ms' }}</dd></div>
          <div><dt>{{ t('dashboard.assistantSetup.inputTokens') }}</dt><dd>{{ record.input_tokens.toLocaleString(locale) }}</dd></div>
          <div><dt>{{ t('dashboard.assistantSetup.outputTokens') }}</dt><dd>{{ record.output_tokens.toLocaleString(locale) }}</dd></div>
          <div><dt>{{ t('usage.cacheReadTokensLabel') }}</dt><dd>{{ record.cache_read_tokens.toLocaleString(locale) }}</dd></div>
          <div><dt>{{ t('usage.cacheCreationTokensLabel') }}</dt><dd>{{ record.cache_creation_tokens.toLocaleString(locale) }}</dd></div>
          <div><dt>{{ t('usage.userBilled') }}</dt><dd>{{ money.format(record.actual_cost) }}</dd></div>
        </dl>
      </HeroDisclosure>
    </li>
  </ul>
  <nav v-if="expanded && (page > 1 || (records && records.pages > 1))" class="sgm-usage-pages" :aria-label="t('usage.title')">
    <HeroButton type="button" class="sgm-usage-action" :disabled="loadingRecords || page <= 1" @press="changeList(true, page - 1)">{{ t('pagination.previous') }}</HeroButton>
    <span v-if="records">{{ t('pagination.pageOf', { page, total: records.pages }) }}</span>
    <HeroButton type="button" class="sgm-usage-action" :disabled="loadingRecords || !records || page >= records.pages" @press="changeList(true, page + 1)">{{ t('pagination.next') }}</HeroButton>
  </nav>
</template>

<script setup lang="ts">
import HeroButton from '@/components/hero/HeroButton.vue'
import HeroDisclosure from '@/components/hero/HeroDisclosure.vue'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAsyncState } from '@vueuse/core'
import { usageAPI } from '@/api/usage'
import Icon from '@/components/icons/Icon.vue'
import { formatDateTimeToMinute } from '@/utils/format'

const { t, locale } = useI18n()
const money = computed(() => new Intl.NumberFormat(locale.value, {
  style: 'currency', currency: 'USD', currencyDisplay: 'narrowSymbol', maximumFractionDigits: 6,
}))
const { state: stats, isLoading: loadingStats, error: statsError, execute: loadStats } =
  useAsyncState(() => usageAPI.getStats('today'), null, { resetOnExecute: false })
const expanded = ref(false)
const page = ref(1)
const { state: records, isLoading: loadingRecords, error: recordsError, execute: loadRecords } =
  useAsyncState(() => usageAPI.list(page.value, expanded.value ? 20 : 5), null)

function changeList(showAll: boolean, nextPage: number) {
  if (loadingRecords.value) return
  expanded.value = showAll
  page.value = nextPage
  void loadRecords()
}

function refresh() {
  void loadStats()
  void loadRecords()
}
</script>
