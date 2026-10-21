<script setup>
defineProps({ items: { type: Array, default: () => [] }, label: { type: String, default: '이용 혜택' } })
</script>

<template>
  <ul class="store-benefits" :aria-label="label">
    <li v-for="item in items" :key="item.id" class="store-benefit">
      <div class="store-benefit-icon" aria-hidden="true"><slot name="icon" :item="item"><span v-if="item.icon">{{ item.icon }}</span><svg v-else viewBox="0 0 32 32" fill="none"><path d="m8 16 5 5L24 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="16" cy="16" r="14" stroke="currentColor" stroke-width="1.5"/></svg></slot></div>
      <h3><slot name="title" :item="item">{{ item.title }}</slot></h3>
      <p v-if="item.description">{{ item.description }}</p>
      <slot name="action" :item="item" />
    </li>
  </ul>
</template>

<style scoped>
.store-benefits{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,230px),1fr));gap:20px;margin:0;padding:0;list-style:none}.store-benefit{min-width:0;padding:29px 27px 31px;border:1px solid #e1e7df;border-radius:20px;background:#fff;color:var(--store-ink,#15222b)}.store-benefit-icon{display:flex;align-items:center;min-height:38px;margin-bottom:22px;color:var(--teal-deep,#1d6057);font-size:28px}.store-benefit-icon svg{width:34px;height:34px}.store-benefit h3{margin:0;font-size:23px;font-weight:700;line-height:1.4;letter-spacing:-.7px;overflow-wrap:anywhere}.store-benefit p{margin:13px 0 0;color:#59685e;font-size:14px;line-height:1.8;overflow-wrap:anywhere}
@media(max-width:600px){.store-benefits{gap:13px}.store-benefit{padding:24px}.store-benefit h3{font-size:21px}}
</style>
