<script setup lang="ts">
import { computed, ref, reactive, onMounted, watch } from 'vue'
import { BookMarked, Search, RotateCcw, Plus } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useNotification } from '@/composables/useNotification'
import { formatDate } from '@/lib/date'
import { isApiError } from '@/lib/api-error'
import type {
  AvailableTeachingClassVO,
  CourseType,
  EnrollmentBlockReason,
  SemesterVO,
  SelectionWindowAvailabilityVO,
} from '@/types'
import {
  getAvailableTeachingClasses,
  getMyActiveSelectionWindows,
  getCurrentSemester,
  enrollCourse,
  getSemesterList,
} from '@/lib/api'
import PaginationBar from '@/components/PaginationBar.vue'

const { success } = useNotification()
const router = useRouter()

// 课程类型映射
const courseTypeMap: Record<string, string> = {
  REQUIRED: '必修',
  LIMITED_ELECTIVE: '限选',
  OPEN_ELECTIVE: '任选',
}

// 数据状态
const isLoading = ref(false)
const tableData = ref<AvailableTeachingClassVO[]>([])
const total = ref(0)
const semesters = ref<SemesterVO[]>([])
const availability = ref<SelectionWindowAvailabilityVO | null>(null)
const isAvailabilityLoading = ref(false)

// 查询参数
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  semesterId: undefined as number | undefined,
  courseName: '',
  courseCode: '',
  courseType: undefined as CourseType | undefined,
  onlyAvailable: false,
})

// 选课确认对话框
const enrollDialogOpen = ref(false)
const itemToEnroll = ref<AvailableTeachingClassVO | null>(null)
const isEnrolling = ref(false)

// 错误提示对话框
const errorDialogOpen = ref(false)
const errorMessage = ref('')

const goToProgramProgress = () => {
  router.push({ name: 'ProgramProgress' })
}

const availabilitySummary = computed(() => {
  if (!availability.value?.windows?.length) return ''
  const typeLabel = (t?: CourseType) => (t ? courseTypeMap[t] || t : '全部课程类型')
  return availability.value.windows
    .map(
      (w) =>
        `${w.name}（${typeLabel(w.courseType)}，${formatDate(w.startTime, 'MM-DD HH:mm')}~${formatDate(
          w.endTime,
          'MM-DD HH:mm'
        )}）`
    )
    .join('；')
})

const availabilityAlertVariant = computed(() => {
  if (!availability.value) return 'default'
  return availability.value.open ? 'default' : 'destructive'
})

const availabilityTitle = computed(() => {
  if (!availability.value) return '选课窗口'
  return availability.value.open ? '选课窗口已开放' : '当前不在选课窗口期内'
})

const availabilityDescription = computed(() => {
  if (!availability.value) return '加载选课窗口状态中...'
  if (availability.value.open) return availabilitySummary.value || '当前课程类型暂无可用窗口信息'
  return availability.value.reason || '你可以浏览课程，但无法提交选课。'
})

// 加载学期列表
const loadSemesters = async () => {
  try {
    const res = await getSemesterList({ pageNum: 1, pageSize: 50 })
    if (res?.data) {
      semesters.value = res.data.records
    }
  } catch (err: unknown) {
    // 学生可能没有权限查看学期列表，不显示错误提示
    console.debug('加载学期列表失败', err)
  }
}

const loadCurrentSemester = async () => {
  try {
    const res = await getCurrentSemester()
    if (res?.data?.id && !queryParams.semesterId) {
      queryParams.semesterId = res.data.id
    }
  } catch (err: unknown) {
    console.debug('加载当前学期失败', err)
  }
}

// 加载当前用户可用的选课窗口（用于入口校验）
const loadAvailability = async () => {
  isAvailabilityLoading.value = true
  try {
    const res = await getMyActiveSelectionWindows({
      semesterId: queryParams.semesterId || undefined,
      courseType: queryParams.courseType || undefined,
    })
    availability.value = res?.data || null
  } catch (err: unknown) {
    console.error('加载选课窗口失败', err)
    availability.value = null
  } finally {
    isAvailabilityLoading.value = false
  }
}

const priorityValue = (row: AvailableTeachingClassVO) => {
  const mandatory = row.isMandatory ? 1000 : 0
  const recommended = row.isRecommended ? 200 : 0
  const forMyClass = row.forMyAdministrativeClass ? 100 : 0
  const selectable = row.canEnroll ? 10 : 0
  return mandatory + recommended + forMyClass + selectable
}

const displayRows = computed(() => {
  return [...tableData.value].sort((a, b) => priorityValue(b) - priorityValue(a))
})

const blockReasonLabel = (reason?: EnrollmentBlockReason) => {
  switch (reason) {
    case 'ALREADY_SELECTED':
      return '已选'
    case 'WINDOW_CLOSED':
      return '未开放'
    case 'FULL':
      return '已满'
    case 'NOT_ELIGIBLE':
      return '不符合'
    case 'TIME_CONFLICT':
      return '冲突'
    default:
      return '不可选'
  }
}

