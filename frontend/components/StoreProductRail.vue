<script setup>
import { onBeforeUnmount, onMounted, ref, watch, nextTick } from 'vue'
import StoreSectionHeader from './StoreSectionHeader.vue'
import StoreProductCard from './StoreProductCard.vue'

const props = defineProps({ title: { type: String, required: true }, description: { type: String, default: '' }, products: { type: Array, default: () => [] }, label: { type: String, default: '' } })
const emit = defineEmits(['select'])
const track = ref(null)
const canPrevious = ref(false)
const canNext = ref(false)
let resizeObserver
function updateEdges() {
  if (!track.value) return
  canPrevious.value = track.value.scrollLeft > 2
  canNext.value = track.value.scrollLeft + track.value.clientWidth < track.value.scrollWidth - 2
}
function move(direction) {
  const element = track.value
  if (!element) return
  const reduced = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  element.scrollBy({ left: direction * element.clientWidth * .85, behavior: reduced ? 'auto' : 'smooth' })
}
onMounted(() => {
  updateEdges()
  window.addEventListener('resize', updateEdges)
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(updateEdges)
    resizeObserver.observe(track.value)
  }
})
watch(() => props.products, async () => { await nextTick(); updateEdges() }, { deep: true })
onBeforeUnmount(() => { window.removeEventListener('resize', updateEdges); resizeObserver?.disconnect() })
</script>

<template>
  <section class="store-product-rail" :aria-label="label || title">
    <StoreSectionHeader :title="title" :description="description"><template v-if="$slots.heading" #title><slot name="heading" /></template></StoreSectionHeader>
    <ul ref="track" class="store-rail-track" :aria-label="`${label || title} 목록`" @scroll.passive="updateEdges">
      <li v-for="product in products" :key="product.id" class="store-rail-item"><slot name="product" :product="product"><StoreProductCard :product="product" @select="emit('select', $event)" /></slot></li>
    </ul>
    <div class="store-rail-controls">
      <button type="button" :disabled="!canPrevious" :aria-label="`${label || title} 이전 항목`" @click="move(-1)"><span aria-hidden="true">‹</span></button>
      <button type="button" :disabled="!canNext" :aria-label="`${label || title} 다음 항목`" @click="move(1)"><span aria-hidden="true">›</span></button>
    </div>
  </section>
</template>

<style scoped>
.store-product-rail{min-width:0;padding:10px 0}.store-rail-track{display:flex;gap:22px;margin:0 -5px;padding:5px 5px 14px;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:thin;scrollbar-color:var(--store-sage,#a6b9a8) transparent}.store-rail-item{flex:0 0 350px;min-width:0;list-style:none;scroll-snap-align:start}.store-rail-controls{display:flex;justify-content:flex-end;gap:12px;margin-top:12px}.store-rail-controls button{display:grid;place-items:center;width:40px;height:40px;padding:0;border:0;border-radius:50%;background:#e4eae1;color:var(--store-ink,#15222b);font:inherit;font-size:31px;line-height:1;cursor:pointer}.store-rail-controls button:hover:enabled{background:var(--store-sage,#a6b9a8)}.store-rail-controls button:disabled{opacity:.35;cursor:default}.store-rail-controls button:focus-visible{outline:3px solid var(--teal,#267c6d);outline-offset:3px}
@media(max-width:600px){.store-rail-track{gap:15px}.store-rail-item{flex-basis:min(310px,84vw)}}
@media(prefers-reduced-motion:reduce){.store-rail-track{scroll-behavior:auto}}
</style>
