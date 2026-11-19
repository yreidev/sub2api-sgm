<template>
  <!-- Custom Home Content: Full Page Mode -->
  <div v-if="hasHomeContent" class="min-h-screen">
    <!-- iframe mode -->
    <iframe
      v-if="isHomeContentUrl"
      :src="homeContent.trim()"
      :title="siteName"
      class="h-screen w-full border-0"
      allowfullscreen
    ></iframe>
    <!-- HTML mode - SECURITY: homeContent is admin-only setting, XSS risk is acceptable -->
    <div v-else v-html="homeContent"></div>
  </div>

  <PublicLayout v-else>
    <template #navigation>
      <HeroLink v-if="docUrl" :href="docUrl" target="_blank" rel="noopener noreferrer" class="nav-link" :title="t('home.viewDocs')" :aria-label="t('home.viewDocs')">
        <Icon name="book" /><span>{{ t('home.docs') }}</span>
      </HeroLink>
      <HeroLink v-if="showModelPlazaEntry" to="/model-plaza" class="nav-link" :title="t('nav.modelPlaza')" :aria-label="t('nav.modelPlaza')">
        <Icon name="grid" /><span>{{ t('nav.modelPlaza') }}</span>
      </HeroLink>
    </template>

    <div class="welcome" :data-testid="compactHomeEnabled ? 'compact-home' : 'default-home'">
      <HeroCard as="section" class="welcome-hero" aria-labelledby="welcome-title">
        <h1 id="welcome-title">{{ t('home.connectAssistant') }}</h1>
        <p>{{ siteSubtitle }}</p>
        <div class="welcome-actions">
          <HeroLink v-if="isAuthenticated" :to="dashboardPath" variant="primary" class="welcome-primary">
            {{ t('home.goToDashboard') }} <Icon name="arrowRight" />
          </HeroLink>
          <template v-else>
            <HeroLink v-if="canRegister" to="/register" variant="primary" class="welcome-primary">
              {{ t('auth.createAccount') }} <Icon name="arrowRight" />
            </HeroLink>
            <HeroLink to="/login" :variant="canRegister ? 'outline' : 'primary'" :class="canRegister ? 'welcome-secondary' : 'welcome-primary'">
              {{ t('auth.signIn') }}
            </HeroLink>
          </template>
        </div>
      </HeroCard>
      <HeroCard as="ul" v-if="!compactHomeEnabled" class="welcome-features">
        <li v-for="feature in features" :key="feature.title">
          <Icon :name="feature.icon" size="lg" aria-hidden="true" />
          <h2>{{ t(feature.title) }}</h2>
          <p>{{ t(feature.description) }}</p>
        </li>
      </HeroCard>
    </div>
    <template v-if="!compactHomeEnabled" #footer>
      <HeroLink href="https://github.com/Wei-Shaw/sub2api" target="_blank" rel="noopener noreferrer" class="nav-link">GitHub <Icon name="externalLink" size="sm" /></HeroLink>
    </template>
  </PublicLayout>
</template>

<script setup lang="ts">
import HeroLink from '@/components/hero/HeroLink.vue'
import HeroCard from '@/components/hero/HeroCard.vue'
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore, useAppStore } from '@/stores'
import PublicLayout from '@/components/layout/PublicLayout.vue'
import Icon from '@/components/icons/Icon.vue'
import { sanitizeUrl } from '@/utils/url'
import { FeatureFlags, isFeatureFlagEnabled } from '@/utils/featureFlags'

