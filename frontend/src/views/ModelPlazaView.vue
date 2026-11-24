<template>
  <component :is="isEmbedded ? AppLayout : PublicLayout">
    <template v-if="!isEmbedded" #navigation>
      <HeroLink
        class="plaza-account-link"
        :to="authStore.isAdmin ? '/admin/dashboard' : authStore.isAuthenticated ? '/dashboard' : { path: '/login', query: { redirect: '/model-plaza' } }"
      >
        {{ t(authStore.isAuthenticated ? 'modelPlaza.nav.backToDashboard' : 'modelPlaza.nav.login') }}
      </HeroLink>
    </template>
    <ModelPlazaContent
      :response="data" :loading="loading" :error="loadFailed" :embedded="isEmbedded"
      @retry="loadPlaza"
    />
  </component>
</template>

<script setup lang="ts">
import HeroLink from '@/components/hero/HeroLink.vue'
import { computed, defineAsyncComponent, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import PublicLayout from '@/components/layout/PublicLayout.vue'
import ModelPlazaContent from '@/components/modelPlaza/ModelPlazaContent.vue'
import { getModelPlaza, type ModelPlazaResponse } from '@/api/modelPlaza'
import { useAuthStore } from '@/stores/auth'

const AppLayout = defineAsyncComponent(() => import('@/components/layout/AppLayout.vue'))
const route = useRoute()
const { t } = useI18n()
const authStore = useAuthStore()
const isEmbedded = computed(() => route.query.embedded === '1' && authStore.isAdmin)
const data = ref<ModelPlazaResponse | null>(null)
const loading = ref(true)
const loadFailed = ref(false)

async function loadPlaza() {
  loading.value = true
  loadFailed.value = false
  try {
    data.value = await getModelPlaza()
  } catch (error) {
    console.error('Failed to load model plaza', error)
    loadFailed.value = true
  } finally {
    loading.value = false
  }
}

onMounted(loadPlaza)
</script>

<style scoped>
.plaza-account-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  border-radius: 10px;
  padding-inline: 1.125rem;
  background: var(--accent);
  color: var(--on-accent);
  font-size: .9375rem;
  font-weight: 500;
  white-space: nowrap;
  text-decoration: none;
  box-shadow: var(--shadow-btn-primary, 0 1px 2px rgb(18 69 79 / 24%), inset 0 1px 0 rgb(255 255 255 / 16%));
  transition:
    background-color var(--duration-fast, 150ms) var(--ease-out, cubic-bezier(0.22, 1, 0.36, 1)),
    box-shadow var(--duration-fast, 150ms) var(--ease-out, cubic-bezier(0.22, 1, 0.36, 1)),
    transform var(--duration-fast, 150ms) var(--ease-out, cubic-bezier(0.22, 1, 0.36, 1));
}
.plaza-account-link:hover {
  background: var(--accent-hover, #12454f);
}
.plaza-account-link:active {
  background: var(--accent-active, #0e3840);
  transform: scale(0.985);
}
.plaza-account-link:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
  box-shadow: var(--ring-focus, 0 0 0 3px rgb(18 108 122 / 18%));
}
@media (prefers-reduced-motion: reduce) {
  .plaza-account-link {
    transition: none;
  }
  .plaza-account-link:active {
    transform: none;
  }
}
</style>
