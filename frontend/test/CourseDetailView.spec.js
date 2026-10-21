import { mount, flushPromises } from '@vue/test-utils'
import CourseDetailView from '../src/views/CourseDetailView.vue'

jest.mock('../src/lib/api', () => ({ api: jest.fn() }))
jest.mock('../src/lib/portone', () => ({ isPortoneConfigured: jest.fn(), requestCoursePayment: jest.fn() }))
const mockPush = jest.fn()
jest.mock('vue-router', () => ({
  RouterLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
  useRoute: () => ({ params: { idx: '7' }, fullPath: '/courses/7' }),
  useRouter: () => ({ push: mockPush }),
}))
import { api } from '../src/lib/api'
import { isPortoneConfigured, requestCoursePayment } from '../src/lib/portone'

const course = { idx: 7, title: 'Vue 서비스 개발', description: '설명', instructor_name: '강사', category: '개발', price: 1000, curriculum: '첫 수업\n다음 수업' }

describe('course detail purchase', () => {
  beforeEach(() => { api.mockReset(); mockPush.mockReset(); isPortoneConfigured.mockReset(); requestCoursePayment.mockReset() })

  it('creates an order and launches checkout with server values', async () => {
    isPortoneConfigured.mockReturnValue(true)
    api.mockResolvedValueOnce(course)
    const wrapper = mount(CourseDetailView); await flushPromises()
    api.mockResolvedValueOnce({ idx: 11, course_title: course.title, amount: 1000, payment_id: 'course-11-abc123', status: 'pending_payment' })
    await wrapper.get('button').trigger('click'); await flushPromises()
    expect(api).toHaveBeenLastCalledWith('/order/register', { method: 'POST', body: JSON.stringify({ course_id: 7 }) })
    expect(requestCoursePayment).toHaveBeenCalledWith({ paymentId: 'course-11-abc123', orderName: course.title, totalAmount: 1000, orderId: 11 })
  })

  it('does not create an order when public PortOne settings are missing', async () => {
    isPortoneConfigured.mockReturnValue(false)
    api.mockResolvedValueOnce(course)
    const wrapper = mount(CourseDetailView); await flushPromises()
    await wrapper.get('button').trigger('click'); await flushPromises()
    expect(api).toHaveBeenCalledTimes(1)
    expect(wrapper.get('[role="alert"]').text()).toContain('결제 서비스 설정')
  })

  it('records a free course without opening the payment SDK', async () => {
    isPortoneConfigured.mockReturnValue(true)
    api.mockResolvedValueOnce({ ...course, price: 0 })
    const wrapper = mount(CourseDetailView); await flushPromises()
    api.mockResolvedValueOnce({ idx: 12, status: 'paid' })
    await wrapper.get('button').trigger('click'); await flushPromises()
    expect(requestCoursePayment).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('무료 강의 신청이 완료되었습니다.')
  })

  it('routes signed-out buyers to login and keeps the return path', async () => {
    isPortoneConfigured.mockReturnValue(true)
    api.mockResolvedValueOnce(course)
    const wrapper = mount(CourseDetailView); await flushPromises()
    api.mockRejectedValueOnce(Object.assign(new Error('Sign in'), { status: 401 }))
    await wrapper.get('button').trigger('click'); await flushPromises()
    expect(mockPush).toHaveBeenCalledWith({ name: 'login', query: { returnTo: '/courses/7' } })
  })

  it('recovers a failed detail request through the retry action', async () => {
    api.mockRejectedValueOnce(new Error('Network down'))
    const wrapper = mount(CourseDetailView); await flushPromises()
    expect(wrapper.get('[aria-busy]').attributes('aria-busy')).toBe('false')
    expect(wrapper.get('[role="alert"]').text()).toBe('Network down')
    api.mockResolvedValueOnce(course)
    await wrapper.get('button').trigger('click'); await flushPromises()
    expect(wrapper.get('h1').text()).toBe(course.title)
    expect(wrapper.findAll('.course-store-lessons li')).toHaveLength(2)
  })

  it('prevents rapid duplicate order creation while awaiting the server', async () => {
    isPortoneConfigured.mockReturnValue(true)
    api.mockResolvedValueOnce(course)
    const wrapper = mount(CourseDetailView); await flushPromises()
    let resolveOrder
    api.mockImplementationOnce(() => new Promise(resolve => { resolveOrder = resolve }))
    const button = wrapper.get('button')
    const first = button.trigger('click')
    const second = button.trigger('click')
    await Promise.all([first, second])
    expect(api.mock.calls.filter(([path]) => path === '/order/register')).toHaveLength(1)
    expect(button.element.disabled).toBe(true)
    resolveOrder({ idx: 11, course_title: course.title, amount: 1000, payment_id: 'test-payment' })
    await flushPromises()
    expect(requestCoursePayment).toHaveBeenCalledTimes(1)
    expect(button.element.disabled).toBe(false)
  })
})