const { t } = useI18n()
const authStore = useAuthStore()
const appStore = useAppStore()
const settings = computed(() => appStore.cachedPublicSettings)
const siteName = computed(() => settings.value?.site_name || appStore.siteName)
const siteSubtitle = computed(() => settings.value?.site_subtitle || t('home.assistantIntro'))
const docUrl = computed(() => sanitizeUrl(settings.value?.doc_url || appStore.docUrl || ''))
const homeContent = computed(() => settings.value?.home_content?.trim() || '')
const hasHomeContent = computed(() => homeContent.value.length > 0)
const isHomeContentUrl = computed(() => /^https?:\/\//.test(homeContent.value))
const compactHomeEnabled = computed(() => settings.value?.compact_home_enabled === true)
const isAuthenticated = computed(() => authStore.isAuthenticated)
const canRegister = computed(() => settings.value?.registration_enabled === true && !appStore.backendModeEnabled)
const dashboardPath = computed(() => authStore.isAdmin ? '/admin/dashboard' : '/dashboard')
const showModelPlazaEntry = computed(() => isFeatureFlagEnabled(FeatureFlags.modelPlaza) &&
  (isAuthenticated.value || settings.value?.model_plaza_require_auth !== true))

const features = [
  { icon: 'key', title: 'home.connectTitle', description: 'home.connectHint' },
  { icon: 'creditCard', title: 'home.balanceTitle', description: 'home.balanceHint' },
  { icon: 'chart', title: 'home.historyTitle', description: 'home.historyHint' },
] as const

onMounted(() => {
  authStore.checkAuth()
  if (!appStore.publicSettingsLoaded) void appStore.fetchPublicSettings()
})
</script>

<style scoped>
.nav-link, .welcome-actions a { display: inline-flex; align-items: center; justify-content: center; gap: .5rem; min-height: 44px; border-radius: 10px; }
.nav-link { color: var(--muted); padding-inline: .6rem; font-size: .9rem; }
.nav-link:hover { color: var(--ink); background: var(--tint); }
.welcome { display: grid; gap: 1.5rem; padding-block: clamp(2rem, 5vw, 4rem); }
.welcome-hero { position: relative; isolation: isolate; overflow: hidden; border: 1px solid var(--line); border-radius: 18px; background: var(--tint); padding: clamp(2rem, 6vw, 4.8rem) clamp(1.25rem, 5vw, 3.75rem); }
.welcome-hero::before { content: ""; position: absolute; z-index: -1; inset: 0 0 0 30%; background: url('../assets/sgm-balance-wave.webp') center right / cover no-repeat; opacity: var(--wave-opacity); mask-image: linear-gradient(90deg, transparent, #000 55%); }
.welcome h1 { max-width: 17ch; font-size: clamp(2.25rem, 5vw, 4rem); line-height: 1.14; font-weight: 500; letter-spacing: -.045em; text-wrap: balance; }
.welcome p { max-width: 44ch; color: var(--muted); line-height: 1.65; overflow-wrap: anywhere; }
.welcome-hero p { margin-top: 1rem; white-space: pre-line; }
.welcome-actions { display: flex; flex-wrap: wrap; gap: .625rem; margin-top: 1.75rem; }
.welcome-actions a { padding: .6rem 1.15rem; font-weight: 500; }
.welcome-primary { color: var(--on-accent); background: var(--accent); }
.welcome-secondary { color: var(--ink); background: var(--panel); border: 1px solid var(--field-line); }
.welcome-actions a:hover { filter: brightness(.93); }
.welcome-features[data-slot="card"] { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0; padding: 0; border: 1px solid var(--line); border-radius: 18px; background: var(--panel); }
.welcome-features li { padding: clamp(1.25rem, 3vw, 2rem); }
.welcome-features li + li { border-inline-start: 1px solid var(--line); }
.welcome-features svg { color: var(--accent); }
.welcome-features h2 { margin: .9rem 0 .35rem; font-size: 1.25rem; font-weight: 500; }
@media (max-width: 680px) {
  .nav-link span { display: none; }
  .nav-link { min-width: 44px; }
  .welcome-features[data-slot="card"] { grid-template-columns: 1fr; }
  .welcome-features li + li { border-inline-start: 0; border-top: 1px solid var(--line); }
  .welcome-hero::before { left: 46%; mask-image: linear-gradient(90deg, transparent, #000 90%); }
}
</style>
