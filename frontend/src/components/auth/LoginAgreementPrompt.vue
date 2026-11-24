<template>
  <div
    v-if="mode === 'checkbox' && documents.length > 0"
    class="px-0.5"
  >
    <div class="flex items-start gap-2">
      <div class="min-w-0 flex-1">
        <p class="agreement-checkbox-copy text-[13px] leading-5">
          <HeroCheckbox id="login-agreement-consent" :model-value="accepted" @update:model-value="$event ? emit('accept') : emit('reject')">
            {{ t('legal.loginAgreementPrompt.checkboxPrefix') }}
          </HeroCheckbox>
          <template v-for="(doc, index) in documents" :key="doc.id || doc.title">
            <HeroLink
              :to="documentRoute(doc)"
              target="_blank"
              rel="noopener noreferrer"
              class="agreement-link"
            >
              {{ doc.title }}
            </HeroLink>
            <span v-if="index < documents.length - 1" class="agreement-separator">{{ t('legal.loginAgreementPrompt.documentSeparator') }}</span>
          </template>
        </p>
      </div>
    </div>
  </div>

  <div
    v-else-if="!accepted && documents.length > 0"
    class="agreement-banner"
  >
    <div class="flex items-start gap-3">
      <Icon name="shield" size="sm" class="agreement-banner-icon mt-0.5 flex-shrink-0" />
      <div class="min-w-0 flex-1">
        <p class="agreement-banner-title">{{ t('legal.loginAgreementPrompt.noticeTitle') }}</p>
        <p class="agreement-banner-desc mt-1">
          {{ t('legal.loginAgreementPrompt.noticeDescription') }}
        </p>
      </div>
      <HeroButton
        variant="primary"
        type="button"
        class="agreement-banner-btn flex-shrink-0"
        @press="emit('open')"
      >
        {{ t('legal.loginAgreementPrompt.viewTerms') }}
      </HeroButton>
    </div>
  </div>

  <HeroModal v-if="dialogVisible" :label="t('legal.loginAgreementPrompt.dialogTitle')">
    <div class="agreement-modal-header">
      <div class="flex items-start gap-4">
        <span class="agreement-modal-badge flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl">
          <Icon name="shield" size="md" />
        </span>
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <h2 class="agreement-modal-title">
              {{ t('legal.loginAgreementPrompt.dialogTitle') }}
            </h2>
            <span
              v-if="updatedAt"
              class="agreement-modal-date"
            >
              {{ updatedAt }}
            </span>
          </div>
          <p class="agreement-modal-desc mt-2">
            {{
              t('legal.loginAgreementPrompt.dialogDescription', {
                date: updatedAt || t('legal.loginAgreementPrompt.recently'),
              })
            }}
          </p>
        </div>
      </div>
    </div>

    <div class="agreement-modal-body max-h-[56vh] overflow-y-auto">
      <div class="mb-3 flex items-center justify-between gap-3">
        <p class="agreement-section-label">{{ t('legal.loginAgreementPrompt.relatedDocuments') }}</p>
      </div>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <HeroLink
          v-for="(doc, index) in documents"
          :key="doc.id || doc.title"
          :to="documentRoute(doc)"
          target="_blank"
          rel="noopener noreferrer"
          class="agreement-doc-card group flex min-h-[72px] w-full items-center gap-3 px-4 py-3 text-left"
        >
          <span class="agreement-doc-icon flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
            <Icon :name="documentIcon(index, doc.title)" size="sm" />
          </span>
          <span class="min-w-0 flex-1">
            <span class="agreement-doc-title block truncate">{{ doc.title }}</span>
          </span>
          <span class="agreement-doc-ext flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full">
            <Icon name="externalLink" size="sm" />
          </span>
        </HeroLink>
      </div>
    </div>

    <div class="agreement-modal-footer">
      <div class="grid grid-cols-2 gap-3">
        <HeroButton
          variant="secondary"
          type="button"
          full-width
          class="agreement-btn-secondary"
          @press="emit('reject')"
        >
          {{ t('legal.loginAgreementPrompt.reject') }}
        </HeroButton>
        <HeroButton
          variant="primary"
          type="button"
          full-width
          class="agreement-btn-primary"
          @press="emit('accept')"
        >
          {{ t('legal.loginAgreementPrompt.accept') }}
        </HeroButton>
      </div>
    </div>
  </HeroModal>
</template>

<script setup lang="ts">
import HeroButton from '@/components/hero/HeroButton.vue'
import HeroLink from '@/components/hero/HeroLink.vue'
import HeroCheckbox from '@/components/hero/HeroCheckbox.vue'
import HeroModal from '@/components/hero/HeroModal.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Icon from '@/components/icons/Icon.vue'
import type { LoginAgreementDocument } from '@/types'

const { t } = useI18n()

const props = withDefaults(defineProps<{
  accepted: boolean
  documents: LoginAgreementDocument[]
  mode: 'modal' | 'checkbox' | string
  updatedAt?: string
  visible: boolean
}>(), {
  updatedAt: ''
})

