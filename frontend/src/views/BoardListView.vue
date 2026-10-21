<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { api } from '../lib/api'
import SkeletonBlock from '../components/SkeletonBlock.vue'

const posts = ref([])
const total = ref(0)
const loading = ref(true)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    const result = await api('/board/list')
    posts.value = result?.items ?? []
    total.value = result?.total ?? posts.value.length
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <section class="page-intro list-intro">
    <div><p class="overline"><span class="overline-rule"></span>작은 생각을 나누는 곳</p><h1>이야기 <span>둘러보기</span></h1><p class="intro-text">지나치기 쉬운 생각을 읽고, 당신의 이야기도 보태 주세요.</p></div>
    <RouterLink class="primary-link" to="/board/new">이야기 쓰기 <span aria-hidden="true">＋</span></RouterLink>
  </section>
  <section class="list-page" aria-labelledby="list-heading">
    <div class="section-heading"><div><h2 id="list-heading">모든 이야기</h2><p>함께 읽고 싶은 생각들</p></div><span class="post-count">{{ new Intl.NumberFormat('ko-KR').format(total) }}개의 글</span></div>
    <div v-if="loading" class="post-list" role="status" aria-label="게시글 불러오는 중" aria-busy="true">
      <div v-for="item in 5" :key="item" class="skeleton-row"><SkeletonBlock /><span><SkeletonBlock /><SkeletonBlock /></span></div>
    </div>
    <div v-else-if="error" class="state-panel" role="alert"><strong>이야기를 불러오지 못했습니다.</strong><p>{{ error }}</p><button class="text-button" type="button" @click="load">다시 불러오기</button></div>
    <div v-else-if="!posts.length" class="state-panel empty-state"><span class="empty-mark" aria-hidden="true">✳</span><strong>아직 첫 이야기가 없어요.</strong><p>오늘 떠오른 생각을 가장 먼저 남겨 주세요.</p><RouterLink class="text-button" to="/board/new">첫 글 쓰기</RouterLink></div>
    <div v-else class="post-list">
      <RouterLink v-for="post in posts" :key="post.idx" class="post-row" :to="`/board/${post.idx}`">
        <span class="post-marker" aria-hidden="true"><span></span></span>
        <span class="post-copy"><span class="post-title">{{ post.title || '제목 없는 글' }}</span><span class="post-preview">{{ (post.contents || '').slice(0, 110) || '내용이 비어 있습니다.' }}</span></span>
        <span class="post-index">{{ String(post.idx).padStart(2, '0') }}</span><span class="row-caret" aria-hidden="true">↗</span>
      </RouterLink>
    </div>
  </section>
</template>
