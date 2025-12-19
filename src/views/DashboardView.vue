<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import {
  getCurrentSemester,
  getStudentInfo,
  getAdministrativeClassDetail,
  getMyEnrollments,
  getTeachingClassScheduleList,
} from '@/lib/api'
import { useRouter } from 'vue-router'
import type { SemesterVO, CourseEnrollmentVO, TeachingClassScheduleVO } from '@/types'

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
  Palette,
} from 'lucide-vue-next'

const userStore = useUserStore()
const router = useRouter()

// --- 状态 ---
const isMounted = ref(true)
const isLoadingSemester = ref(false)
const currentSemester = ref<SemesterVO | null>(null)
const className = ref<string | null>(null)

// 用户信息
const userInfo = computed(() => userStore.userInfo)
const userInitial = computed(() => userStore.userInitial)
const roleLower = computed(() => (userInfo.value?.role || '').toLowerCase())
const isStudent = computed(() => roleLower.value.includes('student'))
const isTeacher = computed(() => roleLower.value.includes('teacher'))
const showSchedule = computed(() => isStudent.value || isTeacher.value)

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
const genderMap: Record<string, string> = {
  '0': '男',
  '1': '女',
  '2': '未知',
  MALE: '男',
  FEMALE: '女',
  UNKNOWN: '未知',
}

// 学生课表数据
type CourseBlock = {
  id: number
  name: string
  teacher: string
  classroom: string
  day: number // 1-7, 周一到周日
  startSection: number
  endSection: number
  type: '必修' | '选修' | '实验' | '实践' | '其他'
}

const scheduleBlocks = ref<CourseBlock[]>([])
const isLoadingSchedule = ref(false)

const courseTypeColorMap: Record<CourseBlock['type'], string> = {
  必修: 'bg-red-100 text-red-700 border-red-200',
  选修: 'bg-blue-100 text-blue-700 border-blue-200',
  实验: 'bg-amber-100 text-amber-700 border-amber-200',
  实践: 'bg-green-100 text-green-700 border-green-200',
  其他: 'bg-slate-100 text-slate-700 border-slate-200',
}

const dayLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
const sectionLabels = ['第一节', '第二节', '第三节', '第四节', '第五节']

// --- 方法 ---

// 加载当前学期
const loadCurrentSemester = async () => {
  if (!isMounted.value) return
  isLoadingSemester.value = true
  try {
    const res = await getCurrentSemester()
    if (isMounted.value && res && res.data) {
      currentSemester.value = res.data
    }
  } catch (error) {
    if (isMounted.value) {
      console.error('获取当前学期失败', error)
    }
  } finally {
    if (isMounted.value) {
      isLoadingSemester.value = false
    }
  }
}

// 加载学生所属班级
const loadStudentClass = async () => {
  if (!isMounted.value || !isStudent.value || !userInfo.value?.id) return
  try {
    const res = await getStudentInfo(userInfo.value.id)
    const classId = res?.data?.administrativeClassId
    if (isMounted.value && res?.data?.administrativeClassName) {
      className.value = res.data.administrativeClassName
      return
    }
    if (isMounted.value && classId) {
      const detail = await getAdministrativeClassDetail(classId)
      if (isMounted.value) {
        className.value = detail?.data?.name || null
      }
    }
  } catch (err) {
    if (isMounted.value) {
      console.error('获取学生班级失败', err)
    }
  }
}