const emit = defineEmits<{
  accept: []
  reject: []
  open: []
}>()

const dialogVisible = computed(() => props.visible && documents.value.length > 0)
const documents = computed(() => props.documents.filter((doc) => doc.title.trim()))
const updatedAt = computed(() => props.updatedAt || '')
const accepted = computed(() => props.accepted)
const mode = computed(() => props.mode === 'checkbox' ? 'checkbox' : 'modal')

function documentRoute(doc: LoginAgreementDocument) {
  return {
    name: 'LegalDocument',
    params: {
      documentId: doc.id || doc.title,
    },
  }
}

function documentIcon(index: number, title: string): 'document' | 'shield' | 'globe' | 'cog' {
  const normalizedTitle = title.toLowerCase()
  if (
    normalizedTitle.includes('policy') ||
    normalizedTitle.includes('privacy') ||
    title.includes('政策') ||
    title.includes('隐私')
  ) {
    return 'shield'
  }
  if (
    normalizedTitle.includes('country') ||
    normalizedTitle.includes('region') ||
    title.includes('国家') ||
    title.includes('地区')
  ) {
    return 'globe'
  }
  if (index === 3) {
    return 'cog'
  }
  return 'document'
}
</script>

<style scoped>
.agreement-checkbox-copy {
  color: var(--muted);
}

.agreement-link {
  font-weight: 500;
  color: var(--accent);
  text-underline-offset: 4px;
  transition: color var(--duration-fast) var(--ease-out);
}

.agreement-link:hover {
  color: var(--accent-hover);
  text-decoration: underline;
}

.agreement-separator {
  color: var(--muted);
}

.agreement-banner {
  border-radius: 12px;
  border: 1px solid var(--line);
  background: var(--tint);
  padding: 0.875rem;
  font-size: 0.875rem;
  color: var(--ink);
}

.agreement-banner-icon {
  color: var(--accent);
}

.agreement-banner-title {
  font-weight: 500;
  color: var(--ink);
}

.agreement-banner-desc {
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--muted);
}

.agreement-banner-btn {
  min-height: 44px;
  border-radius: 10px;
  padding: 0.5rem 0.875rem;
  font-size: 0.8125rem;
  font-weight: 500;
  --button-bg: var(--accent);
  --button-bg-hover: var(--accent-hover);
  --button-bg-pressed: var(--accent-active);
  --button-fg: var(--on-accent);
  background: var(--accent);
  color: var(--on-accent);
  box-shadow: var(--shadow-btn-primary);
  transition:
    background-color var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out),
    transform var(--duration-fast) var(--ease-out);
}

.agreement-banner-btn:hover:not(:disabled),
.agreement-banner-btn[data-hovered="true"]:not(:disabled) {
  background: var(--accent-hover);
}

.agreement-banner-btn:active:not(:disabled),
.agreement-banner-btn[data-pressed="true"]:not(:disabled) {
  background: var(--accent-active);
  transform: scale(0.985);
}

button.agreement-banner-btn:focus-visible,
button.agreement-banner-btn[data-focus-visible="true"] {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
  box-shadow: var(--ring-focus);
}

@media (max-width: 420px) {
  .agreement-banner > .flex {
    flex-wrap: wrap;
  }

  .agreement-banner-btn {
    flex: 1 0 100%;
    width: 100%;
    margin-top: 0.25rem;
  }
}

.agreement-modal-header {
  border-bottom: 1px solid var(--line-subtle);
  padding-bottom: 1.25rem;
}

.agreement-modal-badge {
  border: 1px solid var(--line);
  background: var(--tint);
  color: var(--accent);
  box-shadow: var(--shadow-xs);
}

.agreement-modal-title {
  margin: 0;
  font-size: 1.25rem;
  line-height: 1.3;
  font-weight: 600;
  letter-spacing: -0.02em;
  text-wrap: balance;
  color: var(--ink);
}

.agreement-modal-date {
  border-radius: 9999px;
  border: 1px solid var(--line-subtle);
  background: var(--panel-subtle);
  padding: 0.1875rem 0.625rem;
  font-size: 0.75rem;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: var(--muted);
}

.agreement-modal-desc {
  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--muted);
}

.agreement-modal-body {
  padding-block: 1.25rem;
}

.agreement-section-label {
  font-size: 0.8125rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  color: var(--ink);
}

.agreement-doc-card {
  border-radius: 12px;
  border: 1px solid var(--line);
  background: var(--panel-subtle);
  color: var(--ink);
  text-decoration: none;
  transition:
    transform var(--duration-fast) var(--ease-out),
    border-color var(--duration-fast) var(--ease-out),
    background-color var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out);
}

.agreement-doc-card:hover {
  transform: translateY(-1px);
  border-color: var(--line-strong);
  background: var(--panel-elevated);
  box-shadow: var(--shadow-xs);
  text-decoration: none;
}

.dark .agreement-doc-card:hover {
  background: var(--tint-strong);
}

