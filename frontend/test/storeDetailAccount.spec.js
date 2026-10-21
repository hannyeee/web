import { mount } from '@vue/test-utils'
import StoreFormField from '../components/StoreFormField.vue'
import StoreAccountPanel from '../components/StoreAccountPanel.vue'
import StoreOptionPicker from '../components/StoreOptionPicker.vue'
import StoreProductGallery from '../components/StoreProductGallery.vue'
import StorePurchaseSummary from '../components/StorePurchaseSummary.vue'
import StoreAccordion from '../components/StoreAccordion.vue'
import StoreNavigation from '../components/StoreNavigation.vue'

describe('reusable store detail and account components', () => {
  it('connects unique field labels, hints and errors while forwarding native form attributes', async () => {
    const wrapper = mount(StoreFormField, { props: { label: '이메일', hint: '가입한 주소', error: '주소를 확인하세요.', type: 'email' }, attrs: { name: 'email', required: true, autocomplete: 'email' } })
    const input = wrapper.get('input')
    expect(wrapper.get('label').attributes('for')).toBe(input.attributes('id'))
    expect(input.element.required).toBe(true)
    expect(input.attributes('autocomplete')).toBe('email')
    expect(input.attributes('aria-invalid')).toBe('true')
    const descriptions = input.attributes('aria-describedby').split(' ')
    expect(descriptions.map(id => wrapper.get(`[id="${id}"]`).text())).toEqual(['가입한 주소', '주소를 확인하세요.'])
    await input.setValue('learner@example.com')
    expect(wrapper.emitted('update:modelValue')).toEqual([['learner@example.com']])
    await wrapper.setProps({ error: '' })
    expect(input.attributes('aria-invalid')).toBeUndefined()
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  it('toggles password visibility without submitting or changing the password', async () => {
    const wrapper = mount(StoreFormField, { props: { label: '비밀번호', type: 'password', modelValue: 'secret-value' } })
    const toggle = wrapper.get('button')
    expect(toggle.attributes('type')).toBe('button')
    await toggle.trigger('click')
    expect(wrapper.get('input').attributes('type')).toBe('text')
    expect(toggle.attributes('aria-pressed')).toBe('true')
    expect(wrapper.get('input').element.value).toBe('secret-value')
    await toggle.trigger('click')
    expect(wrapper.get('input').attributes('type')).toBe('password')
  })

  it('preserves external field descriptions alongside internal hints after attribute updates', async () => {
    const wrapper = mount(StoreFormField, { props: { id: 'email', label: '이메일', hint: '안내' }, attrs: { 'aria-describedby': 'policy policy' } })
    expect(wrapper.get('input').attributes('aria-describedby')).toBe('policy email-hint')
    await wrapper.setProps({ 'aria-describedby': 'new-policy' })
    expect(wrapper.get('input').attributes('aria-describedby')).toBe('new-policy email-hint')
  })

  it('delegates account submission and prevents duplicate requests during loading', async () => {
    const wrapper = mount(StoreAccountPanel, { props: { title: '로그인', submitLabel: '로그인' }, slots: { default: '<input name="email" type="email" required />', footer: '<a href="/signup">회원가입</a>' } })
    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('submit')).toHaveLength(1)
    expect(wrapper.get('a').attributes('href')).toBe('/signup')
    await wrapper.setProps({ loading: true, error: '다시 시도하세요.' })
    expect(wrapper.get('fieldset').element.disabled).toBe(true)
    expect(wrapper.get('button[type="submit"]').element.disabled).toBe(true)
    expect(wrapper.get('[role="alert"]').text()).toBe('다시 시도하세요.')
    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('submit')).toHaveLength(1)
  })

  it('uses separate native radio groups and emits stable option IDs', async () => {
    const props = { label: '학습 방식', modelValue: 'self', options: [{ id: 'self', label: '스스로 배우기', description: '평생 소장' }, { id: 'mentor', label: '멘토와 함께', price: '₩79,000' }, { id: 'closed', label: '오프라인', disabled: true }] }
    const wrapper = mount({ components: { StoreOptionPicker }, data: () => ({ props }), template: '<div><StoreOptionPicker v-bind="props"/><StoreOptionPicker v-bind="props"/></div>' })
    const groups = wrapper.findAllComponents(StoreOptionPicker)
    const inputs = groups[0].findAll('input')
    expect(inputs[0].element.checked).toBe(true)
    expect(inputs[2].element.disabled).toBe(true)
    expect(inputs[0].attributes('name')).not.toBe(groups[1].get('input').attributes('name'))
    await inputs[1].setValue(true)
    expect(groups[0].emitted('update:modelValue')).toEqual([['mentor']])
  })

  it('navigates gallery images with correct boundaries and accessible status', async () => {
    const wrapper = mount(StoreProductGallery, { props: { label: '강의 미리보기', images: [{ src: '/one.svg', alt: '소개', caption: '첫 번째 화면' }, { src: '/two.svg', alt: '커리큘럼' }] } })
    const previous = wrapper.get('[aria-label="이전 상품 이미지"]')
    const next = wrapper.get('[aria-label="다음 상품 이미지"]')
    expect(previous.element.disabled).toBe(true)
    await next.trigger('click')
    expect(wrapper.get('.store-gallery__stage>img').attributes('alt')).toBe('커리큘럼')
    expect(next.element.disabled).toBe(true)
    expect(wrapper.get('[aria-live="polite"]').text()).toBe('2 / 2')
    expect(wrapper.emitted('update:modelValue')).toEqual([[1]])
    await previous.trigger('click')
    expect(wrapper.get('.store-gallery__stage>img').attributes('alt')).toBe('소개')
  })

  it('includes the selected option under the caller field name in native form data', () => {
    const wrapper = mount({ components: { StoreOptionPicker }, template: '<form><StoreOptionPicker name="learning" label="학습 방식" model-value="mentor" :options="[{ id: \'mentor\', label: \'멘토와 함께\' }]" /></form>' })
    expect(new FormData(wrapper.element).get('learning')).toBe('mentor')
  })

  it('handles missing and failed gallery images and clamps a controlled index when images change', async () => {
    const wrapper = mount(StoreProductGallery)
    expect(wrapper.text()).toContain('등록된 이미지가 없습니다.')
    expect(wrapper.find('button').exists()).toBe(false)
    await wrapper.setProps({ images: [{ src: '/missing.svg', alt: '강의' }], modelValue: 8 })
    await wrapper.get('img').trigger('error')
    expect(wrapper.text()).toContain('이미지를 불러올 수 없습니다.')
    await wrapper.setProps({ images: [{ src: '/loaded.svg', alt: '새 강의' }] })
    expect(wrapper.get('img').attributes('src')).toBe('/loaded.svg')
  })

  it('summarizes selected options and emits checkout only from an available action', async () => {
    const wrapper = mount(StorePurchaseSummary, { props: { title: 'Vue 실전', price: 39000, items: [{ label: '학습 방식', value: '스스로 배우기' }] } })
    expect(wrapper.get('.store-summary__total strong').text()).toContain('39,000')
    expect(wrapper.get('dt').text()).toBe('학습 방식')
    expect(wrapper.get('dd').text()).toBe('스스로 배우기')
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('checkout')).toHaveLength(1)
    await wrapper.setProps({ disabled: true })
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('checkout')).toHaveLength(1)
    await wrapper.setProps({ disabled: false, loading: true })
    expect(wrapper.get('button').attributes('aria-busy')).toBe('true')
  })

  it('provides native FAQ disclosures with safe text and scoped answer slots', async () => {
    const wrapper = mount(StoreAccordion, { props: { defaultOpen: ['access'], items: [{ id: 'access', title: '언제 들을 수 있나요?', content: '<script>unsafe</script>' }] } })
    const details = wrapper.get('details')
    expect(details.element.open).toBe(true)
    expect(wrapper.find('script').exists()).toBe(false)
    expect(wrapper.get('.store-faq__answer').text()).toBe('<script>unsafe</script>')
    details.element.open = false
    await details.trigger('toggle')
    expect(wrapper.emitted('change')).toContainEqual([[]])
  })

  it('exposes mobile menu state and closes after following a navigation item', async () => {
    const wrapper = mount(StoreNavigation, { props: { items: [{ id: 'courses', label: '강의', href: '/courses' }], activeId: 'courses' } })
    const toggle = wrapper.get('button')
    expect(toggle.attributes('aria-expanded')).toBe('false')
    expect(wrapper.get('nav a').attributes('aria-current')).toBe('page')
    await toggle.trigger('click')
    expect(toggle.attributes('aria-expanded')).toBe('true')
    expect(toggle.attributes('aria-controls')).toBe(wrapper.get('nav').attributes('id'))
    await wrapper.get('nav a').trigger('click')
    expect(toggle.attributes('aria-expanded')).toBe('false')
  })

  it('returns keyboard focus to the mobile menu button after Escape', async () => {
    const wrapper = mount(StoreNavigation, { attachTo: document.body, props: { items: [{ id: 'courses', label: '강의', href: '/courses' }] } })
    try {
      await wrapper.get('button').trigger('click')
      wrapper.get('nav a').element.focus()
      await wrapper.get('nav a').trigger('keydown', { key: 'Escape' })
      expect(wrapper.get('button').attributes('aria-expanded')).toBe('false')
      expect(document.activeElement).toBe(wrapper.get('button').element)
    } finally { wrapper.unmount() }
  })
})
