import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import LoginView from '@/views/LoginView.vue'
import RegisterView from '@/views/RegisterView.vue'
import MainLayout from '@/views/MainLayout.vue'
import ChangePassword from '@/views/ChangePassword.vue'
import UpdateUserInfoView from '@/views/UpdateUserInfoView.vue'
import UpdateProfileView from '@/views/UpdateProfileView.vue'
import ForgotPassword from '@/views/ForgotPassword.vue'
import { useUserStore } from '@/stores/user'

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
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/DashboardView.vue'),
        meta: { title: 'Dashboard' },
      },
      {
        path: 'course-list',
        name: 'CourseList',
        component: () => import('@/views/Course/CourseList.vue'),
        meta: { title: 'Course Management' },
      },
      {
        path: 'departments',
        name: 'DepartmentList',
        component: () => import('@/views/Department/DepartmentList.vue'),
        meta: { title: 'Department Management' },
      },
      {
        path: 'semesters',
        name: 'SemesterList',
        component: () => import('@/views/Semester/SemesterList.vue'),
        meta: { title: 'Semester Management' },
      },
      {
        path: 'majors',
        name: 'MajorList',
        component: () => import('@/views/Major/MajorList.vue'),
        meta: { title: 'Major Management' },
      },
      {
        path: 'students',
        name: 'StudentList',
        component: () => import('@/views/Student/StudentList.vue'),
        meta: { title: 'Student Management' },
      },
      {
        path: 'teachers',
        name: 'TeacherList',
        component: () => import('@/views/Teacher/TeacherList.vue'),
        meta: { title: 'Teacher Management' },
      },
      {
        path: 'family-members',
        name: 'FamilyMemberList',
        component: () => import('@/views/FamilyMember/FamilyMemberList.vue'),
        meta: { title: 'Family Member Management' },
      },
      {
        path: 'permissions',
        name: 'PermissionList',
        component: () => import('@/views/Permission/PermissionList.vue'),
        meta: { title: 'Permission Management' },
      },
      {
        path: 'roles',
        name: 'RoleList',
        component: () => import('@/views/Role/RoleList.vue'),
        meta: { title: 'Role Management' },
      },
      {
        path: 'administrative-classes',
        name: 'AdministrativeClassList',
        component: () => import('@/views/AdministrativeClass/AdministrativeClassList.vue'),
        meta: { title: 'Administrative Class Management' },
      },
      {
        path: 'course-offerings',
        name: 'CourseOfferingList',
        component: () => import('@/views/CourseOffering/CourseOfferingList.vue'),
        meta: { title: 'Course Offering Management' },
      },
      {
        path: 'teaching-classes',
        name: 'TeachingClassList',
        component: () => import('@/views/TeachingClass/TeachingClassList.vue'),
        meta: { title: 'Teaching Class Management' },
      },
      {
        path: 'schedules',
        name: 'ScheduleList',
        component: () => import('@/views/TeachingClassSchedule/ScheduleList.vue'),
        meta: { title: 'Schedule Management' },
      },
      {
        path: 'selection-windows',
        name: 'SelectionWindowList',
        component: () => import('@/views/CourseSelectionWindow/CourseSelectionWindowList.vue'),
        meta: { title: 'Course Selection Windows' },
      },
      {
        path: 'program-requirements',
        name: 'ProgramRequirementList',
        component: () => import('@/views/ProgramCourseRequirement/ProgramRequirementList.vue'),
        meta: { title: 'Program Requirement Management' },
      },
      {
        path: 'available-courses',
        name: 'AvailableCourseList',
        component: () => import('@/views/CourseEnrollment/AvailableCourseList.vue'),
        meta: { title: 'Available Courses' },
      },
      {
        path: 'my-enrollments',
        name: 'MyEnrollments',
        component: () => import('@/views/CourseEnrollment/MyEnrollments.vue'),
        meta: { title: 'My Enrollments' },
      },
      {
        path: 'profile',
        name: 'UserProfile',
        component: () => import('@/views/UserProfileView.vue'),
        meta: { title: 'Profile' },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/login',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, _from, next) => {
  const userStore = useUserStore()
  const isLoggedIn = userStore.isLoggedIn
  const isAuthPage = to.name === 'Login' || to.name === 'Register'

  if (to.meta.requiresAuth && !isLoggedIn) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
    return
  }

  if (isAuthPage && isLoggedIn) {
    next({ name: 'Dashboard' })
    return
  }

  next()
})

export default router
