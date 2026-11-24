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
.plaza-filters.plaza-filters[data-slot="card"] {
  --field-border: var(--field-line);
  --field-border-hover: var(--field-line-hover, #5c767b);
  --field-border-focus: var(--focus);
  --color-field: var(--field);
  --color-field-hover: var(--panel-subtle, #f7fafa);
  --field-focus: var(--field);
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) repeat(3, minmax(0, 1fr));
  gap: 1rem;
  padding: 1.25rem;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 18px;
  box-shadow: var(--shadow-card, 0 1px 2px rgb(22 43 52 / 5%), 0 4px 12px -2px rgb(22 43 52 / 5%));
}
.plaza-filters > [data-slot] {
  display: grid;
  min-width: 0;
  gap: .375rem;
  font-size: .875rem;
  font-weight: 500;
  color: var(--ink);
}
.plaza-filters [data-slot="label"] {
  font-size: .875rem;
  font-weight: 500;
  line-height: 1.4;
  color: var(--ink);
}
.plaza-filters input[data-slot="input"],
.plaza-filters [data-slot="select-trigger"] {
  width: 100%;
  min-width: 0;
  min-height: 44px;
  border: 1px solid var(--field-line);
  border-radius: 10px;
  background-color: var(--field);
  color: var(--ink);
  font: inherit;
  font-size: .9375rem;
  font-weight: 400;
  font-variant-numeric: tabular-nums;
  box-shadow: var(--shadow-xs, 0 1px 2px rgb(22 43 52 / 5%));
  transition:
    border-color var(--duration-fast, 150ms) var(--ease-out, cubic-bezier(0.22, 1, 0.36, 1)),
    background-color var(--duration-fast, 150ms) var(--ease-out, cubic-bezier(0.22, 1, 0.36, 1)),
    box-shadow var(--duration-fast, 150ms) var(--ease-out, cubic-bezier(0.22, 1, 0.36, 1));
}
@media (hover: hover) {
  .plaza-filters input[data-slot="input"]:hover:not(:focus):not(:focus-visible),
  .plaza-filters [data-slot="select-trigger"]:hover:not(:focus-visible):not([data-open="true"]) {
    border-color: var(--field-line-hover, #5c767b);
    background-color: var(--panel-subtle, #f7fafa);
  }
}
.plaza-filters input[data-slot="input"]:focus,
.plaza-filters input[data-slot="input"]:focus-visible,
.plaza-filters input[data-slot="input"][data-focused="true"],
.plaza-filters [data-slot="select-trigger"]:focus-visible,
.plaza-filters [data-slot="select-trigger"][data-focus-visible="true"],
.plaza-filters [data-slot="select-trigger"][data-open="true"] {
  border-color: var(--focus);
  background-color: var(--field);
  box-shadow: var(--ring-focus, 0 0 0 3px rgb(18 108 122 / 18%));
  outline: 2px solid transparent;
}
.plaza-filters [data-slot="select-trigger"] {
  padding-inline: .75rem 2rem;
}
.plaza-filters [data-slot="select-value"] {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.plaza-filters [data-slot="select-indicator"] {
  color: var(--muted);
  transition:
    transform var(--duration-fast, 150ms) var(--ease-out, cubic-bezier(0.22, 1, 0.36, 1)),
    color var(--duration-fast, 150ms) var(--ease-out, cubic-bezier(0.22, 1, 0.36, 1));
}
.plaza-filters [data-slot="select-trigger"]:hover [data-slot="select-indicator"],
.plaza-filters [data-slot="select-trigger"][data-open="true"] [data-slot="select-indicator"] {
  color: var(--ink);
}
.plaza-filters .search-box {
  position: relative;
}
.plaza-filters .search-box input[data-slot="input"] {
  padding-inline: 2.5rem 2.75rem;
}
.plaza-filters .search-box input[data-slot="input"]:placeholder-shown {
  padding-inline-end: .75rem;
}
.plaza-filters .search-box input[data-slot="input"]::placeholder {
  color: var(--muted);
}
.plaza-filters .search-box > svg {
  position: absolute;
  inset-inline-start: .85rem;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: var(--muted);
  transition: color var(--duration-fast, 150ms) var(--ease-out, cubic-bezier(0.22, 1, 0.36, 1));
}
.plaza-filters .search-box:focus-within > svg {
  color: var(--accent);
}
.plaza-filters .search-box button {
  position: absolute;
  inset: 0 0 0 auto;
  width: 44px;
  min-height: 44px;
  display: grid;
  place-items: center;
  color: var(--muted);
  border-radius: 10px;
  transition:
    color var(--duration-fast, 150ms) var(--ease-out, cubic-bezier(0.22, 1, 0.36, 1)),
    background-color var(--duration-fast, 150ms) var(--ease-out, cubic-bezier(0.22, 1, 0.36, 1)),
    transform var(--duration-fast, 150ms) var(--ease-out, cubic-bezier(0.22, 1, 0.36, 1));
}
@media (hover: hover) {
  .plaza-filters .search-box button:hover {
    color: var(--ink);
    background-color: var(--tint);
  }
}
.plaza-filters .search-box button:active {
  transform: scale(0.96);
}
.plaza-filters .search-box button:focus-visible,
.plaza-filters .search-box button[data-focus-visible="true"] {
  outline: 2px solid var(--focus);
  outline-offset: -2px;
  box-shadow: none;
}
.plaza-filter-menu [role="option"] {
  font-variant-numeric: tabular-nums;
}
@media (max-width: 720px) {
  .plaza-filters.plaza-filters[data-slot="card"] {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: .75rem;
    padding: 1rem;
  }
  .plaza-filters > :first-child {
    grid-column: 1 / -1;
  }
}
@media (prefers-reduced-motion: reduce) {
  .plaza-filters input[data-slot="input"],
  .plaza-filters [data-slot="select-trigger"],
  .plaza-filters [data-slot="select-indicator"],
  .plaza-filters .search-box > svg,
  .plaza-filters .search-box button {
    transition: none;
  }
  .plaza-filters .search-box button:active,
  .plaza-filters .search-box button[data-pressed="true"] {
    transform: none;
  }
}
</style>
