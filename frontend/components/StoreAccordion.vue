<script setup>
import { ref, useId } from 'vue'

const props = defineProps({
  items: { type: Array, default: () => [] },
  label: { type: String, default: '자주 묻는 질문' },
  defaultOpen: { type: Array, default: () => [] },
})
const emit = defineEmits(['change'])
const openIds = ref(new Set(props.defaultOpen))
const groupId = `store-faq-${useId()}`
function toggle(item, event) {
  const next = new Set(openIds.value)
  if (event.target.open) next.add(item.id)
  else next.delete(item.id)
  openIds.value = next
  emit('change', [...next])
}
</script>

<template>
  <section class="store-faq" :aria-label="label">
    <details v-for="(item, index) in items" :key="item.id" :open="openIds.has(item.id)" @toggle="toggle(item, $event)">
      <summary :id="`${groupId}-${index}`">{{ item.title }}<span aria-hidden="true">+</span></summary>
      <div class="store-faq__answer" :aria-labelledby="`${groupId}-${index}`"><slot name="answer" :item="item">{{ item.content }}</slot></div>
    </details>
  </section>
</template>

<style scoped>
.store-faq{border-top:1px solid var(--line,#dce4dc);color:var(--store-ink,#15222b)}.store-faq details{border-bottom:1px solid var(--line,#dce4dc)}.store-faq summary{display:flex;align-items:center;justify-content:space-between;gap:24px;min-height:64px;padding:16px 4px;box-sizing:border-box;font-size:16px;font-weight:650;line-height:1.5;list-style:none;cursor:pointer}.store-faq summary::-webkit-details-marker{display:none}.store-faq summary>span{flex-shrink:0;color:var(--teal-deep,#1d6057);font-size:27px;font-weight:400}.store-faq details[open] summary>span{transform:rotate(45deg)}.store-faq summary:focus-visible{outline:3px solid var(--teal,#267c6d);outline-offset:3px;border-radius:6px}.store-faq__answer{max-width:75ch;padding:0 40px 24px 4px;color:#52665b;font-size:14px;line-height:1.9;white-space:pre-line;overflow-wrap:anywhere}
</style>
