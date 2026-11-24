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
.public-bar {
  position: sticky;
  top: 0;
  z-index: 30;
  border-bottom: 1px solid var(--line);
  background: var(--bar-bg);
  -webkit-backdrop-filter: saturate(160%) blur(12px);
  backdrop-filter: saturate(160%) blur(12px);
  box-shadow: var(--bar-shadow);
}
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .public-bar { background: var(--panel); }
}
.public-nav, .public-brand, .public-tools, .public-footer { display: flex; align-items: center; }
.public-nav { min-height: 4rem; justify-content: space-between; gap: .5rem; flex-wrap: wrap; padding-block: .45rem; }
.public-brand {
  min-width: 0;
  max-width: 100%;
  gap: .65rem;
  min-height: 44px;
  padding: .25rem .625rem .25rem .375rem;
  margin-inline-start: -.375rem;
  border-radius: var(--radius);
  color: var(--ink);
  font-size: 1.0625rem;
  font-weight: 600;
  letter-spacing: -.02em;
  text-decoration: none;
  transition: color var(--duration-fast) var(--ease-out), background-color var(--duration-fast) var(--ease-out);
}
.public-brand:hover {
  color: var(--ink);
  background: var(--tint);
  text-decoration: none;
}
.public-brand:active {
  background: var(--tint-strong);
  text-decoration: none;
}
.public-brand img {
  width: 2rem;
  height: 2rem;
  flex: none;
  object-fit: contain;
  border-radius: .5rem;
  box-shadow: var(--shadow-xs);
  transition: transform var(--duration-fast) var(--ease-out);
}
.public-brand:hover img { transform: translateY(-.5px); }
.public-brand span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.public-tools { margin-inline-start: auto; flex-wrap: wrap; gap: .375rem; }
.public-tools .public-theme {
  --button-bg: transparent;
  --button-bg-hover: var(--tint);
  --button-bg-pressed: var(--tint-strong);
  --button-fg: var(--muted);
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border-radius: var(--radius);
  border: 1px solid transparent;
  background: transparent;
  color: var(--muted);
  transition:
    color var(--duration-fast) var(--ease-out),
    background-color var(--duration-fast) var(--ease-out),
    border-color var(--duration-fast) var(--ease-out),
    transform var(--duration-fast) var(--ease-out);
}
.public-tools .public-theme:hover,
.public-tools .public-theme[data-hovered="true"] {
  --button-fg: var(--ink);
  color: var(--ink);
  background: var(--tint);
  border-color: var(--line-subtle);
}
.public-tools .public-theme:active,
.public-tools .public-theme[data-pressed="true"] {
  --button-fg: var(--ink);
  background: var(--tint-strong);
  transform: scale(.97);
}
.public-tools :deep(button) { min-height: 44px; }
.public-shell :deep(:focus-visible) { outline: 2px solid var(--focus); outline-offset: 2px; }
.public-footer {
  flex-wrap: wrap;
  justify-content: space-between;
  gap: .5rem;
  border-top: 1px solid var(--line-subtle);
  padding-block: 1.25rem;
  font-size: .875rem;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
  overflow-wrap: anywhere;
}
@media (min-width: 640px) { .public-width { width: min(66rem, calc(100% - 4rem)); } }
@media (prefers-reduced-motion: reduce) {
  .public-brand,
  .public-brand img,
  .public-tools .public-theme { transition: none; }
  .public-brand:hover img,
  .public-tools .public-theme:active,
  .public-tools .public-theme[data-pressed="true"] { transform: none; }
}
</style>
