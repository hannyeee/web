<script setup>
defineProps({
  variant: { type: String, default: 'primary', validator: value => ['primary', 'secondary', 'quiet'].includes(value) },
  type: { type: String, default: 'button' },
  disabled: Boolean,
  loading: Boolean,
  loadingLabel: { type: String, default: '처리 중…' },
})
</script>

<template>
  <button class="store-button" :class="`store-button--${variant}`" :type="type" :disabled="disabled || loading" :aria-busy="loading || undefined">
    <template v-if="loading">{{ loadingLabel }}</template>
    <slot v-else />
  </button>
</template>

<style scoped>
.store-button{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:44px;padding:11px 23px;border:1px solid transparent;border-radius:999px;font:inherit;font-size:14px;font-weight:600;line-height:1.4;cursor:pointer;transition:background-color .16s ease}
.store-button--primary{background:var(--teal,#267c6d);color:#fff}.store-button--primary:hover{background:var(--teal-deep,#1d6057)}
.store-button--secondary{border-color:var(--store-ink,#15222b);background:transparent;color:var(--store-ink,#15222b)}.store-button--secondary:hover{background:var(--store-paper,#f4f6f2)}
.store-button--quiet{background:transparent;color:var(--teal-deep,#1d6057)}.store-button--quiet:hover{text-decoration:underline;text-underline-offset:4px}
.store-button:focus-visible{outline:3px solid var(--teal,#267c6d);outline-offset:4px}.store-button:disabled{opacity:.5;cursor:default}
@media(prefers-reduced-motion:reduce){.store-button{transition:none}}
</style>
