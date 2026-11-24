<template>
  <div class="plaza-content" :class="{ 'public-palette': embedded, 'plaza-page': !embedded }">
    <HeroCard as="header" v-if="!embedded" class="plaza-hero">
      <h1>{{ t('modelPlaza.title') }}</h1>
      <p>{{ t('modelPlaza.description') }}</p>
    </HeroCard>

    <HeroCard v-if="descriptionHtml" class="plaza-description plaza-panel"><div v-html="descriptionHtml"></div></HeroCard>
    <p v-if="loading" role="status" class="plaza-status plaza-panel">{{ t('modelPlaza.loading') }}</p>
    <HeroCard v-else-if="error" class="plaza-status plaza-panel">
      <p role="alert">{{ t('modelPlaza.loadFailed') }}</p>
      <HeroButton variant="primary" type="button" class="plaza-retry" @press="$emit('retry')">{{ t('common.tryAgain') }}</HeroButton>
    </HeroCard>
    <template v-else>
      <!-- 筛选区:平台 → 分组 → 倍率 -->
      <PlazaFilterBar
        :platforms="platforms"
        :groups="groupOptions"
        :rates="rates"
        v-model:platform="selectedPlatform"
        v-model:group-id="selectedGroupId"
        v-model:rate="selectedRate"
        v-model:search="searchQuery"
      />

      <!-- 分组分节的模型清单(默认按生效倍率升序) -->
      <div v-if="filteredGroups.length > 0" class="space-y-5">
        <PlazaGroupSection v-for="g in filteredGroups" :key="g.id" :group="g" />
      </div>
      <div
        v-else
        role="status" class="plaza-status plaza-panel"
      >
        {{ searchActive ? t('modelPlaza.noSearchResult') : t('modelPlaza.empty') }}
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import HeroButton from '@/components/hero/HeroButton.vue'
import HeroCard from '@/components/hero/HeroCard.vue'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import PlazaFilterBar from './PlazaFilterBar.vue'
import PlazaGroupSection from './PlazaGroupSection.vue'
import type { ModelPlazaGroup, ModelPlazaResponse } from '@/api/modelPlaza'

const props = defineProps<{
  response: ModelPlazaResponse | null
  loading: boolean
  error?: boolean
  /** 后台内嵌形态(AppLayout 内):隐藏页头。 */
  embedded?: boolean
}>()

const { t } = useI18n()
defineEmits<{ retry: [] }>()

const selectedPlatform = ref<string>('all')
const selectedGroupId = ref<number | 'all'>('all')
const selectedRate = ref<number | 'all'>('all')
const searchQuery = ref('')

const searchActive = computed(() => searchQuery.value.trim() !== '')

const descriptionHtml = computed(() => {
  const md = props.response?.description?.trim()
  if (!md) return ''
  return DOMPurify.sanitize(marked.parse(md) as string)
})

/** 生效倍率 = 用户专属倍率 ?? 分组默认倍率。 */
function effectiveRate(g: ModelPlazaGroup): number {
  return g.user_rate_multiplier ?? g.rate_multiplier
}

const platforms = computed(() =>
  [...new Set((props.response?.groups ?? []).map((g) => g.platform).filter(Boolean))].sort()
)

const groupOptions = computed(() =>
  (props.response?.groups ?? []).map((g) => ({
    id: g.id,
    name: g.name,
    platform: g.platform,
    rate: effectiveRate(g)
  }))
)

/** 全量生效倍率;当前组合下不可用的项由 FilterBar 置灰而非隐藏。 */
const rates = computed(() =>
  [...new Set((props.response?.groups ?? []).map(effectiveRate))].sort((a, b) => a - b)
)

/** 数据刷新后选中的倍率可能不复存在,重置为全部。 */
watch(rates, (list) => {
  if (selectedRate.value !== 'all' && !list.includes(selectedRate.value)) {
    selectedRate.value = 'all'
  }
})

