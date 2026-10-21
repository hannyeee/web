<script setup>
import { computed, ref, useId } from 'vue'

const props = defineProps({
  images: { type: Array, default: () => [] },
  modelValue: { type: Number, default: undefined },
  label: { type: String, default: '상품 이미지' },
})
const emit = defineEmits(['update:modelValue'])
const localIndex = ref(0)
const index = computed(() => Math.max(0, Math.min(props.modelValue ?? localIndex.value, props.images.length - 1)))
const image = computed(() => props.images[index.value])
const stageId = `store-gallery-${useId()}`
const failedSrc = ref('')
function select(next) {
  localIndex.value = next
  emit('update:modelValue', next)
}
</script>

<template>
  <section class="store-gallery" :aria-label="label" aria-roledescription="캐러셀">
    <div :id="stageId" class="store-gallery__stage">
      <img v-if="image && failedSrc !== image.src" :key="image.src" :src="image.src" :alt="image.alt || label" @error="failedSrc = image.src" />
      <div v-else class="store-gallery__placeholder"><slot name="placeholder">{{ image ? '이미지를 불러올 수 없습니다.' : '등록된 이미지가 없습니다.' }}</slot></div>
      <div v-if="images.length > 1" class="store-gallery__arrows">
        <button type="button" :aria-controls="stageId" aria-label="이전 상품 이미지" :disabled="index === 0" @click="select(index - 1)">‹</button>
        <button type="button" :aria-controls="stageId" aria-label="다음 상품 이미지" :disabled="index === images.length - 1" @click="select(index + 1)">›</button>
      </div>
    </div>
    <div v-if="images.length > 1" class="store-gallery__thumbnails" aria-label="이미지 선택">
      <button v-for="(item, position) in images" :key="`${item.src}-${position}`" type="button" :aria-label="`${position + 1}번째 이미지: ${item.alt || label}`" :aria-pressed="index === position" :aria-controls="stageId" @click="select(position)"><img :src="item.src" alt="" loading="lazy" /></button>
    </div>
    <p v-if="images.length" class="store-gallery__caption" aria-live="polite">{{ index + 1 }} / {{ images.length }}<span v-if="image.caption"> · {{ image.caption }}</span></p>
  </section>
</template>

<style scoped>
.store-gallery{min-width:0;color:var(--store-ink,#15222b)}.store-gallery__stage{position:relative;display:grid;place-items:center;aspect-ratio:1.15;overflow:hidden;border-radius:22px;background:#e8ede6}.store-gallery__stage>img{width:100%;height:100%;min-height:0;object-fit:contain}.store-gallery__placeholder{padding:40px;text-align:center;color:#52665b;font-size:14px;line-height:1.7}.store-gallery__arrows{position:absolute;inset:50% 14px auto;display:flex;justify-content:space-between;pointer-events:none;transform:translateY(-50%)}.store-gallery__arrows button{display:grid;place-items:center;width:44px;height:44px;border:0;border-radius:50%;background:var(--paper,#fbfcf9);color:var(--store-ink,#15222b);font:inherit;font-size:30px;line-height:1;cursor:pointer;pointer-events:auto;box-shadow:0 2px 10px #15222b0d}.store-gallery__arrows button:disabled{opacity:.35;cursor:default}.store-gallery__thumbnails{display:flex;justify-content:safe center;gap:10px;max-width:100%;overflow:auto;padding:14px 4px 5px}.store-gallery__thumbnails button{flex:0 0 56px;width:56px;height:56px;padding:4px;border:2px solid transparent;border-radius:12px;background:#e8ede6;cursor:pointer}.store-gallery__thumbnails button[aria-pressed=true]{border-color:var(--teal,#267c6d)}.store-gallery__thumbnails img{width:100%;height:100%;object-fit:contain}.store-gallery button:focus-visible{outline:3px solid var(--teal,#267c6d);outline-offset:3px}.store-gallery__caption{margin:10px 0 0;color:#52665b;font-size:12px;text-align:center;font-variant-numeric:tabular-nums}@media(max-width:480px){.store-gallery__stage{border-radius:16px}.store-gallery__arrows{inset-inline:8px}}
</style>
