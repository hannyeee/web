<script setup>
import { computed, ref, useId, useAttrs } from 'vue'

defineOptions({ inheritAttrs: false })
const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  id: { type: String, default: '' },
  label: { type: String, required: true },
  type: { type: String, default: 'text' },
  hint: { type: String, default: '' },
  error: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue'])
const attrs = useAttrs()
const generatedId = useId()
const inputId = computed(() => props.id || `store-field-${generatedId}`)
const revealed = ref(false)
const inputType = computed(() => props.type === 'password' && revealed.value ? 'text' : props.type)
function descriptionIds() {
  const ids = [attrs['aria-describedby'], props.hint && `${inputId.value}-hint`, props.error && `${inputId.value}-error`].filter(Boolean).join(' ').split(/\s+/).filter(Boolean)
  return [...new Set(ids)].join(' ') || undefined
}
</script>

<template>
  <div class="store-field" :class="{ 'store-field--invalid': error }">
    <div class="store-field__control">
      <input v-bind="$attrs" :id="inputId" :type="inputType" :value="modelValue" :placeholder="$attrs.placeholder || ' '" :aria-invalid="error ? 'true' : undefined" :aria-describedby="descriptionIds()" :class="{ 'store-field__password': type === 'password' }" @input="emit('update:modelValue', $event.target.value)" />
      <label :for="inputId">{{ label }}</label>
      <button v-if="type === 'password'" class="store-field__reveal" type="button" :aria-label="`${label} ${revealed ? '숨기기' : '표시'}`" :aria-pressed="revealed" :disabled="$attrs.disabled" @click="revealed = !revealed">{{ revealed ? '숨기기' : '표시' }}</button>
    </div>
    <p v-if="hint" :id="`${inputId}-hint`" class="store-field__hint">{{ hint }}</p>
    <p v-if="error" :id="`${inputId}-error`" class="store-field__error" role="alert">{{ error }}</p>
  </div>
</template>

<style scoped>
.store-field{min-width:0;color:var(--store-ink,#15222b)}.store-field__control{position:relative}.store-field input{box-sizing:border-box;width:100%;min-height:62px;margin:0;padding:25px 16px 9px;border:1px solid #839087;border-radius:12px;background:var(--paper,#fbfcf9);color:inherit;font:inherit;font-size:16px}.store-field label{position:absolute;top:20px;left:16px;max-width:calc(100% - 32px);overflow:hidden;color:#52665b;font-size:16px;line-height:1.4;text-overflow:ellipsis;white-space:nowrap;pointer-events:none;transition:top .15s,font-size .15s}.store-field input:focus~label,.store-field input:not(:placeholder-shown)~label{top:9px;font-size:11px}.store-field input::placeholder{color:transparent}.store-field input:focus::placeholder{color:#66746c}.store-field input:focus-visible{outline:3px solid var(--teal,#267c6d);outline-offset:2px}.store-field input:disabled{cursor:not-allowed;opacity:.6}.store-field input.store-field__password{padding-right:70px}.store-field__password~label{max-width:calc(100% - 88px)}.store-field__reveal{position:absolute;top:9px;right:7px;min-width:52px;min-height:44px;border:0;border-radius:8px;background:transparent;color:var(--teal-deep,#1d6057);font:inherit;font-size:12px;cursor:pointer}.store-field__reveal:focus-visible{outline:3px solid var(--teal,#267c6d);outline-offset:1px}.store-field__hint,.store-field__error{margin:8px 3px 0;font-size:12px;line-height:1.6;overflow-wrap:anywhere}.store-field__hint{color:#52665b}.store-field__error{color:#9e4035}.store-field--invalid input{border-color:#9e4035}@media(prefers-reduced-motion:reduce){.store-field label{transition:none}}
</style>
