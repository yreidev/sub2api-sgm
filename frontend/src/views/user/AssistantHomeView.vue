<template>
  <div v-if="user" ref="overviewHost"></div>
  <Teleport v-if="user && usageHost" :to="usageHost">
    <AssistantUsageOverview :key="user.id" />
  </Teleport>
  <Teleport v-if="user && paymentStarted" :to="paymentHost">
    <PaymentView :key="user.id" inline-recharge :preview-checkout="previewCheckout" @credited="onCredited" />
  </Teleport>
  <Teleport v-if="user && configurationHost" :to="configurationHost">
    <AssistantSetupCard :key="user.id" :balance="user.balance" />
  </Teleport>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, onBeforeMount, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { createElement } from 'react'
import { useMediaQuery } from '@vueuse/core'
import { useReactHost } from '@/components/hero/useReactHost'
import { AssistantOverview } from '@/components/assistant/AssistantOverview'
import '@fontsource/ibm-plex-sans/latin-400.css'
import '@fontsource/ibm-plex-sans/latin-500.css'
import '@fontsource/ibm-plex-sans/latin-600.css'
import '@fontsource/ibm-plex-mono/latin-400.css'
import 'virtual:sgm-heroui.css'
import '@/components/assistant/heroui.css'
import { useRoute, useRouter } from 'vue-router'
import AssistantSetupCard from '@/components/user/dashboard/AssistantSetupCard.vue'
import AssistantUsageOverview from '@/components/user/dashboard/AssistantUsageOverview.vue'
import { assistantPaymentStorageKey, readPaymentRecoverySnapshot } from '@/components/payment/paymentFlow'
import { useAuthStore, useAppStore } from '@/stores'
import { formatCurrency } from '@/utils/format'
import { sanitizeUrl } from '@/utils/url'
import { FeatureFlags, isFeatureFlagEnabled } from '@/utils/featureFlags'

const PaymentView = defineAsyncComponent(() => import('./PaymentView.vue'))
const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()
// This route uses a light palette, including payment and menu portals under body.
let previousDark = false
onBeforeMount(() => {
  previousDark = document.documentElement.classList.contains('dark')
  document.documentElement.classList.remove('dark')
})
onBeforeUnmount(() => document.documentElement.classList.toggle('dark', previousDark))

const user = computed(() => authStore.user)
const siteLogo = computed(() => sanitizeUrl(appStore.siteLogo || '', { allowRelative: true, allowDataUrl: true }) || '/logo.svg')
const paymentHost = document.createElement('div')
const usageHost = shallowRef<HTMLDivElement | null>(null)
const configurationHost = shallowRef<HTMLDivElement | null>(null)

function setPaymentHost(element: HTMLDivElement | null) {
  if (element) element.append(paymentHost)
  else paymentHost.remove()
}

function setConfigurationHost(element: HTMLDivElement | null) {
  configurationHost.value = element
}

function setUsageHost(element: HTMLDivElement | null) {
  usageHost.value = element
}

const canRecharge = computed(() => {
  const settings = appStore.cachedPublicSettings
  return settings?.payment_enabled && !settings.payment_balance_disabled
})
const previewCheckout = computed(() =>
  import.meta.env.DEV && import.meta.env.VITE_SGM_RECHARGE_PREVIEW === '1' &&
  appStore.publicSettingsLoaded && !canRecharge.value
)
const refreshing = ref(false)
const rechargeOpen = ref(false)
const paymentStarted = ref(false)

const showModelPlaza = computed(() => isFeatureFlagEnabled(FeatureFlags.modelPlaza))
const isMobileNav = useMediaQuery('(max-width: 639px)')

const overviewHost = useReactHost(() => {
  if (!user.value) return null
  return createElement(AssistantOverview, {
    title: t('dashboard.assistantSetup.homeTitle'),
    siteName: appStore.siteName,
    siteLogo: siteLogo.value,
    modelPlazaLabel: t('nav.modelPlaza'),
    modelPlazaHref: '/model-plaza',
    showMobileModelPlaza: showModelPlaza.value && isMobileNav.value,
    openModelPlaza: showModelPlaza.value ? () => { void router.push('/model-plaza') } : undefined,
    accountLabel: t('nav.myAccount'),
    adminLabel: t('dashboard.assistantSetup.backToAdmin'),
    logoutLabel: t('nav.logout'),
    balanceLabel: t('common.availableBalance'),
    balance: formatCurrency(user.value.balance),
    refreshLabel: t('dashboard.assistantSetup.refreshBalance'),
    rechargeLabel: t('dashboard.assistantSetup.recharge'),
    closeLabel: t('dashboard.assistantSetup.closeRecharge'),
    contactAdmin: appStore.publicSettingsLoaded && user.value.balance <= 0 ? t('dashboard.assistantSetup.contactAdmin') : '',
    showRecharge: Boolean(canRecharge.value || previewCheckout.value || paymentStarted.value),
    rechargeOpen: rechargeOpen.value,
    refreshing: refreshing.value,
    refreshBalance,
    setRechargeOpen,
    openAdmin: authStore.isAdmin ? () => { void router.push('/admin/dashboard') } : undefined,
    logout,
    paymentHost: setPaymentHost,
    usageHost: setUsageHost,
    configurationHost: setConfigurationHost,
  })
})

function setRechargeOpen(open: boolean) {
  rechargeOpen.value = open
  if (open) paymentStarted.value = true
}

function openRecovery() {
  if (!user.value) return
  const recovery = readPaymentRecoverySnapshot(localStorage.getItem(assistantPaymentStorageKey(user.value.id)), { allowExpired: true })
  if (route.query.recharge === '1' || recovery || localStorage.getItem(assistantPaymentStorageKey(user.value.id) + '.uncertain')) {
    rechargeOpen.value = true
    paymentStarted.value = true
  }
}

async function refreshBalance() {
  if (refreshing.value) return
  refreshing.value = true
  try {
    await authStore.refreshUser()
  } catch (error) {
    console.error('Failed to refresh assistant account balance', error)
    appStore.showError(t('dashboard.assistantSetup.balanceError'))
  } finally {
    refreshing.value = false
  }
}

function onCredited() {
  rechargeOpen.value = false
  if (route.query.recharge === '1') {
    const query = { ...route.query }
    delete query.recharge
    void router.replace({ path: '/dashboard', query })
  }
}

async function logout() {
  await authStore.logout()
  await router.replace('/login')
}

watch(() => route.query.recharge, openRecovery)
onMounted(() => {
  if (user.value) localStorage.removeItem('sgm.dashboard.view.' + user.value.id)
  openRecovery()
  void refreshBalance()
  void appStore.fetchPublicSettings()
})
</script>
