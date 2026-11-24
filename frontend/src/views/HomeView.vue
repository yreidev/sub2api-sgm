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
          <span class="welcome-feature-icon" aria-hidden="true">
            <Icon :name="feature.icon" size="lg" />
          </span>
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
.nav-link,
.welcome-actions a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: .5rem;
  min-height: 44px;
  border-radius: 10px;
  text-decoration: none;
  transition:
    color var(--duration-fast, 150ms) var(--ease-out, cubic-bezier(0.22, 1, 0.36, 1)),
    background-color var(--duration-fast, 150ms) var(--ease-out, cubic-bezier(0.22, 1, 0.36, 1)),
    border-color var(--duration-fast, 150ms) var(--ease-out, cubic-bezier(0.22, 1, 0.36, 1)),
    box-shadow var(--duration-fast, 150ms) var(--ease-out, cubic-bezier(0.22, 1, 0.36, 1)),
    transform var(--duration-fast, 150ms) var(--ease-out, cubic-bezier(0.22, 1, 0.36, 1));
}
.nav-link {
  color: var(--muted);
  padding-inline: .7rem;
  font-size: .9rem;
  font-weight: 500;
}
.nav-link:hover {
  color: var(--ink);
  background: var(--tint);
}
.nav-link:active {
  background: var(--tint-strong, var(--tint));
  transform: scale(0.985);
}
.nav-link:focus-visible,
.welcome-actions a:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
  box-shadow: var(--ring-focus, 0 0 0 3px rgb(18 108 122 / 18%));
}

.welcome {
  display: grid;
  gap: 1.5rem;
  padding-block: clamp(2rem, 5vw, 3.75rem);
}

