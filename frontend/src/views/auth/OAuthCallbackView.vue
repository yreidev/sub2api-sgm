<template>
  <div class="public-palette auth-callback-page">
    <div class="auth-callback-shell">
      <div v-if="isProcessing" role="status" aria-live="polite" class="auth-callback-card text-center">
        <div class="auth-callback-spinner mx-auto h-9 w-9 animate-spin motion-reduce:animate-none rounded-full" aria-hidden="true"></div>
        <h1 class="auth-callback-heading mt-4">
          {{ t('auth.oauth.callbackTitle') }}
        </h1>
        <p class="auth-callback-intro mt-2">
          {{ t('auth.oauth.callbackHint') }}
        </p>
      </div>

      <div v-else-if="needsRegistrationCompletion" class="auth-callback-card">
        <h1 class="auth-callback-heading">
          {{ t('auth.oidc.callbackTitle', { providerName }) }}
        </h1>
        <p class="auth-callback-intro mt-2">
          {{ registrationHint }}
        </p>

        <div class="mt-6 space-y-4">
          <div>
            <label class="input-label">{{ t('auth.emailLabel') }}</label>
            <HeroInput
              class="input w-full"
              type="email"
              :model-value="registrationEmail"
              readonly
              disabled
            />
          </div>
          <div>
            <label class="input-label">{{ t('auth.passwordLabel') }}</label>
            <HeroInput
              v-model="password"
              type="password"
              class="input w-full"
              :placeholder="t('auth.createPasswordPlaceholder')"
              :disabled="isSubmitting"
              autocomplete="new-password"
              @keyup.enter="handleSubmitRegistration"
            />
          </div>
          <div>
            <label class="input-label">{{ t('auth.confirmPassword') }}</label>
            <HeroInput
              v-model="confirmPassword"
              type="password"
              class="input w-full"
              :placeholder="t('auth.confirmPasswordPlaceholder')"
              :disabled="isSubmitting"
              autocomplete="new-password"
              @keyup.enter="handleSubmitRegistration"
            />
          </div>
          <div v-if="invitationRequired">
            <label class="input-label">{{ t('auth.invitationCodeLabel') }}</label>
            <HeroInput
              v-model="invitationCode"
              type="text"
              class="input w-full"
              :placeholder="t('auth.invitationCodePlaceholder')"
              :disabled="isSubmitting"
              @keyup.enter="handleSubmitRegistration"
            />
          </div>
          <p v-if="registrationError" role="alert" class="text-sm text-red-600 dark:text-red-400">
            {{ registrationError }}
          </p>
          <HeroButton variant="primary"
            full-width class="btn btn-primary"
            type="button"
            :disabled="isSubmitting || !canSubmitRegistration"
            @press="handleSubmitRegistration"
          >
            {{ isSubmitting ? t('common.processing') : t('auth.oidc.completeRegistration') }}
          </HeroButton>
        </div>
      </div>

      <div v-else-if="invalidCallback" role="alert" class="auth-callback-card text-center">
        <h1 class="auth-callback-heading">
          {{ t('auth.oauth.invalidCallbackTitle') }}
        </h1>
        <p class="auth-callback-intro mt-2">
          {{ t('auth.oauth.invalidCallbackHint') }}
        </p>
        <HeroButton variant="primary" class="btn btn-primary mt-6" type="button" @press="router.replace('/login')">
          {{ t('auth.backToLogin') }}
        </HeroButton>
      </div>

      <div v-else class="auth-callback-card">
        <h1 class="auth-callback-heading">
          {{ t('auth.oauth.callbackTitle') }}
        </h1>
        <p class="auth-callback-intro mt-2">
          {{ t('auth.oauth.callbackHint') }}
        </p>

        <div class="mt-6 space-y-4">
          <div>
            <label class="input-label">{{ t('auth.oauth.code') }}</label>
            <div class="flex gap-2">
              <HeroInput class="input auth-callback-mono min-w-0 flex-1 text-sm" :model-value="code" readonly />
              <HeroButton variant="secondary" class="btn btn-secondary shrink-0" type="button" :disabled="!code" @press="copy(code)">
                {{ t('common.copy') }}
              </HeroButton>
            </div>
          </div>

          <div>
            <label class="input-label">{{ t('auth.oauth.state') }}</label>
            <div class="flex gap-2">
              <HeroInput class="input auth-callback-mono min-w-0 flex-1 text-sm" :model-value="state" readonly />
              <HeroButton variant="secondary"
                class="btn btn-secondary shrink-0"
                type="button"
                :disabled="!state"
                @press="copy(state)"
              >
                {{ t('common.copy') }}
              </HeroButton>
            </div>
          </div>

          <div>
            <label class="input-label">{{ t('auth.oauth.fullUrl') }}</label>
            <div class="flex gap-2">
              <HeroInput class="input auth-callback-mono min-w-0 flex-1 text-xs" :model-value="fullUrl" readonly />
              <HeroButton variant="secondary"
                class="btn btn-secondary shrink-0"
                type="button"
                :disabled="!fullUrl"
                @press="copy(fullUrl)"
              >
                {{ t('common.copy') }}
              </HeroButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import HeroButton from '@/components/hero/HeroButton.vue'
