<script setup>
import { ref, useId, nextTick } from 'vue'

defineProps({
  brand: { type: String, default: '배움상점' },
  homeHref: { type: String, default: '/' },
  items: { type: Array, default: () => [] },
  activeId: { type: [String, Number], default: '' },
  label: { type: String, default: '상점 메뉴' },
})
const open = ref(false)
const menuButton = ref(null)
const navigationId = `store-navigation-${useId()}`
function closeSelection() { open.value = false }
async function closeMenu() {
  if (!open.value) return
  open.value = false
  await nextTick()
  menuButton.value?.focus()
}
</script>

<template>
  <header class="store-navigation">
    <a class="store-navigation__brand" :href="homeHref"><slot name="brand">{{ brand }}</slot></a>
    <button ref="menuButton" class="store-navigation__toggle" type="button" :aria-expanded="open" :aria-controls="navigationId" @click="open = !open">{{ open ? '메뉴 닫기' : '메뉴 열기' }}<span aria-hidden="true">{{ open ? '−' : '+' }}</span></button>
    <nav :id="navigationId" :aria-label="label" :class="{ 'store-navigation__links--open': open }" class="store-navigation__links" @keydown.esc.stop.prevent="closeMenu">
      <template v-for="item in items" :key="item.id"><slot name="link" :item="item" :active="activeId === item.id" :close="closeSelection"><a :href="item.href" :aria-current="activeId === item.id ? 'page' : undefined" @click="closeSelection">{{ item.label }}</a></slot></template>
    </nav>
    <div v-if="$slots.actions" class="store-navigation__actions"><slot name="actions" /></div>
  </header>
</template>

<style scoped>
.store-navigation{display:flex;align-items:center;gap:30px;min-height:68px;padding:0 8px;border-bottom:1px solid var(--line,#dce4dc);color:var(--store-ink,#15222b)}.store-navigation :deep(a){color:inherit;text-decoration:none}.store-navigation__brand{flex-shrink:0;font-size:19px;font-weight:750;letter-spacing:-.7px}.store-navigation__links{display:flex;align-items:center;justify-content:center;gap:30px;flex:1}.store-navigation__links :deep(a){display:flex;align-items:center;min-height:48px;font-size:13px}.store-navigation__links :deep(a:hover),.store-navigation__links :deep(a[aria-current=page]){color:var(--teal-deep,#1d6057)}.store-navigation__links :deep(a[aria-current=page]){text-decoration:underline;text-decoration-color:var(--store-coral,#d7654a);text-underline-offset:8px}.store-navigation__actions{margin-left:auto;font-size:13px}.store-navigation__toggle{display:none;min-height:44px;padding:0 10px;border:0;border-radius:8px;background:transparent;color:inherit;font:inherit;font-size:12px;cursor:pointer}.store-navigation :deep(a:focus-visible),.store-navigation button:focus-visible{outline:3px solid var(--teal,#267c6d);outline-offset:3px;border-radius:5px}@media(max-width:700px){.store-navigation{flex-wrap:wrap;gap:10px;padding-block:8px}.store-navigation__toggle{display:flex;align-items:center;gap:12px;margin-left:auto}.store-navigation__toggle>span{font-size:24px}.store-navigation__links{display:none;order:4;flex-basis:100%;flex-direction:column;align-items:stretch;gap:0;padding:12px 0}.store-navigation__links--open{display:flex}.store-navigation__links :deep(a){padding-inline:10px}.store-navigation__actions{margin-left:8px}}
</style>
