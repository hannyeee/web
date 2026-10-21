import { mount, flushPromises } from '@vue/test-utils'
import CourseCreateView from '../src/views/CourseCreateView.vue'
const mockPush = jest.fn()
jest.mock('../src/lib/api', () => ({ api: jest.fn() }))
jest.mock('vue-router', () => ({ RouterLink: { props: ['to'], template: '<a :href="to"><slot /></a>' }, useRouter: () => ({ push: mockPush }) }))
import { api } from '../src/lib/api'

describe('course registration', () => {
  beforeEach(() => { api.mockReset(); mockPush.mockReset() })
  it.each(['', '-1', '1.5'])('rejects invalid price value %s', async (price) => {
    const wrapper = mount(CourseCreateView); await wrapper.get('#course-title').setValue('타이틀'); await wrapper.get('#course-description').setValue('설명'); await wrapper.get('#course-category').setValue('개발'); await wrapper.get('#course-price').setValue(price); await wrapper.get('#course-curriculum').setValue('1강')
    await wrapper.get('form').trigger('submit'); expect(api).not.toHaveBeenCalled(); expect(wrapper.find('[role="alert"]').exists()).toBe(true)
  })
  it('publishes valid course details and redirects to the new course', async () => {
    const wrapper = mount(CourseCreateView); await wrapper.get('#course-title').setValue('타이틀'); await wrapper.get('#course-description').setValue('설명'); await wrapper.get('#course-category').setValue('개발'); await wrapper.get('#course-price').setValue('0'); await wrapper.get('#course-curriculum').setValue('1강')
    api.mockResolvedValue({ idx: 14 }); await wrapper.get('form').trigger('submit'); await flushPromises()
    expect(api).toHaveBeenCalledWith('/course/register', { method: 'POST', body: JSON.stringify({ title: '타이틀', description: '설명', category: '개발', price: 0, curriculum: '1강' }) }); expect(mockPush).toHaveBeenCalledWith('/courses/14')
  })

  it('rejects blank required fields after trimming whitespace', async () => {
    const wrapper = mount(CourseCreateView)
    await wrapper.get('#course-title').setValue('   ')
    await wrapper.get('#course-description').setValue('설명')
    await wrapper.get('#course-category').setValue('개발')
    await wrapper.get('#course-price').setValue('100')
    await wrapper.get('#course-curriculum').setValue('첫 수업')
    await wrapper.get('form').trigger('submit')
    expect(api).not.toHaveBeenCalled()
    expect(wrapper.get('[role="alert"]').text()).toContain('필수 항목')
  })

  it('routes unauthorized registration to login and preserves the form return path', async () => {
    const wrapper = mount(CourseCreateView)
    await wrapper.get('#course-title').setValue('강의')
    await wrapper.get('#course-description').setValue('설명')
    await wrapper.get('#course-category').setValue('개발')
    await wrapper.get('#course-price').setValue('100')
    await wrapper.get('#course-curriculum').setValue('첫 수업')
    api.mockRejectedValue(Object.assign(new Error('로그인이 필요합니다.'), { status: 401 }))
    await wrapper.get('form').trigger('submit'); await flushPromises()
    expect(mockPush).toHaveBeenCalledWith({ name: 'login', query: { returnTo: '/courses/new' } })
  })

  it('shows registration API errors without navigating away', async () => {
    const wrapper = mount(CourseCreateView)
    await wrapper.get('#course-title').setValue('강의')
    await wrapper.get('#course-description').setValue('설명')
    await wrapper.get('#course-category').setValue('개발')
    await wrapper.get('#course-price').setValue('100')
    await wrapper.get('#course-curriculum').setValue('첫 수업')
    api.mockRejectedValue(new Error('등록을 완료하지 못했습니다.'))
    await wrapper.get('form').trigger('submit'); await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('등록을 완료하지 못했습니다.')
    expect(mockPush).not.toHaveBeenCalled()
  })
})
