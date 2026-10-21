<script setup>
import { onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { api } from '../lib/api'
import SkeletonBlock from '../components/SkeletonBlock.vue'

const route = useRoute()
const post = ref(null)
const loading = ref(true)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  post.value = null
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
      <div class="detail-end"><RouterLink class="primary-link" to="/board">다른 이야기 읽기</RouterLink></div>
    </article>
  </section>
</template>
