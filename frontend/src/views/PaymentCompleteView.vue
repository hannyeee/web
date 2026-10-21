<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { api } from '../lib/api'

const route = useRoute()
const router = useRouter()
const state = ref('checking')
const message = ref('포트원 결제 결과를 확인하고 있습니다.')

onMounted(async () => {
  const orderId = Number(route.query.orderId)
  const paymentId = typeof route.query.paymentId === 'string' ? route.query.paymentId : ''
  const providerError = route.query.code

  if (providerError || !Number.isInteger(orderId) || orderId <= 0 || !paymentId) {
    state.value = 'failed'
    message.value = '결제가 완료되지 않았습니다. 주문 내역에서 상태를 확인해 주세요.'
    return
  }

  try {
    await api('/order/complete', {
      method: 'POST',
      body: JSON.stringify({ order_id: orderId, payment_id: paymentId }),
    })
    state.value = 'paid'
    message.value = '결제가 확인되었습니다. 강의 구매가 완료되었습니다.'
  } catch (err) {
    if (err.status === 401) {
      router.push({ name: 'login', query: { returnTo: route.fullPath } })
      return
    }
    state.value = 'failed'
    message.value = '결제를 확인하지 못했습니다. 주문 내역에서 상태를 확인해 주세요.'
  }
})
</script>

<template>
  <section class="state-panel payment-result" :aria-busy="state === 'checking'">
    <p class="hero-kicker">결제 결과</p>
    <h1>{{ state === 'paid' ? '구매 완료' : state === 'failed' ? '결제 확인 필요' : '결제 확인 중' }}</h1>
    <p :role="state === 'failed' ? 'alert' : 'status'">{{ message }}</p>
    <RouterLink to="/orders">주문 내역 보기</RouterLink>
    <RouterLink to="/courses">강의 더 둘러보기</RouterLink>
  </section>
</template>
