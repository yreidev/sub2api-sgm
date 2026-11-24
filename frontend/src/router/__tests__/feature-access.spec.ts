import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

type NavigationGuard = (
  to: Record<string, any>,
  from: Record<string, any>,
  next: ReturnType<typeof vi.fn>
) => Promise<void>

const routerHarness = vi.hoisted(() => ({
  guard: null as NavigationGuard | null,
}))

const authStore = vi.hoisted(() => ({
  checkAuth: vi.fn().mockResolvedValue(undefined),
  isAuthenticated: true,
  isAdmin: false,
  isSimpleMode: false,
  hasPendingAuthSession: false,
}))

const appStore = vi.hoisted(() => ({
  siteName: 'Sub2API',
  backendModeEnabled: false,
  publicSettingsLoaded: false,
  cachedPublicSettings: null as null | {
    payment_enabled?: boolean
    risk_control_enabled?: boolean
    subscription_enabled?: boolean
    model_plaza_enabled?: boolean
    model_plaza_require_auth?: boolean
    custom_menu_items?: []
  },
  fetchPublicSettings: vi.fn(),
}))

vi.mock('vue-router', () => ({
  createWebHistory: vi.fn(() => ({})),
  createRouter: vi.fn(() => ({
    beforeEach: vi.fn((guard: NavigationGuard) => {
      routerHarness.guard = guard
    }),
    afterEach: vi.fn(),
    onError: vi.fn(),
  })),
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => authStore,
}))

vi.mock('@/stores/app', () => ({
  useAppStore: () => appStore,
}))

vi.mock('@/stores/adminSettings', () => ({
  useAdminSettingsStore: () => ({ customMenuItems: [] }),
}))

vi.mock('@/stores/adminCompliance', () => ({
  useAdminComplianceStore: () => ({
    initialized: true,
    fetchStatus: vi.fn(),
    requireAcknowledgement: vi.fn(),
  }),
}))

vi.mock('@/composables/useNavigationLoading', () => ({
  useNavigationLoadingState: () => ({
    startNavigation: vi.fn(),
    endNavigation: vi.fn(),
    isLoading: { value: false },
  }),
}))

vi.mock('@/composables/useRoutePrefetch', () => ({
  useRoutePrefetch: () => ({
    triggerPrefetch: vi.fn(),
    cancelPendingPrefetch: vi.fn(),
    resetPrefetchState: vi.fn(),
  }),
}))

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise
  })
  return { promise, resolve }
}

function runGuard(meta: Record<string, unknown>, path: string, name = 'FeatureRoute', query = {}) {
  if (!routerHarness.guard) {
    throw new Error('router guard was not registered')
  }

  const next = vi.fn()
  const navigation = routerHarness.guard(
    {
      path,
      fullPath: path,
      name, query,
      params: {},
      meta: { requiresAuth: true, ...meta },
    },
    {},
    next
  )
  return { navigation, next }
}

