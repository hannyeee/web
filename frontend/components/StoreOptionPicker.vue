<script setup>
import { useId } from 'vue'

defineProps({
  modelValue: { type: [String, Number], default: '' },
  name: { type: String, default: '' },
  label: { type: String, required: true },
  description: { type: String, default: '' },
  options: { type: Array, default: () => [] },
  disabled: Boolean,
  required: Boolean,
})
const emit = defineEmits(['update:modelValue'])
const groupId = `store-options-${useId()}`
</script>

<template>
  <fieldset class="store-options" :disabled="disabled" :aria-describedby="description ? `${groupId}-description` : undefined">
    <legend>{{ label }}</legend>
    <p v-if="description" :id="`${groupId}-description`" class="store-options__description">{{ description }}</p>
    <div class="store-options__list">
      <label v-for="(option, index) in options" :key="option.id" class="store-options__option" :class="{ 'store-options__option--disabled': option.disabled }">
        <input :id="`${groupId}-${index}`" :name="name || groupId" type="radio" :value="option.id" :checked="modelValue === option.id" :disabled="option.disabled" :required="required" @change="emit('update:modelValue', option.id)" />
        <span class="store-options__body">
          <span v-if="option.swatch" class="store-options__swatch" :style="{ backgroundColor: option.swatch }" aria-hidden="true" />
          <span class="store-options__copy"><strong>{{ option.label }}</strong><span v-if="option.description">{{ option.description }}</span></span>
          <span v-if="option.price" class="store-options__price">{{ option.price }}</span>
          <span v-if="option.disabled" class="store-options__unavailable">선택 불가</span>
        </span>
      </label>
    </div>
    <slot />
  </fieldset>
</template>

<style scoped>
.store-options{min-width:0;margin:0;padding:0;border:0;color:var(--store-ink,#15222b)}.store-options legend{padding:0;font-size:21px;font-weight:700;line-height:1.4;letter-spacing:-.7px}.store-options__description{margin:8px 0 0;color:#52665b;font-size:13px;line-height:1.6}.store-options__list{display:grid;gap:12px;margin-top:18px}.store-options__option{position:relative;display:block;cursor:pointer}.store-options input{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}.store-options__body{display:flex;box-sizing:border-box;align-items:center;gap:14px;min-height:80px;padding:18px;border:1px solid #839087;border-radius:14px;background:var(--paper,#fbfcf9)}.store-options input:checked+.store-options__body{border:2px solid var(--teal,#267c6d);padding:17px;background:#edf3ee}.store-options input:focus-visible+.store-options__body{outline:3px solid var(--teal,#267c6d);outline-offset:3px}.store-options input:disabled+.store-options__body{opacity:.55;cursor:not-allowed}.store-options__copy{display:grid;gap:5px;flex:1;min-width:0;overflow-wrap:anywhere}.store-options__copy strong{font-size:15px;font-weight:650}.store-options__copy>span,.store-options__price,.store-options__unavailable{font-size:12px;line-height:1.5}.store-options__copy>span{color:#52665b}.store-options__price{flex-shrink:0;font-variant-numeric:tabular-nums}.store-options__swatch{flex:0 0 26px;width:26px;height:26px;border:1px solid #839087;border-radius:50%}.store-options__unavailable{color:#52665b}@media(max-width:400px){.store-options__body{flex-wrap:wrap}.store-options__price{margin-left:auto}}
</style>
