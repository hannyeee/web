<script setup>
import { computed, useAttrs, useId } from 'vue'

defineOptions({ inheritAttrs: false })
const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  options: { type: Array, default: () => [] },
  label: { type: String, required: true },
  id: { type: String, default: '' },
  hint: { type: String, default: '' },
  error: { type: String, default: '' },
  placeholder: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue'])
const generatedId = useId()
const attrs = useAttrs()
const inputId = computed(() => props.id || `store-select-${generatedId}`)
function descriptionIds() {
  const ids = [attrs['aria-describedby'], props.hint && `${inputId.value}-hint`, props.error && `${inputId.value}-error`].filter(Boolean).join(' ').split(/\s+/).filter(Boolean)
  return [...new Set(ids)].join(' ') || undefined
}
function selectOption(event) {
  const optionIndex = event.target.selectedIndex - (props.placeholder ? 1 : 0)
  emit('update:modelValue', optionIndex < 0 ? '' : props.options[optionIndex].value)
}
</script>

<template>
  <div class="store-select-field" :class="{ 'store-select-field--invalid': error }">
    <label :for="inputId">{{ label }}</label>
    <select v-bind="$attrs" :id="inputId" :value="modelValue" :aria-invalid="error ? 'true' : undefined" :aria-describedby="descriptionIds()" @change="selectOption">
      <option v-if="placeholder" value="">{{ placeholder }}</option>
      <option v-for="(option, index) in options" :key="index" :value="option.value" :disabled="option.disabled">{{ option.label }}</option>
    </select>
    <p v-if="hint" :id="`${inputId}-hint`" class="store-select-field__hint">{{ hint }}</p>
    <p v-if="error" :id="`${inputId}-error`" class="store-select-field__error" role="alert">{{ error }}</p>
  </div>
</template>

<style scoped>
.store-select-field{min-width:0;color:var(--store-ink,#15222b)}.store-select-field>label{display:block;margin-bottom:8px;color:#52665b;font-size:13px;font-weight:600;line-height:1.5}.store-select-field select{box-sizing:border-box;width:100%;min-height:52px;margin:0;padding:12px 38px 12px 14px;border:1px solid #839087;border-radius:12px;background:var(--store-paper,#f4f6f2);color:inherit;font:inherit;font-size:16px;line-height:1.5;cursor:pointer}.store-select-field select:focus-visible{outline:3px solid var(--teal,#267c6d);outline-offset:2px}.store-select-field select:disabled{cursor:not-allowed;opacity:.6}.store-select-field__hint,.store-select-field__error{margin:8px 3px 0;font-size:12px;line-height:1.6;overflow-wrap:anywhere}.store-select-field__hint{color:#52665b}.store-select-field__error{color:#9e4035}.store-select-field--invalid select{border-color:#9e4035}
</style>
