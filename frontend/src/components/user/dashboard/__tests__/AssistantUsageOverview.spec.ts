import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { describe, expect, it, vi } from 'vitest'
import AssistantUsageOverview from '../AssistantUsageOverview.vue'
import en from '@/i18n/locales/en'
import type { UsageLog } from '@/types'

const { getStats, list } = vi.hoisted(() => ({ getStats: vi.fn(), list: vi.fn() }))
vi.mock('@/api/usage', () => ({ usageAPI: { getStats, list } }))

const record: UsageLog = {
  id: 1, model: 'sample-model', actual_cost: 0.00012, total_cost: 2, created_at: '2026-11-18T12:15:00Z',
  request_id: 'req-demo', inbound_endpoint: '/v1/responses', duration_ms: 120,
  input_tokens: 100, output_tokens: 20, cache_read_tokens: 6, cache_creation_tokens: 0,
  user_id: 7, api_key_id: 1, account_id: null, group_id: null, subscription_id: null,
  cache_creation_5m_tokens: 0, cache_creation_1h_tokens: 0,
  input_cost: 1, output_cost: 1, cache_creation_cost: 0, cache_read_cost: 0,
  rate_multiplier: 1, long_context_billing_applied: false, billing_type: 0,
  stream: false, native_compaction_v2: false, first_token_ms: null,
  image_count: 0, image_size: null, image_input_size: null, image_output_size: null,
  image_size_source: null, image_size_breakdown: null,
  image_input_tokens: 0, image_output_tokens: 0, image_input_cost: 0, image_output_cost: 0,
  user_agent: null, cache_ttl_overridden: false,
}

function mountOverview() {
  return mount(AssistantUsageOverview, {
    global: {
      plugins: [createI18n({ legacy: false, locale: 'en', messages: { en } })],
    },
  })
}

describe('AssistantUsageOverview', () => {
  it('shows today’s actual cost, recent requests and their details on the same page', async () => {
    getStats.mockResolvedValueOnce({ total_actual_cost: 0.01234, total_cost: 5, total_requests: 42, total_tokens: 13210 })
    list.mockResolvedValueOnce({ items: [record], page: 1, page_size: 5, pages: 1, total: 1 })
    const view = mountOverview()
    await flushPromises()
    expect(getStats).toHaveBeenCalledWith('today')
    expect(list).toHaveBeenCalledWith(1, 5)
    expect(view.findAll('.sgm-usage-metrics dd').map(item => item.text())).toEqual(['$0.01234', '42', '13,210'])
    expect(view.get('li').text()).toContain('sample-model')
    expect(view.get('li').text()).toContain('$0.00012')
    expect(view.get('time').attributes('datetime')).toBe('2026-11-18T12:15:00Z')
    await view.get('[data-slot="disclosure-trigger"]').trigger('click')
    await flushPromises()
    expect(view.get('[data-slot="disclosure-trigger"]').attributes('aria-expanded')).toBe('true')
    expect(view.findAll('.sgm-usage-details dd').map(item => item.text())).toEqual([
      'req-demo', '/v1/responses', '120 ms', '100', '20', '6', '0', '$0.00012',
    ])
    expect(view.find('a').exists()).toBe(false)
    view.unmount()
  })

  it('pages through all requests in place, retries the current page, and collapses to five', async () => {
    getStats.mockResolvedValue({ total_actual_cost: 1, total_requests: 21, total_tokens: 140 })
    list.mockImplementation(async (page: number, size: number) => ({
      page, page_size: size, pages: Math.ceil(21 / size), total: 21,
      items: Array.from({ length: Math.min(size, 21 - (page - 1) * size) }, (_, index) => ({
        ...record, id: (page - 1) * size + index + 1,
      })),
    }))
    const view = mountOverview()
    await flushPromises()
    const toggle = view.get('button[aria-expanded]')
    await toggle.trigger('click')
    await flushPromises()
    expect(view.findAll('[data-slot="disclosure-trigger"]')).toHaveLength(20)
    expect(view.get('nav button').element.hasAttribute('disabled')).toBe(true)
    list.mockRejectedValueOnce(new Error('unavailable'))
    await view.findAll('nav button')[1].trigger('click')
    await flushPromises()
    expect(view.get('[role=alert]').text()).toBe(en.usage.failedToLoad)
    await view.get('button').trigger('click')
    await flushPromises()
    expect(list).toHaveBeenLastCalledWith(2, 20)
    expect(view.findAll('[data-slot="disclosure-trigger"]')).toHaveLength(1)
    expect(view.findAll('nav button')[1].element.hasAttribute('disabled')).toBe(true)
    await view.get('nav button').trigger('click')
    await flushPromises()
    expect(list).toHaveBeenLastCalledWith(1, 20)
    await toggle.trigger('click')
    await flushPromises()
    expect(list).toHaveBeenLastCalledWith(1, 5)
    expect(view.findAll('[data-slot="disclosure-trigger"]')).toHaveLength(5)
    expect(view.find('nav').exists()).toBe(false)
    view.unmount()
  })

  it('keeps empty history distinct from failed totals and supports retry', async () => {
    getStats.mockRejectedValueOnce(new Error('unavailable'))
    list.mockResolvedValue({ items: [] })
    const view = mountOverview()
    await flushPromises()
    expect(view.find('dl').exists()).toBe(false)
    expect(view.get('[role=alert]').text()).toBe(en.dashboard.assistantSetup.usageStatsError)
    expect(view.text()).toContain(en.dashboard.noUsageRecords)
    getStats.mockResolvedValueOnce({ total_actual_cost: 0, total_requests: 0, total_tokens: 0 })
    list.mockRejectedValueOnce(new Error('unavailable'))
    await view.get('button').trigger('click')
    await flushPromises()
    expect(view.findAll('.sgm-usage-metrics dd').map(item => item.text())).toEqual(['$0.00', '0', '0'])
    expect(view.get('[role=alert]').text()).toBe(en.usage.failedToLoad)
    expect(view.text()).not.toContain(en.dashboard.noUsageRecords)
    view.unmount()
  })
})
