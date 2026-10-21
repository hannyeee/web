/**
 * Reusable Vue 3 storefront UI; no router, account or payment API dependency.
 * Import from '../../components' in src/views (see ComponentGalleryView.vue).
 *
 * Catalog: products = [{ id, title, description?, image?, imageAlt?, price?,
 *   badge?, category?, href?, swatches?: [{ color, label }] }].
 * StoreProductRail/StoreProductCard emit select(product) when href is omitted.
 *
 * Detail: StoreProductGallery images = [{ src, alt, caption? }], v-model=index.
 * StoreOptionPicker options = [{ id, label, description?, price?, swatch?,
 *   disabled? }], v-model=id; name is optional for native form submission.
 * StorePurchaseSummary items = [{ label, value }]; checkout emits no request.
 *
 * Forms: fields and selects use v-model; StoreCheckbox uses a boolean model.
 * Native name/required/disabled/autocomplete attrs go to their input controls.
 * StoreAccountPanel emits submit; callers handle validation and API requests.
 * Text is escaped by Vue. Images, links and slot contents come from callers.
 * Colors inherit existing --store-* and --teal variables with brand fallbacks.
 */
export { default as StoreButton } from './StoreButton.vue'
export { default as StoreSectionHeader } from './StoreSectionHeader.vue'
export { default as StoreNavigation } from './StoreNavigation.vue'
export { default as StoreCategoryNav } from './StoreCategoryNav.vue'
export { default as StoreProductCard } from './StoreProductCard.vue'
export { default as StoreProductRail } from './StoreProductRail.vue'
export { default as StoreProductGallery } from './StoreProductGallery.vue'
export { default as StoreOptionPicker } from './StoreOptionPicker.vue'
export { default as StorePurchaseSummary } from './StorePurchaseSummary.vue'
export { default as StoreBenefits } from './StoreBenefits.vue'
export { default as StoreAccordion } from './StoreAccordion.vue'
export { default as StoreFormField } from './StoreFormField.vue'
export { default as StoreAccountPanel } from './StoreAccountPanel.vue'
export { default as StoreSelectField } from './StoreSelectField.vue'
export { default as StoreCheckbox } from './StoreCheckbox.vue'