import HeroInput from '@/components/hero/HeroInput.vue'
import 'virtual:sgm-heroui.css'
import '@/styles/public-palette.css'
import '@fontsource/ibm-plex-sans/latin-400.css'
import '@fontsource/ibm-plex-sans/latin-500.css'
import '@fontsource/ibm-plex-sans/latin-600.css'
import '@fontsource/ibm-plex-mono/latin-400.css'
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useClipboard } from '@/composables/useClipboard'
import { useAppStore, useAuthStore } from '@/stores'
import { apiClient } from '@/api/client'
import { buildApiUrl } from '@/api/url'
import {
  exchangePendingOAuthCompletion,
  persistOAuthTokenContext,
  type OAuthTokenResponse
} from '@/api/auth'
import {
  clearAllAffiliateReferralCodes,
  loadOAuthAffiliateCode,
  oauthAffiliatePayload
} from '@/utils/oauthAffiliate'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { copyToClipboard } = useClipboard()
const appStore = useAppStore()
const authStore = useAuthStore()
const isProcessing = ref(false)
const isSubmitting = ref(false)
const needsRegistrationCompletion = ref(false)
const invitationRequired = ref(false)
const registrationEmail = ref('')
const password = ref('')
const confirmPassword = ref('')
const invitationCode = ref('')
const registrationError = ref('')
const pendingProvider = ref<'github' | 'google'>('github')
const redirectTo = ref('/dashboard')
const invalidCallback = ref(false)
const EMAIL_OAUTH_PENDING_PROVIDER_KEY = 'email_oauth_pending_provider'

type EmailOAuthPendingCompletion = Partial<OAuthTokenResponse> & {
  error?: string
  provider?: string
  redirect?: string
  email?: string
  resolved_email?: string
  invitation_required?: boolean
}

const code = computed(() => (route.query.code as string) || '')
const state = computed(() => (route.query.state as string) || '')
const error = computed(
  () => (route.query.error as string) || (route.query.error_description as string) || ''
)

const fullUrl = computed(() => {
  if (typeof window === 'undefined') return ''
  return window.location.href
})
const providerName = computed(() =>
  pendingProvider.value === 'google' ? 'Google' : 'GitHub'
)
const registrationHint = computed(() =>
  invitationRequired.value
    ? t('auth.oidc.invitationRequired', { providerName: providerName.value })
    : t('auth.oidc.completeRegistration')
)
const canSubmitRegistration = computed(() => {
  if (!registrationEmail.value.trim()) return false
  if (password.value.length < 6) return false
  if (password.value !== confirmPassword.value) return false
  if (invitationRequired.value && !invitationCode.value.trim()) return false
  return true
})

function parseFragmentParams(): URLSearchParams {
  const raw = typeof window !== 'undefined' ? window.location.hash : ''
  const hash = raw.startsWith('#') ? raw.slice(1) : raw
  return new URLSearchParams(hash)
}

function readTokenResponse(params: URLSearchParams): OAuthTokenResponse | null {
  const accessToken = params.get('access_token')?.trim() || ''
  if (!accessToken) return null

  const response: OAuthTokenResponse = { access_token: accessToken }
  const refreshToken = params.get('refresh_token')?.trim() || ''
  if (refreshToken) response.refresh_token = refreshToken
  const expiresIn = Number.parseInt(params.get('expires_in')?.trim() || '', 10)
  if (Number.isFinite(expiresIn) && expiresIn > 0) response.expires_in = expiresIn
  const tokenType = params.get('token_type')?.trim() || ''
  if (tokenType) response.token_type = tokenType
  return response
}

