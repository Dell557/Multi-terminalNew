import { createRouter, createWebHistory } from 'vue-router'
import { ROUTE_NAMES, ROUTE_PATHS } from './routes'

const routes = [
  {
    path: '/h5',
    redirect: ROUTE_PATHS.HOME
  },
  {
    path: ROUTE_PATHS.HOME,
    name: ROUTE_NAMES.HOME,
    component: () => import('../views/Home.vue'),
    meta: {
      title: '首页',
      transition: 'slide-fade'
    }
  },
  {
    path: ROUTE_PATHS.DETAIL,
    name: ROUTE_NAMES.DETAIL,
    component: () => import('../views/CourseDetail.vue'),
    meta: {
      title: '课程详情',
      transition: 'slide-right'
    }
  },
  {
    path: ROUTE_PATHS.FILTER,
    name: ROUTE_NAMES.FILTER,
    component: () => import('../views/FilterPage.vue'),
    meta: {
      title: '筛选',
      transition: 'slide-up'
    }
  },
  {
    path: ROUTE_PATHS.SEARCH,
    name: ROUTE_NAMES.SEARCH,
    component: () => import('../views/SearchPage.vue'),
    meta: {
      title: '搜索',
      transition: 'slide-up'
    }
  },
  {
    path: ROUTE_PATHS.FEISHU_SEARCH,
    name: ROUTE_NAMES.FEISHU_SEARCH,
    component: () => import('../views/FeishuDocs.vue'),
    meta: {
      title: '飞书文档',
      transition: 'fade'
    }
  },
  {
    path: ROUTE_PATHS.FEISHU_DOC,
    name: ROUTE_NAMES.FEISHU_DOC,
    component: () => import('../views/FeishuDocs.vue'),
    meta: {
      title: '飞书文档',
      transition: 'fade'
    }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
