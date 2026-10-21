<script setup>
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { computed } from 'vue'
import { StoreNavigation } from '../components'

const route = useRoute()
const storePage = computed(() => ['course-list', 'course-detail', 'course-create', 'order-list', 'component-gallery', 'login', 'signup'].includes(route.name))
const navigationItems = [
  { id: 'courses', label: '강의 둘러보기', href: '/courses' },
  { id: 'create', label: '강의 등록', href: '/courses/new' },
  { id: 'orders', label: '주문 내역', href: '/orders' },
  { id: 'board', label: '이야기', href: '/board' },
]
const activeSection = computed(() => {
  if (route.name === 'course-create') return 'create'
  if (['course-list', 'course-detail'].includes(route.name)) return 'courses'
  if (route.name === 'order-list') return 'orders'
  if (['board-list', 'board-detail', 'board-create'].includes(route.name)) return 'board'
  return ''
})
</script>

<template>
  <a class="skip-link" href="#main">본문으로 건너뛰기</a>
  <div class="site-shell" :class="{ 'store-shell': storePage }">
    <StoreNavigation brand="배움상점" home-href="/courses" :items="navigationItems" :active-id="activeSection" label="주요 메뉴">
      <template #brand><span class="app-brand"><span class="app-brand-mark" aria-hidden="true">배</span>배움상점</span></template>
      <template #link="{ item, active, close }"><RouterLink custom :to="item.href" v-slot="{ href, navigate }"><a :href="href" :aria-current="active ? 'page' : undefined" @click="close(); navigate($event)">{{ item.label }}</a></RouterLink></template>
      <template #actions><RouterLink class="app-account-link" to="/login" :aria-current="route.name === 'login' ? 'page' : undefined">로그인</RouterLink></template>
    </StoreNavigation>
    <main id="main" tabindex="-1">
      <RouterView v-slot="{ Component, route: currentRoute }"><Transition name="page" mode="out-in"><component :is="Component" :key="currentRoute.fullPath" /></Transition></RouterView>
    </main>
    <footer class="site-footer"><RouterLink class="footer-wordmark" to="/courses">배움상점</RouterLink><p>배움의 다음 장을 여는 곳</p><RouterLink to="/board">이야기 나누기</RouterLink></footer>
  </div>
</template>

<style scoped>
.app-brand{display:inline-flex;align-items:center;gap:9px;white-space:nowrap}.app-brand-mark{display:grid;place-items:center;width:32px;height:32px;border-radius:10px 10px 10px 3px;background:var(--store-ink,#15222b);color:var(--store-paper,#f4f6f2);font-size:16px;font-weight:700}.app-account-link{display:inline-flex;align-items:center;min-height:44px;color:var(--teal-deep,#1d6057);font-size:13px;text-decoration:none;white-space:nowrap}.app-account-link:hover{text-decoration:underline;text-underline-offset:4px}@media(max-width:480px){.app-brand{gap:7px;font-size:16px}.app-brand-mark{width:28px;height:28px;font-size:14px}}
</style>
