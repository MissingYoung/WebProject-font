<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { BookMarked, Search, RotateCcw, Plus } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { toast } from 'vue-sonner'
import type { AvailableTeachingClassVO, SemesterVO, CourseType } from '@/types'
import { getAvailableTeachingClasses, enrollCourse, getSemesterList } from '@/lib/api'

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

// 查询参数
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  semesterId: undefined as number | undefined,
  courseName: '',
  courseCode: '',
  courseType: undefined as CourseType | undefined,
})

// 选课确认对话框
const enrollDialogOpen = ref(false)
const itemToEnroll = ref<AvailableTeachingClassVO | null>(null)
const isEnrolling = ref(false)

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
      courseType: queryParams.courseType || undefined,
    }
    const res = await getAvailableTeachingClasses(params)
    if (res?.data) {
      tableData.value = res.data.records
      total.value = res.data.total
    }
  } catch (err: unknown) {
    console.error('获取可选课程列表失败', err)
    toast.error('获取数据失败，请重试')
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
  fetchData()
}

// 分页
const prevPage = () => {
  if (queryParams.pageNum > 1) {
    queryParams.pageNum--
    fetchData()
  }
}

const nextPage = () => {
  const maxPage = Math.ceil(total.value / queryParams.pageSize)
  if (queryParams.pageNum < maxPage) {
    queryParams.pageNum++
    fetchData()
  }
}

// 选课
const handleEnrollClick = (row: AvailableTeachingClassVO) => {
  itemToEnroll.value = row
  enrollDialogOpen.value = true
}

const handleConfirmEnroll = async () => {
  if (!itemToEnroll.value) return
  isEnrolling.value = true
  try {
    await enrollCourse({ teachingClassId: itemToEnroll.value.id })
    toast.success('选课成功')
    enrollDialogOpen.value = false
    fetchData()
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '选课失败'
    toast.error(message)
  } finally {
    isEnrolling.value = false
  }
}

// 格式化容量
const formatCapacity = (enrolled?: number, capacity?: number) => {
  if (!capacity) return `${enrolled || 0}/无限制`
  return `${enrolled || 0}/${capacity}`
}

// 是否可选
const isSelectable = (row: AvailableTeachingClassVO) => {
  if (!row.capacity) return true
  return (row.enrolledCount || 0) < row.capacity
}

// 格式化排课时间
const formatScheduleInfo = (
  schedules?: { weekDay: number; startSection: number; endSection: number; classroom?: string }[]
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
        `${weekDayMap[s.weekDay] || ''}第${s.startSection}-${s.endSection}节${s.classroom ? `(${s.classroom})` : ''}`
    )
    .join('; ')
}

onMounted(() => {
  loadSemesters()
  fetchData()
})
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
    </div>

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
            <TableHead>选课人数</TableHead>
            <TableHead>上课时间</TableHead>
            <TableHead class="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="isLoading">
            <TableCell colspan="9" class="text-center py-8 text-muted-foreground">
              加载中...
            </TableCell>
          </TableRow>
          <TableRow v-else-if="tableData.length === 0">
            <TableCell colspan="9" class="text-center py-8 text-muted-foreground">
              暂无可选课程
            </TableCell>
          </TableRow>
          <TableRow v-for="row in tableData" :key="row.id">
            <TableCell class="font-medium">{{ row.courseCode }}</TableCell>
            <TableCell>{{ row.courseName }}</TableCell>
            <TableCell>{{ row.name }}</TableCell>
            <TableCell>{{ row.teacherName || '-' }}</TableCell>
            <TableCell>{{ row.credit || '-' }}</TableCell>
            <TableCell>
              <Badge variant="outline">
                {{ courseTypeMap[row.courseType] || row.courseType }}
              </Badge>
            </TableCell>
            <TableCell>
              <span :class="{ 'text-red-600': !isSelectable(row) }">
                {{ formatCapacity(row.enrolledCount, row.capacity) }}
              </span>
            </TableCell>
            <TableCell>{{ formatScheduleInfo(row.schedules) }}</TableCell>
            <TableCell class="text-right">
              <Button size="sm" :disabled="!isSelectable(row)" @click="handleEnrollClick(row)">
                <Plus class="mr-1 h-4 w-4" />
                选课
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <!-- 分页 -->
    <div class="flex items-center justify-between">
      <div class="text-sm text-muted-foreground">
        共 {{ total }} 条记录，当前第 {{ queryParams.pageNum }} /
        {{ Math.ceil(total / queryParams.pageSize) || 1 }} 页
      </div>
      <div class="flex gap-2">
        <Button variant="outline" size="sm" :disabled="queryParams.pageNum <= 1" @click="prevPage">
          上一页
        </Button>
        <Button
          variant="outline"
          size="sm"
          :disabled="queryParams.pageNum >= Math.ceil(total / queryParams.pageSize)"
          @click="nextPage"
        >
          下一页
        </Button>
      </div>
    </div>

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
  </div>
</template>