.welcome-hero[data-slot="card"] {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  gap: 0;
  border: 1px solid var(--line);
  border-radius: 18px;
  background:
    radial-gradient(ellipse 62% 90% at 92% 118%, rgb(179 218 214 / 44%), transparent 54%),
    radial-gradient(ellipse 52% 72% at 98% -16%, rgb(206 218 236 / 40%), transparent 56%),
    linear-gradient(112deg, #f3faf8 0%, var(--tint, #ebf5f4) 54%, #e0eeef 100%);
  box-shadow:
    var(--shadow-inset-top, inset 0 1px 0 rgb(255 255 255 / 85%)),
    var(--shadow-card, 0 1px 2px rgb(22 43 52 / 5%), 0 4px 12px -2px rgb(22 43 52 / 5%));
  padding: clamp(2rem, 6vw, 4.5rem) clamp(1.25rem, 5vw, 3.75rem);
}
.welcome-hero::before {
  content: "";
  position: absolute;
  z-index: -1;
  inset: 0 0 0 30%;
  pointer-events: none;
  background: url('../assets/sgm-balance-wave.webp') center right / cover no-repeat;
  opacity: var(--wave-opacity, .72);
  mix-blend-mode: multiply;
  mask-image: linear-gradient(90deg, transparent, #000 55%);
}
.dark .welcome-hero[data-slot="card"] {
  background:
    radial-gradient(ellipse 62% 90% at 92% 118%, rgb(138 211 205 / 12%), transparent 54%),
    radial-gradient(ellipse 52% 72% at 98% -16%, rgb(92 149 170 / 12%), transparent 56%),
    linear-gradient(116deg, #1b343b 0%, #152b31 56%, #12242a 100%);
  border-color: var(--line);
}
.dark .welcome-hero::before {
  mix-blend-mode: screen;
  filter: invert(1) hue-rotate(180deg) brightness(1.4);
}

.welcome h1 {
  max-width: 17ch;
  font-size: clamp(2.25rem, 5vw, 3.75rem);
  line-height: 1.12;
  font-weight: 500;
  letter-spacing: -.03em;
  text-wrap: balance;
  color: var(--ink);
}
.welcome p {
  max-width: 46ch;
  color: var(--muted);
  line-height: 1.65;
  overflow-wrap: anywhere;
}
.welcome-hero p {
  margin-top: 1rem;
  font-size: clamp(1rem, 1.4vw, 1.0625rem);
  white-space: pre-line;
}

.welcome-actions {
  display: flex;
  flex-wrap: wrap;
  gap: .75rem;
  margin-top: 1.875rem;
}
.welcome-actions a {
  padding: .625rem 1.25rem;
  font-size: .9375rem;
  font-weight: 500;
}
.welcome-actions a.welcome-primary {
  --button-bg: var(--accent);
  --button-bg-hover: var(--accent-hover, #12454f);
  --button-bg-pressed: var(--accent-active, #0e3840);
  --button-fg: var(--on-accent);
  color: var(--on-accent);
  background: var(--accent);
  border: 1px solid transparent;
  box-shadow: var(--shadow-btn-primary, 0 1px 2px rgb(18 69 79 / 24%), inset 0 1px 0 rgb(255 255 255 / 16%));
}
.welcome-actions a.welcome-primary:hover {
  background: var(--accent-hover, #12454f);
  box-shadow: var(--shadow-btn-primary, 0 1px 2px rgb(18 69 79 / 24%), inset 0 1px 0 rgb(255 255 255 / 16%));
}
.welcome-actions a.welcome-primary:active {
  background: var(--accent-active, #0e3840);
  transform: scale(0.985);
}
.welcome-actions a.welcome-primary svg {
  transition: transform var(--duration-fast, 150ms) var(--ease-out, cubic-bezier(0.22, 1, 0.36, 1));
}
@media (hover: hover) {
  .welcome-actions a.welcome-primary:hover svg {
    transform: translateX(2px);
  }
}

.welcome-actions a.welcome-secondary {
  --button-bg: var(--panel);
  --button-bg-hover: var(--panel-subtle, #f7fafa);
  --button-bg-pressed: var(--tint);
  --button-fg: var(--ink);
  color: var(--ink);
  background: var(--panel);
  border: 1px solid var(--line);
  box-shadow: var(--shadow-xs, 0 1px 2px rgb(22 43 52 / 5%));
}
.welcome-actions a.welcome-secondary:hover {
  background: var(--panel-subtle, #f7fafa);
  border-color: var(--line-strong, #b6c8cc);
}
.welcome-actions a.welcome-secondary:active {
  background: var(--tint);
  border-color: var(--line-strong, #b6c8cc);
  transform: scale(0.985);
}

.welcome-features[data-slot="card"] {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0;
  padding: 0;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 18px;
  background: var(--panel);
  box-shadow: var(--shadow-card, 0 1px 2px rgb(22 43 52 / 5%), 0 4px 12px -2px rgb(22 43 52 / 5%));
}
.welcome-features li {
  padding: clamp(1.35rem, 3vw, 2rem);
  transition: background-color var(--duration-base, 220ms) var(--ease-out, cubic-bezier(0.22, 1, 0.36, 1));
}
.welcome-features li + li {
  border-inline-start: 1px solid var(--line-subtle, var(--line));
}
.welcome-feature-icon {
  display: inline-grid;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 10px;
  background: var(--tint);
  color: var(--accent);
  box-shadow: inset 0 0 0 1px var(--line-subtle, var(--line));
  transition:
    background-color var(--duration-base, 220ms) var(--ease-out, cubic-bezier(0.22, 1, 0.36, 1)),
    box-shadow var(--duration-base, 220ms) var(--ease-out, cubic-bezier(0.22, 1, 0.36, 1)),
    transform var(--duration-base, 220ms) var(--ease-out, cubic-bezier(0.22, 1, 0.36, 1));
}
.welcome-feature-icon svg {
  width: 1.375rem;
  height: 1.375rem;
  color: currentColor;
}
@media (hover: hover) {
  .welcome-features li:hover {
    background: var(--panel-subtle, #f7fafa);
  }
  .welcome-features li:hover .welcome-feature-icon {
    background: var(--tint-strong, var(--tint));
    box-shadow: inset 0 0 0 1px var(--line);
    transform: translateY(-1px);
  }
}
.welcome-features h2 {
  margin: 1rem 0 .4rem;
  font-size: 1.125rem;
  line-height: 1.35;
  font-weight: 600;
  letter-spacing: -.015em;
  text-wrap: balance;
  color: var(--ink);
}
.welcome-features p {
  font-size: .9375rem;
  line-height: 1.65;
}

@media (max-width: 680px) {
  .nav-link span { display: none; }
  .nav-link { min-width: 44px; padding-inline: 0; }
  .welcome-features[data-slot="card"] { grid-template-columns: 1fr; }
  .welcome-features li + li { border-inline-start: 0; border-top: 1px solid var(--line-subtle, var(--line)); }
  .welcome-hero::before { left: 46%; mask-image: linear-gradient(90deg, transparent, #000 90%); }
}

@media (prefers-reduced-motion: reduce) {
  .nav-link,
  .welcome-actions a,
  .welcome-actions a.welcome-primary svg,
  .welcome-features li,
  .welcome-feature-icon {
    transition: none;
  }
  .nav-link:active,
  .welcome-actions a.welcome-primary:active,
  .welcome-actions a.welcome-secondary:active,
  .welcome-actions a.welcome-primary:hover svg,
  .welcome-features li:hover .welcome-feature-icon {
    transform: none;
  }
}
</style>
