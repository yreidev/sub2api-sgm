import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import TotpLoginModal from '@/components/auth/TotpLoginModal.vue'

const { showErrorMock } = vi.hoisted(() => ({
  showErrorMock: vi.fn(),
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('@/stores', () => ({
  useAppStore: () => ({
    showError: (...args: any[]) => showErrorMock(...args),
  }),
}))

describe('TotpLoginModal', () => {
  beforeEach(() => {
    showErrorMock.mockReset()
  })

  it('sends verification errors to toast and does not render inline alert', async () => {
    const wrapper = mount(TotpLoginModal, {
      props: {
        tempToken: 'temp-token',
        userEmailMasked: 'u***@example.com',
      },
    })

    await vi.waitFor(() => {
      expect(document.body.textContent).toContain('u***@example.com')
    })

    ;(wrapper.vm as unknown as { setError: (message: string) => void }).setError('Invalid code')
    await wrapper.vm.$nextTick()

    expect(showErrorMock).toHaveBeenCalledWith('Invalid code')
    expect(document.body.textContent).not.toContain('Invalid code')
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(document.querySelector('[role="alert"]')).toBeNull()
    wrapper.unmount()
  })

  it('announces verifying status with an accessible status region and decorative spinner', async () => {
    const wrapper = mount(TotpLoginModal, {
      props: {
        tempToken: 'temp-token',
        userEmailMasked: 'u***@example.com',
      },
    })

    await vi.waitFor(() => {
      expect(document.body.textContent).toContain('u***@example.com')
    })

    ;(wrapper.vm as unknown as { setVerifying: (value: boolean) => void }).setVerifying(true)
    await wrapper.vm.$nextTick()

    const status = document.querySelector('[role="status"]')
    expect(status).not.toBeNull()
    expect(status?.textContent).toContain('common.verifying')
    const spinner = status?.querySelector('.totp-spinner')
    expect(spinner?.getAttribute('aria-hidden')).toBe('true')
    expect(spinner?.classList.contains('motion-reduce:animate-none')).toBe(true)
    wrapper.unmount()
  })
})
