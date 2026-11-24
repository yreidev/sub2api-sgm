<template>
  <div class="space-y-4">
    <HeroButton variant="secondary" type="button" :disabled="buttonDisabled" full-width class="btn btn-secondary" @press="startLogin">
      <span
        class="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full border border-emerald-200/80 bg-emerald-50 text-xs font-semibold text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/15 dark:text-emerald-300"
      >
        W
      </span>
      {{ t('auth.oidc.signIn', { providerName }) }}
    </HeroButton>

    <p
      v-if="disabledHint"
      data-testid="wechat-oauth-hint"
      class="text-sm text-amber-800 dark:text-amber-300"
    >
      {{ disabledHint }}
    </p>

    <div v-if="showDivider" class="auth-divider flex items-center gap-3">
      <div class="auth-divider-line h-px flex-1"></div>
      <span class="auth-divider-label text-xs">
        {{ t('auth.oauthOrContinue') }}
      </span>
      <div class="auth-divider-line h-px flex-1"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import HeroButton from '@/components/hero/HeroButton.vue'
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { resolveWeChatOAuthStart, type OAuthLoginStart } from '@/api/auth'
import { useAppStore } from '@/stores'
import { resolveAffiliateReferralCode, storeOAuthAffiliateCode } from '@/utils/oauthAffiliate'

const props = withDefaults(defineProps<{
  disabled?: boolean
  affCode?: string
  showDivider?: boolean
}>(), {
  showDivider: true,
})
const emit = defineEmits<{
  start: [request: OAuthLoginStart]
}>()

const appStore = useAppStore()
const route = useRoute()
const { t, locale } = useI18n()
const providerName = computed(() => t('auth.wechatProviderName'))

function localizeWeChatHint(zh: string, en: string): string {
  return locale.value.startsWith('zh') ? zh : en
}

const resolvedStart = computed(() => resolveWeChatOAuthStart(appStore.cachedPublicSettings))
const buttonDisabled = computed(() => props.disabled || resolvedStart.value.mode === null)
const disabledHint = computed(() => {
  if (props.disabled) {
    return ''
  }
  switch (resolvedStart.value.unavailableReason) {
    case 'external_browser_required':
      return t('auth.oauthFlow.wechatSystemBrowserOnly')
    case 'wechat_browser_required':
      return t('auth.oauthFlow.wechatBrowserOnly')
    case 'native_app_required':
      return localizeWeChatHint(
        '当前仅配置微信移动应用登录，需要在原生 App 中通过微信 SDK 发起授权。',
        'This site only has WeChat mobile app login configured. Continue from the native app through the WeChat SDK.',
      )
    case 'not_configured':
      return t('auth.oauthFlow.wechatNotConfigured')
    default:
      return ''
  }
})

onMounted(() => {
  if (!appStore.cachedPublicSettings && !appStore.publicSettingsLoaded) {
    appStore.fetchPublicSettings()
  }
})

function startLogin(): void {
  if (buttonDisabled.value || !resolvedStart.value.mode) {
    return
  }
  const redirectTo = (route.query.redirect as string) || '/dashboard'
  storeOAuthAffiliateCode(resolveAffiliateReferralCode(props.affCode, route.query.aff, route.query.aff_code))
  const mode = resolvedStart.value.mode
  emit('start', {
    provider: 'wechat',
    params: { mode, redirect: redirectTo }
  })
}
</script>

<style scoped>
.auth-divider-line {
  background: var(--line, #d4e0e2);
}

.auth-divider-label {
  color: var(--muted, #4d636b);
}
</style>
