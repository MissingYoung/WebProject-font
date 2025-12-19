<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { getCurrentSemester } from '@/lib/api'
import { useRouter } from 'vue-router'
import type { SemesterVO } from '@/types'

// UI 组件
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Home,
  GraduationCap,
  Building2,
  Calendar,
  BookOpen,
  Users,
  Shield,
  UserCog,
  ArrowRight,
  Loader2,
  User,
  Mail,
  Phone,
} from 'lucide-vue-next'

const userStore = useUserStore()
const router = useRouter()

// --- 状态 ---
const isLoadingSemester = ref(false)
const currentSemester = ref<SemesterVO | null>(null)

// 用户信息
const userInfo = computed(() => userStore.userInfo)
const userInitial = computed(() => userStore.userInitial)

// 快捷操作菜单
const quickActions = [
  { name: '课程管理', routeName: 'CourseList', icon: GraduationCap, color: 'bg-blue-500' },
  { name: '部门管理', routeName: 'DepartmentList', icon: Building2, color: 'bg-green-500' },
  { name: '学期管理', routeName: 'SemesterList', icon: Calendar, color: 'bg-yellow-500' },
  { name: '专业管理', routeName: 'MajorList', icon: BookOpen, color: 'bg-purple-500' },
  { name: '学生管理', routeName: 'StudentList', icon: GraduationCap, color: 'bg-pink-500' },
  { name: '教师管理', routeName: 'TeacherList', icon: Users, color: 'bg-indigo-500' },
  { name: '权限管理', routeName: 'PermissionList', icon: Shield, color: 'bg-orange-500' },
  { name: '角色管理', routeName: 'RoleList', icon: UserCog, color: 'bg-red-500' },
]

// 性别映射
const genderMap: Record<number, string> = {
  0: '男',
  1: '女',
  2: '未知',
}

// --- 方法 ---

// 加载当前学期
const loadCurrentSemester = async () => {
  isLoadingSemester.value = true
  try {
    const res = await getCurrentSemester()
    if (res && res.data) {
      currentSemester.value = res.data
    }
  } catch (error) {
    console.error('获取当前学期失败', error)
  } finally {
    isLoadingSemester.value = false
  }
}

// 导航到指定路由
const navigateTo = (routeName: string) => {
  router.push({ name: routeName })
}

// 获取欢迎语
const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 6) return '夜深了'
  if (hour < 12) return '早上好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
}

// 初始化
onMounted(() => {
  loadCurrentSemester()
})
</script>

