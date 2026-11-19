<template>
  <div class="public-shell public-palette">
    <header class="public-bar">
      <nav class="public-width public-nav">
        <HeroLink to="/home" class="public-brand" :title="t('home.backToSite')">
          <img :src="logo" alt="" />
          <span>{{ siteName }}</span>
        </HeroLink>
        <div class="public-tools">
          <slot name="navigation" />
          <HeroLocaleMenu />
          <HeroButton icon-only type="button" class="public-theme" :aria-label="themeLabel" :title="themeLabel" @press="toggleTheme">
            <Icon :name="isDark ? 'sun' : 'moon'" size="md" />
          </HeroButton>
        </div>
      </nav>
    </header>
    <main class="public-width public-main"><slot /></main>
    <footer class="public-width public-footer">
      <span>&copy; {{ year }} {{ siteName }}</span>
      <slot name="footer" />
    </footer>
  </div>
</template>

<script setup lang="ts">
import HeroButton from '@/components/hero/HeroButton.vue'
import HeroLink from '@/components/hero/HeroLink.vue'
import HeroLocaleMenu from '@/components/hero/HeroLocaleMenu.vue'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores'
import 'virtual:sgm-heroui.css'
import Icon from '@/components/icons/Icon.vue'
import { sanitizeUrl } from '@/utils/url'
import '@/styles/public-palette.css'
import '@fontsource/ibm-plex-sans/latin-400.css'
import '@fontsource/ibm-plex-sans/latin-500.css'
import '@fontsource/ibm-plex-sans/latin-600.css'

const appStore = useAppStore()
const { t } = useI18n()
const siteName = computed(() => appStore.cachedPublicSettings?.site_name || appStore.siteName)
const logo = computed(() => sanitizeUrl(appStore.cachedPublicSettings?.site_logo || appStore.siteLogo || '', { allowRelative: true, allowDataUrl: true }) || '/logo.svg')
const year = new Date().getFullYear()
const isDark = ref(document.documentElement.classList.contains('dark'))
const themeLabel = computed(() => t(isDark.value ? 'home.switchToLight' : 'home.switchToDark'))

function toggleTheme() {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}
</script>

<style scoped>
.public-shell {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  background: var(--page);
  color: var(--ink);
  font-family: "IBM Plex Sans", "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif;
}
.public-width { width: min(66rem, calc(100% - 2rem)); margin-inline: auto; }
.public-main { flex: 1; min-width: 0; }
.public-bar { border-bottom: 1px solid var(--line); background: var(--panel); }
.public-nav, .public-brand, .public-tools, .public-footer { display: flex; align-items: center; }
.public-nav { min-height: 4rem; justify-content: space-between; gap: .5rem; flex-wrap: wrap; padding-block: .45rem; }
.public-brand { min-width: 0; max-width: 100%; gap: .65rem; min-height: 44px; font-size: 1.0625rem; font-weight: 600; }
.public-brand img { width: 2rem; height: 2rem; object-fit: contain; border-radius: .5rem; }
.public-brand span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.public-tools { margin-inline-start: auto; flex-wrap: wrap; gap: .3rem; }
.public-theme { display: grid; place-items: center; width: 44px; height: 44px; border-radius: 10px; color: var(--muted); }
.public-theme:hover { background: var(--tint); }
.public-tools :deep(button) { min-height: 44px; }
.public-shell :deep(:focus-visible) { outline: 2px solid var(--focus); outline-offset: 3px; }
.public-footer { flex-wrap: wrap; justify-content: space-between; gap: .5rem; border-top: 1px solid var(--line); padding-block: 1rem; font-size: .875rem; color: var(--muted); overflow-wrap: anywhere; }
@media (min-width: 640px) { .public-width { width: min(66rem, calc(100% - 4rem)); } }
</style>
