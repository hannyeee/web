<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { api } from '../lib/api'
import { isPortoneConfigured, requestCoursePayment } from '../lib/portone'
import { StoreSectionHeader, StoreProductGallery, StorePurchaseSummary, StoreAccordion, StoreButton } from '../../components'

const route = useRoute()
const router = useRouter()
const course = ref(null)
const error = ref('')
const busy = ref(false)
const notice = ref('')
const loading = ref(true)
const price = (value) => `${new Intl.NumberFormat('ko-KR').format(value)}원`
const lessons = computed(() => (course.value?.curriculum || '').split('\n').map(item => item.trim()).filter(Boolean))
const images = computed(() => course.value?.image_url ? [{ src: course.value.image_url, alt: `${course.value.title} 강의 이미지` }] : [])
const questions = [
  { id: 'payment', title: '구매한 강의는 어디서 확인하나요?', content: '상단의 주문 내역에서 신청한 강의와 결제 상태를 확인할 수 있습니다. 유료 강의는 결제가 확인된 후 구매 완료로 표시됩니다.' },
  { id: 'login', title: '로그인 없이 신청할 수 있나요?', content: '강의를 신청하려면 로그인이 필요합니다. 로그인 후 다시 강의 상세 화면으로 돌아와 신청을 이어갈 수 있습니다.' },
]

async function load() {
  loading.value = true
  error.value = ''
  try {
    course.value = await api(`/course/read/${route.params.idx}`)
  } catch (err) {
    error.value = err.message
  } finally { loading.value = false }
}

async function order() {
  if (busy.value) return
  busy.value = true
  error.value = ''
  notice.value = ''
  try {
    if (!course.value) return
    if (course.value.price > 0 && !isPortoneConfigured()) {
      throw new Error('결제 서비스 설정이 완료되지 않았습니다. 관리자에게 문의해 주세요.')
    }

    const created = await api('/order/register', {
      method: 'POST',
      body: JSON.stringify({ course_id: Number(route.params.idx) }),
    })
    if (created.status === 'paid' && !created.payment_id) {
      notice.value = '무료 강의 신청이 완료되었습니다.'
      return
    }
    await requestCoursePayment({
      paymentId: created.payment_id,
      orderName: created.course_title,
      totalAmount: created.amount,
      orderId: created.idx,
    })
  } catch (err) {
    if (err.status === 401) router.push({ name: 'login', query: { returnTo: route.fullPath } })
    else error.value = err.message
  } finally {
    busy.value = false
  }
}

onMounted(load)
</script>

<template>
  <section v-if="course" class="course-store-detail">
    <RouterLink class="back-link" to="/courses">← 강의 목록</RouterLink>
    <header class="course-store-heading"><p>{{ course.category }} · {{ course.instructor_name }}</p><h1>{{ course.title }}</h1><span>{{ price(course.price) }}</span></header>
    <div class="course-store-layout">
      <article class="course-store-content">
        <StoreProductGallery :images="images" :label="`${course.title} 강의 이미지`"><template #placeholder><div class="course-store-art" aria-hidden="true"><span>{{ (course.category || '배움').slice(0, 1) }}</span><small>배움상점</small></div></template></StoreProductGallery>
        <section class="course-store-section"><StoreSectionHeader title="이 강의를 소개합니다." /><p class="course-store-description">{{ course.description }}</p></section>
        <section class="course-store-section"><StoreSectionHeader title="한 단계씩." description="이렇게 배워갑니다." /><ol class="course-store-lessons"><li v-for="(lesson, index) in lessons" :key="index"><span class="course-store-lesson-number" aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span>{{ lesson }}</li></ol></section>
        <section class="course-store-section"><StoreSectionHeader title="궁금한 점이 있나요?" /><StoreAccordion :items="questions" /></section>
      </article>
      <StorePurchaseSummary class="course-store-purchase" :title="course.title" :price="price(course.price)" :items="[{ label: '강사', value: course.instructor_name }, { label: '분야', value: course.category }, { label: '수업 구성', value: `${lessons.length}개 수업` }]" :loading="busy" :action-label="course.price === 0 ? '무료 강의 신청하기' : '강의 구매하기'" loading-label="결제창을 여는 중…" note="결제가 확인되면 주문 내역에 구매 완료로 표시됩니다." @checkout="order">
        <p v-if="notice" class="success-note" role="status">
          {{ notice }} <RouterLink to="/orders">주문 내역 보기</RouterLink>
        </p>
        <p v-if="error" class="field-error" role="alert">{{ error }}</p>
      </StorePurchaseSummary>
    </div>
  </section>
  <section v-else class="state-panel" :aria-busy="loading">
    <p v-if="error" role="alert">{{ error }}</p>
    <p v-else>강의 정보를 불러오는 중입니다.</p>
    <StoreButton v-if="error" variant="secondary" @click="load">다시 불러오기</StoreButton>
    <RouterLink to="/courses">강의 목록</RouterLink>
  </section>
</template>

<style scoped>
.course-store-detail{padding:32px 0 80px}.course-store-heading{max-width:900px;padding:40px 0}.course-store-heading>p{margin:0 0 15px;color:var(--teal-deep,#1d6057);font-size:13px}.course-store-heading h1{margin:0 0 20px;color:var(--store-ink,#15222b);font-size:clamp(34px,4.5vw,54px);line-height:1.25;letter-spacing:-2px;word-break:keep-all;overflow-wrap:anywhere}.course-store-heading>span{font-size:18px;font-variant-numeric:tabular-nums}.course-store-layout{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(300px,1fr);gap:48px;align-items:start}.course-store-content{min-width:0}.course-store-purchase{position:sticky;top:24px}.course-store-purchase .success-note,.course-store-purchase .field-error{margin-top:18px}.course-store-section{margin-top:46px}.course-store-section :deep(.store-section-title){font-size:28px}.course-store-description{margin:0;color:#52665b;font-size:15px;line-height:1.95;white-space:pre-wrap;overflow-wrap:anywhere}.course-store-lessons{margin:0;padding:0;list-style:none;border-top:1px solid var(--line,#dce4dc)}.course-store-lessons li{display:flex;align-items:baseline;gap:18px;padding:22px 4px;border-bottom:1px solid var(--line,#dce4dc);color:var(--store-ink,#15222b);font-size:15px;line-height:1.7;overflow-wrap:anywhere}.course-store-lesson-number{flex-shrink:0;color:var(--teal-deep,#1d6057);font-size:12px;font-variant-numeric:tabular-nums}.course-store-art{display:grid;place-items:center;gap:24px;width:210px;max-width:100%;aspect-ratio:1;border-radius:22px;background:var(--store-sage,#a6b9a8);color:var(--store-ink,#15222b);transform:rotate(-6deg)}.course-store-art>span{font-size:86px;font-weight:700}.course-store-art>small{font-size:12px}.course-store-purchase :deep(.store-summary__total strong){font-size:32px}@media(max-width:760px){.course-store-layout{grid-template-columns:1fr;gap:34px}.course-store-purchase{position:static;grid-row:2}.course-store-heading{padding:30px 0}.course-store-detail{padding-bottom:48px}}@media(max-width:480px){.course-store-heading h1{font-size:33px;letter-spacing:-1.4px}.course-store-section :deep(.store-section-title){font-size:25px}.course-store-layout{gap:24px}}
</style>
