<template>
  <div class="space-y-4">
    <HeroButton variant="secondary" type="button" :disabled="disabled" full-width class="btn btn-secondary" @press="startLogin">
      <span
        class="oidc-provider-badge mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold"
      >
        {{ providerInitial }}
      </span>
      {{ t('auth.oidc.signIn', { providerName: normalizedProviderName }) }}
    </HeroButton>

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
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { OAuthLoginStart } from '@/api/auth'
import { resolveAffiliateReferralCode, storeOAuthAffiliateCode } from '@/utils/oauthAffiliate'

const props = withDefaults(defineProps<{
  disabled?: boolean
  affCode?: string
  providerName?: string
  showDivider?: boolean
}>(), {
  providerName: 'OIDC',
  showDivider: true
})
const emit = defineEmits<{
  start: [request: OAuthLoginStart]
}>()

const route = useRoute()
const { t } = useI18n()

const normalizedProviderName = computed(() => {
  const name = props.providerName?.trim()
  return name || 'OIDC'
})

const providerInitial = computed(() => normalizedProviderName.value.charAt(0).toUpperCase() || 'O')

function startLogin(): void {
  const redirectTo = (route.query.redirect as string) || '/dashboard'
  storeOAuthAffiliateCode(resolveAffiliateReferralCode(props.affCode, route.query.aff, route.query.aff_code))
  emit('start', { provider: 'oidc', params: { redirect: redirectTo } })
}
</script>

<style scoped>
.oidc-provider-badge {
  border: 1px solid var(--line, #d4e0e2);
  background: var(--tint, #ebf5f4);
  color: var(--accent, #195762);
}

.auth-divider-line {
  background: var(--line, #d4e0e2);
}

.auth-divider-label {
  color: var(--muted, #4d636b);
}
</style>
