<script setup>
import { computed, useAttrs, useId, useSlots } from 'vue'

defineOptions({ inheritAttrs: false })
const props = defineProps({
  modelValue: Boolean,
  label: { type: String, required: true },
  id: { type: String, default: '' },
  hint: { type: String, default: '' },
  error: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue'])
const generatedId = useId()
const attrs = useAttrs()
const slots = useSlots()
const inputId = computed(() => props.id || `store-checkbox-${generatedId}`)
function descriptionIds() {
  const ids = [attrs['aria-describedby'], (props.hint || slots.description) && `${inputId.value}-hint`, props.error && `${inputId.value}-error`].filter(Boolean).join(' ').split(/\s+/).filter(Boolean)
  return [...new Set(ids)].join(' ') || undefined
}
</script>

<template>
  <div class="store-checkbox" :class="{ 'store-checkbox--invalid': error }">
    <div class="store-checkbox__row">
      <input v-bind="$attrs" :id="inputId" type="checkbox" :checked="modelValue" :aria-invalid="error ? 'true' : undefined" :aria-describedby="descriptionIds()" @change="emit('update:modelValue', $event.target.checked)" />
      <label :for="inputId"><slot>{{ label }}</slot></label>
    </div>
    <div v-if="hint || $slots.description" :id="`${inputId}-hint`" class="store-checkbox__hint"><slot name="description">{{ hint }}</slot></div>
    <p v-if="error" :id="`${inputId}-error`" class="store-checkbox__error" role="alert">{{ error }}</p>
  </div>
</template>

<style scoped>
.store-checkbox{min-width:0;color:var(--store-ink,#15222b)}.store-checkbox__row{display:flex;align-items:flex-start;gap:11px;min-height:44px}.store-checkbox input{flex:0 0 20px;width:20px;height:20px;margin:12px 0;accent-color:var(--teal,#267c6d);cursor:pointer}.store-checkbox label{display:flex;align-items:center;flex-wrap:wrap;min-height:44px;box-sizing:border-box;padding:10px 0;font-size:14px;line-height:1.7;cursor:pointer;overflow-wrap:anywhere}.store-checkbox input:focus-visible{outline:3px solid var(--teal,#267c6d);outline-offset:4px;border-radius:3px}.store-checkbox input:disabled,.store-checkbox input:disabled+label{opacity:.55;cursor:not-allowed}.store-checkbox__hint,.store-checkbox__error{margin:2px 0 0 31px;font-size:12px;line-height:1.7;overflow-wrap:anywhere}.store-checkbox__hint{color:#52665b}.store-checkbox__error{color:#9e4035}.store-checkbox :deep(a){color:var(--teal-deep,#1d6057);text-underline-offset:3px}.store-checkbox :deep(a:focus-visible){outline:3px solid var(--teal,#267c6d);outline-offset:3px}
</style>
