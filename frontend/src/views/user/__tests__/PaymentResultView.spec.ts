import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

const routeState = vi.hoisted(() => ({
  query: {} as Record<string, unknown>,
}))

const routerPush = vi.hoisted(() => vi.fn())
const pollOrderStatus = vi.hoisted(() => vi.fn())
const verifyOrder = vi.hoisted(() => vi.fn())
const verifyOrderPublic = vi.hoisted(() => vi.fn())
const resolveOrderPublicByResumeToken = vi.hoisted(() => vi.fn())
const session = vi.hoisted(() => ({ isAuthenticated: false, isAdmin: false, user: { id: 9 } }))
const refreshUser = vi.hoisted(() => vi.fn())

vi.mock('vue-router', async () => {
  const actual = await vi.importActual<typeof import('vue-router')>('vue-router')
  return {
    ...actual,
    useRoute: () => routeState,
    useRouter: () => ({ push: routerPush }),
  }
})

vi.mock('vue-i18n', async () => {
  const actual = await vi.importActual<typeof import('vue-i18n')>('vue-i18n')
  return {
    ...actual,
    useI18n: () => ({
      t: (key: string) => key,
    }),
  }
})

vi.mock('@/stores/payment', () => ({
  usePaymentStore: () => ({
    pollOrderStatus,
  }),
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    refreshUser,
    ...session,
  }),
}))

vi.mock('@/api/payment', () => ({
  paymentAPI: {
    verifyOrder,
    verifyOrderPublic,
    resolveOrderPublicByResumeToken,
  },
}))

import PaymentResultView from '../PaymentResultView.vue'
import { assistantPaymentStorageKey, PAYMENT_RECOVERY_STORAGE_KEY } from '@/components/payment/paymentFlow'
import { formatPaymentAmount } from '@/components/payment/currency'

const orderFactory = (status: string) => ({
  id: 42,
  user_id: 9,
  amount: 88,
  pay_amount: 88,
  fee_rate: 0,
  payment_type: 'alipay',
  out_trade_no: 'sub2_20260420abcd1234',
  status,
  order_type: 'balance',
  created_at: '2026-04-20T12:00:00Z',
  expires_at: '2026-04-20T12:30:00Z',
  refund_amount: 0,
})

const recoverySnapshotFactory = (resumeToken: string) => ({
  orderId: 42,
  amount: 88,
  qrCode: '',
  expiresAt: '2099-01-01T00:10:00.000Z',
  paymentType: 'alipay',
  payUrl: 'https://pay.example.com/session/42',
  outTradeNo: 'sub2_20260420abcd1234',
  clientSecret: '',
  intentId: '',
  currency: '',
  countryCode: '',
  paymentEnv: '',
  payAmount: 88,
  orderType: 'balance',
  paymentMode: 'popup',
  resumeToken,
  createdAt: Date.UTC(2099, 0, 1, 0, 0, 0),
})