const enrollButtonLabel = (row: AvailableTeachingClassVO) => {
  if (row.canEnroll) return '选课'
  if (row.isEnrolled) return '已选'
  return blockReasonLabel(row.blockReason)
}

const canClickEnroll = (row: AvailableTeachingClassVO) => !!row.canEnroll

// 获取列表数据
const fetchData = async () => {
  isLoading.value = true
  try {
    const params = {
      ...queryParams,
      semesterId: queryParams.semesterId || undefined,
      courseType: queryParams.courseType || undefined,
      onlyAvailable: queryParams.onlyAvailable || undefined,
    }
    const res = await getAvailableTeachingClasses(params)
    if (res?.data) {
      tableData.value = res.data.records
      total.value = res.data.total
    }
  } catch (err: unknown) {
    console.error('获取可选课程列表失败', err)
    errorMessage.value = '获取数据失败，请重试'
    errorDialogOpen.value = true
  } finally {
    isLoading.value = false
  }
}

// 搜索
const handleSearch = () => {
  queryParams.pageNum = 1
  fetchData()
}

// 重置
const handleReset = () => {
  queryParams.pageNum = 1
  queryParams.semesterId = undefined
  queryParams.courseName = ''
  queryParams.courseCode = ''
  queryParams.courseType = undefined
  queryParams.onlyAvailable = false
}

// 选课
const handleEnrollClick = (row: AvailableTeachingClassVO) => {
  if (!canClickEnroll(row)) return
  itemToEnroll.value = row
  enrollDialogOpen.value = true
}

const handleConfirmEnroll = async () => {
  if (!itemToEnroll.value) return
  isEnrolling.value = true
  try {
    await enrollCourse({ teachingClassId: itemToEnroll.value.id })
    success('选课成功')
    enrollDialogOpen.value = false
    fetchData()
  } catch (err: unknown) {
    if (isApiError(err) && err.bizCode) {
      errorMessage.value = err.message
    } else {
      errorMessage.value = err instanceof Error ? err.message : '选课失败'
    }
    errorDialogOpen.value = true
  } finally {
    isEnrolling.value = false
  }
}

// 格式化容量
const formatCapacity = (enrolled?: number, capacity?: number) => {
  if (!capacity) return `${enrolled || 0}/无限制`
  return `${enrolled || 0}/${capacity}`
}

const isTeachingClassDisabled = (row: AvailableTeachingClassVO) => !row.canEnroll

// 格式化排课时间
const formatScheduleInfo = (
  schedules?: {
    weekDay: number
    startWeek?: number
    endWeek?: number
    startSection: number
    endSection: number
    classroom?: string
  }[]
) => {
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
        `${weekDayMap[s.weekDay] || ''}${s.startWeek && s.endWeek ? `第${s.startWeek}-${s.endWeek}周` : ''}第${s.startSection}-${s.endSection}节${s.classroom ? `(${s.classroom})` : ''}`
    )
    .join('; ')
}

onMounted(() => {
  loadSemesters()
  loadCurrentSemester().finally(() => {
    loadAvailability()
    fetchData()
  })
})

watch(
  () => [queryParams.semesterId, queryParams.courseType, queryParams.onlyAvailable] as const,
  () => {
    queryParams.pageNum = 1
    loadAvailability()
    fetchData()
  }
)
</script>