function sanitizeRedirectPath(path: string | null | undefined): string {
  if (!path) return '/dashboard'
  if (!path.startsWith('/')) return '/dashboard'
  if (path.startsWith('//')) return '/dashboard'
  if (path.includes('://')) return '/dashboard'
  if (path.includes('\n') || path.includes('\r')) return '/dashboard'
  return path
}

function readPendingEmailOAuthProvider(): 'github' | 'google' | null {
  if (typeof window === 'undefined') return null
  const provider = window.sessionStorage.getItem(EMAIL_OAUTH_PENDING_PROVIDER_KEY)
  if (provider === 'github' || provider === 'google') return provider
  return null
}

function redirectProviderCallbackToBackend(provider: 'github' | 'google'): void {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(route.query)) {
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item != null) params.append(key, String(item))
      })
    } else if (value != null) {
      params.set(key, String(value))
    }
  }
  const suffix = params.toString() ? `?${params.toString()}` : ''
  window.location.href = buildApiUrl(`/auth/oauth/${provider}/callback${suffix}`)
}

async function finalizeTokenResponse(tokenResponse: OAuthTokenResponse, redirect: string) {
  persistOAuthTokenContext(tokenResponse)
  await authStore.setToken(tokenResponse.access_token)
  if (typeof window !== 'undefined') {
    window.sessionStorage.removeItem(EMAIL_OAUTH_PENDING_PROVIDER_KEY)
  }
  clearAllAffiliateReferralCodes()
  appStore.showSuccess(t('auth.loginSuccess'))
  await router.replace(sanitizeRedirectPath(redirect))
}

function hasOAuthTokenResponse(value: Partial<OAuthTokenResponse>): value is OAuthTokenResponse {
  return typeof value.access_token === 'string' && value.access_token.trim() !== ''
}

async function resumePendingEmailOAuth() {
  isProcessing.value = true
  try {
    const completion = await exchangePendingOAuthCompletion() as EmailOAuthPendingCompletion
    const completionRedirect = completion.redirect || '/dashboard'
    if (hasOAuthTokenResponse(completion)) {
      await finalizeTokenResponse(completion, completionRedirect)
      return
    }

    const provider = String(completion.provider || '').toLowerCase()
    if (provider === 'github' || provider === 'google') {
      pendingProvider.value = provider
    }
    redirectTo.value = sanitizeRedirectPath(completionRedirect)

    if (completion.error === 'invitation_required' || completion.error === 'registration_completion_required') {
      invitationRequired.value = completion.error === 'invitation_required' || completion.invitation_required === true
      registrationEmail.value = String(completion.resolved_email || completion.email || '').trim()
      needsRegistrationCompletion.value = true
      isProcessing.value = false
      return
    }

    appStore.showError(completion.error || t('auth.loginFailed'))
  } catch (e: unknown) {
    const err = e as { message?: string; response?: { data?: { message?: string } } }
    const message = err.response?.data?.message || err.message || t('auth.loginFailed')
    appStore.showError(message)
    invalidCallback.value = true
  } finally {
    if (!needsRegistrationCompletion.value) {
      isProcessing.value = false
    }
  }
}

async function handleSubmitRegistration() {
  registrationError.value = ''
  if (!registrationEmail.value.trim()) {
    registrationError.value = t('auth.emailRequired')
    return
  }
  if (password.value.length < 6) {
    registrationError.value = t('auth.passwordMinLength')
    return
  }
  if (password.value !== confirmPassword.value) {
    registrationError.value = t('auth.passwordsDoNotMatch')
    return
  }
  const code = invitationCode.value.trim()
  if (invitationRequired.value && !code) return

  isSubmitting.value = true
  try {
    const payload: { password: string; invitation_code?: string; aff_code?: string } = {
      password: password.value,
      ...oauthAffiliatePayload(loadOAuthAffiliateCode())
    }
    if (invitationRequired.value) {
      payload.invitation_code = code
    }
    const { data } = await apiClient.post<OAuthTokenResponse>(
      `/auth/oauth/${pendingProvider.value}/complete-registration`,
      payload
    )
    await finalizeTokenResponse(data, redirectTo.value)
  } catch (e: unknown) {
    const err = e as { message?: string; response?: { data?: { message?: string } } }
    registrationError.value =
      err.response?.data?.message || err.message || t('auth.oidc.completeRegistrationFailed')
  } finally {
    isSubmitting.value = false
  }
}

