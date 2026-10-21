import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/components', name: 'component-gallery', component: () => import('./views/ComponentGalleryView.vue') },
    { path: '/', redirect: '/courses' },
    { path: '/courses', name: 'course-list', component: () => import('./views/CourseListView.vue') },
    { path: '/courses/new', name: 'course-create', component: () => import('./views/CourseCreateView.vue') },
    { path: '/courses/:idx(\\d+)', name: 'course-detail', component: () => import('./views/CourseDetailView.vue') },
    { path: '/orders', name: 'order-list', component: () => import('./views/OrderListView.vue') },
    { path: '/payments/complete', name: 'payment-complete', component: () => import('./views/PaymentCompleteView.vue') },
    { path: '/board', name: 'board-list', component: () => import('./views/BoardListView.vue') },
    { path: '/board/new', name: 'board-create', component: () => import('./views/BoardCreateView.vue') },
    { path: '/board/:idx(\\d+)', name: 'board-detail', component: () => import('./views/BoardDetailView.vue') },
    { path: '/login', name: 'login', component: () => import('./views/LoginView.vue') },
    { path: '/signup', name: 'signup', component: () => import('./views/SignupView.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/courses' },
  ],
  scrollBehavior() { return { top: 0 } },
})

export default router
