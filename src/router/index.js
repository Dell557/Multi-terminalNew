import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('@/views/AboutView.vue'),
    },
    {
      path: '/detail/:id',
      name: 'detail',
      component: () => import('@/views/detail/DetailView.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    if (to.name === from.name && to.path !== from.path) {
      return { left: window.scrollX, top: window.scrollY }
    }
    return { left: 0, top: 0 }
  },
})

export default router
