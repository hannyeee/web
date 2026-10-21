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
  it('shows courses from every category together without category tabs or sideways browsing controls', async () => {
    api.mockResolvedValue({ items: [
      { idx: 1, category: '디자인', title: '화면 디자인', instructor_name: '민지', price: 12000 },
      { idx: 2, category: '개발', title: 'Vue 개발', instructor_name: '지수', price: 0 },
    ] })
    const wrapper = mount(CourseListView); await flushPromises()
    expect(wrapper.findAll('.store-product-card')).toHaveLength(2)
    expect(wrapper.get('ul[aria-label="전체 강의 목록"]').findAll('li')).toHaveLength(2)
    expect(wrapper.text()).toContain('전체 2개의 강의')
    expect(wrapper.text()).toContain('화면 디자인')
    expect(wrapper.text()).toContain('Vue 개발')
    expect(wrapper.get('a[href="/courses/1"]').attributes('aria-label')).toBe('화면 디자인 자세히 보기')
    expect(wrapper.get('a[href="/courses/2"]').attributes('aria-label')).toBe('Vue 개발 자세히 보기')
    expect(wrapper.findAll('.store-product-card')[1].text()).toContain('무료 강의')
    expect(wrapper.find('nav[aria-label="강의 분야"]').exists()).toBe(false)
    expect(wrapper.find('[role="tablist"]').exists()).toBe(false)
    expect(wrapper.find('button[aria-label$="이전 항목"]').exists()).toBe(false)
    expect(wrapper.find('button[aria-label$="다음 항목"]').exists()).toBe(false)
    expect(api).toHaveBeenCalledTimes(1)
  })

  it('renders every course in the list with its own detail link when the catalog is large', async () => {
    const courses = Array.from({ length: 18 }, (_, index) => ({
      idx: index + 1,
      title: `함께 배우는 수업 ${index + 1}`,
      category: ['개발', '디자인', '데이터'][index % 3],
      instructor_name: '배움이',
      price: 10000 + index * 1000,
    }))
    api.mockResolvedValue({ items: courses })
    const wrapper = mount(CourseListView); await flushPromises()
    const list = wrapper.get('ul[aria-label="전체 강의 목록"]')
    expect(list.findAll('li')).toHaveLength(courses.length)
    expect(wrapper.get('[role="status"]').text()).toBe('전체 18개의 강의')
    courses.forEach(course => {
      expect(list.get(`a[href="/courses/${course.idx}"]`).attributes('aria-label')).toBe(`${course.title} 자세히 보기`)
      expect(list.text()).toContain(course.title)
    })
  })
})
