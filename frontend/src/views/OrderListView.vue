<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { api } from '../lib/api'

const router = useRouter()
const orders = ref([])
const error = ref('')
const loading = ref(true)
const money = (amount) => `${new Intl.NumberFormat('ko-KR').format(amount)}원`
const date = (value) => new Date(value).toLocaleDateString('ko-KR')

async function load() {
  loading.value = true
  error.value = ''
  try {
    const result = await api('/order/list')
    orders.value = result?.items || []
  } catch (err) {
    if (err.status === 401) router.push({ name: 'login', query: { returnTo: '/orders' } })
    else error.value = err.message
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <section class="orders-page">
    <p class="hero-kicker">나의 배움</p>
    <h1>주문 내역</h1>
    <p class="orders-note">결제 완료된 강의와 결제 대기 중인 주문을 확인할 수 있습니다.</p>
    <p v-if="loading">주문 내역을 불러오는 중입니다.</p>
    <p v-else-if="error" role="alert">
      {{ error }} <button class="text-button" @click="load">다시 시도</button>
    </p>
    <div v-else-if="orders.length" class="order-list">
      <article v-for="order in orders" :key="order.idx" class="order-row">
        <div>
          <RouterLink :to="`/courses/${order.course_id}`">{{ order.course_title }}</RouterLink>
          <time>{{ date(order.created_at) }}</time>
        </div>
        <strong>{{ money(order.amount) }}</strong>
        <span v-if="order.status === 'paid'" class="paid-badge">
          구매 완료<span v-if="order.paid_at"> · {{ date(order.paid_at) }} 결제</span>
        </span>
        <span v-else class="pending-badge">결제 대기</span>
      </article>
    </div>
    <div v-else class="state-panel empty-state">
      <strong>아직 주문한 강의가 없습니다.</strong>
      <RouterLink to="/courses">강의 둘러보기</RouterLink>
    </div>
  </section>
</template>
