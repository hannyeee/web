import { mount } from '@vue/test-utils'
import StoreButton from '../components/StoreButton.vue'
import StoreSectionHeader from '../components/StoreSectionHeader.vue'
import StoreCategoryNav from '../components/StoreCategoryNav.vue'
import StoreProductCard from '../components/StoreProductCard.vue'
import StoreProductRail from '../components/StoreProductRail.vue'
import StoreBenefits from '../components/StoreBenefits.vue'

const product = { id: 'vue', title: 'Vue 실전', description: '작은 서비스 만들기', image: '/course.svg', imageAlt: '강의 미리보기', price: '₩39,000', badge: '새 강의', category: '프론트엔드', swatches: [{ color: '#a6b9a8', label: '세이지' }] }

describe('reusable store catalog components', () => {
  it('preserves native button attributes and click, then disables submission while loading', async () => {
    const click = jest.fn()
    const wrapper = mount(StoreButton, { props: { type: 'submit', variant: 'secondary' }, attrs: { onClick: click, 'aria-label': '강의 신청' }, slots: { default: '신청하기' } })
    expect(wrapper.attributes('type')).toBe('submit')
    expect(wrapper.attributes('aria-label')).toBe('강의 신청')
    await wrapper.trigger('click')
    expect(click).toHaveBeenCalledTimes(1)
    await wrapper.setProps({ loading: true, loadingLabel: '신청 중…' })
    expect(wrapper.element.disabled).toBe(true)
    expect(wrapper.attributes('aria-busy')).toBe('true')
    expect(wrapper.text()).toBe('신청 중…')
    await wrapper.trigger('click')
    expect(click).toHaveBeenCalledTimes(1)
    await wrapper.setProps({ loading: false, disabled: true })
    expect(wrapper.text()).toBe('신청하기')
    expect(wrapper.element.disabled).toBe(true)
  })

  it('renders semantic headings with optional description and caller actions', () => {
    const wrapper = mount(StoreSectionHeader, { props: { title: '새로운 배움.', description: '나에게 맞는 시작.', as: 'h1' }, slots: { actions: '<a href="/courses">모두 보기</a>' } })
    expect(wrapper.get('h1').text()).toBe('새로운 배움. 나에게 맞는 시작.')
    expect(wrapper.get('a').attributes('href')).toBe('/courses')
  })

  it('selects categories using native buttons while preserving link navigation', async () => {
    const wrapper = mount(StoreCategoryNav, { props: { items: [{ id: 'all', label: '전체' }, { id: 'web', label: '웹 개발', image: '/web.svg' }, { id: 'more', label: '더 보기', href: '/courses' }], modelValue: 'all' } })
    const buttons = wrapper.findAll('button')
    expect(buttons[0].attributes('aria-pressed')).toBe('true')
    expect(buttons[1].attributes('aria-pressed')).toBe('false')
    await buttons[1].trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([['web']])
    await wrapper.setProps({ modelValue: 'web' })
    expect(buttons[1].attributes('aria-pressed')).toBe('true')
    expect(wrapper.get('img').attributes('alt')).toBe('')
    expect(wrapper.get('a').attributes('href')).toBe('/courses')
    await wrapper.get('a').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toHaveLength(1)
  })

  it('renders product content, accessible swatches and one explicit selection action', async () => {
    const wrapper = mount(StoreProductCard, { props: { product } })
    expect(wrapper.get('h3').text()).toBe(product.title)
    expect(wrapper.get('img').attributes('alt')).toBe(product.imageAlt)
    expect(wrapper.text()).toContain(product.price)
    expect(wrapper.get('[aria-label="색상 옵션"]').text()).toContain('세이지')
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('select')).toEqual([[product]])
    await wrapper.setProps({ product: { ...product, href: '/courses/vue' } })
    expect(wrapper.find('button').exists()).toBe(false)
    expect(wrapper.get('a').attributes('href')).toBe('/courses/vue')
    expect(wrapper.findAll('a a, a button')).toHaveLength(0)
  })

  it('updates rail controls at scroll edges and respects reduced motion', async () => {
    const wrapper = mount(StoreProductRail, { props: { title: '추천 강의', products: [product, { ...product, id: 'next' }] } })
    const track = wrapper.get('.store-rail-track')
    Object.defineProperties(track.element, { clientWidth: { value: 300 }, scrollWidth: { value: 900 }, scrollLeft: { value: 0, writable: true } })
    track.element.scrollBy = jest.fn()
    const originalMatchMedia = window.matchMedia
    window.matchMedia = jest.fn().mockReturnValue({ matches: true })
    try {
      await track.trigger('scroll')
      const controls = wrapper.findAll('.store-rail-controls button')
      expect(controls[0].element.disabled).toBe(true)
      expect(controls[1].element.disabled).toBe(false)
      await controls[1].trigger('click')
      expect(track.element.scrollBy).toHaveBeenCalledWith({ left: 255, behavior: 'auto' })
      track.element.scrollLeft = 600
      await track.trigger('scroll')
      expect(controls[0].element.disabled).toBe(false)
      expect(controls[1].element.disabled).toBe(true)
      window.matchMedia.mockReturnValue({ matches: false })
      await controls[0].trigger('click')
      expect(track.element.scrollBy).toHaveBeenLastCalledWith({ left: -255, behavior: 'smooth' })
      await wrapper.findComponent(StoreProductCard).get('button').trigger('click')
      expect(wrapper.emitted('select')).toEqual([[product]])
    } finally {
      window.matchMedia = originalMatchMedia
      wrapper.unmount()
    }
  })

  it('replaces a failed image with its brand fallback and retries a new image source', async () => {
    const wrapper = mount(StoreProductCard, { props: { product } })
    await wrapper.get('img').trigger('error')
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.get('.store-product-placeholder').text()).toBe('V')
    await wrapper.setProps({ product: { ...product, image: '/new-course.svg' } })
    expect(wrapper.get('img').attributes('src')).toBe('/new-course.svg')
  })

  it('renders caller benefit copy as text and supports scoped icon and action slots', () => {
    const wrapper = mount(StoreBenefits, { props: { items: [{ id: 'support', title: '함께하는 학습', description: '<script>unsafe</script>' }] }, slots: { icon: '<span>+</span>', action: '<template #action="{ item }"><a :href="`/help/${item.id}`">자세히</a></template>' } })
    expect(wrapper.get('h3').text()).toBe('함께하는 학습')
    expect(wrapper.get('p').text()).toBe('<script>unsafe</script>')
    expect(wrapper.find('script').exists()).toBe(false)
    expect(wrapper.get('a').attributes('href')).toBe('/help/support')
  })
})
