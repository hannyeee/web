<script setup>
defineProps({ title: { type: String, required: true }, description: { type: String, default: '' }, as: { type: String, default: 'h2', validator: value => ['h1', 'h2', 'h3', 'h4'].includes(value) } })
</script>

<template>
  <header class="store-section-header">
    <component :is="as" class="store-section-title"><slot name="title">{{ title }}<span v-if="description">{{ ` ${description}` }}</span></slot></component>
    <div v-if="$slots.actions" class="store-section-actions"><slot name="actions" /></div>
  </header>
</template>

<style scoped>
.store-section-header{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;margin-bottom:26px}.store-section-title{max-width:900px;margin:0;color:var(--store-ink,#15222b);font:inherit;font-size:clamp(25px,3.3vw,38px);font-weight:700;line-height:1.25;letter-spacing:-1.4px;overflow-wrap:anywhere;word-break:keep-all;text-wrap:balance}.store-section-title span{color:#617168}.store-section-actions{flex-shrink:0}
@media(max-width:600px){.store-section-header{align-items:flex-start;gap:16px}.store-section-title{letter-spacing:-.8px}.store-section-actions{max-width:35%}}
</style>
