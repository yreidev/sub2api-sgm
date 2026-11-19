import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import type { ConfigurationProps } from '@/components/assistant/AssistantConfiguration'
import AssistantSetupCard from '../AssistantSetupCard.vue'

const { ensureAssistant, getAssistant, listAssistantModels, render, unmount } = vi.hoisted(() => ({
  ensureAssistant: vi.fn(),
  getAssistant: vi.fn(),
  listAssistantModels: vi.fn(),
  render: vi.fn<(element: { props: ConfigurationProps }) => void>(),
  unmount: vi.fn()
}))

vi.mock('react-dom/client', () => ({ createRoot: () => ({ render, unmount }) }))
vi.mock('@/components/assistant/AssistantConfiguration', () => ({ AssistantConfiguration: () => null }))
vi.mock('@/api/keys', () => ({ keysAPI: { ensureAssistant, getAssistant, listAssistantModels } }))
vi.mock('@/composables/useClipboard', () => ({ useClipboard: () => ({ copyToClipboard: vi.fn() }) }))
vi.mock('@/stores/app', () => ({
  useAppStore: () => ({ cachedPublicSettings: { api_base_url: 'https://sgm.example/v1/' } })
}))
vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string, args?: { model: string }) => args ? key + ' ' + args.model : key })
}))

const current = () => render.mock.lastCall![0].props
const key = 'test-project-key'

async function show(balance: number) {
  const wrapper = mount(AssistantSetupCard, { props: { balance } })
  await flushPromises()
  return wrapper
}

describe('AssistantSetupCard', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    ensureAssistant.mockResolvedValue(key)
    getAssistant.mockResolvedValue(null)
    listAssistantModels.mockResolvedValue(['gpt-6.2-sol', 'gpt-6-astra', 'gpt-6.2-astra', 'gpt-5.6-terra'])
  })

  it('shows an already issued key on entry without requesting a new one', async () => {
    getAssistant.mockResolvedValue(key)
    const wrapper = await show(0)
    expect(getAssistant).toHaveBeenCalledOnce()
    expect(current().projectKey).toBe(key)
    expect(ensureAssistant).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('only requests the fixed key on click, including when the existing user has no balance', async () => {
    const wrapper = await show(0)
    expect(current().balanceHint).toBe('dashboard.assistantSetup.addBalance')
    expect(ensureAssistant).not.toHaveBeenCalled()
    current().acquireKey()
    await flushPromises()
    expect(ensureAssistant).toHaveBeenCalledWith(false)
    expect(current().projectKey).toBe(key)
    wrapper.unmount()
    expect(unmount).toHaveBeenCalledOnce()
  })

  it('puts Astra first and updates the copy action when another model is selected', async () => {
    const wrapper = await show(10)
    expect(current().models).toEqual(['gpt-6.2-astra', 'gpt-6-astra', 'gpt-6.2-sol', 'gpt-5.6-terra'])
    expect(current().model).toBe('gpt-6.2-astra')
    current().changeModel('gpt-5.6-terra')
    await flushPromises()
    expect(current().copyModelLabel).toBe('dashboard.assistantSetup.copyModel gpt-5.6-terra')
    expect(current().apiUrl).toBe('https://sgm.example/v1')
    wrapper.unmount()
  })

  it('retries a failed model catalog without obtaining a key', async () => {
    listAssistantModels.mockRejectedValueOnce(new Error('offline'))
    const wrapper = await show(0)
    expect(current().models).toEqual([])
    expect(current().retryModelsLabel).toBe('dashboard.assistantSetup.retryModels')
    current().loadModels()
    await flushPromises()
    expect(current().model).toBe('gpt-6.2-astra')
    expect(ensureAssistant).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('reports an inactive key without automatically creating a replacement', async () => {
    ensureAssistant.mockRejectedValue({ reason: 'ASSISTANT_KEY_INACTIVE' })
    const wrapper = await show(10)
    current().acquireKey()
    await flushPromises()
    expect(current().error).toBe('dashboard.assistantSetup.inactiveKey')
    expect(ensureAssistant).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it('requires an explicit second click to replace a deleted key', async () => {
    ensureAssistant.mockRejectedValueOnce({ reason: 'ASSISTANT_KEY_DELETED' })
    const wrapper = await show(10)
    current().acquireKey()
    await flushPromises()
    expect(current().error).toBe('dashboard.assistantSetup.replaceKeyHint')
    expect(ensureAssistant.mock.calls).toEqual([[false]])
    current().acquireKey()
    await flushPromises()
    expect(ensureAssistant.mock.calls).toEqual([[false], [true]])
    wrapper.unmount()
  })
})
