<script setup>
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { api } from '../lib/api'
import StoreAccountPanel from '../../components/StoreAccountPanel.vue'
import StoreFormField from '../../components/StoreFormField.vue'

const router = useRouter()
const name = ref('')
const email = ref('')
const password = ref('')
const busy = ref(false)
const error = ref('')

async function signup() {
  if (busy.value) return
  busy.value = true
  error.value = ''
  try {
    await api('/user/signup', { method: 'POST', body: JSON.stringify({ name: name.value.trim(), email: email.value.trim(), password: password.value }) })
    await router.push('/login?created=1')
  } catch (err) { error.value = err.message }
  finally { busy.value = false }
}
</script>

<template>
  <div class="store-signup-page">
    <RouterLink class="store-signup-back" to="/courses">강의 둘러보기</RouterLink>
    <StoreAccountPanel title="배움을 시작하세요." heading-tag="h1" description="계정을 만들고 새로운 배움을 만나보세요." submit-label="회원가입" loading-label="가입하는 중…" :loading="busy" :error="error" @submit="signup">
      <template #brand><span class="store-signup-mark" aria-hidden="true">배</span></template>
      <StoreFormField id="signup-name" v-model="name" label="이름" name="name" autocomplete="name" required />
      <StoreFormField id="signup-email" v-model="email" label="이메일" name="email" type="email" autocomplete="email" spellcheck="false" placeholder="you@example.com" required />
      <StoreFormField id="signup-password" v-model="password" label="비밀번호" name="password" type="password" autocomplete="new-password" required />
      <template #footer>이미 계정이 있나요? <RouterLink to="/login">로그인</RouterLink></template>
    </StoreAccountPanel>
  </div>
</template>

<style scoped>
.store-signup-page{display:grid;justify-items:center;gap:30px;min-height:700px;padding:42px 0 80px;box-sizing:border-box}.store-signup-back{justify-self:start;color:var(--teal-deep,#1d6057);font-size:13px;text-decoration:none}.store-signup-back:hover{text-decoration:underline;text-underline-offset:4px}.store-signup-back:focus-visible{outline:3px solid var(--teal,#267c6d);outline-offset:4px;border-radius:3px}.store-signup-mark{display:grid;place-items:center;width:60px;height:60px;border-radius:18px 18px 18px 5px;background:var(--store-sage,#a6b9a8);color:var(--store-ink,#15222b);font-size:30px;font-weight:700}.store-signup-page :deep(.store-account__footer a){margin-left:8px;font-weight:600;text-underline-offset:4px}
@media(max-width:480px){.store-signup-page{gap:23px;min-height:0;padding:26px 0 54px}}
</style>