onMounted(async () => {
  const params = parseFragmentParams()
  const tokenResponse = readTokenResponse(params)
  const fragmentError = params.get('error') || ''
  const fragmentErrorDescription =
    params.get('error_description') || params.get('error_message') || ''

  if (fragmentError) {
    appStore.showError(fragmentErrorDescription || fragmentError)
    return
  }
  if (!tokenResponse) {
    if (route.path === '/auth/oauth/callback') {
      const pendingEmailOAuthProvider = readPendingEmailOAuthProvider()
      if (pendingEmailOAuthProvider && code.value && state.value) {
        redirectProviderCallbackToBackend(pendingEmailOAuthProvider)
        return
      }
      await resumePendingEmailOAuth()
    }
    return
  }

  isProcessing.value = true
  try {
    await finalizeTokenResponse(tokenResponse, params.get('redirect') || '/dashboard')
  } catch (error: unknown) {
    const message = (error as { message?: string })?.message || t('auth.loginFailed')
    appStore.showError(message)
    isProcessing.value = false
  }
})

watch(
  error,
  (message) => {
    if (message) {
      appStore.showError(message)
    }
  },
  { immediate: true }
)

const copy = (value: string) => {
  if (!value) return
  copyToClipboard(value)
}
</script>

<style scoped>
.auth-callback-page {
  min-height: 100dvh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: clamp(2rem, 6vw, 4.5rem) 1rem;
  background: var(--page);
  color: var(--ink);
  font-family: "IBM Plex Sans", "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif;
}

.auth-callback-shell {
  width: min(100%, 38rem);
}

.auth-callback-card {
  position: relative;
  isolation: isolate;
  padding: clamp(1.5rem, 4vw, 2.25rem);
  border-radius: 18px;
  border: 1px solid var(--line);
  background: var(--panel);
  box-shadow: var(--shadow-card), var(--shadow-inset-top);
  overflow-wrap: anywhere;
}

.auth-callback-card::before {
  position: absolute;
  content: "";
  z-index: -1;
  inset: 0 0 auto auto;
  width: 48%;
  height: 5rem;
  border-top-right-radius: inherit;
  background: url('../../assets/sgm-balance-wave.webp') center / cover;
  opacity: var(--wave-opacity);
  mix-blend-mode: multiply;
  mask-image: linear-gradient(212deg, #000 10%, transparent 72%);
  pointer-events: none;
}

.dark .auth-callback-card::before {
  mix-blend-mode: screen;
  filter: invert(1) hue-rotate(180deg) brightness(1.4);
}

.auth-callback-heading {
  margin: 0;
  font-size: clamp(1.375rem, 3.2vw, 1.625rem);
  line-height: 1.26;
  font-weight: 500;
  letter-spacing: -0.025em;
  text-wrap: balance;
  color: var(--ink);
}

.auth-callback-intro {
  font-size: 0.9375rem;
  line-height: 1.6;
  color: var(--muted);
}

.auth-callback-spinner {
  border: 2.5px solid var(--line);
  border-top-color: var(--accent);
}

.auth-callback-card :deep(.input-label) {
  display: block;
  margin-bottom: 0.4375rem;
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--ink);
}

.auth-callback-card :deep(.input[data-slot="input"]),
.auth-callback-card :deep(.input) {
  min-height: 46px;
  border-radius: 10px;
  border: 1px solid var(--field-line);
  background: var(--field);
  color: var(--ink);
  font-size: 0.9375rem;
  box-shadow: var(--shadow-xs);
  transition:
    border-color var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out),
    background-color var(--duration-fast) var(--ease-out);
}

.auth-callback-card :deep(.input[data-slot="input"]::placeholder),
.auth-callback-card :deep(.input::placeholder) {
  color: var(--muted);
  opacity: 1;
}

.auth-callback-card :deep(.input[data-slot="input"]:hover:not(:disabled):not([readonly]):not(:focus)),
.auth-callback-card :deep(.input:hover:not(:disabled):not([readonly]):not(:focus)) {
  border-color: var(--field-line-hover);
  background: var(--field);
}

.auth-callback-card :deep(.input[data-slot="input"]:focus),
.auth-callback-card :deep(.input[data-slot="input"][data-focused="true"]),
.auth-callback-card :deep(.input:focus) {
  outline: 2px solid transparent;
  outline-offset: 2px;
  border-color: var(--focus);
  box-shadow: var(--ring-focus);
}

.auth-callback-card :deep(.input[data-slot="input"][readonly]),
.auth-callback-card :deep(.input[readonly]),
.auth-callback-card :deep(.input[data-slot="input"]:disabled),
.auth-callback-card :deep(.input:disabled) {
  background: var(--panel-subtle);
  border-color: var(--line);
  color: var(--muted);
  box-shadow: none;
  opacity: 1;
}

