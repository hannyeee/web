<script setup>
import { computed } from 'vue'
import StoreButton from './StoreButton.vue'

const props = defineProps({
  title: { type: String, required: true },
  price: { type: [Number, String], required: true },
  currency: { type: String, default: 'KRW' },
  items: { type: Array, default: () => [] },
  note: { type: String, default: '' },
  actionLabel: { type: String, default: '구입하기' },
  loadingLabel: { type: String, default: '처리 중…' },
  disabled: Boolean,
  loading: Boolean,
})
const emit = defineEmits(['checkout'])
const formattedPrice = computed(() => typeof props.price === 'number' ? new Intl.NumberFormat('ko-KR', { style: 'currency', currency: props.currency, maximumFractionDigits: props.currency === 'KRW' ? 0 : 2 }).format(props.price) : props.price)
</script>

<template>
  <aside class="store-summary" :aria-label="`${title} 구매 요약`">
    <p class="store-summary__label">선택한 상품</p>
    <h3>{{ title }}</h3>
    <dl v-if="items.length"><div v-for="item in items" :key="item.label"><dt>{{ item.label }}</dt><dd>{{ item.value }}</dd></div></dl>
    <slot name="details" />
    <div class="store-summary__total"><span>총 금액</span><strong>{{ formattedPrice }}</strong></div>
    <p v-if="note" class="store-summary__note">{{ note }}</p>
    <StoreButton class="store-summary__action" :disabled="disabled" :loading="loading" :loading-label="loadingLabel" @click="emit('checkout')">{{ actionLabel }}</StoreButton>
    <slot />
  </aside>
</template>

<style scoped>
.store-summary{box-sizing:border-box;padding:28px;border:1px solid var(--line,#dce4dc);border-radius:20px;background:var(--paper,#fbfcf9);color:var(--store-ink,#15222b)}.store-summary__label{margin:0 0 8px;color:#52665b;font-size:12px}.store-summary h3{margin:0;font-size:23px;line-height:1.4;letter-spacing:-.7px;overflow-wrap:anywhere}.store-summary dl{display:grid;gap:13px;margin:25px 0}.store-summary dl>div{display:flex;justify-content:space-between;gap:20px;font-size:13px;line-height:1.6}.store-summary dt{color:#52665b}.store-summary dd{min-width:0;margin:0;text-align:right;overflow-wrap:anywhere}.store-summary__total{display:grid;gap:8px;margin-top:25px;padding-top:22px;border-top:1px solid var(--line,#dce4dc)}.store-summary__total>span{font-size:12px;color:#52665b}.store-summary__total strong{font-size:30px;letter-spacing:-1px;font-variant-numeric:tabular-nums}.store-summary__note{margin:13px 0 0;color:#52665b;font-size:12px;line-height:1.7}.store-summary__action{width:100%;margin-top:22px}
</style>
