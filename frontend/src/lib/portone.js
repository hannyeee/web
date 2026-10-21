import PortOne from '@portone/browser-sdk/v2'
import { portoneConfig } from './portoneConfig'

export function isPortoneConfigured() {
  return Boolean(portoneConfig.storeId && portoneConfig.channelKey)
}

export async function requestCoursePayment({ paymentId, orderName, totalAmount, orderId }) {
  if (!isPortoneConfigured()) throw new Error('결제 서비스 설정이 완료되지 않았습니다. 관리자에게 문의해 주세요.')

  return PortOne.requestPayment({
    storeId: portoneConfig.storeId,
    channelKey: portoneConfig.channelKey,
    paymentId,
    orderName,
    totalAmount,
    currency: 'KRW',
    payMethod: 'CARD',
    redirectUrl: `${window.location.origin}/payments/complete?orderId=${encodeURIComponent(orderId)}`,
    forceRedirect: true,
  })
}