<template>
  <div class="space-y-4">
    <!-- 标题栏 -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold tracking-tight flex items-center gap-2">
          <BookMarked class="h-6 w-6" />
          可选课程
        </h2>
        <p class="text-muted-foreground">浏览并选择本学期可选的课程</p>
      </div>
      <Button variant="outline" @click="goToProgramProgress">培养计划进度</Button>
    </div>

    <!-- 选课窗口提示 -->
    <Alert v-if="!isAvailabilityLoading && availability" :variant="availabilityAlertVariant">
      <AlertTitle>{{ availabilityTitle }}</AlertTitle>
      <AlertDescription>{{ availabilityDescription }}</AlertDescription>
    </Alert>

    <!-- 搜索区域 -->
    <div class="flex flex-wrap gap-4 items-end">
      <div class="flex-1 min-w-[200px] max-w-[250px]">
        <Select v-model="queryParams.semesterId">
          <SelectTrigger>
            <SelectValue placeholder="选择学期" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="semester in semesters" :key="semester.id" :value="semester.id">
              {{ semester.name }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div class="flex-1 min-w-[200px] max-w-[250px]">
        <Input
          v-model="queryParams.courseName"
          placeholder="课程名称"
          @keyup.enter="handleSearch"
        />
      </div>
      <div class="flex-1 min-w-[150px] max-w-[180px]">
        <Input
          v-model="queryParams.courseCode"
          placeholder="课程编码"
          @keyup.enter="handleSearch"
        />
      </div>
      <div class="flex-1 min-w-[150px] max-w-[180px]">
        <Select v-model="queryParams.courseType">
          <SelectTrigger>
            <SelectValue placeholder="课程类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="REQUIRED">必修</SelectItem>
            <SelectItem value="LIMITED_ELECTIVE">限选</SelectItem>
            <SelectItem value="OPEN_ELECTIVE">任选</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div class="flex items-center gap-2 pb-1">
        <Switch v-model:checked="queryParams.onlyAvailable" />
        <span class="text-sm text-muted-foreground select-none">仅看有余量</span>
      </div>
      <div class="flex gap-2">
        <Button @click="handleSearch">
          <Search class="mr-2 h-4 w-4" />
          搜索
        </Button>
        <Button variant="outline" @click="handleReset">
          <RotateCcw class="mr-2 h-4 w-4" />
          重置
        </Button>
      </div>
    </div>

    <!-- 表格 -->
    <div class="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>课程编码</TableHead>
            <TableHead>课程名称</TableHead>
            <TableHead>教学班</TableHead>
            <TableHead>主讲教师</TableHead>
            <TableHead>学分</TableHead>
            <TableHead>类型</TableHead>
            <TableHead>标记</TableHead>
            <TableHead>选课人数</TableHead>
            <TableHead>上课时间</TableHead>
            <TableHead class="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="isLoading">
            <TableCell colspan="10" class="text-center py-8 text-muted-foreground">
              加载中...
            </TableCell>
          </TableRow>
          <TableRow v-else-if="tableData.length === 0">
            <TableCell colspan="10" class="text-center py-8 text-muted-foreground">
              暂无可选课程
            </TableCell>
          </TableRow>
          <TableRow v-for="row in displayRows" :key="row.id">
            <TableCell class="font-medium">{{ row.courseCode }}</TableCell>
            <TableCell>
              <div>{{ row.courseName }}</div>
              <div class="mt-1 flex flex-wrap gap-1">
                <Badge v-if="row.isMandatory" variant="destructive">必修</Badge>
                <Badge v-else-if="row.isRecommended" variant="secondary">推荐</Badge>
                <Badge v-if="row.forMyAdministrativeClass" variant="default">本班</Badge>
              </div>
            </TableCell>
            <TableCell>{{ row.name }}</TableCell>
            <TableCell>{{ row.teacherName || '-' }}</TableCell>
            <TableCell>{{ row.credit || '-' }}</TableCell>
            <TableCell>
              <Badge variant="outline">
                {{ courseTypeMap[row.courseType] || row.courseType }}
              </Badge>
            </TableCell>
            <TableCell>
              <div class="flex flex-wrap gap-1">
                <Badge v-if="row.adminClassRestricted" variant="outline">行政班限制</Badge>
                <Badge v-if="row.planSource" variant="outline">{{ row.planSource }}</Badge>
              </div>
            </TableCell>
            <TableCell>
              {{ formatCapacity(row.enrolledCount, row.capacity) }}
            </TableCell>
            <TableCell>{{ formatScheduleInfo(row.schedules) }}</TableCell>
            <TableCell class="text-right">
              <Button
                size="sm"
                :disabled="isTeachingClassDisabled(row)"
                :variant="isTeachingClassDisabled(row) ? 'outline' : 'default'"
                :class="{
                  'opacity-50 cursor-not-allowed': isTeachingClassDisabled(row),
                }"
                @click="handleEnrollClick(row)"
              >
                <Plus class="mr-1 h-4 w-4" />
                {{ enrollButtonLabel(row) }}
              </Button>
              <div
                v-if="!row.canEnroll && row.blockReason"
                class="text-xs text-muted-foreground mt-1"
              >
                {{ blockReasonLabel(row.blockReason) }}
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <!-- 分页 -->
    <PaginationBar
      v-model:page-num="queryParams.pageNum"
      v-model:page-size="queryParams.pageSize"
      class="justify-between"
      :total="total"
      :is-loading="isLoading"
      @change="fetchData"
    />

    <!-- 选课确认对话框 -->
    <AlertDialog :open="enrollDialogOpen" @update:open="(v) => (enrollDialogOpen = v)">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle class="flex items-center gap-2"> 确认选课？ </AlertDialogTitle>
          <AlertDialogDescription>
            您正在选择课程：
            <span class="font-bold text-black">
              {{ itemToEnroll?.courseName }} - {{ itemToEnroll?.name }}
            </span>
            <br />
            <span class="text-sm text-muted-foreground mt-2 block">
              主讲教师：{{ itemToEnroll?.teacherName || '未指定' }}
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel :disabled="isEnrolling">取消</AlertDialogCancel>
          <AlertDialogAction :disabled="isEnrolling" @click.prevent="handleConfirmEnroll">
            {{ isEnrolling ? '选课中...' : '确认选课' }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <!-- 错误提示对话框 -->
    <AlertDialog :open="errorDialogOpen" @update:open="(v) => (errorDialogOpen = v)">
      <AlertDialogContent class="max-w-sm mx-auto">
        <AlertDialogHeader>
          <AlertDialogTitle>提示信息</AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogDescription class="text-center text-base">
          {{ errorMessage }}
        </AlertDialogDescription>
        <AlertDialogFooter class="flex justify-center">
          <AlertDialogAction @click="errorDialogOpen = false">确定</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
