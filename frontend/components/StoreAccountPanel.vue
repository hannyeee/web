<script setup>
import { useId } from 'vue'
import StoreButton from './StoreButton.vue'

defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  submitLabel: { type: String, default: '계속' },
  headingTag: { type: String, default: 'h2', validator: value => ['h1', 'h2', 'h3'].includes(value) },
  loadingLabel: { type: String, default: '처리 중…' },
  loading: Boolean,
  error: { type: String, default: '' },
})
const emit = defineEmits(['submit'])
const headingId = `store-account-${useId()}`
</script>

<template>
  <section class="store-account" :aria-labelledby="headingId">
    <div v-if="$slots.brand" class="store-account__brand"><slot name="brand" /></div>
    <header><component :is="headingTag" :id="headingId" class="store-account__title">{{ title }}</component><p v-if="description">{{ description }}</p></header>
    <slot name="notice" />
    <form class="store-account__form" :aria-busy="loading" @submit.prevent="!loading && emit('submit')">
      <fieldset :disabled="loading"><legend class="store-account__sr">{{ title }} 입력 정보</legend><slot /></fieldset>
      <p v-if="error" class="store-account__error" role="alert">{{ error }}</p>
      <StoreButton type="submit" :loading="loading" :loading-label="loadingLabel">{{ submitLabel }}</StoreButton>
    </form>
    <div v-if="$slots.footer" class="store-account__footer"><slot name="footer" /></div>
    <div v-if="$slots.privacy" class="store-account__privacy"><slot name="privacy" /></div>
  </section>
</template>

<style scoped>
.store-account{box-sizing:border-box;width:100%;max-width:480px;margin-inline:auto;padding:40px 28px;border:1px solid var(--line,#dce4dc);border-radius:24px;background:var(--paper,#fbfcf9);color:var(--store-ink,#15222b);text-align:center}.store-account__brand{display:grid;place-items:center;margin-bottom:26px}.store-account__title{margin:0;font-size:clamp(25px,4vw,34px);font-weight:700;line-height:1.3;letter-spacing:-1.2px;text-wrap:balance}.store-account header p{margin:13px 0 0;color:#52665b;font-size:14px;line-height:1.7;text-wrap:balance}.store-account__form{display:grid;gap:20px;margin-top:30px}.store-account fieldset{display:grid;gap:14px;min-width:0;margin:0;padding:0;border:0;text-align:left}.store-account__form>.store-account__error{margin:0;color:#9e4035;font-size:13px;text-align:left;line-height:1.6}.store-account__footer{margin-top:24px;color:var(--teal-deep,#1d6057);font-size:13px;line-height:1.8}.store-account__privacy{margin-top:30px;padding-top:23px;border-top:1px solid var(--line,#dce4dc);color:#52665b;font-size:11px;line-height:1.8}.store-account__sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}@media(max-width:480px){.store-account{padding:28px 18px;border-radius:20px}}
</style>
