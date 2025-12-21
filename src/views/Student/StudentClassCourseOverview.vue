<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { AlertTriangle, BookCheck, GraduationCap, Loader2, RefreshCw, User } from 'lucide-vue-next'
import { useUserStore } from '@/stores/user'
import { useNotification } from '@/composables/useNotification'
import type {
  CourseType,
  SemesterVO,
  StudentClassCourseOverviewVO,
  TeachingClassScheduleVO,
} from '@/types'
import { getCurrentSemester, getSemesterList, getStudentMeOverview } from '@/lib/api'
import { formatDate } from '@/lib/date'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import PaginationBar from '@/components/PaginationBar.vue'

const userStore = useUserStore()
const router = useRouter()
const { error: notifyError } = useNotification()

const role = computed(() => userStore.me?.role || userStore.userInfo?.role || '')
const isStudent = computed(() => role.value === 'student')

const semesters = ref<SemesterVO[]>([])
const currentSemester = ref<SemesterVO | null>(null)
const selectedSemesterId = ref<number | undefined>(undefined)

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  includeSchedules: false,
})

const overview = ref<StudentClassCourseOverviewVO | null>(null)
const isLoading = ref(false)
const errorMessage = ref<string | null>(null)

const courseTypeMap: Record<CourseType, string> = {
  REQUIRED: '必修',
  LIMITED_ELECTIVE: '限选',
  OPEN_ELECTIVE: '公选',
}

const formatCourseType = (courseType?: CourseType) => {
  if (!courseType) return '-'
  return courseTypeMap[courseType] || courseType
}

const formatScheduleInfo = (schedules?: TeachingClassScheduleVO[] | null) => {
  if (!schedules || schedules.length === 0) return '-'
  const weekDayMap: Record<number, string> = {
    1: '周一',
    2: '周二',
    3: '周三',
    4: '周四',
    5: '周五',
    6: '周六',
    7: '周日',
  }
  return schedules
    .map(
      (s) =>
        `${weekDayMap[s.weekDay] || ''}第${s.startWeek}-${s.endWeek}周 第${s.startSection}-${s.endSection}节${s.classroom ? `(${s.classroom})` : ''}`
    )
    .join('；')
}

const loadSemesters = async () => {
  try {
    const res = await getSemesterList({ pageNum: 1, pageSize: 100 })
    semesters.value = res.data.records || []
  } catch (err: unknown) {
    notifyError(err instanceof Error ? err.message : '加载学期列表失败')
    semesters.value = []
  }
}

const loadCurrent = async () => {
  try {
    const res = await getCurrentSemester()
    currentSemester.value = res.data || null
    if (!selectedSemesterId.value && res.data?.id) selectedSemesterId.value = res.data.id
  } catch {
    currentSemester.value = null
  }
}

const fetchOverview = async () => {
  if (!isStudent.value) return
  isLoading.value = true
  errorMessage.value = null
  try {
    const res = await getStudentMeOverview({
      semesterId: selectedSemesterId.value,
      pageNum: queryParams.pageNum,
      pageSize: queryParams.pageSize,
      includeSchedules: queryParams.includeSchedules,
    })
    overview.value = res.data
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '加载概览失败'
    errorMessage.value = msg
    notifyError(msg)
    overview.value = null
  } finally {
    isLoading.value = false
  }
}

const handleSemesterChange = (v: unknown) => {
  selectedSemesterId.value = typeof v === 'number' ? v : undefined
  queryParams.pageNum = 1
  fetchOverview()
}

const handleIncludeSchedulesChange = (val: boolean) => {
  queryParams.includeSchedules = val
  queryParams.pageNum = 1
  fetchOverview()
}

const goDashboard = () => router.push({ name: 'Dashboard' })

onMounted(async () => {
  await Promise.all([loadSemesters(), loadCurrent()])
  await fetchOverview()
})
</script>

