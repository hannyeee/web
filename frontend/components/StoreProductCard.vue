<script setup>
import { ref } from 'vue'
defineProps({ product: { type: Object, required: true }, actionLabel: { type: String, default: '자세히 보기' } })
const emit = defineEmits(['select'])
const failedImage = ref('')
</script>

<template>
  <article class="store-product-card">
    <div class="store-product-copy">
      <p v-if="product.badge" class="store-product-badge">{{ product.badge }}</p>
      <p v-if="product.category" class="store-product-category">{{ product.category }}</p>
      <h3>{{ product.title }}</h3>
      <p v-if="product.description" class="store-product-description">{{ product.description }}</p>
      <p v-if="product.price !== undefined && product.price !== null" class="store-product-price">{{ product.price }}</p>
    </div>
    <div class="store-product-image"><slot name="image" :product="product"><img v-if="product.image && failedImage !== product.image" :src="product.image" :alt="product.imageAlt || product.title" loading="lazy" @error="failedImage = product.image" /><span v-else class="store-product-placeholder" aria-hidden="true">{{ product.title.slice(0, 1) }}</span></slot></div>
    <div class="store-product-bottom">
      <ul v-if="product.swatches?.length" class="store-product-swatches" aria-label="색상 옵션">
        <li v-for="(swatch, index) in product.swatches" :key="index" :style="{ backgroundColor: typeof swatch === 'string' ? swatch : swatch.color }"><span class="store-visually-hidden">{{ typeof swatch === 'string' ? swatch : swatch.label }}</span></li>
      </ul>
      <slot name="action" :product="product">
        <a v-if="product.href" class="store-product-action" :href="product.href" :aria-label="`${product.title} ${actionLabel}`">{{ actionLabel }}</a>
        <button v-else type="button" class="store-product-action" :aria-label="`${product.title} ${actionLabel}`" @click="emit('select', product)">{{ actionLabel }}</button>
      </slot>
    </div>
  </article>
</template>

<style scoped>
.store-product-card{display:flex;flex-direction:column;min-width:0;height:100%;overflow:hidden;border:1px solid #e1e7df;border-radius:22px;background:#fff;color:var(--store-ink,#15222b)}.store-product-copy{padding:29px 28px 0}.store-product-badge{margin:0 0 10px;color:#a33d27;font-size:12px;font-weight:700}.store-product-category{margin:0 0 8px;color:#617168;font-size:12px}.store-product-copy h3{margin:0;font-size:25px;font-weight:700;line-height:1.3;letter-spacing:-.8px;overflow-wrap:anywhere}.store-product-description{margin:11px 0 0;color:#526158;font-size:14px;line-height:1.7;overflow-wrap:anywhere}.store-product-price{margin:13px 0 0;font-size:14px;font-weight:600;font-variant-numeric:tabular-nums}.store-product-image{display:grid;place-items:center;flex:1;min-height:200px;margin:22px 18px 0;aspect-ratio:1.35;overflow:hidden}.store-product-image img{width:100%;height:100%;object-fit:contain}.store-product-placeholder{display:grid;place-items:center;width:80%;height:85%;border-radius:18px;background:var(--store-sage,#a6b9a8);font-size:64px;font-weight:700}.store-product-bottom{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:71px;padding:17px 28px 23px}.store-product-action{margin-left:auto;padding:5px 0;border:0;background:transparent;color:var(--teal-deep,#1d6057);font:inherit;font-size:13px;font-weight:600;text-decoration:none;cursor:pointer}.store-product-action:hover{text-decoration:underline;text-underline-offset:4px}.store-product-action:focus-visible{outline:3px solid var(--teal,#267c6d);outline-offset:4px;border-radius:2px}.store-product-swatches{display:flex;flex-wrap:wrap;gap:6px;margin:0;padding:0;list-style:none}.store-product-swatches li{width:14px;height:14px;border:1px solid #8a958d;border-radius:50%}.store-visually-hidden{position:absolute;width:1px;height:1px;padding:0;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap}
@media(max-width:600px){.store-product-copy{padding:24px 23px 0}.store-product-copy h3{font-size:23px}.store-product-image{min-height:185px}.store-product-bottom{padding-right:23px;padding-left:23px}}
</style>