describe('feature route guard', () => {
  beforeAll(async () => {
    await import('@/router')
  })

  beforeEach(() => {
    authStore.isAuthenticated = true
    authStore.isAdmin = true
    authStore.isSimpleMode = false
    authStore.hasPendingAuthSession = false
    appStore.backendModeEnabled = false
    appStore.publicSettingsLoaded = false
    appStore.cachedPublicSettings = null
    appStore.fetchPublicSettings.mockReset()
  })

  it.each(['/usage', '/keys', '/orders', '/profile', '/dashboard/standard', '/admin/users', '/payment/qrcode'])(
    'restricts %s to administrators', async (path) => {
      authStore.isAdmin = false
      const user = runGuard({}, path)
      await user.navigation
      expect(user.next).toHaveBeenCalledWith('/dashboard')
      authStore.isAdmin = true
      const admin = runGuard({}, path)
      await admin.navigation
      expect(admin.next).toHaveBeenCalledWith()
    })

  it.each([
    ['/dashboard', 'Dashboard', true], ['/oauth/mcp/authorize', 'MCPOAuthAuthorize', true],
    ['/model-plaza', 'ModelPlaza', false],
    ['/auth/wechat/payment/callback', 'WeChatPaymentOAuthCallback', false], ['/payment/result', 'PaymentResult', false],
    ['/payment/airwallex', 'AirwallexPayment', false], ['/payment/stripe', 'StripePayment', false],
  ])('retains access to %s for regular accounts', async (path, name, requiresAuth) => {
    authStore.isAdmin = false
    const { navigation, next } = runGuard({ requiresAuth }, path, name)
    await navigation
    expect(next).toHaveBeenCalledWith()
  })

  it.each([['/home', 'Home'], ['/setup', 'Setup'], ['/key-usage', 'KeyUsage']])(
    'returns signed-in regular accounts to the home from %s', async (path, name) => {
      authStore.isAdmin = false
      const { navigation, next } = runGuard({ requiresAuth: false }, path, name)
      await navigation
      expect(next).toHaveBeenCalledWith('/dashboard')
    })

  it('returns a regular account to the home recharge dialog from the former checkout', async () => {
    authStore.isAdmin = false
    const { navigation, next } = runGuard({}, '/purchase', 'PurchaseSubscription')
    await navigation
    expect(next).toHaveBeenCalledWith({ path: '/dashboard', query: { recharge: '1' }, replace: true })
  })

  it('preserves a legacy WeChat callback when moving checkout into the home dialog', async () => {
    authStore.isAdmin = false
    const query = { wechat_resume: '1', wechat_resume_token: 'test-token' }
    const { navigation, next } = runGuard({}, '/purchase', 'PurchaseSubscription', query)
    await navigation
    expect(next).toHaveBeenCalledWith({ path: '/dashboard', query: { ...query, recharge: '1' }, replace: true })
  })

  it('waits for the first public-settings request before deciding payment access', async () => {
    const deferred = createDeferred<{ payment_enabled: boolean }>()
    appStore.fetchPublicSettings.mockImplementation(async () => {
      const settings = await deferred.promise
      appStore.cachedPublicSettings = settings
      appStore.publicSettingsLoaded = true
      return settings
    })

    const { navigation, next } = runGuard({ requiresPayment: true }, '/purchase')

    await vi.waitFor(() => expect(appStore.fetchPublicSettings).toHaveBeenCalledTimes(1))
    expect(next).not.toHaveBeenCalled()

    deferred.resolve({ payment_enabled: true })
    await navigation
    expect(next).toHaveBeenCalledOnce()
    expect(next).toHaveBeenCalledWith()
  })

  it.each([
    ['payment', { requiresPayment: true }, '/purchase'],
    ['risk control', { requiresRiskControl: true }, '/admin/risk-control'],
    ['subscription', { requiresSubscription: true }, '/subscriptions'],
  ])('does not treat a failed %s settings load as explicitly disabled', async (_name, meta, path) => {
    appStore.fetchPublicSettings.mockResolvedValue(null)

    const { navigation, next } = runGuard(meta, path)
    await navigation

    expect(appStore.publicSettingsLoaded).toBe(false)
    expect(next).toHaveBeenCalledOnce()
    expect(next).toHaveBeenCalledWith()
  })

  it.each([
    ['payment', { requiresPayment: true }, { payment_enabled: false }, '/admin/dashboard'],
    [
      'risk control',
      { requiresRiskControl: true },
      { risk_control_enabled: false },
      '/admin/settings',
    ],
    ['subscription', { requiresSubscription: true }, { subscription_enabled: false }, '/admin/dashboard'],
  ])('redirects when loaded settings explicitly disable %s', async (_name, meta, settings, target) => {
    appStore.cachedPublicSettings = settings
    appStore.publicSettingsLoaded = true

    const { navigation, next } = runGuard(meta, '/feature')
    await navigation

    expect(appStore.fetchPublicSettings).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalledOnce()
    expect(next).toHaveBeenCalledWith(target)
  })
})

describe('subscription route guard (opt-out flag)', () => {
  beforeEach(() => {
    authStore.isAuthenticated = true
    authStore.isAdmin = true
    authStore.isSimpleMode = false
    authStore.hasPendingAuthSession = false
    appStore.backendModeEnabled = false
    appStore.publicSettingsLoaded = true
    appStore.fetchPublicSettings.mockReset()
  })

  it.each([
    ['missing key', {}],
    ['explicit true', { subscription_enabled: true }],
  ])('lets /subscriptions through when the flag is %s', async (_name, settings) => {
    appStore.cachedPublicSettings = settings

    const { navigation, next } = runGuard({ requiresSubscription: true }, '/subscriptions')
    await navigation

    expect(next).toHaveBeenCalledOnce()
    expect(next).toHaveBeenCalledWith()
  })

  it('sends admins to the admin dashboard when subscriptions are disabled', async () => {
    authStore.isAdmin = true
    appStore.cachedPublicSettings = { subscription_enabled: false }

    const { navigation, next } = runGuard({ requiresSubscription: true }, '/subscriptions')
    await navigation

    expect(next).toHaveBeenCalledWith('/admin/dashboard')
  })
})

