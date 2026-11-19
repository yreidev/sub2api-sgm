<template><div ref="host"></div></template>

<script setup lang="ts">
import { createElement } from 'react'
import { useReactHost } from '@/components/hero/useReactHost'
import { PlazaFilters } from './PlazaFilters'
import { useI18n } from 'vue-i18n'
import { platformLabel } from '@/utils/platformColors'

const props = defineProps<{
  /** 数据中出现的平台(去重排序后)。 */
  platforms: string[]
  /** 全量分组(含平台与生效倍率),三个维度的置灰联动由此推导。 */
  groups: Array<{ id: number; name: string; platform: string; rate: number }>
  /** 全量生效倍率去重升序。 */
  rates: number[]
}>()
const platform = defineModel<string>('platform', { required: true })
const groupId = defineModel<number | 'all'>('groupId', { required: true })
const rate = defineModel<number | 'all'>('rate', { required: true })
const search = defineModel<string>('search', { required: true })

const { t } = useI18n()
const host = useReactHost(() => {
  const all = { id: 'all' as const, label: t('modelPlaza.filters.all') }
  return createElement(PlazaFilters, {
    search: search.value, changeSearch: value => { search.value = value },
    modelLabel: t('modelPlaza.filters.modelLabel'), placeholder: t('modelPlaza.filters.searchPlaceholder'), clearLabel: t('common.clear'),
    platform: { label: t('modelPlaza.filters.platformLabel'), value: platform.value,
      options: [all, ...props.platforms.map(id => ({ id, label: platformLabel(id), disabled: !platformEnabled(id) }))],
      change: value => { platform.value = value } },
    group: { label: t('modelPlaza.filters.groupLabel'), value: groupId.value,
      options: [all, ...props.groups.map(g => ({ id: g.id, label: g.name, disabled: !groupEnabled(g) }))],
      change: value => { groupId.value = value } },
    rate: { label: t('modelPlaza.filters.rateLabel'), value: rate.value,
      options: [all, ...props.rates.map(id => ({ id, label: id + '×', disabled: !rateEnabled(id) }))],
      change: value => { rate.value = value } },
  })
}, true)

/**
 * 三个维度互为约束(faceted):某选项可点 ⟺ 在「其他两维」当前选择下仍有分组命中。
 * 「全部」永远可点,作为解除本维约束的出口;可点项组合恒有结果,无需选择修正。
 */
function platformEnabled(p: string): boolean {
  return props.groups.some(
    (g) =>
      g.platform === p &&
      (groupId.value === 'all' || g.id === groupId.value) &&
      (rate.value === 'all' || g.rate === rate.value)
  )
}

function groupEnabled(g: { platform: string; rate: number }): boolean {
  return (
    (platform.value === 'all' || g.platform === platform.value) &&
    (rate.value === 'all' || g.rate === rate.value)
  )
}

function rateEnabled(r: number): boolean {
  return props.groups.some(
    (g) =>
      g.rate === r &&
      (platform.value === 'all' || g.platform === platform.value) &&
      (groupId.value === 'all' || g.id === groupId.value)
  )
}
</script>

<style>
.plaza-filters[data-slot="card"] { display: grid; grid-template-columns: minmax(0, 1.7fr) repeat(3, minmax(0, 1fr)); gap: 1rem; padding: 1.25rem; background: var(--panel); border: 1px solid var(--line); border-radius: 18px; }
.plaza-filters > [data-slot] { display: grid; min-width: 0; gap: .375rem; font-size: .9375rem; font-weight: 500; }
.plaza-filters input, .plaza-filters [data-slot="select-trigger"] { width: 100%; min-width: 0; min-height: 44px; border: 1px solid var(--field-line); border-radius: 10px; background-color: var(--field); color: var(--ink); font: inherit; font-weight: 400; }
.plaza-filters [data-slot="select-trigger"] { padding-inline: .75rem; text-overflow: ellipsis; }
.plaza-filters .search-box { position: relative; }
.plaza-filters .search-box input { padding-inline: 2.5rem 2.75rem; }
.plaza-filters .search-box input:placeholder-shown { padding-inline-end: .5rem; }
.plaza-filters .search-box input::placeholder { color: var(--muted); }
.plaza-filters .search-box > svg { position: absolute; inset-inline-start: .85rem; top: 50%; transform: translateY(-50%); pointer-events: none; color: var(--muted); }
.plaza-filters .search-box button { position: absolute; inset: 0 0 0 auto; width: 44px; display: grid; place-items: center; color: var(--muted); border-radius: 10px; }
@media (max-width: 720px) {
  .plaza-filters[data-slot="card"] { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .75rem; padding: 1rem; }
}
</style>
