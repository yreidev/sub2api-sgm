<template>
  <component :is="isEmbedded ? AppLayout : PublicLayout">
    <template v-if="!isEmbedded" #navigation>
      <HeroLink
        class="plaza-account-link"
        :to="authStore.isAdmin ? '/admin/dashboard' : { path: '/login', query: { redirect: '/model-plaza' } }"
      >
        {{ t(authStore.isAdmin ? 'modelPlaza.nav.backToDashboard' : 'modelPlaza.nav.login') }}
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
  min-height: 44px;
  border-radius: 10px;
  padding-inline: 1.1rem;
  background: var(--accent);
  color: var(--on-accent);
  font-weight: 500;
}
.plaza-account-link:hover { filter: brightness(.93); }
</style>
