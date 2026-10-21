<script setup>
import { ref, toRefs } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { api } from '../lib/api'
import { boardDraft } from '../stores/boardDraft'

const router = useRouter()
const { title, contents } = toRefs(boardDraft)
const busy = ref(false)
const error = ref('')
const titleInput = ref(null)

async function publish() {
  if (busy.value) return
  if (!title.value.trim() || !contents.value.trim()) {
    error.value = '제목과 내용을 모두 입력해 주세요.'
    titleInput.value?.focus()
    return
  }
  busy.value = true
  error.value = ''
  try {
    const post = await api('/board/register', { method: 'POST', body: JSON.stringify({ title: title.value.trim(), contents: contents.value.trim() }) })
    title.value = ''
    contents.value = ''
    await router.push(`/board/${post.idx}`)
  } catch (err) {
    if (err.status === 401) await router.push({ path: '/login', query: { returnTo: '/board/new' } })
    else error.value = err.message
  }
  finally { busy.value = false }
}
</script>

<template>
  <section class="form-page write-page">
    <div class="form-page-heading"><RouterLink class="back-link" to="/board"><span aria-hidden="true">←</span> 이야기 목록</RouterLink><p class="overline"><span class="overline-rule"></span>당신의 차례</p><h1>어떤 생각이<br />떠올랐나요?</h1><p class="intro-text">천천히 적어도 괜찮아요. 올린 글은 누구나 읽을 수 있어요.</p></div>
    <form class="page-form" @submit.prevent="publish" novalidate>
      <label for="post-title">제목</label><input id="post-title" ref="titleInput" v-model="title" name="title" maxlength="120" autocomplete="off" placeholder="이야기의 제목을 적어 주세요…" />
      <label for="post-contents">내용</label><textarea id="post-contents" v-model="contents" name="contents" rows="9" autocomplete="off" placeholder="떠오른 생각을 여기에 적어 주세요…"></textarea>
      <p v-if="error" class="field-error" role="alert">{{ error }}</p>
      <div class="form-actions"><RouterLink class="secondary-link" to="/board">취소</RouterLink><button class="primary-button" type="submit" :disabled="busy" :aria-busy="busy"><span v-if="busy" class="button-spinner" aria-hidden="true"></span>{{ busy ? '올리는 중…' : '이야기 올리기' }}</button></div>
    </form>
  </section>
</template>
