<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { BookCheck, Loader2, Search, RotateCcw, Trash2 } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
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
import type { TeachingClassScheduleVO } from '@/types'
import type { CourseEnrollmentVO, SemesterVO, CourseEnrollmentStatus, CourseType } from '@/types'
import { getMyEnrollments, dropCourse, getSemesterList } from '@/lib/api'
import PaginationBar from '@/components/PaginationBar.vue'

const { success } = useNotification()
const router = useRouter()

// 课程类型映射
const courseTypeMap: Record<string, string> = {
  REQUIRED: '必修',
  LIMITED_ELECTIVE: '限选',
  OPEN_ELECTIVE: '任选',
}

// 状态映射
const statusMap: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  SELECTED: { label: '已选', variant: 'default' },
  WAITLISTED: { label: '候补', variant: 'outline' },
  DROPPED: { label: '已退', variant: 'destructive' },
  COMPLETED: { label: '已完成', variant: 'secondary' },
}

// 数据状态
const isLoading = ref(false)
const tableData = ref<CourseEnrollmentVO[]>([])
const total = ref(0)
const semesters = ref<SemesterVO[]>([])

// 查询参数
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  semesterId: undefined as number | undefined,
  status: undefined as CourseEnrollmentStatus | undefined,
})

// 退课确认对话框
const dropDialogOpen = ref(false)
const itemToDrop = ref<CourseEnrollmentVO | null>(null)
const isDropping = ref(false)

// 错误提示对话框
const errorDialogOpen = ref(false)
const errorMessage = ref('')

const goToProgramProgress = () => {
  router.push({ name: 'ProgramProgress' })
}

// 加载学期列表
const loadSemesters = async () => {
  try {
    const res = await getSemesterList({ pageNum: 1, pageSize: 50 })
    if (res?.data) {
      semesters.value = res.data.records
    }
  } catch (err: unknown) {
    console.error('加载学期列表失败', err)
  }
}