a.agreement-doc-card:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
  border-color: var(--focus);
  box-shadow: var(--ring-focus);
}

.agreement-doc-icon {
  border: 1px solid var(--line-subtle);
  background: var(--panel);
  color: var(--muted);
  transition:
    background-color var(--duration-fast) var(--ease-out),
    border-color var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out);
}

.agreement-doc-card:hover .agreement-doc-icon {
  border-color: var(--line);
  background: var(--tint);
  color: var(--accent);
}

.agreement-doc-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--ink);
}

.agreement-doc-ext {
  color: var(--muted);
  transition:
    background-color var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out);
}

.agreement-doc-card:hover .agreement-doc-ext {
  background: var(--tint);
  color: var(--accent);
}

.agreement-modal-footer {
  border-top: 1px solid var(--line-subtle);
  padding-top: 1rem;
}

.agreement-btn-secondary {
  min-height: 44px;
  border-radius: 10px;
  border: 1px solid var(--field-line);
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  --button-bg: var(--panel-elevated);
  --button-bg-hover: var(--tint);
  --button-bg-pressed: var(--tint-strong);
  --button-fg: var(--ink);
  background: var(--panel-elevated);
  color: var(--ink);
  box-shadow: var(--shadow-xs), var(--shadow-inset-top);
  transition:
    background-color var(--duration-fast) var(--ease-out),
    border-color var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out),
    transform var(--duration-fast) var(--ease-out);
}

.agreement-btn-secondary:hover:not(:disabled),
.agreement-btn-secondary[data-hovered="true"]:not(:disabled) {
  background: var(--tint);
  border-color: var(--field-line-hover);
}

.dark .agreement-btn-secondary {
  --button-bg-hover: var(--tint-strong);
  --button-bg-pressed: var(--tint);
}

.dark .agreement-btn-secondary:hover:not(:disabled),
.dark .agreement-btn-secondary[data-hovered="true"]:not(:disabled) {
  background: var(--tint-strong);
  border-color: var(--field-line-hover);
}

.agreement-btn-secondary:active:not(:disabled),
.agreement-btn-secondary[data-pressed="true"]:not(:disabled) {
  background: var(--tint-strong);
  transform: scale(0.985);
}

button.agreement-btn-secondary:focus-visible,
button.agreement-btn-secondary[data-focus-visible="true"] {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
  border-color: var(--focus);
  box-shadow: var(--ring-focus);
}

.agreement-btn-primary {
  min-height: 44px;
  border-radius: 10px;
  border: 1px solid transparent;
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  --button-bg: var(--accent);
  --button-bg-hover: var(--accent-hover);
  --button-bg-pressed: var(--accent-active);
  --button-fg: var(--on-accent);
  background: var(--accent);
  color: var(--on-accent);
  box-shadow: var(--shadow-btn-primary);
  transition:
    background-color var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out),
    transform var(--duration-fast) var(--ease-out);
}

.agreement-btn-primary:hover:not(:disabled),
.agreement-btn-primary[data-hovered="true"]:not(:disabled) {
  background: var(--accent-hover);
}

.agreement-btn-primary:active:not(:disabled),
.agreement-btn-primary[data-pressed="true"]:not(:disabled) {
  background: var(--accent-active);
  transform: scale(0.985);
}

button.agreement-btn-primary:focus-visible,
button.agreement-btn-primary[data-focus-visible="true"] {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
  box-shadow: var(--ring-focus);
}

.agreement-fade-enter-active,
.agreement-fade-leave-active {
  transition: opacity var(--duration-fast) var(--ease-out);
}

.agreement-fade-enter-from,
.agreement-fade-leave-to {
  opacity: 0;
}

.agreement-fade-enter-active > div,
.agreement-fade-leave-active > div {
  transition:
    transform var(--duration-fast) var(--ease-out),
    opacity var(--duration-fast) var(--ease-out);
}

.agreement-fade-enter-from > div,
.agreement-fade-leave-to > div {
  opacity: 0;
  transform: translateY(8px) scale(0.98);
}

@media (prefers-reduced-motion: reduce) {
  .agreement-link,
  .agreement-banner-btn,
  .agreement-doc-card,
  .agreement-doc-icon,
  .agreement-doc-ext,
  .agreement-btn-secondary,
  .agreement-btn-primary,
  .agreement-fade-enter-active,
  .agreement-fade-leave-active,
  .agreement-fade-enter-active > div,
  .agreement-fade-leave-active > div {
    transition: none;
  }

  .agreement-doc-card:hover,
  .agreement-banner-btn:active:not(:disabled),
  .agreement-banner-btn[data-pressed="true"]:not(:disabled),
  .agreement-btn-secondary:active:not(:disabled),
  .agreement-btn-secondary[data-pressed="true"]:not(:disabled),
  .agreement-btn-primary:active:not(:disabled),
  .agreement-btn-primary[data-pressed="true"]:not(:disabled) {
    transform: none;
  }
}
</style>
