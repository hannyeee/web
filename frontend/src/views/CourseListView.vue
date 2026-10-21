<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { api } from '../lib/api'
import { StoreSectionHeader, StoreProductCard, StoreBenefits, StoreAccordion, StoreButton } from '../../components'
const courses = ref([])
const loading = ref(true)
const error = ref('')
const products = computed(() => courses.value.map(course => ({
  id: course.idx, title: course.title, description: course.description,
  category: [course.category, course.instructor_name].filter(Boolean).join(' · '),
  price: `${new Intl.NumberFormat('ko-KR').format(course.price)}원`,
  badge: course.price === 0 ? '무료 강의' : '', image: course.image_url,
  imageAlt: `${course.title} 강의 이미지`, href: `/courses/${course.idx}`,
})))
const benefits = [
  { id: 'choose', title: '관심 있는 분야부터.', description: '분야별로 강의를 골라 지금 필요한 배움을 찾아보세요.', icon: '↗' },
  { id: 'read', title: '충분히 살펴보고.', description: '강의 소개와 강사, 수업 구성을 확인하고 선택하세요.', icon: '+' },
  { id: 'orders', title: '신청 내역은 한곳에.', description: '주문 내역에서 신청한 강의와 결제 상태를 확인하세요.', icon: '✓' },
]
const questions = [
  { id: 'detail', title: '강의의 상세 정보는 어디서 확인하나요?', content: '강의 카드의 자세히 보기를 선택하면 소개, 강사, 가격과 수업 구성을 확인할 수 있습니다.' },
  { id: 'account', title: '강의를 신청하려면 로그인이 필요한가요?', content: '강의 목록과 상세 정보는 로그인 없이 살펴볼 수 있습니다. 강의를 신청할 때는 계정으로 로그인해 주세요.' },
  { id: 'orders', title: '신청한 강의는 어디서 확인하나요?', content: '상단의 주문 내역에서 신청 내역과 결제 상태를 확인할 수 있습니다.' },
]
async function load() {
  loading.value = true; error.value = ''
  try { const result = await api('/course/list'); courses.value = result?.items || [] }
  catch (err) { error.value = err.message }
  finally { loading.value = false }
}
onMounted(load)
</script>
<template>
  <div class="catalog-storefront">
    <section class="catalog-intro">
      <div><StoreSectionHeader as="h1" title="배움상점." description="내일의 나를 위한, 오늘의 좋은 선택." /><p>지금 필요한 기술과 관점을 만나보세요.</p></div>
      <div class="catalog-help"><p>나누고 싶은 배움이 있나요?</p><RouterLink to="/courses/new">강의 등록하기 <span aria-hidden="true">↗</span></RouterLink></div>
    </section>
    <section id="course-catalog" class="catalog-products">
      <div v-if="loading" class="catalog-loading" aria-busy="true" aria-label="강의를 불러오는 중"><div v-for="n in 3" :key="n" class="catalog-skeleton"><span></span><i></i><i></i></div></div>
      <div v-else-if="error" class="state-panel" role="alert"><strong>강의를 불러오지 못했어요.</strong><p>{{ error }}</p><StoreButton variant="secondary" @click="load">다시 불러오기</StoreButton></div>
      <template v-else-if="courses.length">
        <p class="catalog-count" role="status">전체 {{ products.length }}개의 강의</p>
        <StoreSectionHeader title="지금 만나는 배움." description="새로운 가능성을 골라보세요." />
        <ul class="catalog-course-grid" aria-label="전체 강의 목록">
          <li v-for="product in products" :key="product.id">
            <StoreProductCard :product="product"><template #action><RouterLink class="catalog-product-link" :to="product.href" :aria-label="`${product.title} 자세히 보기`">자세히 보기</RouterLink></template></StoreProductCard>
          </li>
        </ul>
      </template>
      <div v-else class="state-panel empty-state"><strong>아직 등록된 강의가 없어요.</strong><p>첫 강의를 등록하고 배움을 나눠보세요.</p><RouterLink class="primary-link" to="/courses/new">강의 등록하기</RouterLink></div>
    </section>
    <section class="catalog-section"><StoreSectionHeader title="배움상점과 함께." description="선택부터 신청까지, 편안하게." /><StoreBenefits :items="benefits" /></section>
    <section class="catalog-section"><StoreSectionHeader title="시작하기 전에." description="궁금한 점을 확인하세요." /><StoreAccordion :items="questions" /></section>
  </div>
</template>

<style scoped>
.catalog-storefront{padding-bottom:80px}.catalog-intro{display:flex;align-items:center;justify-content:space-between;gap:50px;padding:76px 0 50px}.catalog-intro>div:first-child{max-width:790px}.catalog-intro :deep(.store-section-title){font-size:clamp(38px,4.7vw,62px);line-height:1.22;letter-spacing:-2.8px;text-wrap:pretty}.catalog-intro>div>p{margin:19px 0 0;color:#52665b;font-size:15px;line-height:1.8}.catalog-help{flex-shrink:0;font-size:13px;line-height:1.8}.catalog-help p{margin:0 0 8px;color:#52665b}.catalog-help a,.catalog-product-link{color:var(--teal-deep,#1d6057);text-decoration:none}.catalog-help a:hover,.catalog-product-link:hover{text-decoration:underline;text-underline-offset:4px}.catalog-products{margin-top:44px}.catalog-count{margin:0 0 16px;color:#52665b;font-size:12px;font-variant-numeric:tabular-nums}.catalog-product-link{margin-left:auto;padding:11px 0;font-size:13px;font-weight:650}.catalog-product-link:focus-visible{outline:3px solid var(--teal,#267c6d);outline-offset:3px}.catalog-section{margin-top:68px}.catalog-loading{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px}.catalog-skeleton{display:grid;gap:20px;min-height:400px;padding:26px;border:1px solid var(--line,#dce4dc);border-radius:22px;background:#fff}.catalog-skeleton span{height:220px;border-radius:14px;background:#e4eae1}.catalog-skeleton i{height:18px;border-radius:4px;background:#e4eae1}.catalog-skeleton i:last-child{width:55%}@media(max-width:760px){.catalog-intro{align-items:flex-start;flex-direction:column;gap:24px;padding:45px 0 30px}.catalog-intro :deep(.store-section-title){font-size:44px;letter-spacing:-2px}.catalog-help{display:flex;flex-wrap:wrap;gap:6px 15px}.catalog-loading{grid-template-columns:repeat(2,minmax(0,1fr))}.catalog-loading>div:last-child{display:none}.catalog-section{margin-top:46px}}@media(max-width:480px){.catalog-intro :deep(.store-section-title){font-size:36px;letter-spacing:-1.8px}.catalog-intro>div>p{font-size:13px}.catalog-products{margin-top:30px}.catalog-loading{grid-template-columns:1fr}.catalog-loading>div:not(:first-child){display:none}.catalog-storefront{padding-bottom:48px}}
.catalog-course-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px;margin:28px 0 0;padding:0;list-style:none}.catalog-course-grid>li{min-width:0}@media(max-width:960px){.catalog-course-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:600px){.catalog-course-grid{grid-template-columns:minmax(0,1fr);gap:20px}}
</style>