const filteredGroups = computed(() => {
  let groups = props.response?.groups ?? []
  if (selectedPlatform.value !== 'all') {
    groups = groups.filter((g) => g.platform === selectedPlatform.value)
  }
  if (selectedGroupId.value !== 'all') {
    groups = groups.filter((g) => g.id === selectedGroupId.value)
  }
  if (selectedRate.value !== 'all') {
    groups = groups.filter((g) => effectiveRate(g) === selectedRate.value)
  }
  // 模型名搜索:分组内只留命中的模型,整组无命中则隐藏该分组。
  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
    groups = groups
      .map((g) => ({ ...g, models: g.models.filter((m) => m.name.toLowerCase().includes(q)) }))
      .filter((g) => g.models.length > 0)
  }
  // 专属倍率会改变生效值,不能只依赖后端按默认倍率的排序。
  return [...groups].sort(
    (a, b) => effectiveRate(a) - effectiveRate(b) || a.name.localeCompare(b.name)
  )
})
</script>

<style scoped>
.plaza-content {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1.25rem;
  color: var(--ink);
}
.plaza-page {
  padding-block: clamp(1.5rem, 4vw, 3rem);
}

.plaza-hero[data-slot="card"] {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  gap: 0;
  padding: clamp(1.5rem, 4vw, 2.75rem);
  border: 1px solid var(--line);
  border-radius: 18px;
  background:
    radial-gradient(ellipse 58% 92% at 92% 118%, rgb(179 218 214 / 42%), transparent 54%),
    radial-gradient(ellipse 52% 72% at 98% -18%, rgb(206 218 236 / 38%), transparent 56%),
    linear-gradient(112deg, #f3faf8 0%, var(--tint, #ebf5f4) 55%, #e0eeef 100%);
  box-shadow:
    var(--shadow-inset-top, inset 0 1px 0 rgb(255 255 255 / 85%)),
    var(--shadow-card, 0 1px 2px rgb(22 43 52 / 5%), 0 4px 12px -2px rgb(22 43 52 / 5%));
}
.plaza-hero::before {
  content: "";
  position: absolute;
  z-index: -1;
  inset: 0 0 0 35%;
  pointer-events: none;
  background: url('../../assets/sgm-balance-wave.webp') right center / cover no-repeat;
  opacity: var(--wave-opacity, .72);
  mix-blend-mode: multiply;
  mask-image: linear-gradient(90deg, transparent, #000 55%);
}
.dark .plaza-hero[data-slot="card"] {
  background:
    radial-gradient(ellipse 58% 92% at 92% 118%, rgb(138 211 205 / 12%), transparent 54%),
    radial-gradient(ellipse 52% 72% at 98% -18%, rgb(92 149 170 / 12%), transparent 56%),
    linear-gradient(116deg, #1b343b 0%, #152b31 56%, #12242a 100%);
  border-color: var(--line);
}
.dark .plaza-hero::before {
  mix-blend-mode: screen;
  filter: invert(1) hue-rotate(180deg) brightness(1.4);
}
.plaza-hero h1 {
  font-size: clamp(1.75rem, 3.6vw, 2.5rem);
  font-weight: 500;
  letter-spacing: -.03em;
  line-height: 1.18;
  text-wrap: balance;
  color: var(--ink);
}
.plaza-hero p {
  margin-top: .5rem;
  max-width: 56ch;
  color: var(--muted);
  line-height: 1.65;
}

.plaza-panel,
.plaza-panel[data-slot="card"] {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 18px;
  box-shadow: var(--shadow-card, 0 1px 2px rgb(22 43 52 / 5%), 0 4px 12px -2px rgb(22 43 52 / 5%));
}

.plaza-status,
.plaza-status[data-slot="card"] {
  align-items: center;
  justify-content: center;
  gap: .75rem;
  padding: 2.5rem 1.25rem;
  text-align: center;
  color: var(--muted);
}

.plaza-retry {
  --button-bg: var(--accent);
  --button-bg-hover: var(--accent-hover, #12454f);
  --button-bg-pressed: var(--accent-active, #0e3840);
  --button-fg: var(--on-accent);
  margin-top: .25rem;
  min-height: 44px;
  padding: .5rem 1.25rem;
  border-radius: 10px;
  background: var(--accent);
  color: var(--on-accent);
  font-weight: 500;
  box-shadow: var(--shadow-btn-primary, 0 1px 2px rgb(18 69 79 / 24%), inset 0 1px 0 rgb(255 255 255 / 16%));
  transition:
    background-color var(--duration-fast, 150ms) var(--ease-out, cubic-bezier(0.22, 1, 0.36, 1)),
    box-shadow var(--duration-fast, 150ms) var(--ease-out, cubic-bezier(0.22, 1, 0.36, 1)),
    transform var(--duration-fast, 150ms) var(--ease-out, cubic-bezier(0.22, 1, 0.36, 1));
}
.plaza-retry:hover {
  background: var(--accent-hover, #12454f);
}
.plaza-retry:active {
  background: var(--accent-active, #0e3840);
  transform: scale(0.985);
}
.plaza-retry:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
  box-shadow: var(--ring-focus, 0 0 0 3px rgb(18 108 122 / 18%));
}

.plaza-description[data-slot="card"] {
  gap: 0;
  padding: 1.125rem 1.375rem;
  font-size: .9375rem;
  line-height: 1.7;
  color: var(--ink);
  overflow-wrap: anywhere;
}

.plaza-description :deep(h1),
.plaza-description :deep(h2),
.plaza-description :deep(h3) {
  margin: .875rem 0 .4rem;
  font-weight: 600;
  letter-spacing: -.015em;
  color: var(--ink);
}
.plaza-description :deep(h1:first-child),
.plaza-description :deep(h2:first-child),
.plaza-description :deep(h3:first-child) {
  margin-top: 0;
}

.plaza-description :deep(p) {
  margin: 0 0 .5rem;
  color: var(--ink);
}
.plaza-description :deep(p:last-child) {
  margin-bottom: 0;
}

.plaza-description :deep(a) {
  color: var(--accent);
  text-decoration: underline;
  text-underline-offset: 4px;
  transition: color var(--duration-fast, 150ms) var(--ease-out, cubic-bezier(0.22, 1, 0.36, 1));
}
.plaza-description :deep(a:hover) {
  color: var(--accent-hover, var(--accent));
}

.plaza-description :deep(ul) {
  margin: 0 0 .5rem;
  list-style-type: disc;
  padding-inline-start: 1.25rem;
}

.plaza-description :deep(ol) {
  margin: 0 0 .5rem;
  list-style-type: decimal;
  padding-inline-start: 1.25rem;
}

.plaza-description :deep(li) {
  margin-bottom: .2rem;
  color: var(--ink);
}

.plaza-description :deep(code) {
  border-radius: 6px;
  border: 1px solid var(--line-subtle, var(--line));
  background: var(--tint);
  color: var(--ink);
  padding: .1rem .375rem;
  font-family: "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: .8125rem;
}

.plaza-description :deep(blockquote) {
  margin: .625rem 0;
  border-inline-start: 3px solid var(--accent);
  border-radius: 0 8px 8px 0;
  background: var(--panel-subtle, var(--tint));
  padding: .5rem .875rem;
  color: var(--muted);
}

.plaza-description :deep(hr) {
  margin: .75rem 0;
  border: 0;
  border-top: 1px solid var(--line-subtle, var(--line));
}

@media (prefers-reduced-motion: reduce) {
  .plaza-retry,
  .plaza-description :deep(a) {
    transition: none;
  }
  .plaza-retry:active,
  .plaza-retry[data-pressed="true"] {
    transform: none;
  }
}
</style>
