<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { api } from '../lib/api'
import SkeletonBlock from '../components/SkeletonBlock.vue'
import { useAuth } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const { user } = useAuth()
const post = ref(null)
const loading = ref(true)
const error = ref('')
const confirmingDelete = ref(false)
const deleting = ref(false)
const deleteError = ref('')
const deleteButton = ref(null)
const cancelButton = ref(null)
const canDelete = computed(() => Boolean(user.value && post.value?.created_by != null && user.value.idx === post.value.created_by))

async function askDelete() {
  confirmingDelete.value = true
  deleteError.value = ''
  await nextTick()
  cancelButton.value?.focus()
}

async function cancelDelete() {
  if (deleting.value) return
  confirmingDelete.value = false
  deleteError.value = ''
  await nextTick()
  deleteButton.value?.focus()
}

async function deletePost() {
  if (!canDelete.value || !confirmingDelete.value || deleting.value) return
  deleting.value = true
  deleteError.value = ''
  try {
    await api(`/board/delete/${post.value.idx}`, { method: 'DELETE' })
    await router.push('/board')
  } catch (err) {
    deleteError.value = err.message
  } finally {
    deleting.value = false
  }
}

async function load() {
  loading.value = true
  error.value = ''
  post.value = null
  confirmingDelete.value = false
  deleteError.value = ''
  try { post.value = await api(`/board/read/${route.params.idx}`) }
  catch (err) { error.value = err.message }
  finally { loading.value = false }
}

onMounted(load)
watch(() => route.params.idx, load)
</script>

<template>
  <section class="detail-page">
    <div class="detail-top"><RouterLink class="back-link" to="/board"><span aria-hidden="true">←</span> 이야기 목록</RouterLink><RouterLink class="quiet-link" to="/board/new">글 남기기</RouterLink></div>
    <article v-if="loading" class="detail-skeleton" role="status" aria-label="게시글 불러오는 중" aria-busy="true"><SkeletonBlock /><SkeletonBlock /><SkeletonBlock /><SkeletonBlock /></article>
    <div v-else-if="error" class="state-panel state-error" role="alert"><strong>이야기를 열지 못했습니다.</strong><p>{{ error }}</p><RouterLink class="text-button" to="/board">목록으로 돌아가기</RouterLink></div>
    <article v-else-if="post" class="detail-article">
      <p class="detail-eyebrow"><span class="detail-dot"></span>이야기 <span class="reading-index">No. {{ String(post.idx).padStart(2, '0') }}</span></p>
      <h1>{{ post.title || '제목 없는 글' }}</h1><div class="reading-rule"><span></span></div>
      <p class="detail-body">{{ post.contents || '내용이 비어 있습니다.' }}</p><p class="reading-end">— 여기까지 읽어 주셔서 고맙습니다</p>
      <div v-if="canDelete" class="story-owner-actions">
        <button v-if="!confirmingDelete" ref="deleteButton" class="story-delete-button" type="button" @click="askDelete">이야기 삭제</button>
        <div v-else class="story-delete-confirmation" role="group" aria-labelledby="story-delete-question" @keydown.esc.prevent="cancelDelete">
          <p id="story-delete-question">이 이야기를 삭제할까요? 삭제한 글은 되돌릴 수 없습니다.</p>
          <div class="story-delete-controls">
            <button ref="cancelButton" class="story-cancel-button" type="button" :disabled="deleting" @click="cancelDelete">취소</button>
            <button class="story-delete-button" type="button" :disabled="deleting" :aria-busy="deleting" @click="deletePost">{{ deleting ? '삭제 중…' : '삭제하기' }}</button>
          </div>
          <p v-if="deleteError" class="field-error" role="alert">{{ deleteError }}</p>
        </div>
      </div>
      <div class="detail-end"><RouterLink class="primary-link" to="/board">다른 이야기 읽기</RouterLink></div>
    </article>
  </section>
</template>

<style scoped>
.story-owner-actions{display:flex;justify-content:flex-end;margin-top:28px}.story-delete-button,.story-cancel-button{min-height:44px;padding:0 14px;border:1px solid #c7d1c8;border-radius:3px;background:transparent;color:#52665b;font:inherit;font-size:12px;cursor:pointer}.story-delete-button{border-color:#bf8279;color:#9e4035}.story-delete-button:hover{background:#f9eeeb}.story-cancel-button:hover{background:#e9f0e9}.story-delete-button:focus-visible,.story-cancel-button:focus-visible{outline:3px solid var(--teal,#267c6d);outline-offset:3px}.story-delete-button:disabled,.story-cancel-button:disabled{opacity:.6;cursor:wait}.story-delete-confirmation{width:100%;padding:18px;border:1px solid #d8c4bd;border-radius:3px}.story-delete-confirmation>p:first-child{margin:0 0 12px;color:#52665b;font-size:13px;line-height:1.8}.story-delete-controls{display:flex;justify-content:flex-end;gap:10px}.story-delete-confirmation .field-error{margin-top:12px}
</style>
