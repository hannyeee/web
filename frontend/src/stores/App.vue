<script setup>
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { computed, onMounted } from 'vue'
import { StoreNavigation } from '../../components/index.js'
import { useAuth } from './auth.js'

const route = useRoute()
const { user, restoring, restoreError, logoutBusy, logoutError, restoreSession, logout } = useAuth()
onMounted(restoreSession)
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
      <template #actions>
        <div class="app-account">
          <template v-if="user">
            <span class="app-account-name" :title="user.name">{{ user.name }}님</span>
            <button class="app-account-link app-logout" type="button" :disabled="logoutBusy" :aria-busy="logoutBusy" @click="logout">{{ logoutBusy ? '로그아웃 중…' : '로그아웃' }}</button>
          </template>
          <span v-else-if="restoring" class="app-account-status" role="status">계정 확인 중…</span>
          <RouterLink v-else class="app-account-link" to="/login" :aria-current="route.name === 'login' ? 'page' : undefined">로그인</RouterLink>
          <p v-if="logoutError" class="app-account-error" role="alert">{{ logoutError }}</p>
          <button v-if="restoreError" class="app-account-link app-logout app-account-retry" type="button" @click="restoreSession">계정 확인 다시 시도</button>
        </div>
      </template>
    </StoreNavigation>
    <main id="main" tabindex="-1">
      <RouterView v-slot="{ Component, route: currentRoute }"><Transition name="page" mode="out-in"><component :is="Component" :key="currentRoute.fullPath" /></Transition></RouterView>
    </main>
    <footer class="site-footer"><RouterLink class="footer-wordmark" to="/courses">배움상점</RouterLink><p>배움의 다음 장을 여는 곳</p><RouterLink to="/board">이야기 나누기</RouterLink></footer>
  </div>
</template>

<style scoped>
.app-brand{display:inline-flex;align-items:center;gap:9px;white-space:nowrap}.app-brand-mark{display:grid;place-items:center;width:32px;height:32px;border-radius:10px 10px 10px 3px;background:var(--store-ink,#15222b);color:var(--store-paper,#f4f6f2);font-size:16px;font-weight:700}.app-account-link{display:inline-flex;align-items:center;min-height:44px;color:var(--teal-deep,#1d6057);font-size:13px;text-decoration:none;white-space:nowrap}.app-account-link:hover{text-decoration:underline;text-underline-offset:4px}@media(max-width:480px){.app-brand{gap:7px;font-size:16px}.app-brand-mark{width:28px;height:28px;font-size:14px}}
.app-account{display:flex;align-items:center;justify-content:flex-end;flex-wrap:wrap;gap:0 12px;max-width:300px}.app-account-name{max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px;color:var(--store-ink,#15222b)}.app-logout{border:0;padding:0 4px;background:transparent;font-family:inherit;cursor:pointer}.app-logout:disabled{opacity:.6;cursor:wait}.app-logout:focus-visible{outline:3px solid var(--teal,#267c6d);outline-offset:3px;border-radius:3px}.app-account-status{font-size:12px;color:#52665b}.app-account-error{flex-basis:100%;max-width:280px;margin:0 0 8px;color:#9e4035;font-size:12px;line-height:1.6}.app-account-retry{font-size:12px}@media(max-width:480px){.app-account{max-width:180px;gap:0 6px}.app-account-name{max-width:88px}}
</style>
