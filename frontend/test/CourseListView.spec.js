import { mount, flushPromises } from '@vue/test-utils'
import CourseListView from '../src/views/CourseListView.vue'

jest.mock('../src/lib/api', () => ({ api: jest.fn() }))
jest.mock('vue-router', () => ({ RouterLink: { props: ['to'], template: '<a :href="to"><slot /></a>' } }))
import { api } from '../src/lib/api'

describe('course catalog', () => {
  beforeEach(() => api.mockReset())
  it('renders course data and a safe image fallback', async () => {
    api.mockResolvedValue({ items: [{ idx: 1, category: '디자인', title: '기초부터 배우기', instructor_name: '민지', price: 12000 }] })
    const wrapper = mount(CourseListView); await flushPromises()
    expect(wrapper.text()).toContain('기초부터 배우기'); expect(wrapper.text()).toContain('12,000원')
    expect(wrapper.find('.store-product-placeholder').exists()).toBe(true)
    expect(wrapper.get('a[href="/courses/1"]').text()).toBe('자세히 보기')
  })
  it('shows loading, error with retry, and empty states', async () => {
    let reject; api.mockReturnValue(new Promise((_, no) => { reject = no }))
    const wrapper = mount(CourseListView); expect(wrapper.find('[aria-busy="true"]').exists()).toBe(true)
    reject(new Error('Network down')); await flushPromises(); expect(wrapper.text()).toContain('다시 불러오기')
    api.mockResolvedValue({ items: [] }); await wrapper.get('button').trigger('click'); await flushPromises(); expect(wrapper.text()).toContain('아직 등록된 강의가 없어요.')
  })
  it('filters real API courses by category without changing detail destinations', async () => {
    api.mockResolvedValue({ items: [
      { idx: 1, category: '디자인', title: '화면 디자인', instructor_name: '민지', price: 12000 },
      { idx: 2, category: '개발', title: 'Vue 개발', instructor_name: '지수', price: 0 },
    ] })
    const wrapper = mount(CourseListView); await flushPromises()
    expect(wrapper.findAll('.store-product-card')).toHaveLength(2)
    const categories = wrapper.findAll('.store-category-nav button')
    await categories.find(button => button.text().endsWith('개발')).trigger('click')
    expect(wrapper.findAll('.store-product-card')).toHaveLength(1)
    expect(wrapper.get('.store-product-card h3').text()).toBe('Vue 개발')
    expect(wrapper.get('.store-product-card').text()).toContain('무료 강의')
    expect(wrapper.get('.catalog-product-link').attributes('href')).toBe('/courses/2')
    expect(api).toHaveBeenCalledTimes(1)
    await categories[0].trigger('click')
    expect(wrapper.findAll('.store-product-card')).toHaveLength(2)
  })
})