<template>
  <div class="space-y-6 p-6">
    <!-- 1. 顶部欢迎区域 -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Home class="h-6 w-6" /> 我的桌面
        </h2>
        <p class="text-muted-foreground">
          {{ getGreeting() }}，{{ userInfo?.realName || userInfo?.username || '用户' }}
        </p>
      </div>
    </div>

    <!-- 2. 主体内容网格 -->
    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <!-- 用户信息卡片 -->
      <Card class="md:col-span-1">
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <User class="h-5 w-5" />
            个人信息
          </CardTitle>
          <CardDescription>您的账户基本信息</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="flex items-center gap-4 mb-4">
            <Avatar class="h-16 w-16">
              <AvatarImage :src="userInfo?.avatarUrl ?? ''" :alt="userInfo?.realName ?? ''" />
              <AvatarFallback class="text-lg">{{ userInitial }}</AvatarFallback>
            </Avatar>
            <div>
              <h3 class="font-semibold text-lg">{{ userInfo?.realName || '未设置姓名' }}</h3>
              <p class="text-sm text-muted-foreground">@{{ userInfo?.username }}</p>
              <Badge v-if="userInfo?.role" variant="secondary" class="mt-1">
                {{ userInfo.role }}
              </Badge>
            </div>
          </div>
          <div class="space-y-2 text-sm">
            <div v-if="userInfo?.sduId" class="flex items-center gap-2 text-muted-foreground">
              <span class="font-medium text-foreground w-16">学工号:</span>
              {{ userInfo.sduId }}
            </div>
            <div v-if="userInfo?.email" class="flex items-center gap-2 text-muted-foreground">
              <Mail class="h-4 w-4" />
              {{ userInfo.email }}
            </div>
            <div v-if="userInfo?.phone" class="flex items-center gap-2 text-muted-foreground">
              <Phone class="h-4 w-4" />
              {{ userInfo.phone }}
            </div>
            <div class="flex items-center gap-2 text-muted-foreground">
              <span class="font-medium text-foreground w-16">性别:</span>
              {{ genderMap[userInfo?.gender ?? 2] }}
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- 当前学期卡片 -->
      <Card class="md:col-span-1">
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Calendar class="h-5 w-5" />
            当前学期
          </CardTitle>
          <CardDescription>系统当前设置的教学学期</CardDescription>
        </CardHeader>
        <CardContent>
          <div v-if="isLoadingSemester" class="flex items-center justify-center py-8">
            <Loader2 class="h-6 w-6 animate-spin mr-2" />
            加载中...
          </div>
          <div v-else-if="currentSemester" class="space-y-4">
            <div>
              <h3 class="font-semibold text-lg">{{ currentSemester.name }}</h3>
              <p class="text-sm text-muted-foreground">{{ currentSemester.academicYear }} 学年</p>
            </div>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-muted-foreground">开始日期</span>
                <span>{{ currentSemester.startDate }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">结束日期</span>
                <span>{{ currentSemester.endDate }}</span>
              </div>
              <div v-if="currentSemester.weekCount" class="flex justify-between">
                <span class="text-muted-foreground">教学周数</span>
                <span>{{ currentSemester.weekCount }} 周</span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              class="w-full mt-2"
              @click="navigateTo('SemesterList')"
            >
              查看全部学期
              <ArrowRight class="ml-2 h-4 w-4" />
            </Button>
          </div>
          <div v-else class="text-center py-8 text-muted-foreground">
            <Calendar class="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>暂未设置当前学期</p>
            <Button variant="outline" size="sm" class="mt-4" @click="navigateTo('SemesterList')">
              前往设置
            </Button>
          </div>
        </CardContent>
      </Card>

      <!-- 系统概览卡片 -->
      <Card class="md:col-span-1">
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Shield class="h-5 w-5" />
            系统概览
          </CardTitle>
          <CardDescription>教务管理系统功能模块</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="space-y-4">
            <p class="text-sm text-muted-foreground">
              本系统提供完整的教务管理功能，包括用户管理、课程管理、选课系统等核心模块。
            </p>
            <div class="grid grid-cols-2 gap-2 text-sm">
              <div class="flex items-center gap-2">
                <div class="h-2 w-2 rounded-full bg-green-500"></div>
                用户管理
              </div>
              <div class="flex items-center gap-2">
                <div class="h-2 w-2 rounded-full bg-blue-500"></div>
                课程管理
              </div>
              <div class="flex items-center gap-2">
                <div class="h-2 w-2 rounded-full bg-purple-500"></div>
                组织架构
              </div>
              <div class="flex items-center gap-2">
                <div class="h-2 w-2 rounded-full bg-orange-500"></div>
                权限系统
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- 3. 快捷操作区域 -->
    <Card>
      <CardHeader>
        <CardTitle>快捷操作</CardTitle>
        <CardDescription>快速访问常用功能模块</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          <button
            v-for="action in quickActions"
            :key="action.routeName"
            class="flex flex-col items-center gap-2 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
            @click="navigateTo(action.routeName)"
          >
            <div :class="['p-3 rounded-full text-white', action.color]">
              <component :is="action.icon" class="h-5 w-5" />
            </div>
            <span class="text-sm font-medium">{{ action.name }}</span>
          </button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
