<script setup>
import { computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { api } from '../lib/api'
const router = useRouter()
const form = ref({ title: '', description: '', category: '', price: '', image_url: '', curriculum: '' })
const busy = ref(false); const error = ref(''); const validation = ref('')
const valid = computed(() => form.value.title.trim() && form.value.description.trim() && form.value.category.trim() && /^(0|[1-9]\d*)$/.test(String(form.value.price)) && form.value.curriculum.split('\n').some(line => line.trim()))
async function submit() {
 validation.value = ''
 if (!valid.value) { validation.value = '필수 항목을 입력하고 가격은 0 이상의 정수, 커리큘럼은 한 줄 이상 작성해 주세요.'; return }
 busy.value = true; error.value = ''
 const payload = { title: form.value.title.trim(), description: form.value.description.trim(), category: form.value.category.trim(), price: Number(form.value.price), curriculum: form.value.curriculum.trim() }
 if (form.value.image_url.trim()) payload.image_url = form.value.image_url.trim()
 try { const result = await api('/course/register', { method: 'POST', body: JSON.stringify(payload) }); await router.push(`/courses/${result.idx}`) }
 catch (err) { if (err.status === 401) await router.push({ name: 'login', query: { returnTo: '/courses/new' } }); else error.value = err.message }
 finally { busy.value = false }
}
</script>
<template><section class="store-form-page"><div class="form-intro"><RouterLink class="back-link" to="/courses">← 강의 둘러보기</RouterLink><p class="hero-kicker">지식 나누기</p><h1>당신의 배움을<br />강의로 만들어보세요.</h1><p>등록한 강의는 바로 공개되어 누구나 둘러볼 수 있습니다.</p></div><form class="store-form" @submit.prevent="submit"><label for="course-title">강의명</label><input id="course-title" v-model="form.title" maxlength="60" required /><label for="course-description">강의 소개</label><textarea id="course-description" v-model="form.description" required rows="4"></textarea><label for="course-category">카테고리</label><input id="course-category" v-model="form.category" maxlength="40" required /><label for="course-price">가격 (원)</label><input id="course-price" v-model="form.price" type="number" min="0" step="1" required /><label for="course-image">이미지 주소 (선택)</label><input id="course-image" v-model="form.image_url" type="url" /><label for="course-curriculum">커리큘럼 (한 줄에 한 강의)</label><textarea id="course-curriculum" v-model="form.curriculum" required rows="6"></textarea><p v-if="validation" class="field-error" role="alert">{{ validation }}</p><p v-if="error" class="field-error" role="alert">{{ error }}</p><button class="primary-button" :disabled="busy">{{ busy ? '등록 중' : '강의 공개하기' }}</button></form></section></template>
