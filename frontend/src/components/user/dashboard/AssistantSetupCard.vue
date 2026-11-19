<template><div ref="host"></div></template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { createElement } from 'react'
import { useReactHost } from '@/components/hero/useReactHost'
import { AssistantConfiguration } from '@/components/assistant/AssistantConfiguration'
import { keysAPI } from '@/api/keys'
import { useClipboard } from '@/composables/useClipboard'
import { useAppStore } from '@/stores/app'

const props = defineProps<{ balance: number }>()
const { t } = useI18n()
const appStore = useAppStore()
const { copyToClipboard } = useClipboard()
const model = ref<string | null>(null)
const models = ref<string[]>([])
const loadingModels = ref(true)
const modelListFailed = ref(false)
const projectKey = ref('')
const preparing = ref(false)
const loadingKey = ref(true)
const keyError = ref('')
const errorLabels: Record<string, string> = {
  ASSISTANT_KEY_BALANCE_REQUIRED: 'addBalance',
  ASSISTANT_KEY_DELETED: 'replaceKeyHint',
  ASSISTANT_KEY_GROUP_UNAVAILABLE: 'groupError',
  ASSISTANT_KEY_INACTIVE: 'inactiveKey',
  ASSISTANT_KEY_EXPIRED: 'expiredKey',
  ASSISTANT_KEY_QUOTA_EXHAUSTED: 'quotaKey',
  API_KEY_COUNT_EXCEEDED: 'keyLimit'
}
const baseUrl = computed(() => {
  const url = (appStore.cachedPublicSettings?.api_base_url?.trim() || window.location.origin).replace(/\/+$/, '')
  return url.endsWith('/v1') ? url : url + '/v1'
})

onMounted(() => {
  void loadModels()
  void loadExistingKey()
})

const host = useReactHost(() => createElement(AssistantConfiguration, {
  title: t('dashboard.assistantSetup.title'),
  modelHint: t('dashboard.assistantSetup.guideModel'),
  keyHint: t(projectKey.value ? 'dashboard.assistantSetup.guideExistingKey' : 'dashboard.assistantSetup.guideKey'),
  setupHint: t('dashboard.assistantSetup.instructions'),
  balanceHint: props.balance <= 0 && !keyError.value ? t('dashboard.assistantSetup.addBalance') : '',
  apiUrl: baseUrl.value,
  apiUrlLabel: t('dashboard.assistantSetup.apiUrl'),
  copyLabel: t('common.copy'),
  copyUrlLabel: t('dashboard.assistantSetup.copyUrl'),
  keyLabel: t('dashboard.apiKeys'),
  copyKeyLabel: t('dashboard.assistantSetup.copyKey'),
  keyPlaceholder: t(loadingKey.value ? 'common.loading' : 'dashboard.assistantSetup.keyPlaceholder'),
  copyConfigurationLabel: t('dashboard.assistantSetup.copyConfiguration'),
  modelLabel: t('dashboard.assistantSetup.selectModel'),
  copyModelLabel: t('dashboard.assistantSetup.copyModel', { model: model.value ?? '' }),
  modelPlaceholder: t(loadingModels.value ? 'common.loading' : 'dashboard.assistantSetup.noModels'),
  models: models.value,
  model: model.value,
  retryModelsLabel: modelListFailed.value ? t('dashboard.assistantSetup.retryModels') : '',
  projectKey: projectKey.value,
  preparing: preparing.value || loadingKey.value,
  acquireLabel: t(keyError.value === 'ASSISTANT_KEY_DELETED' ? 'dashboard.assistantSetup.replaceKey' : 'dashboard.assistantSetup.getKey'),
  error: keyError.value ? t('dashboard.assistantSetup.' + (errorLabels[keyError.value] ?? 'keyError')) : '',
  changeModel: (value) => { model.value = value },
  loadModels,
  acquireKey: () => prepareKey(keyError.value === 'ASSISTANT_KEY_DELETED'),
  copy: copyToClipboard,
}))

async function loadModels() {
  loadingModels.value = true
  modelListFailed.value = false
  try {
    const available = await keysAPI.listAssistantModels()
    const priority = (id: string) => {
      if (id === 'gpt-6.2-astra') return 0
      return /(?:^|[-_.])astra(?:$|[-_.])/i.test(id) ? 1 : 2
    }
    models.value = [...new Set(available.map(id => id.trim()).filter(Boolean))].sort((a, b) => priority(a) - priority(b))
    if (model.value === null || !models.value.includes(model.value)) model.value = models.value[0] ?? null
  } catch (error) {
    console.error('Failed to load assistant Chat models', error)
    modelListFailed.value = true
  } finally {
    loadingModels.value = false
  }
}

async function loadExistingKey() {
  try {
    projectKey.value = (await keysAPI.getAssistant()) ?? ''
  } catch (error) {
    keyError.value = (error as { reason?: string }).reason || 'unknown'
  } finally {
    loadingKey.value = false
  }
}

async function prepareKey(replaceDeleted: boolean) {
  if (preparing.value || loadingKey.value) return
  preparing.value = true
  try {
    projectKey.value = await keysAPI.ensureAssistant(replaceDeleted)
    keyError.value = ''
  } catch (error) {
    keyError.value = (error as { reason?: string }).reason || 'unknown'
  } finally {
    preparing.value = false
  }
}

</script>
