import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import MainLayout from '@/views/MainLayout.vue'
import ChangePassword from '@/views/ChangePassword.vue'
import { useUserStore } from '../stores/user'



import UpdateUserInfoView from '../views/UpdateUserInfoView.vue'
import UpdateProfileView from '../views/UpdateProfileView.vue'
import CourseList from '@/views/Course/CourseList.vue'
import ForgotPassword from '@/views/ForgotPassword.vue'



// 使用 vue-router 提供的 RouteRecordRaw 类型来定义路由数组
const routes: Array<RouteRecordRaw> = [

  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta:{requiresAuth:false}
  },
  {
    path: '/register',
    name: 'Register',
    component: RegisterView,
    meta:{requiresAuth:false}
  },
    {
    path: '/change-password',
    name: 'ChangePassword',
    component:ChangePassword,
    meta:{requiresAuth:true}
  },
  // 根路径重定向到更新页面，避免访问 '/' 时页面为空白
  {

    path:'/find-password',
    name:'FindPassword',
    component:ForgotPassword,
    meta:{requiresAuth:false}
  },


  {
    path: '/update-info',
    name: 'UpdateInfo',
    component: UpdateUserInfoView,
    meta:{requiresAuth:true}
  },
  {
    path: '/update-profile',
    name: 'UpdateProfile',
    component: UpdateProfileView,
    meta:{requiresAuth:true}
  },
  {
    path: '/',
    component: MainLayout,
    redirect: '/dashboard',// 默认重定向到仪表盘
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('src/views/DashboardView.vue'),
        meta: { title: '我的桌面' }
      },
      {
        path: 'course-list',
        name: 'CourseList',
        component:()=>import('src/views/Course/CourseList.vue'),
        meta: { title: '课程管理' }
      },
    ]


  },

  // 捕获所有未匹配路径并重定向到登录页
  {
    path: '/:pathMatch(.*)*',
    redirect: '/login',
  },

]

const router = createRouter({
  history: createWebHistory(),
  routes,
});




//全局前置守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore();
  const isLoggedIn = userStore.isLoggedIn;
  const isAuthPage = to.name === 'Login' || to.name === 'Register';
  console.log(`导航守卫: 目标路径 ${to.path}, 登录状态: ${isLoggedIn}`);

  if (to.meta.requiresAuth && !isLoggedIn) {
    // 1. 需要认证但未登录 -> 跳转登录页
    next({ 
      name: 'Login', 
      query: { redirect: to.fullPath } 
    }); 
    return;
  } else if (isAuthPage && isLoggedIn) {
      next({ name: 'Dashboard' });
      return;
  } else {
    next();
  }

});

export default router