describe('PaymentResultView', () => {
  beforeEach(() => {
    routeState.query = {}
    session.isAuthenticated = false
    session.isAdmin = false
    session.user.id = 9
    routerPush.mockReset()
    pollOrderStatus.mockReset()
    verifyOrder.mockReset()
    verifyOrderPublic.mockReset()
    resolveOrderPublicByResumeToken.mockReset()
    refreshUser.mockReset()
    refreshUser.mockResolvedValue({})
    window.localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it.each([false, true])('offers the correct destination after snapshot cleanup (admin=%s)', async (admin) => {
    session.isAuthenticated = true
    session.isAdmin = admin
    routeState.query = { order_id: '42' }
    pollOrderStatus.mockResolvedValue(orderFactory('COMPLETED'))
    const view = mount(PaymentResultView)
    await flushPromises()
    expect(view.text().includes('dashboard.assistantSetup.backHome')).toBe(!admin)
    expect(view.text().includes('payment.result.viewOrders')).toBe(admin)
    view.unmount()
  })

  it('keeps the admin preview destination across cleanup and refresh, scoped to account and order', async () => {
    session.isAdmin = session.isAuthenticated = true
    const key = assistantPaymentStorageKey(9)
    localStorage.setItem(key, JSON.stringify(recoverySnapshotFactory('preview-token')))
    routeState.query = { resume_token: 'preview-token' }
    resolveOrderPublicByResumeToken.mockResolvedValue({ data: orderFactory('COMPLETED') })
    const completed = mount(PaymentResultView)
    await flushPromises()
    expect(localStorage.getItem(key)).toBeNull()
    completed.unmount()

    const newer = JSON.stringify({ ...recoverySnapshotFactory('new-token'), orderId: 99, outTradeNo: 'new-order' })
    localStorage.setItem(key, newer)
    const refresh = mount(PaymentResultView)
    await flushPromises()
    await refresh.get('button').trigger('click')
    expect(routerPush).toHaveBeenCalledWith({ path: '/dashboard', query: { view: 'simple', recharge: undefined } })
    expect(localStorage.getItem(key)).toBe(newer)
    refresh.unmount()

    routeState.query = { out_trade_no: orderFactory('').out_trade_no, trade_status: 'TRADE_SUCCESS' }
    verifyOrder.mockRejectedValueOnce(new Error('authenticated verification unavailable'))
    verifyOrderPublic.mockResolvedValueOnce({ data: { out_trade_no: routeState.query.out_trade_no, status: 'REFUNDED' } })
    const refunded = mount(PaymentResultView)
    await flushPromises()
    expect(refunded.text()).toContain('payment.status.refunded')
    expect(refunded.text()).toContain('dashboard.assistantSetup.backHome')
    expect(refunded.text()).not.toContain('payment.result.failed')
    expect(localStorage.getItem(key)).toBe(newer)
    refunded.unmount()

    session.user.id = 10
    routeState.query = { resume_token: 'preview-token' }
    const otherAccount = mount(PaymentResultView)
    await flushPromises()
    expect(otherAccount.text()).toContain('payment.result.viewOrders')
    otherAccount.unmount()

    session.user.id = 9
    routeState.query = { order_id: '83' }
    pollOrderStatus.mockResolvedValue({ ...orderFactory('COMPLETED'), id: 83, out_trade_no: 'standard-order' })
    const otherOrder = mount(PaymentResultView)
    await flushPromises()
    expect(otherOrder.text()).toContain('payment.result.viewOrders')
    expect(localStorage.getItem(key)).toBe(newer)
    otherOrder.unmount()
  })

  it.each([assistantPaymentStorageKey(9), PAYMENT_RECOVERY_STORAGE_KEY])(
    'retains a charged order until fulfillment succeeds (%s)', async (key) => {
      vi.useFakeTimers()
      routeState.query = { order_id: '42', resume_token: 'sample-token' }
      localStorage.setItem(key, JSON.stringify(recoverySnapshotFactory('sample-token')))
      resolveOrderPublicByResumeToken
        .mockResolvedValueOnce({ data: { ...orderFactory('FAILED'), paid_at: '2026-04-20T12:01:00Z' } })
        .mockResolvedValueOnce({ data: orderFactory('RECHARGING') })
        .mockResolvedValueOnce({ data: orderFactory('COMPLETED') })
      const view = mount(PaymentResultView)
      await flushPromises()
      expect(view.text()).toContain('payment.result.creditFailedHint')
      expect(view.text()).not.toContain('payment.result.failed')
      expect(view.text()).not.toContain('payment.result.backToRecharge')
      expect(localStorage.getItem(key)).not.toBeNull()
      await vi.advanceTimersByTimeAsync(2000)
      expect(view.text()).toContain('payment.result.processing')
      expect(localStorage.getItem(key)).not.toBeNull()
      await vi.advanceTimersByTimeAsync(2000)
      expect(view.text()).toContain('payment.result.success')
      expect(localStorage.getItem(key)).toBeNull()
      view.unmount()
    })

  it('returns an interrupted assistant payment to the same page and retains its selected amount', async () => {
    const key = assistantPaymentStorageKey(9)
    routeState.query = { out_trade_no: 'sub2_20260420abcd1234' }
    window.localStorage.setItem(key, JSON.stringify({ ...recoverySnapshotFactory(''), requestedAmount: 50 }))
    pollOrderStatus.mockResolvedValue(orderFactory('FAILED'))

    const wrapper = mount(PaymentResultView)
    await flushPromises()

    const home = wrapper.findAll('button').find(button => button.text() === 'dashboard.assistantSetup.backHome')
    expect(home).toBeDefined()
    await home!.trigger('click')
    expect(routerPush).toHaveBeenCalledWith({ path: '/dashboard', query: { view: 'simple', recharge: '1' } })
    expect(window.localStorage.getItem(key)).toContain('"requestedAmount":50')
    expect(refreshUser).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('renders a pending state instead of a failure state when the restored order is still pending', async () => {
    routeState.query = {
      resume_token: 'resume-42',
      order_id: '999',
      status: 'success',
    }
    window.localStorage.setItem(PAYMENT_RECOVERY_STORAGE_KEY, JSON.stringify({
      orderId: 42,
      amount: 88,
      qrCode: '',
      expiresAt: '2099-01-01T00:10:00.000Z',
      paymentType: 'alipay',
      payUrl: 'https://pay.example.com/session/42',
      outTradeNo: 'sub2_20260420abcd1234',
      clientSecret: '',
      intentId: '',
      currency: '',
      countryCode: '',
      paymentEnv: '',
      payAmount: 88,
      orderType: 'balance',
      paymentMode: 'redirect',
      resumeToken: 'resume-42',
      createdAt: Date.UTC(2099, 0, 1, 0, 0, 0),
    }))
    resolveOrderPublicByResumeToken.mockResolvedValue({
      data: orderFactory('PENDING'),
    })

    const wrapper = mount(PaymentResultView, {
      global: {
        stubs: {
          OrderStatusBadge: true,
        },
      },
    })

    await flushPromises()

    expect(resolveOrderPublicByResumeToken).toHaveBeenCalledWith('resume-42')
    expect(pollOrderStatus).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('payment.result.processing')
    expect(wrapper.text()).not.toContain('payment.result.success')
    expect(wrapper.text()).not.toContain('payment.result.failed')
  })

  it('prefers the public resume-token result over a stale restored DB snapshot', async () => {
    routeState.query = {
      resume_token: 'resume-authoritative',
      order_id: '42',
      status: 'success',
    }
    window.localStorage.setItem(PAYMENT_RECOVERY_STORAGE_KEY, JSON.stringify({
      orderId: 42,
      amount: 88,
      qrCode: '',
      expiresAt: '2099-01-01T00:10:00.000Z',
      paymentType: 'alipay',
      payUrl: 'https://pay.example.com/session/42',
      outTradeNo: 'sub2_20260420abcd1234',
      clientSecret: '',
      intentId: '',
      currency: '',
      countryCode: '',
      paymentEnv: '',
      payAmount: 88,
      orderType: 'balance',
      paymentMode: 'popup',
      resumeToken: 'resume-authoritative',
      createdAt: Date.UTC(2099, 0, 1, 0, 0, 0),
    }))
    resolveOrderPublicByResumeToken.mockResolvedValue({
      data: {
        ...orderFactory('COMPLETED'),
        amount: 100,
        pay_amount: 103,
        fee_rate: 3,
      },
    })

    const wrapper = mount(PaymentResultView, {
      global: {
        stubs: {
          OrderStatusBadge: true,
        },
      },
    })

    await flushPromises()

    expect(pollOrderStatus).not.toHaveBeenCalled()
    expect(resolveOrderPublicByResumeToken).toHaveBeenCalledWith('resume-authoritative')
    expect(refreshUser).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain('payment.result.success')
    expect(wrapper.text()).toContain('103.00')
    expect(wrapper.text()).toContain('100.00')
    expect(window.localStorage.getItem(PAYMENT_RECOVERY_STORAGE_KEY)).toBeNull()
  })

  it('waits for completed fulfillment before refreshing the user balance', async () => {
    vi.useFakeTimers()
    routeState.query = {
      resume_token: 'resume-77',
    }
    window.localStorage.setItem(
      PAYMENT_RECOVERY_STORAGE_KEY,
      JSON.stringify(recoverySnapshotFactory('resume-77')),
    )
    resolveOrderPublicByResumeToken
      .mockResolvedValueOnce({
        data: orderFactory('PENDING'),
      })
      .mockResolvedValueOnce({
        data: orderFactory('COMPLETED'),
      })

    const wrapper = mount(PaymentResultView, {
      global: {
        stubs: {
          OrderStatusBadge: true,
        },
      },
    })

    await flushPromises()

    expect(resolveOrderPublicByResumeToken).toHaveBeenCalledTimes(1)
    expect(refreshUser).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('payment.result.processing')
    expect(window.localStorage.getItem(PAYMENT_RECOVERY_STORAGE_KEY)).not.toBeNull()

    await vi.advanceTimersByTimeAsync(2000)
    await flushPromises()

    expect(resolveOrderPublicByResumeToken).toHaveBeenCalledTimes(2)
    expect(refreshUser).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain('payment.result.success')
    expect(wrapper.text()).not.toContain('payment.result.failed')
    expect(window.localStorage.getItem(PAYMENT_RECOVERY_STORAGE_KEY)).toBeNull()
  })

  it('keeps the successful result when refreshing the user balance fails', async () => {
    routeState.query = {
      resume_token: 'resume-refresh-failure',
    }
    resolveOrderPublicByResumeToken.mockResolvedValue({
      data: orderFactory('COMPLETED'),
    })
    refreshUser.mockRejectedValueOnce(new Error('profile refresh failed'))

    const wrapper = mount(PaymentResultView, {
      global: {
        stubs: {
          OrderStatusBadge: true,
        },
      },
    })

    await flushPromises()

    expect(refreshUser).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain('payment.result.success')
    expect(wrapper.text()).not.toContain('payment.result.failed')
  })

  it('falls back to order_id polling when resume-token recovery fails', async () => {
    routeState.query = {
      resume_token: 'resume-fail',
      order_id: '77',
    }
    window.localStorage.setItem(
      PAYMENT_RECOVERY_STORAGE_KEY,
      JSON.stringify({
        ...recoverySnapshotFactory('resume-fail'),
        orderId: 42,
      }),
    )
    resolveOrderPublicByResumeToken.mockRejectedValueOnce(new Error('resume failed'))
    pollOrderStatus.mockResolvedValueOnce({
      ...orderFactory('PAID'),
      id: 77,
    })

    const wrapper = mount(PaymentResultView, {
      global: {
        stubs: {
          OrderStatusBadge: true,
        },
      },
    })

    await flushPromises()

    expect(resolveOrderPublicByResumeToken).toHaveBeenCalledWith('resume-fail')
    expect(pollOrderStatus).toHaveBeenCalledWith(77)
    expect(verifyOrderPublic).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('payment.result.success')
    expect(window.localStorage.getItem(PAYMENT_RECOVERY_STORAGE_KEY)).toContain('"orderId":42')
  })

  it('falls back to public out_trade_no verification when resume_token recovery fails in legacy return flows', async () => {
    routeState.query = {
      resume_token: 'resume-fail',
      out_trade_no: 'legacy-should-not-run',
      trade_status: 'TRADE_SUCCESS',
    }
    resolveOrderPublicByResumeToken.mockRejectedValueOnce(new Error('resume failed'))
    verifyOrderPublic.mockResolvedValueOnce({
      data: {
        ...orderFactory('PAID'),
        out_trade_no: 'legacy-should-not-run',
      },
    })

    const wrapper = mount(PaymentResultView, {
      global: {
        stubs: {
          OrderStatusBadge: true,
        },
      },
    })

    await flushPromises()

    expect(resolveOrderPublicByResumeToken).toHaveBeenCalledWith('resume-fail')
    expect(verifyOrderPublic).toHaveBeenCalledWith('legacy-should-not-run')
    expect(pollOrderStatus).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('payment.result.success')
  })

  it('ignores a stale global recovery snapshot when legacy return markers do not identify the order', async () => {
    routeState.query = {
      trade_status: 'TRADE_SUCCESS',
    }
    window.localStorage.setItem(
      PAYMENT_RECOVERY_STORAGE_KEY,
      JSON.stringify(recoverySnapshotFactory('resume-stale')),
    )

    const wrapper = mount(PaymentResultView, {
      global: {
        stubs: {
          OrderStatusBadge: true,
        },
      },
    })

    await flushPromises()

    expect(resolveOrderPublicByResumeToken).not.toHaveBeenCalled()
    expect(verifyOrderPublic).not.toHaveBeenCalled()
    expect(pollOrderStatus).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('payment.result.failed')
    expect(wrapper.text()).not.toContain('sub2_20260420abcd1234')
  })

  it('uses public out_trade_no verification when no signed resume context is available', async () => {
    routeState.query = {
      out_trade_no: 'legacy-123',
      trade_status: 'TRADE_SUCCESS',
    }
    verifyOrder.mockRejectedValue(new Error('auth required'))
    verifyOrderPublic.mockResolvedValue({
      data: orderFactory('PAID'),
    })

    const wrapper = mount(PaymentResultView, {
      global: {
        stubs: {
          OrderStatusBadge: true,
        },
      },
    })

    await flushPromises()

    expect(verifyOrder).toHaveBeenCalledWith('legacy-123')
    expect(verifyOrderPublic).toHaveBeenCalledWith('legacy-123')
    expect(pollOrderStatus).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('payment.result.success')
  })

  it('renders the minimal public out_trade_no verification result without payment_type', async () => {
    routeState.query = {
      out_trade_no: 'legacy-minimal',
      trade_status: 'TRADE_SUCCESS',
    }
    verifyOrder.mockRejectedValue(new Error('auth required'))
    verifyOrderPublic.mockResolvedValue({
      data: {
        out_trade_no: 'legacy-minimal',
        status: 'PAID',
        paid: true,
        created_at: '2026-04-20T12:00:00Z',
        expires_at: '2026-04-20T12:30:00Z',
      },
    })

    const wrapper = mount(PaymentResultView, {
      global: {
        stubs: {
          OrderStatusBadge: true,
        },
      },
    })

    await flushPromises()

    expect(wrapper.text()).toContain('payment.result.success')
    expect(wrapper.text()).toContain('legacy-minimal')
    expect(wrapper.text()).not.toContain('payment.orders.paymentMethod')
  })

  it('prefers authenticated order verification before falling back to public lookup', async () => {
    routeState.query = {
      out_trade_no: 'auth-verify-123',
      trade_status: 'TRADE_SUCCESS',
    }
    verifyOrder.mockResolvedValue({
      data: orderFactory('COMPLETED'),
    })

    const wrapper = mount(PaymentResultView, {
      global: {
        stubs: {
          OrderStatusBadge: true,
        },
      },
    })

    await flushPromises()

    expect(verifyOrder).toHaveBeenCalledWith('auth-verify-123')
    expect(verifyOrderPublic).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('payment.result.success')
    expect(wrapper.findAll('button').map(button => button.text())).toEqual([
      'payment.result.backToRecharge', 'payment.result.viewOrders',
    ])
  })

  it('does not use public out_trade_no verification for bare order numbers without legacy return markers', async () => {
    routeState.query = {
      out_trade_no: 'legacy-bare',
    }

    mount(PaymentResultView, {
      global: {
        stubs: {
          OrderStatusBadge: true,
        },
      },
    })

    await flushPromises()

    expect(verifyOrderPublic).not.toHaveBeenCalled()
  })

  it('resolves order by resume token when local recovery snapshot is missing', async () => {
    routeState.query = {
      resume_token: 'resume-77',
    }
    resolveOrderPublicByResumeToken.mockResolvedValue({
      data: orderFactory('PAID'),
    })

    const wrapper = mount(PaymentResultView, {
      global: {
        stubs: {
          OrderStatusBadge: true,
        },
      },
    })

    await flushPromises()

    expect(resolveOrderPublicByResumeToken).toHaveBeenCalledWith('resume-77')
    expect(wrapper.text()).toContain('payment.result.success')
  })

  it('uses the currency returned by the order API when rendering amounts', async () => {
    routeState.query = {
      resume_token: 'resume-hkd',
    }
    resolveOrderPublicByResumeToken.mockResolvedValue({
      data: {
        ...orderFactory('PAID'),
        currency: 'HKD',
        amount: 100,
        pay_amount: 103,
        fee_rate: 3,
      },
    })

    const wrapper = mount(PaymentResultView, {
      global: {
        stubs: {
          OrderStatusBadge: true,
        },
      },
    })

    await flushPromises()

    expect(wrapper.text()).toContain(formatPaymentAmount(103, 'HKD'))
  })

  it('normalizes aliased payment methods before rendering the label', async () => {
    routeState.query = {
      resume_token: 'resume-88',
    }
    resolveOrderPublicByResumeToken.mockResolvedValueOnce({
      data: {
        ...orderFactory('PAID'),
        payment_type: 'alipay_direct',
      },
    })

    const wrapper = mount(PaymentResultView, {
      global: {
        stubs: {
          OrderStatusBadge: true,
        },
      },
    })

    await flushPromises()

    expect(wrapper.text()).toContain('payment.methods.alipay')
    expect(wrapper.text()).not.toContain('payment.methods.alipay_direct')
  })
})
