<script setup>
defineProps({ items: { type: Array, default: () => [] }, modelValue: { type: [String, Number], default: null }, label: { type: String, default: '카테고리' } })
const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <nav class="store-category-nav" :aria-label="label">
    <ul class="store-category-list">
      <li v-for="item in items" :key="item.id">
        <component :is="item.href ? 'a' : 'button'" class="store-category" :class="{ 'is-selected': modelValue === item.id }" :href="item.href || undefined" :type="item.href ? undefined : 'button'" :aria-current="item.href && modelValue === item.id ? 'page' : undefined" :aria-pressed="item.href ? undefined : modelValue === item.id" @click="!item.href && emit('update:modelValue', item.id)">
          <span class="store-category-image"><slot name="image" :item="item"><img v-if="item.image" :src="item.image" alt="" loading="lazy" /><span v-else aria-hidden="true">{{ item.label.slice(0, 1) }}</span></slot></span>
          <span>{{ item.label }}</span>
        </component>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.store-category-nav{max-width:100%;padding:8px 3px 13px;overflow-x:auto;scrollbar-width:thin}.store-category-list{display:flex;gap:30px;min-width:max-content;margin:0;padding:0;list-style:none}.store-category{display:flex;align-items:center;flex-direction:column;gap:14px;min-width:100px;padding:5px 5px 12px;border:0;border-bottom:2px solid transparent;background:transparent;color:var(--store-ink,#15222b);font:inherit;font-size:13px;font-weight:600;text-decoration:none;cursor:pointer}.store-category-image{display:grid;place-items:center;width:100px;height:86px;overflow:hidden;border-radius:14px;background:var(--store-paper,#f4f6f2);color:var(--teal-deep,#1d6057);font-size:32px}.store-category-image img{width:100%;height:100%;object-fit:contain}.store-category:hover,.store-category.is-selected{border-bottom-color:var(--teal,#267c6d)}.store-category:focus-visible{outline:3px solid var(--teal,#267c6d);outline-offset:1px;border-radius:5px}
@media(max-width:600px){.store-category-list{gap:16px}.store-category{min-width:83px;font-size:12px}.store-category-image{width:83px;height:74px}}
</style>
