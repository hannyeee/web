import { mount, flushPromises } from '@vue/test-utils'
import PaymentCompleteView from '../src/views/PaymentCompleteView.vue'

jest.mock('../src/lib/api', () => ({ api: jest.fn() }))
const mockRoute = { query: { orderId: '15', paymentId: 'course-15-abcd' }, fullPath: '/payments/complete?orderId=15&paymentId=course-15-abcd' }
const mockPush = jest.fn()
jest.mock('vue-router', () => ({ RouterLink: { props: ['to'], template: '<a :href="to"><slot /></a>' }, useRoute: () => mockRoute, useRouter: () => ({ push: mockPush }) }))
import { api } from '../src/lib/api'

describe('payment completion', () => {
  beforeEach(() => { api.mockReset(); mockPush.mockReset(); mockRoute.query = { orderId: '15', paymentId: 'course-15-abcd' } })

  it('asks the backend to verify the payment before showing success', async () => {
    api.mockResolvedValue({ status: 'paid' })
    const wrapper = mount(PaymentCompleteView); await flushPromises()
    expect(api).toHaveBeenCalledWith('/order/complete', { method: 'POST', body: JSON.stringify({ order_id: 15, payment_id: 'course-15-abcd' }) })
    expect(wrapper.text()).toContain('결제가 확인되었습니다.')
  })

  it('does not verify a provider-declined checkout', async () => {
    mockRoute.query = { orderId: '15', paymentId: 'course-15-abcd', code: 'PAYMENT_FAILED' }
    const wrapper = mount(PaymentCompleteView); await flushPromises()
    expect(api).not.toHaveBeenCalled()
    expect(wrapper.get('[role="alert"]').text()).toContain('결제가 완료되지 않았습니다.')
  })

  it('does not show paid when server verification fails', async () => {
    api.mockRejectedValue(new Error('verification error'))
    const wrapper = mount(PaymentCompleteView); await flushPromises()
    expect(wrapper.text()).toContain('결제 확인 필요')
    expect(wrapper.text()).not.toContain('구매가 완료되었습니다.')
  })
})
