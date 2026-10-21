import { mount, flushPromises } from '@vue/test-utils'
import OrderListView from '../src/views/OrderListView.vue'

jest.mock('../src/lib/api', () => ({ api: jest.fn() }))
const mockPush = jest.fn()
jest.mock('vue-router', () => ({ RouterLink: { props: ['to'], template: '<a :href="to"><slot /></a>' }, useRouter: () => ({ push: mockPush }) }))
import { api } from '../src/lib/api'

describe('order history', () => {
  beforeEach(() => { api.mockReset(); mockPush.mockReset() })

  it('shows separate paid and pending states', async () => {
    api.mockResolvedValue({ items: [
      { idx: 2, course_id: 8, course_title: 'Python 자동화', amount: 25000, status: 'pending_payment', created_at: '2026-10-20T00:00:00Z' },
      { idx: 3, course_id: 9, course_title: 'Vue 서비스', amount: 35000, status: 'paid', created_at: '2026-10-20T00:00:00Z', paid_at: '2026-10-20T01:00:00Z' },
    ] })
    const wrapper = mount(OrderListView); await flushPromises()
    expect(wrapper.text()).toContain('결제 대기')
    expect(wrapper.text()).toContain('구매 완료')
    expect(wrapper.text()).toContain('Python 자동화')
    expect(wrapper.text()).toContain('Vue 서비스')
  })

  it('routes unauthenticated users to login with order history as the return path', async () => {
    api.mockRejectedValue(Object.assign(new Error('Sign in'), { status: 401 }))
    mount(OrderListView); await flushPromises()
    expect(mockPush).toHaveBeenCalledWith({ name: 'login', query: { returnTo: '/orders' } })
  })
})
