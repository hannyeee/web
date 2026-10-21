<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
const props = defineProps({ course: { type: Object, required: true } })
const price = computed(() => new Intl.NumberFormat('ko-KR').format(props.course.price))
</script>
<template>
  <RouterLink class="course-card" :to="`/courses/${course.idx}`">
    <div class="course-cover" :class="`cover-${(course.idx % 4) + 1}`">
      <img v-if="course.image_url" :src="course.image_url" :alt="`${course.title} 강의 이미지`" @error="$event.target.hidden = true" />
      <span v-else class="cover-glyph" aria-hidden="true">{{ (course.category || '배움').slice(0, 1) }}</span>
      <span class="course-category">{{ course.category }}</span>
    </div>
    <div class="course-card-copy"><h3>{{ course.title }}</h3><p class="course-instructor">{{ course.instructor_name }}</p><p class="course-price">{{ price }}원</p></div>
  </RouterLink>
</template>