.auth-callback-card :deep(.auth-callback-mono) {
  font-family: "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
  font-variant-numeric: tabular-nums;
}

.auth-callback-card :deep(.btn-primary) {
  min-height: 46px;
  border-radius: 10px;
  border: 1px solid transparent;
  font-size: 0.9375rem;
  font-weight: 500;
  --button-bg: var(--accent);
  --button-bg-hover: var(--accent-hover);
  --button-bg-pressed: var(--accent-active);
  --button-fg: var(--on-accent);
  color: var(--on-accent);
  background: var(--accent);
  background-image: none;
  box-shadow: var(--shadow-btn-primary);
  transition:
    background-color var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out),
    transform var(--duration-fast) var(--ease-out),
    opacity var(--duration-fast) var(--ease-out);
}

.auth-callback-card :deep(.btn-primary:hover:not(:disabled)),
.auth-callback-card :deep(.btn-primary[data-hovered="true"]:not(:disabled)) {
  background: var(--accent-hover);
  background-image: none;
}

.auth-callback-card :deep(.btn-primary:active:not(:disabled)),
.auth-callback-card :deep(.btn-primary[data-pressed="true"]:not(:disabled)) {
  background: var(--accent-active);
  transform: scale(0.985);
}

.auth-callback-card :deep(.btn-primary:focus-visible),
.auth-callback-card :deep(.btn-primary[data-focus-visible="true"]) {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
  box-shadow: var(--ring-focus);
}

.auth-callback-card :deep(.btn-primary:disabled) {
  opacity: 0.56;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

.auth-callback-card :deep(.btn-secondary) {
  min-height: 46px;
  border-radius: 10px;
  border: 1px solid var(--field-line);
  padding-inline: 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  --button-bg: var(--panel-elevated);
  --button-bg-hover: var(--tint);
  --button-bg-pressed: var(--tint-strong);
  --button-fg: var(--ink);
  color: var(--ink);
  background: var(--panel-elevated);
  background-image: none;
  box-shadow: var(--shadow-xs), var(--shadow-inset-top);
  transition:
    background-color var(--duration-fast) var(--ease-out),
    border-color var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out),
    transform var(--duration-fast) var(--ease-out),
    opacity var(--duration-fast) var(--ease-out);
}

.auth-callback-card :deep(.btn-secondary:hover:not(:disabled)),
.auth-callback-card :deep(.btn-secondary[data-hovered="true"]:not(:disabled)) {
  background: var(--tint);
  border-color: var(--field-line-hover);
}

.dark .auth-callback-card :deep(.btn-secondary) {
  --button-bg-hover: var(--tint-strong);
  --button-bg-pressed: var(--tint);
}

.dark .auth-callback-card :deep(.btn-secondary:hover:not(:disabled)),
.dark .auth-callback-card :deep(.btn-secondary[data-hovered="true"]:not(:disabled)) {
  background: var(--tint-strong);
  border-color: var(--field-line-hover);
}

.auth-callback-card :deep(.btn-secondary:active:not(:disabled)),
.auth-callback-card :deep(.btn-secondary[data-pressed="true"]:not(:disabled)) {
  background: var(--tint-strong);
  transform: scale(0.985);
}

.auth-callback-card :deep(.btn-secondary:focus-visible),
.auth-callback-card :deep(.btn-secondary[data-focus-visible="true"]) {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
  border-color: var(--focus);
  box-shadow: var(--ring-focus);
}

.auth-callback-card :deep(.btn-secondary:disabled) {
  opacity: 0.55;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

@media (prefers-reduced-motion: reduce) {
  .auth-callback-card :deep(.input[data-slot="input"]),
  .auth-callback-card :deep(.input),
  .auth-callback-card :deep(.btn-primary),
  .auth-callback-card :deep(.btn-secondary) {
    transition: none;
  }

  .auth-callback-spinner {
    animation: none;
  }

  .auth-callback-card :deep(.btn-primary:active:not(:disabled)),
  .auth-callback-card :deep(.btn-primary[data-pressed="true"]:not(:disabled)),
  .auth-callback-card :deep(.btn-secondary:active:not(:disabled)),
  .auth-callback-card :deep(.btn-secondary[data-pressed="true"]:not(:disabled)) {
    transform: none;
  }
}
</style>
