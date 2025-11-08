import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import UpdateUserInfoView from '../views/UpdateUserInfoView.vue'
import UpdateProfileView from '../views/UpdateProfileView.vue'

// 使用 vue-router 提供的 RouteRecordRaw 类型来定义路由数组
const routes: Array<RouteRecordRaw> = [
  // 根路径重定向到更新页面，避免访问 '/' 时页面为空白
  {
    path: '/',
    redirect: '/update-info',
  },
  {
    path: '/update-info',
    name: 'UpdateInfo',
    component: UpdateUserInfoView,
  },
  {
    path: '/update-profile',
    name: 'UpdateProfile',
    component: UpdateProfileView,
  },
  // 捕获所有未匹配路径并重定向到根路径（或定向到其它页面）
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router