<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { BookCheck, Search, RotateCcw, Trash2 } from 'lucide-vue-next'
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
import { toast } from 'vue-sonner'
import { formatDate } from '@/lib/date'
import type { CourseEnrollmentVO, SemesterVO, CourseEnrollmentStatus } from '@/types'
import { getMyEnrollments, dropCourse, getSemesterList } from '@/lib/api'

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
    }
    const res = await getMyEnrollments(params)
    if (res?.data) {
      tableData.value = res.data.records
      total.value = res.data.total
    }
  } catch (err: unknown) {
    console.error('获取选课记录失败', err)
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
  queryParams.status = undefined
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
    toast.success('退课成功')
    dropDialogOpen.value = false
    fetchData()
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '退课失败'
    toast.error(message)
  } finally {
    isDropping.value = false
  }
}

// 是否可以退课
const canDrop = (row: CourseEnrollmentVO) => {
  return row.status === 'SELECTED' || row.status === 'WAITLISTED'
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
          <BookCheck class="h-6 w-6" />
          我的选课
        </h2>
        <p class="text-muted-foreground">查看和管理您的选课记录</p>
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
      <div class="flex-1 min-w-[150px] max-w-[180px]">
        <Select v-model="queryParams.status">
          <SelectTrigger>
            <SelectValue placeholder="状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="SELECTED">已选</SelectItem>
            <SelectItem value="WAITLISTED">候补</SelectItem>
            <SelectItem value="DROPPED">已退</SelectItem>
            <SelectItem value="COMPLETED">已完成</SelectItem>
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
            <TableHead>状态</TableHead>
            <TableHead>选课时间</TableHead>
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
              暂无选课记录
            </TableCell>
          </TableRow>
          <TableRow v-for="row in tableData" :key="row.id">
            <TableCell class="font-medium">{{ row.courseCode }}</TableCell>
            <TableCell>{{ row.courseName }}</TableCell>
            <TableCell>{{ row.teachingClassName }}</TableCell>
            <TableCell>{{ row.teacherName || '-' }}</TableCell>
            <TableCell>{{ row.credit || '-' }}</TableCell>
            <TableCell>
              <Badge variant="outline">-</Badge>
            </TableCell>
            <TableCell>
              <Badge :variant="statusMap[row.status]?.variant || 'default'">
                {{ statusMap[row.status]?.label || row.status }}
              </Badge>
            </TableCell>
            <TableCell>{{ formatDate(row.selectedAt) }}</TableCell>
            <TableCell class="text-right">
              <Button
                v-if="canDrop(row)"
                variant="ghost"
                size="icon"
                title="退课"
                @click="handleDropClick(row)"
              >
                <Trash2 class="h-4 w-4 text-red-600" />
              </Button>
              <span v-else class="text-muted-foreground text-sm">-</span>
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

    <!-- 退课确认对话框 -->
    <AlertDialog :open="dropDialogOpen" @update:open="(v) => (dropDialogOpen = v)">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle class="flex items-center gap-2 text-red-600">
            确认退课？
          </AlertDialogTitle>
          <AlertDialogDescription>
            您正在退选课程：
            <span class="font-bold text-black">
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
            class="bg-red-600 hover:bg-red-700 text-white"
            @click.prevent="handleConfirmDrop"
          >
            {{ isDropping ? '退课中...' : '确认退课' }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