describe('model plaza route guard', () => {
  beforeEach(() => {
    authStore.isAuthenticated = false
    authStore.isAdmin = false
    authStore.isSimpleMode = false
    authStore.hasPendingAuthSession = false
    appStore.backendModeEnabled = false
    appStore.publicSettingsLoaded = true
    appStore.cachedPublicSettings = { model_plaza_enabled: true }
    appStore.fetchPublicSettings.mockReset()
  })

  it.each([
    ['/model-plaza', false, false, '/home'],
    ['/model-plaza/', false, false, '/home'],
    ['/model-plaza', true, false, '/dashboard'],
    ['/model-plaza/', true, false, '/dashboard'],
    ['/model-plaza', true, true, '/admin/dashboard'],
    ['/model-plaza/', true, true, '/admin/dashboard'],
  ])(
    'redirects %s when model_plaza_enabled is false (auth=%s, admin=%s -> %s)',
    async (path, isAuthenticated, isAdmin, target) => {
      authStore.isAuthenticated = isAuthenticated
      authStore.isAdmin = isAdmin
      appStore.cachedPublicSettings = { model_plaza_enabled: false }

      const { navigation, next } = runGuard({ requiresAuth: false }, path, 'ModelPlaza')
      await navigation

      expect(next).toHaveBeenCalledOnce()
      expect(next).toHaveBeenCalledWith(target)
    }
  )

  it.each(['/model-plaza', '/model-plaza/'])(
    'redirects guests on %s to /login with redirect query when model_plaza_require_auth is true',
    async (path) => {
      authStore.isAuthenticated = false
      authStore.isAdmin = false
      appStore.cachedPublicSettings = {
        model_plaza_enabled: true,
        model_plaza_require_auth: true,
      }

      const { navigation, next } = runGuard({ requiresAuth: false }, path, 'ModelPlaza')
      await navigation

      expect(next).toHaveBeenCalledOnce()
      expect(next).toHaveBeenCalledWith({ path: '/login', query: { redirect: path } })
    }
  )

  it.each(['/model-plaza', '/model-plaza/'])(
    'allows signed-in regular users on %s when model_plaza_require_auth is true',
    async (path) => {
      authStore.isAuthenticated = true
      authStore.isAdmin = false
      appStore.cachedPublicSettings = {
        model_plaza_enabled: true,
        model_plaza_require_auth: true,
      }

      const { navigation, next } = runGuard({ requiresAuth: false }, path, 'ModelPlaza')
      await navigation

      expect(next).toHaveBeenCalledOnce()
      expect(next).toHaveBeenCalledWith()
    }
  )

  it.each([
    ['/model-plaza', true],
    ['/model-plaza/', true],
    ['/model-plaza', false],
    ['/model-plaza/', false],
  ])(
    'redirects signed-in regular users on %s directly to /login in backend mode (enabled=%s)',
    async (path, enabled) => {
      authStore.isAuthenticated = true
      authStore.isAdmin = false
      appStore.backendModeEnabled = true
      appStore.cachedPublicSettings = { model_plaza_enabled: enabled }

      const { navigation, next } = runGuard({ requiresAuth: false }, path, 'ModelPlaza')
      await navigation

      expect(next).toHaveBeenCalledOnce()
      expect(next).toHaveBeenCalledWith('/login')
    }
  )

  it.each(['/model-plaza', '/model-plaza/'])(
    'allows admins on %s in backend mode when model plaza is enabled',
    async (path) => {
      authStore.isAuthenticated = true
      authStore.isAdmin = true
      appStore.backendModeEnabled = true
      appStore.cachedPublicSettings = { model_plaza_enabled: true }

      const { navigation, next } = runGuard({ requiresAuth: false }, path, 'ModelPlaza')
      await navigation

      expect(next).toHaveBeenCalledOnce()
      expect(next).toHaveBeenCalledWith()
    }
  )
})