// 加载学生课表
const loadStudentSchedule = async () => {
  if (!isMounted.value || !showSchedule.value) return
  isLoadingSchedule.value = true
  scheduleBlocks.value = []

  try {
    // 1. 获取当前学期ID
    const semesterId = currentSemester.value?.id
    if (!semesterId) {
      console.warn('未设置当前学期，无法加载课表')
      return
    }

    // 2. 获取学生的选课记录（只查询已选中的课程）
    const enrollRes = await getMyEnrollments({
      pageNum: 1,
      pageSize: 100,
      semesterId,
      status: 'SELECTED',
    })

    if (!isMounted.value || !enrollRes?.data?.records) return

    const enrollments: CourseEnrollmentVO[] = enrollRes.data.records

    // 3. 对每个选课记录，获取对应的排课信息
    const schedulePromises = enrollments.map(async (enrollment) => {
      try {
        const scheduleRes = await getTeachingClassScheduleList({
          pageNum: 1,
          pageSize: 20,
          teachingClassId: enrollment.teachingClassId,
        })

        if (!scheduleRes?.data?.records) return []

        const schedules: TeachingClassScheduleVO[] = scheduleRes.data.records

        // 将每个排课时间段转换为 CourseBlock
        return schedules.map((schedule) => {
          // 根据课程名称推断课程类型
          let courseType: CourseBlock['type'] = '必修' // 默认为必修
          const courseName = enrollment.courseName || ''
          const courseCode = enrollment.courseCode || ''

          // 优先级：实验 > 实践 > 选修 > 必修
          if (courseName.includes('实验') || courseCode.includes('LAB')) {
            courseType = '实验'
          } else if (
            courseName.includes('实践') ||
            courseName.includes('实训') ||
            courseCode.includes('PRAC')
          ) {
            courseType = '实践'
          } else if (courseName.includes('选修') || courseCode.includes('ELEC')) {
            courseType = '选修'
          }

          return {
            id: schedule.id,
            name: enrollment.courseName || '未知课程',
            teacher: enrollment.teacherName || '待定',
            classroom: schedule.classroom || enrollment.location || '待定',
            day: schedule.weekDay,
            startSection: schedule.startSection,
            endSection: schedule.endSection,
            type: courseType,
          } as CourseBlock
        })
      } catch (err) {
        console.error(`获取教学班 ${enrollment.teachingClassId} 的排课失败`, err)
        return []
      }
    })

    const allSchedules = await Promise.all(schedulePromises)
    if (isMounted.value) {
      scheduleBlocks.value = allSchedules.flat()
    }
  } catch (err) {
    if (isMounted.value) {
      console.error('加载课表失败', err)
    }
  } finally {
    if (isMounted.value) {
      isLoadingSchedule.value = false
    }
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
onMounted(async () => {
  await loadCurrentSemester()
  loadStudentClass()
  loadStudentSchedule()
})

// 清理
onUnmounted(() => {
  isMounted.value = false
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
              <p
                v-if="className || userInfo?.administrativeClassName"
                class="text-sm text-muted-foreground mt-1"
              >
                班级：{{ userInfo?.administrativeClassName || className || '未分班' }}
              </p>
            </div>
          </div>
          <div class="space-y-2 text-sm">
            <div v-if="userInfo?.sduId" class="flex items-center gap-2 text-muted-foreground">
              <span class="font-medium text-foreground w-16">学工号:</span>
              {{ userInfo.sduId }}
            </div>
            <div
              v-if="className || isStudent"
              class="flex items-center gap-2 text-muted-foreground"
            >
              <span class="font-medium text-foreground w-16">班级:</span>
              {{ className || '未分班' }}
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
              {{ genderMap[String(userInfo?.gender ?? 'UNKNOWN')] || '未知' }}
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
            <p class="text-sm text-foreground font-medium">当前学期未设置</p>
            <p class="text-xs text-muted-foreground mt-1">请联系管理员完成设置</p>
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

    <!-- 3. 学生/教师课表 或 管理员快捷操作 -->
    <Card v-if="showSchedule">
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <Palette class="h-5 w-5" />
          本周课表
        </CardTitle>
        <CardDescription>不同课程类型以颜色区分，基于你的选课记录</CardDescription>
      </CardHeader>
      <CardContent>
        <div v-if="isLoadingSchedule" class="flex items-center justify-center py-8">
          <Loader2 class="h-6 w-6 animate-spin mr-2" />
          正在加载课表...
        </div>
        <div v-else-if="scheduleBlocks.length === 0" class="text-center py-8 text-muted-foreground">
          <Palette class="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p class="text-sm text-foreground font-medium">暂无课程安排</p>
          <p class="text-xs text-muted-foreground mt-1">请先选课或等待课程排课完成</p>
        </div>
        <div v-else class="grid grid-cols-[90px_repeat(7,1fr)] gap-2">
          <div class="text-sm text-muted-foreground"></div>
          <div
            v-for="day in dayLabels"
            :key="day"
            class="text-center text-sm font-medium text-muted-foreground"
          >
            {{ day }}
          </div>

          <template v-for="(label, idx) in sectionLabels" :key="label">
            <div class="text-sm text-muted-foreground flex items-center justify-center h-20">
              {{ label }}
            </div>
            <div
              v-for="dayIndex in 7"
              :key="`${label}-${dayIndex}`"
              class="relative h-20 border rounded-md bg-card/40"
            >
              <div
                v-for="block in scheduleBlocks.filter(
                  (b) => b.day === dayIndex && b.startSection === idx + 1
                )"
                :key="block.id"
                class="absolute inset-1 rounded-md border text-xs p-2 shadow-sm"
                :class="courseTypeColorMap[block.type] || courseTypeColorMap['其他']"
              >
                <div class="font-semibold truncate" :title="block.name">
                  {{ block.name }}
                </div>
                <div class="text-[11px] opacity-80 truncate" :title="block.teacher">
                  {{ block.teacher }}
                </div>
                <div class="text-[11px] opacity-80 truncate" :title="block.classroom">
                  {{ block.classroom }}
                </div>
                <div class="text-[11px] opacity-80">
                  {{ block.startSection }}-{{ block.endSection }} 节
                </div>
              </div>
            </div>
          </template>
        </div>
        <div
          v-if="!isLoadingSchedule && scheduleBlocks.length > 0"
          class="flex flex-wrap gap-3 mt-4 text-xs text-muted-foreground"
        >
          <div v-for="(cls, key) in courseTypeColorMap" :key="key" class="flex items-center gap-2">
            <span :class="['h-3 w-3 rounded-sm border', cls]"></span>
            <span>{{ key }}</span>
          </div>
        </div>
      </CardContent>
    </Card>
    <Card v-else>
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