<template>
  <div class="space-y-6 p-6">
    <div class="flex items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold tracking-tight flex items-center gap-2">
          <BookCheck class="h-6 w-6" />
          班级与课程情况
        </h2>
        <p class="text-muted-foreground">
          <span v-if="overview?.semester">
            {{ overview.semester.name }}（{{ overview.semester.academicYear }}）
          </span>
          <span v-else-if="currentSemester">
            {{ currentSemester.name }}（{{ currentSemester.academicYear }}）
          </span>
          <span v-else>学期信息未设置</span>
        </p>
      </div>
      <Button variant="outline" :disabled="isLoading" @click="fetchOverview">
        <RefreshCw class="h-4 w-4 mr-2" />
        刷新
      </Button>
    </div>

    <Alert v-if="!isStudent" variant="destructive">
      <AlertTriangle class="h-4 w-4" />
      <AlertTitle>无权限</AlertTitle>
      <AlertDescription class="flex items-center justify-between gap-4">
        <span>该页面仅学生账号可访问。</span>
        <Button variant="secondary" size="sm" @click="goDashboard">返回桌面</Button>
      </AlertDescription>
    </Alert>

    <Alert v-else-if="errorMessage" variant="destructive">
      <AlertTriangle class="h-4 w-4" />
      <AlertTitle>加载失败</AlertTitle>
      <AlertDescription>{{ errorMessage }}</AlertDescription>
    </Alert>

    <Card v-if="isStudent">
      <CardHeader class="space-y-2">
        <CardTitle class="text-base">筛选</CardTitle>
        <CardDescription>选择学期并查看已选课程</CardDescription>
      </CardHeader>
      <CardContent class="flex flex-wrap items-end gap-6">
        <div class="flex-1 min-w-[220px] max-w-[360px]">
          <label class="text-sm text-muted-foreground">学期</label>
          <Select v-model="selectedSemesterId" @update:model-value="handleSemesterChange">
            <SelectTrigger>
              <SelectValue placeholder="选择学期" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="s in semesters" :key="s.id" :value="s.id">
                {{ s.name }}（{{ s.academicYear }}）
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="flex items-center gap-3 pt-6">
          <Switch
            v-model:checked="queryParams.includeSchedules"
            @update:checked="handleIncludeSchedulesChange"
          />
          <span class="text-sm">包含排课明细</span>
        </div>
      </CardContent>
    </Card>

    <div v-if="isStudent" class="grid gap-6 lg:grid-cols-3">
      <Card class="lg:col-span-2">
        <CardHeader class="space-y-1">
          <CardTitle class="text-base flex items-center gap-2">
            <User class="h-4 w-4" />
            我的信息
          </CardTitle>
          <CardDescription>学籍与班级信息</CardDescription>
        </CardHeader>
        <CardContent class="grid gap-3 text-sm">
          <div class="flex flex-wrap gap-x-8 gap-y-2">
            <div>
              <span class="text-muted-foreground">姓名：</span>
              <span class="font-medium">{{ overview?.user?.realName || '-' }}</span>
            </div>
            <div>
              <span class="text-muted-foreground">学号：</span>
              <span class="font-medium">{{ overview?.user?.sduId || '-' }}</span>
            </div>
            <div>
              <span class="text-muted-foreground">年级：</span>
              <span class="font-medium">{{ overview?.student?.gradeLevel ?? '-' }}</span>
            </div>
            <div>
              <span class="text-muted-foreground">入学年份：</span>
              <span class="font-medium">{{ overview?.student?.entryYear ?? '-' }}</span>
            </div>
          </div>

          <div class="grid gap-2">
            <div>
              <span class="text-muted-foreground">学院：</span>
              <span class="font-medium">{{ overview?.department?.name || '-' }}</span>
            </div>
            <div>
              <span class="text-muted-foreground">专业：</span>
              <span class="font-medium">{{ overview?.major?.name || '-' }}</span>
            </div>
            <div>
              <span class="text-muted-foreground">行政班：</span>
              <span class="font-medium">
                {{ overview?.administrativeClass?.name || '-' }}
                <span v-if="overview?.administrativeClass?.code" class="text-muted-foreground">
                  （{{ overview.administrativeClass.code }}）
                </span>
              </span>
            </div>
            <div>
              <span class="text-muted-foreground">辅导员/班主任：</span>
              <span class="font-medium">{{
                overview?.administrativeClass?.counselorName || '-'
              }}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="space-y-1">
          <CardTitle class="text-base flex items-center gap-2">
            <GraduationCap class="h-4 w-4" />
            已选课程汇总
          </CardTitle>
          <CardDescription>本学期已选情况</CardDescription>
        </CardHeader>
        <CardContent class="grid gap-3">
          <div class="flex items-center justify-between">
            <span class="text-sm text-muted-foreground">课程数</span>
            <span class="text-lg font-bold">{{
              overview?.enrollmentSummary?.courseCount ?? 0
            }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-muted-foreground">总学分</span>
            <span class="text-lg font-bold">
              {{ overview?.enrollmentSummary?.totalCredits ?? 0 }}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>

    <Card v-if="isStudent">
      <CardHeader class="space-y-1">
        <CardTitle class="text-base">已选课程</CardTitle>
        <CardDescription>仅展示 SELECTED 状态的课程</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>课程编码</TableHead>
                <TableHead>课程名称</TableHead>
                <TableHead>教学班</TableHead>
                <TableHead>教师</TableHead>
                <TableHead>学分</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>上课时间</TableHead>
                <TableHead>选课时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-if="isLoading">
                <TableCell colspan="8" class="h-24 text-center">
                  <div class="flex items-center justify-center gap-2">
                    <Loader2 class="h-4 w-4 animate-spin" /> 加载中...
                  </div>
                </TableCell>
              </TableRow>
              <TableRow v-else-if="(overview?.enrollments?.records || []).length === 0">
                <TableCell colspan="8" class="h-24 text-center text-muted-foreground"
                  >暂无已选课程</TableCell
                >
              </TableRow>
              <TableRow v-for="row in overview?.enrollments?.records || []" :key="row.id">
                <TableCell class="font-medium">{{ row.courseCode || '-' }}</TableCell>
                <TableCell>{{ row.courseName || '-' }}</TableCell>
                <TableCell>{{ row.teachingClassName || '-' }}</TableCell>
                <TableCell>{{ row.teacherName || '-' }}</TableCell>
                <TableCell>{{ row.credit ?? '-' }}</TableCell>
                <TableCell>
                  <Badge variant="outline">{{ formatCourseType(row.courseType) }}</Badge>
                </TableCell>
                <TableCell class="max-w-[280px] truncate">
                  {{ queryParams.includeSchedules ? formatScheduleInfo(row.schedules) : '-' }}
                </TableCell>
                <TableCell>{{ formatDate(row.selectedAt) }}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <PaginationBar
          v-model:page-num="queryParams.pageNum"
          v-model:page-size="queryParams.pageSize"
          :total="overview?.enrollments?.total || 0"
          :is-loading="isLoading"
          class="mt-4"
          @change="fetchOverview"
        />
      </CardContent>
    </Card>
  </div>
</template>