// 获取列表数据
const fetchData = async () => {
  isLoading.value = true
  try {
    const params = {
      ...queryParams,
      semesterId: queryParams.semesterId || undefined,
      status: queryParams.status || undefined,
      includeSchedules: true,
    }
    const res = await getMyEnrollments(params)
    if (res?.data) {
      tableData.value = res.data.records
      total.value = res.data.total
    }
  } catch (err: unknown) {
    console.error('获取选课记录失败', err)
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
  queryParams.status = undefined
  fetchData()
}

// 退课
const handleDropClick = (row: CourseEnrollmentVO) => {
  itemToDrop.value = row
  dropDialogOpen.value = true
}

const handleConfirmDrop = async () => {
  if (!itemToDrop.value) return
  isDropping.value = true
  try {
    await dropCourse(itemToDrop.value.id)
    success('退课成功')
    dropDialogOpen.value = false
    fetchData()
  } catch (err: unknown) {
    const message =
      isApiError(err) && err.bizCode === 'ENROLLMENT_MANDATORY_CANNOT_DROP'
        ? '该课程为培养计划必修课，不可退课'
        : err instanceof Error
          ? err.message
          : '退课失败'
    errorMessage.value = message
    errorDialogOpen.value = true
  } finally {
    isDropping.value = false
  }
}

// 是否可以退课
const canDrop = (row: CourseEnrollmentVO) => {
  return row.status === 'SELECTED' || row.status === 'WAITLISTED'
}

const formatCourseType = (courseType?: CourseType) => {
  if (!courseType) return '-'
  return courseTypeMap[courseType] || courseType
}

const formatScheduleInfo = (schedules?: TeachingClassScheduleVO[]) => {
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

onMounted(() => {
  loadSemesters()
  fetchData()
})
</script>

<template>
  <div class="space-y-6 p-6">
    <!-- 标题栏 -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold tracking-tight flex items-center gap-2">
          <BookCheck class="h-6 w-6" />
          我的选课
        </h2>
        <p class="text-muted-foreground">查看和管理您的选课记录</p>
      </div>
      <Button variant="outline" @click="goToProgramProgress">培养计划进度</Button>
    </div>

    <!-- 搜索区域 -->
    <div class="flex flex-wrap gap-4 items-end border p-4 rounded-lg bg-card">
      <div class="grid gap-2 w-[180px]">
        <label class="text-sm font-medium">学期</label>
        <Select v-model="queryParams.semesterId">
          <SelectTrigger>
            <SelectValue placeholder="全部" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="semester in semesters" :key="semester.id" :value="semester.id">
              {{ semester.name }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div class="grid gap-2 w-[150px]">
        <label class="text-sm font-medium">状态</label>
        <Select v-model="queryParams.status">
          <SelectTrigger>
            <SelectValue placeholder="全部" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="SELECTED">已选</SelectItem>
            <SelectItem value="WAITLISTED">候补</SelectItem>
            <SelectItem value="DROPPED">已退</SelectItem>
            <SelectItem value="COMPLETED">已完成</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div class="flex gap-2 pb-0.5">
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
    <div class="border rounded-md bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>课程编码</TableHead>
            <TableHead>课程名称</TableHead>
            <TableHead>教学班</TableHead>
            <TableHead>主讲教师</TableHead>
            <TableHead>学分</TableHead>
            <TableHead>类型</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>上课时间</TableHead>
            <TableHead>选课时间</TableHead>
            <TableHead class="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="isLoading">
            <TableCell colspan="10" class="h-24 text-center">
              <div class="flex items-center justify-center gap-2">
                <Loader2 class="h-4 w-4 animate-spin" /> 加载中...
              </div>
            </TableCell>
          </TableRow>
          <TableRow v-else-if="tableData.length === 0">
            <TableCell colspan="10" class="h-24 text-center text-muted-foreground"
              >暂无选课记录</TableCell
            >
          </TableRow>
          <TableRow v-for="row in tableData" :key="row.id">
            <TableCell class="font-medium">{{ row.courseCode }}</TableCell>
            <TableCell>{{ row.courseName }}</TableCell>
            <TableCell>{{ row.teachingClassName }}</TableCell>
            <TableCell>{{ row.teacherName || '-' }}</TableCell>
            <TableCell>{{ row.credit || '-' }}</TableCell>
            <TableCell>
              <Badge variant="outline">{{ formatCourseType(row.courseType) }}</Badge>
            </TableCell>
            <TableCell>
              <Badge :variant="statusMap[row.status]?.variant || 'default'">
                {{ statusMap[row.status]?.label || row.status }}
              </Badge>
            </TableCell>
            <TableCell class="max-w-[280px] truncate">
              {{ formatScheduleInfo(row.schedules) }}
            </TableCell>
            <TableCell>{{ formatDate(row.selectedAt) }}</TableCell>
            <TableCell class="text-right">
              <Button
                v-if="canDrop(row)"
                variant="ghost"
                size="sm"
                title="退课"
                @click="handleDropClick(row)"
              >
                <Trash2 class="h-4 w-4 text-red-600" />退课
              </Button>
              <span v-else class="text-muted-foreground text-sm">-</span>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <!-- 分页 -->
    <PaginationBar
      v-model:page-num="queryParams.pageNum"
      v-model:page-size="queryParams.pageSize"
      :total="total"
      :is-loading="isLoading"
      @change="fetchData"
    />

    <!-- 退课确认对话框 -->
    <AlertDialog :open="dropDialogOpen" @update:open="(v) => (dropDialogOpen = v)">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle class="flex items-center gap-2 text-red-600">
            确认退课？
          </AlertDialogTitle>
          <AlertDialogDescription>
            您正在退选课程：
            <span class="font-bold text-foreground">
              {{ itemToDrop?.courseName }} - {{ itemToDrop?.teachingClassName }}
            </span>
            <br />
            <span class="text-red-500 text-xs mt-2 block">
              注意：退课后可能无法再次选择此课程
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel :disabled="isDropping">取消</AlertDialogCancel>
          <AlertDialogAction
            :disabled="isDropping"
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            @click.prevent="handleConfirmDrop"
          >
            {{ isDropping ? '退课中...' : '确认退课' }}
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
