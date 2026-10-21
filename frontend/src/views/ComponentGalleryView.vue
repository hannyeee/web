<script setup>
import { computed, ref } from 'vue'
import {
  StoreNavigation, StoreButton, StoreSectionHeader, StoreCategoryNav,
  StoreProductRail, StoreProductGallery, StoreOptionPicker, StorePurchaseSummary,
  StoreBenefits, StoreAccordion, StoreFormField, StoreAccountPanel,
  StoreSelectField, StoreCheckbox,
} from '../../components'

// Self-contained examples: these screens never send login or checkout requests.
const screen = ref('catalog')
const category = ref('all')
const status = ref('')
const screens = [{ id: 'catalog', label: '상품 목록' }, { id: 'detail', label: '상품 상세' }, { id: 'login', label: '로그인' }, { id: 'signup', label: '회원가입' }]
function artwork(title, background, accent) {
  title = title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="490" viewBox="0 0 640 490"><rect width="640" height="490" rx="24" fill="${background}"/><g transform="translate(150 68) rotate(-7 170 170)"><rect x="18" y="20" width="340" height="340" rx="18" fill="#15222b" opacity=".08"/><rect width="340" height="340" rx="18" fill="#fbfcf9"/><path d="M38 45h264" stroke="${accent}" stroke-width="3"/><circle cx="170" cy="162" r="84" fill="${accent}" opacity=".2"/><path d="M97 166l48 46 98-98" fill="none" stroke="${accent}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/><text x="38" y="290" font-family="sans-serif" font-size="38" font-weight="700" fill="#15222b">${title}</text></g></svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}
const products = [
  { id: 'vue', title: 'Vue로 만드는 나의 첫 서비스', description: '아이디어를 살아 있는 화면으로.', price: '₩39,000', amount: 39000, category: '프론트엔드', categoryId: 'frontend', badge: '새로운 강의', image: artwork('Vue Studio', '#dcece3', '#267c6d'), imageAlt: 'Vue 강의의 학습 노트 일러스트' },
  { id: 'api', title: '차근차근, FastAPI', description: '직접 만들며 익히는 백엔드의 기본.', price: '₩49,000', amount: 49000, category: '백엔드', categoryId: 'backend', image: artwork('API Workshop', '#e8ede6', '#15222b'), imageAlt: 'API 강의의 학습 노트 일러스트' },
  { id: 'design', title: '오래 쓰이는 화면의 원칙', description: '사용자의 다음 행동을 생각하는 디자인.', price: '₩35,000', amount: 35000, category: '디자인', categoryId: 'design', image: artwork('Design Notes', '#f2e5df', '#d7654a'), imageAlt: '디자인 강의의 학습 노트 일러스트' },
  { id: 'vue-next', title: '한 걸음 더, Vue 컴포넌트', description: '다음 프로젝트에서도 꺼내 쓰는 구조.', price: '₩59,000', amount: 59000, category: '프론트엔드', categoryId: 'frontend', image: artwork('Next Chapter', '#e0e7de', '#1d6057'), imageAlt: '컴포넌트 강의의 학습 노트 일러스트' },
]
const categories = [{ id: 'all', label: '전체 강의' }, { id: 'frontend', label: '프론트엔드', image: products[0].image }, { id: 'backend', label: '백엔드', image: products[1].image }, { id: 'design', label: '디자인', image: products[2].image }]
const filteredProducts = computed(() => category.value === 'all' ? products : products.filter(product => product.categoryId === category.value))
const selected = ref(products[0])
const learning = ref('self')
const detailImages = computed(() => [
  { src: selected.value.image, alt: selected.value.imageAlt, caption: '강의 소개' },
  { src: artwork('Learn & Build', '#e8ede6', '#267c6d'), alt: '실습 중심 학습 과정 일러스트', caption: '직접 만드는 실습' },
])
const total = computed(() => selected.value.amount + (learning.value === 'mentor' ? 40000 : 0))
const benefits = [{ id: 'access', title: '배움은 내 속도로.', description: '필요할 때 꺼내 보는 온라인 강의.', icon: '↗' }, { id: 'practice', title: '만들면서 익히는 경험.', description: '작은 실습을 쌓아 하나의 결과물로.', icon: '⌘' }, { id: 'support', title: '함께 풀어가는 질문.', description: '막히는 순간에는 학습 커뮤니티와 함께.', icon: '+' }]
const questions = [{ id: 'start', title: '강의는 언제부터 들을 수 있나요?', content: '수강 신청이 완료되면 나의 강의에서 바로 시작할 수 있습니다.' }, { id: 'level', title: '처음 시작하는 사람도 들을 수 있나요?', content: '강의마다 필요한 사전 지식이 다릅니다. 상세 페이지에서 학습 대상과 커리큘럼을 먼저 확인해 주세요.' }]
const email = ref('')
const password = ref('')
const name = ref('')
const confirmPassword = ref('')
const country = ref('KR')
const consent = ref(false)
const remember = ref(false)
const formError = ref('')
function changeScreen(next) { screen.value = next; status.value = ''; formError.value = '' }
function openProduct(product) { selected.value = product; learning.value = 'self'; changeScreen('detail') }
function previewAccount() {
  formError.value = ''
  if (screen.value === 'signup' && password.value !== confirmPassword.value) { formError.value = '비밀번호가 일치하지 않습니다.'; return }
  status.value = '입력 상태를 확인했습니다. 미리보기에서는 계정 정보를 전송하지 않습니다.'
}
</script>

<template>
  <div class="component-preview">
    <div class="preview-intro"><p>배움상점 · 컴포넌트 미리보기</p><h1>좋은 배움의 시작.</h1><p>익숙하고 편안한 쇼핑 경험에, 배움상점의 색을 담았습니다.</p></div>
    <nav class="preview-screens" aria-label="미리보기 화면"><button v-for="item in screens" :key="item.id" type="button" :aria-pressed="screen === item.id" @click="changeScreen(item.id)">{{ item.label }}</button></nav>
    <p v-if="status" class="preview-status" role="status">{{ status }}</p>

    <template v-if="screen === 'catalog'">
      <StoreNavigation brand="배움상점" home-href="/courses" :items="[{ id: 'courses', label: '모든 강의', href: '#preview-products' }, { id: 'benefits', label: '학습 경험', href: '#preview-benefits' }, { id: 'faq', label: '자주 묻는 질문', href: '#preview-faq' }]" active-id="courses"><template #actions><button class="preview-text-action" type="button" @click="changeScreen('login')">로그인</button></template></StoreNavigation>
      <div class="preview-store-heading"><StoreSectionHeader title="배움을 고르는 시간." description="당신의 다음 장을 만나보세요." /></div>
      <StoreCategoryNav v-model="category" :items="categories" label="강의 분야" />
      <div id="preview-products" class="preview-section"><StoreProductRail title="추천 강의." description="오늘 시작할 새로운 가능성." :products="filteredProducts" @select="openProduct" /></div>
      <section id="preview-benefits" class="preview-section"><StoreSectionHeader title="배움상점과 함께." description="시작부터 완성까지." /><StoreBenefits :items="benefits" /></section>
      <section id="preview-faq" class="preview-section"><StoreSectionHeader title="궁금한 점이 있나요?" /><StoreAccordion :items="questions" /></section>
    </template>

    <template v-else-if="screen === 'detail'">
      <button class="preview-text-action" type="button" @click="changeScreen('catalog')">‹ 모든 강의로 돌아가기</button>
      <div class="preview-detail-heading"><p>{{ selected.category }}</p><h2>{{ selected.title }}</h2><p>{{ selected.description }}</p></div>
      <div class="preview-detail-layout">
        <div><StoreProductGallery :images="detailImages" :label="selected.title" /><section class="preview-section"><StoreSectionHeader title="시작하기 전에." /><StoreAccordion :items="questions" /></section></div>
        <div class="preview-detail-options"><StoreOptionPicker v-model="learning" label="어떤 방식으로 배울까요?" description="지금 나에게 맞는 학습 경험을 선택하세요." :options="[{ id: 'self', label: '스스로 배우기', description: '온라인 강의와 실습 자료', price: selected.price }, { id: 'mentor', label: '멘토와 함께', description: '온라인 강의와 일대일 피드백', price: '+ ₩40,000' }]" /><StorePurchaseSummary :title="selected.title" :price="total" :items="[{ label: '학습 방식', value: learning === 'self' ? '스스로 배우기' : '멘토와 함께' }]" note="상품 선택 예시입니다. 실제 주문이나 결제는 진행되지 않습니다." action-label="선택 확인하기" @checkout="status = '선택한 학습 방식과 금액을 확인했습니다. 실제 결제는 진행되지 않습니다.'" /></div>
      </div>
    </template>

    <div v-else class="preview-account-area">
      <StoreAccountPanel :key="screen" :title="screen === 'login' ? '다시 만나 반가워요.' : '새로운 배움을 시작하세요.'" :description="screen === 'login' ? '배움상점 계정으로 이어서 시작하세요.' : '하나의 계정으로 모든 배움을 만나보세요.'" :submit-label="screen === 'login' ? '로그인 확인' : '가입 정보 확인'" :error="formError" @submit="previewAccount">
        <template #brand><span class="preview-brand-mark" aria-hidden="true">배</span></template>
        <StoreFormField v-if="screen === 'signup'" v-model="name" label="이름" name="name" autocomplete="name" required />
        <StoreSelectField v-if="screen === 'signup'" v-model="country" label="국가 / 지역" name="country" autocomplete="country" :options="[{ value: 'KR', label: '대한민국' }, { value: 'US', label: '미국' }, { value: 'JP', label: '일본' }]" />
        <StoreFormField v-model="email" label="이메일" type="email" name="email" autocomplete="email" required />
        <StoreFormField v-model="password" label="비밀번호" type="password" name="password" :autocomplete="screen === 'login' ? 'current-password' : 'new-password'" :minlength="screen === 'signup' ? 8 : undefined" :hint="screen === 'signup' ? '8자 이상으로 입력해 주세요.' : ''" required />
        <StoreFormField v-if="screen === 'signup'" v-model="confirmPassword" label="비밀번호 확인" type="password" name="confirmPassword" autocomplete="new-password" required />
        <StoreCheckbox v-if="screen === 'login'" v-model="remember" label="이메일 기억하기" name="remember" hint="이 미리보기에서는 기기에 저장하지 않습니다." />
        <StoreCheckbox v-else v-model="consent" label="이용약관 및 개인정보 처리방침 동의" name="consent" required hint="필수 동의 항목 예시입니다." />
        <template #footer>{{ screen === 'login' ? '처음 오셨나요?' : '이미 계정이 있나요?' }} <button class="preview-text-action" type="button" @click="changeScreen(screen === 'login' ? 'signup' : 'login')">{{ screen === 'login' ? '회원가입' : '로그인' }}</button></template>
        <template #privacy>컴포넌트 동작을 확인하는 미리보기입니다. 입력한 정보는 서버에 전송하거나 저장하지 않습니다.</template>
      </StoreAccountPanel>
    </div>
    <footer class="preview-footer"><p>색은 그대로. 경험은 더 편안하게.</p><StoreButton variant="quiet" @click="changeScreen('catalog')">상품 목록 살펴보기</StoreButton></footer>
  </div>
</template>

<style scoped>
.component-preview{padding:44px 0 30px;color:var(--store-ink,#15222b)}.preview-intro>p:first-child{margin:0 0 22px;color:#52665b;font-size:12px}.preview-intro h1{margin:0;font-size:clamp(34px,5vw,62px);line-height:1.2;letter-spacing:-2.8px;text-wrap:balance}.preview-intro>p:last-child{margin:20px 0 0;color:#52665b;font-size:14px;line-height:1.8}.preview-screens{display:flex;gap:8px;flex-wrap:wrap;margin:32px 0 46px;padding-bottom:24px;border-bottom:1px solid var(--line,#dce4dc)}.preview-screens button{min-height:44px;padding:10px 20px;border:1px solid var(--line,#dce4dc);border-radius:999px;background:transparent;color:var(--store-ink,#15222b);font:inherit;font-size:13px;cursor:pointer}.preview-screens button[aria-pressed=true]{border-color:var(--store-ink,#15222b);background:var(--store-ink,#15222b);color:var(--store-paper,#f4f6f2)}.preview-screens button:focus-visible,.preview-text-action:focus-visible{outline:3px solid var(--teal,#267c6d);outline-offset:3px}.preview-store-heading{max-width:740px;padding:50px 0 14px}.preview-section{margin-top:54px;scroll-margin-top:24px}.preview-text-action{min-height:44px;padding:5px 0;border:0;background:transparent;color:var(--teal-deep,#1d6057);font:inherit;font-size:13px;text-decoration:underline;text-underline-offset:4px;cursor:pointer}.preview-detail-heading{max-width:760px;padding:22px 0 36px}.preview-detail-heading>p{margin:0 0 12px;color:#52665b;font-size:14px;line-height:1.8}.preview-detail-heading>p:first-child{color:var(--teal-deep,#1d6057);font-size:12px}.preview-detail-heading h2{margin:0 0 18px;font-size:clamp(28px,4vw,44px);line-height:1.3;letter-spacing:-1.5px}.preview-detail-layout{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(290px,1fr);gap:48px;align-items:start}.preview-detail-options{display:grid;gap:30px}.preview-status{padding:16px 20px;border-left:3px solid var(--teal,#267c6d);border-radius:0 10px 10px 0;background:#e4eee5;color:var(--teal-deep,#1d6057);font-size:14px;line-height:1.8}.preview-account-area{padding:12px 0 44px}.preview-brand-mark{display:grid;place-items:center;width:52px;height:52px;border-radius:16px 16px 16px 4px;background:var(--store-ink,#15222b);color:var(--store-paper,#f4f6f2);font-size:23px;font-weight:700}.preview-footer{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-top:70px;padding-top:26px;border-top:1px solid var(--line,#dce4dc);color:#52665b;font-size:12px}.preview-footer p{margin:0}@media(max-width:760px){.preview-detail-layout{grid-template-columns:1fr;gap:32px}.preview-detail-options{max-width:none}.preview-store-heading{padding-top:34px}}@media(max-width:480px){.component-preview{padding-top:30px}.preview-intro h1{letter-spacing:-1.5px}.preview-screens{gap:6px;margin-bottom:30px}.preview-screens button{padding-inline:13px;font-size:12px}.preview-section{margin-top:38px}.preview-footer{align-items:flex-start;flex-direction:column;gap:10px;margin-top:45px}}
</style>
