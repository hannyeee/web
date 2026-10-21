<script setup>
import { ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { api } from '../lib/api'
import StoreAccountPanel from '../../components/StoreAccountPanel.vue'
import StoreFormField from '../../components/StoreFormField.vue'

const route = useRoute()
const router = useRouter()
const email = ref('')
const password = ref('')
const busy = ref(false)
const error = ref('')

async function login() {
  if (busy.value) return
  busy.value = true
  error.value = ''
  try {
    await api('/user/login', { method: 'POST', body: JSON.stringify({ email: email.value, password: password.value }) })
    await router.push(typeof route.query.returnTo === 'string' && route.query.returnTo.startsWith('/') && !route.query.returnTo.startsWith('//') && !route.query.returnTo.includes('\\') ? route.query.returnTo : '/courses')
  } catch (err) { error.value = err.message }
  finally { busy.value = false }
}
</script>

<template>
  <div class="store-login-page">
    <RouterLink class="store-login-back" to="/courses">강의 둘러보기</RouterLink>
    <StoreAccountPanel title="배움을 이어가세요." heading-tag="h1" description="배움상점 계정으로 로그인하세요." submit-label="로그인" loading-label="로그인 중…" :loading="busy" :error="error" @submit="login">
      <template #brand><span class="store-login-mark" aria-hidden="true">배</span></template>
      <template #notice><p v-if="route.query.created" class="store-login-success" role="status">가입이 완료됐습니다. 로그인해 주세요.</p></template>
      <StoreFormField id="login-email" v-model="email" label="이메일" name="email" type="email" autocomplete="email" spellcheck="false" placeholder="you@example.com" required />
      <StoreFormField id="login-password" v-model="password" label="비밀번호" name="password" type="password" autocomplete="current-password" required />
      <template #footer>처음 오셨나요? <RouterLink to="/signup">회원가입</RouterLink></template>
    </StoreAccountPanel>
  </div>
</template>

<style scoped>
.store-login-page{display:grid;justify-items:center;gap:30px;min-height:650px;padding:42px 0 80px;box-sizing:border-box}.store-login-back{justify-self:start;color:var(--teal-deep,#1d6057);font-size:13px;text-decoration:none}.store-login-back:hover{text-decoration:underline;text-underline-offset:4px}.store-login-back:focus-visible{outline:3px solid var(--teal,#267c6d);outline-offset:4px;border-radius:3px}.store-login-mark{display:grid;place-items:center;width:60px;height:60px;border-radius:18px 18px 18px 5px;background:var(--store-sage,#a6b9a8);color:var(--store-ink,#15222b);font-size:30px;font-weight:700}.store-login-success{margin:22px 0 0;padding:14px;border-radius:10px;background:#edf3ee;color:var(--teal-deep,#1d6057);font-size:13px;line-height:1.7}.store-login-page :deep(.store-account__footer a){margin-left:8px;font-weight:600;text-underline-offset:4px}
@media(max-width:480px){.store-login-page{gap:23px;min-height:0;padding:26px 0 54px}}
</style>
