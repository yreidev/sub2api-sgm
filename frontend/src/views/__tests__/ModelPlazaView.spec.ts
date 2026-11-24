import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils'
import { beforeEach, expect, it, vi } from 'vitest'
import PublicLayout from '@/components/layout/PublicLayout.vue'
import ModelPlazaContent from '@/components/modelPlaza/ModelPlazaContent.vue'
import ModelPlazaView from '../ModelPlazaView.vue'

const { getModelPlaza, routeState, authState } = vi.hoisted(() => ({
  getModelPlaza: vi.fn(),
  routeState: { query: { embedded: '1' } as Record<string, string> },
  authState: { isAuthenticated: false, isAdmin: false },
}))

vi.mock('@/api/modelPlaza', () => ({ getModelPlaza }))
vi.mock('vue-router', () => ({ useRoute: () => routeState }))
vi.mock('@/components/layout/AppLayout.vue', () => ({
  __esModule: true,
  default: { name: 'AppLayout', template: '<div data-test="app-layout"><slot /></div>' },
}))
vi.mock('@/components/hero/HeroLocaleMenu.vue', () => ({ default: { template: '<span />' } }))
vi.mock('@/components/modelPlaza/PlazaGroupSection.vue', () => ({
  default: { props: ['group'], template: '<section>{{ group.name }}</section>' },
}))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))
vi.mock('@/stores', () => ({ useAppStore: () => ({ siteName: 'Example' }) }))
vi.mock('@/stores/auth', () => ({ useAuthStore: () => authState }))

beforeEach(() => {
  getModelPlaza.mockReset()
  routeState.query = { embedded: '1' }
  authState.isAuthenticated = false
  authState.isAdmin = false
})

it('opens a shared link in the visitor layout, retries the catalog and filters numeric rates and groups', async () => {
  const group = (id: number, platform: string, rate: number) => ({
    id, name: 'Group ' + id, platform, rate_multiplier: rate, models: [{ name: 'model-' + id }],
  })
  getModelPlaza.mockRejectedValueOnce(new Error('catalog unavailable')).mockResolvedValueOnce({
    groups: [group(1, 'openai', 0.5), group(2, 'gemini', 1)],
  })
  const view = mount(ModelPlazaView, { attachTo: document.body, global: { stubs: { RouterLink: RouterLinkStub, Icon: true } } })
  await flushPromises()
  expect(view.getComponent(PublicLayout).findComponent(RouterLinkStub).props('to')).toBe('/home')
  const accountLink = view.findAllComponents(RouterLinkStub).find(link => link.classes('plaza-account-link'))
  expect(accountLink?.props('to')).toEqual({ path: '/login', query: { redirect: '/model-plaza' } })
  expect(accountLink?.text()).toBe('modelPlaza.nav.login')
  expect(view.get('h1').text()).toBe('modelPlaza.title')
  expect(view.get('[role=alert]').text()).toBe('modelPlaza.loadFailed')
  await view.get('.plaza-retry').trigger('click')
  await flushPromises()
  const [, groupId, rate] = view.findAll('select')
  await rate.setValue('0.5')
  expect(view.findAll('section').map(item => item.text())).toEqual(['Group 1'])
  await view.get('[data-slot="select-trigger"]').trigger('click')
  await flushPromises()
  const blocked = document.querySelector('[role="option"][data-key="gemini"]')
  expect(blocked?.getAttribute('aria-disabled')).toBe('true')
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  await flushPromises()
  await rate.setValue('all')
  await groupId.setValue('2')
  expect(view.findAll('section').map(item => item.text())).toEqual(['Group 2'])
  const search = view.get('#plaza-model-search')
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(search.element, 'missing')
  await search.trigger('input')
  expect(view.get('[role=status]').text()).toBe('modelPlaza.noSearchResult')
  await view.get('.search-box button').trigger('click')
  expect(view.get('section').text()).toBe('Group 2')
  expect(getModelPlaza).toHaveBeenCalledTimes(2)
  view.unmount()
})

it('shows back-to-dashboard link to /dashboard and ignores ?embedded=1 for signed-in regular users', async () => {
  authState.isAuthenticated = true
  authState.isAdmin = false
  routeState.query = { embedded: '1' }
  getModelPlaza.mockResolvedValueOnce({ groups: [] })

  const view = mount(ModelPlazaView, {
    attachTo: document.body,
    global: { stubs: { RouterLink: RouterLinkStub, Icon: true } },
  })
  await flushPromises()

  expect(view.findComponent(PublicLayout).exists()).toBe(true)
  expect(view.find('[data-test="app-layout"]').exists()).toBe(false)
  expect(view.getComponent(ModelPlazaContent).props('embedded')).toBe(false)
  const accountLink = view.findAllComponents(RouterLinkStub).find(link => link.classes('plaza-account-link'))
  expect(accountLink?.props('to')).toBe('/dashboard')
  expect(accountLink?.text()).toBe('modelPlaza.nav.backToDashboard')
  view.unmount()
})

it('links standalone admins to /admin/dashboard and respects ?embedded=1 for admins', async () => {
  authState.isAuthenticated = true
  authState.isAdmin = true
  routeState.query = {}
  getModelPlaza.mockResolvedValue({ groups: [] })

  const standalone = mount(ModelPlazaView, {
    attachTo: document.body,
    global: { stubs: { RouterLink: RouterLinkStub, Icon: true } },
  })
  await flushPromises()

  expect(standalone.findComponent(PublicLayout).exists()).toBe(true)
  expect(standalone.find('[data-test="app-layout"]').exists()).toBe(false)
  expect(standalone.getComponent(ModelPlazaContent).props('embedded')).toBe(false)
  const adminLink = standalone.findAllComponents(RouterLinkStub).find(link => link.classes('plaza-account-link'))
  expect(adminLink?.props('to')).toBe('/admin/dashboard')
  expect(adminLink?.text()).toBe('modelPlaza.nav.backToDashboard')
  standalone.unmount()

  routeState.query = { embedded: '1' }
  const embedded = mount(ModelPlazaView, {
    attachTo: document.body,
    global: { stubs: { RouterLink: RouterLinkStub, Icon: true } },
  })
  await flushPromises()

  expect(embedded.find('[data-test="app-layout"]').exists()).toBe(true)
  expect(embedded.findComponent(PublicLayout).exists()).toBe(false)
  expect(embedded.find('.plaza-account-link').exists()).toBe(false)
  expect(embedded.getComponent(ModelPlazaContent).props('embedded')).toBe(true)
  expect(embedded.find('h1').exists()).toBe(false)
  embedded.unmount()
})
