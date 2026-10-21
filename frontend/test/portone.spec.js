jest.mock('@portone/browser-sdk/v2', () => ({ __esModule: true, default: { requestPayment: jest.fn() } }))
jest.mock('../src/lib/portoneConfig', () => ({ portoneConfig: { storeId: 'store-test', channelKey: 'channel-test' } }))
import PortOne from '@portone/browser-sdk/v2'
import { isPortoneConfigured, requestCoursePayment } from '../src/lib/portone'

describe('PortOne checkout adapter', () => {
  beforeEach(() => { PortOne.requestPayment.mockReset() })

  it('calls the V2 SDK with Toss card checkout and a completion redirect', async () => {
    PortOne.requestPayment.mockResolvedValue(undefined)
    expect(isPortoneConfigured()).toBe(true)
    await requestCoursePayment({ paymentId: 'course-10-abcd', orderName: 'FastAPI 강의', totalAmount: 39000, orderId: 10 })
    expect(PortOne.requestPayment).toHaveBeenCalledWith(expect.objectContaining({
      storeId: 'store-test', channelKey: 'channel-test', paymentId: 'course-10-abcd', orderName: 'FastAPI 강의',
      totalAmount: 39000, currency: 'KRW', payMethod: 'CARD', forceRedirect: true,
      redirectUrl: `${window.location.origin}/payments/complete?orderId=10`,
    }))
  })
})
