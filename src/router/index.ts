import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import MainLayout from '@/views/MainLayout.vue'
import ChangePassword from '@/views/ChangePassword.vue'
import { useUserStore } from '../stores/user'

import UpdateUserInfoView from '../views/UpdateUserInfoView.vue'
import UpdateProfileView from '../views/UpdateProfileView.vue'
import ForgotPassword from '@/views/ForgotPassword.vue'

// 使用 vue-router 提供的 RouteRecordRaw 类型来定义路由数组
const routes: Array<RouteRecordRaw> = [
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { requiresAuth: false },
  },
  {
    path: '/register',
    name: 'Register',
    component: RegisterView,
    meta: { requiresAuth: false },
  },
  {
    path: '/change-password',
    name: 'ChangePassword',
    component: ChangePassword,
    meta: { requiresAuth: true },
  },
  // 根路径重定向到更新页面，避免访问 '/' 时页面为空白
  {
    path: '/find-password',
    name: 'FindPassword',
    component: ForgotPassword,
    meta: { requiresAuth: false },
  },

  {
    path: '/update-info',
    name: 'UpdateInfo',
    component: UpdateUserInfoView,
    meta: { requiresAuth: true },
  },
  {
    path: '/update-profile',
    name: 'UpdateProfile',
    component: UpdateProfileView,
    meta: { requiresAuth: true },
  },
  {
    path: '/',
    component: MainLayout,
    redirect: '/dashboard', // 默认重定向到仪表盘
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/DashboardView.vue'),
        meta: { title: '我的桌面' },
      },
      {
        path: 'course-list',
        name: 'CourseList',
        component: () => import('@/views/Course/CourseList.vue'),
        meta: { title: '课程管理' },
      },
      {
        path: 'departments',
        name: 'DepartmentList',
        component: () => import('@/views/Department/DepartmentList.vue'),
        meta: { title: '部门管理' },
      },
      {
        path: 'semesters',
        name: 'SemesterList',
        component: () => import('@/views/Semester/SemesterList.vue'),
        meta: { title: '学期管理' },
      },
      {
        path: 'majors',
        name: 'MajorList',
        component: () => import('@/views/Major/MajorList.vue'),
        meta: { title: '专业管理' },
      },
      {
        path: 'students',
        name: 'StudentList',
        component: () => import('@/views/Student/StudentList.vue'),
        meta: { title: '学生管理' },
      },
      {
        path: 'teachers',
        name: 'TeacherList',
        component: () => import('@/views/Teacher/TeacherList.vue'),
        meta: { title: '教师管理' },
      },
      {
        path: 'family-members',
        name: 'FamilyMemberList',
        component: () => import('@/views/FamilyMember/FamilyMemberList.vue'),
        meta: { title: '家庭成员管理' },
      },
      {
        path: 'permissions',
        name: 'PermissionList',
        component: () => import('@/views/Permission/PermissionList.vue'),
        meta: { title: '权限管理' },
      },
      {
        path: 'roles',
        name: 'RoleList',
        component: () => import('@/views/Role/RoleList.vue'),
        meta: { title: '角色管理' },
      },
      // 行政班管理
      {
        path: 'administrative-classes',
        name: 'AdministrativeClassList',
        component: () => import('@/views/AdministrativeClass/AdministrativeClassList.vue'),
        meta: { title: '行政班管理' },
      },
      // 开课管理
      {
        path: 'course-offerings',
        name: 'CourseOfferingList',
        component: () => import('@/views/CourseOffering/CourseOfferingList.vue'),
        meta: { title: '开课管理' },
      },
      // 教学班管理
      {
        path: 'teaching-classes',
        name: 'TeachingClassList',
        component: () => import('@/views/TeachingClass/TeachingClassList.vue'),
        meta: { title: '教学班管理' },
      },
      // 排课管理
      {
        path: 'schedules',
        name: 'ScheduleList',
        component: () => import('@/views/TeachingClassSchedule/ScheduleList.vue'),
        meta: { title: '排课管理' },
      },
      // 选课窗口管理
      {
        path: 'selection-windows',
        name: 'SelectionWindowList',
        component: () => import('@/views/CourseSelectionWindow/CourseSelectionWindowList.vue'),
        meta: { title: '选课窗口管理' },
      },
      // 培养计划管理
      {
        path: 'program-requirements',
        name: 'ProgramRequirementList',
        component: () => import('@/views/ProgramCourseRequirement/ProgramRequirementList.vue'),
        meta: { title: '培养计划管理' },
      },
      // 选课 - 可选课程
      {
        path: 'available-courses',
        name: 'AvailableCourseList',
        component: () => import('@/views/CourseEnrollment/AvailableCourseList.vue'),
        meta: { title: '可选课程' },
      },
      // 选课 - 我的选课
      {
        path: 'my-enrollments',
        name: 'MyEnrollments',
        component: () => import('@/views/CourseEnrollment/MyEnrollments.vue'),
        meta: { title: '我的选课' },
      },
      // 课程表
      {
        path: 'timetable',
        name: 'Timetable',
        component: () => import('@/views/Timetable/TimetableView.vue'),
        meta: { title: '课程表' },
      },
      // 教师端：我的班级与课程情况
      {
        path: 'teacher-class-course-overview',
        name: 'TeacherClassCourseOverview',
        component: () => import('@/views/Teacher/TeacherClassCourseOverview.vue'),
        meta: { title: '我的班级与课程情况' },
      },
      // 学生端：班级与课程情况
      {
        path: 'student-class-course-overview',
        name: 'StudentClassCourseOverview',
        component: () => import('@/views/Student/StudentClassCourseOverview.vue'),
        meta: { title: '班级与课程情况' },
      },
      // 培养计划进度（学生端）
      {
        path: 'program-progress',
        name: 'ProgramProgress',
        component: () => import('@/views/ProgramProgress/ProgramProgressView.vue'),
        meta: { title: '培养计划进度' },
      },
      // 个人中心
      {
        path: 'profile',
        name: 'UserProfile',
        component: () => import('@/views/UserProfileView.vue'),
        meta: { title: '个人中心' },
      },
    ],
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
})

//全局前置守卫
router.beforeEach((to, _from, next) => {
  const userStore = useUserStore()
  const isLoggedIn = userStore.isLoggedIn
  const isAuthPage = to.name === 'Login' || to.name === 'Register'
  console.log(`导航守卫: 目标路径 ${to.path}, 登录状态: ${isLoggedIn}`)

  if (to.meta.requiresAuth && !isLoggedIn) {
    // 1. 需要认证但未登录 -> 跳转登录页
    next({
      name: 'Login',
      query: { redirect: to.fullPath },
    })
    return
  } else if (isAuthPage && isLoggedIn) {
    next({ name: 'Dashboard' })
    return
  } else {
    next()
  }
})

export default router
