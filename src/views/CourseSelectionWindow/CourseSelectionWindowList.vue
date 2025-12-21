<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import {
  Calendar,
  Loader2,
  Plus,
  Search,
  RotateCcw,
  Pencil,
  Trash2,
  Send,
  Play,
  XCircle,
} from 'lucide-vue-next'
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
import { useNotification } from '@/composables/useNotification'
import { formatDate } from '@/lib/date'
import type {
  CourseSelectionWindowVO,
  SemesterVO,
  CourseType,
  CourseSelectionWindowStatus,
} from '@/types'
import {
  getSelectionWindowList,
  deleteSelectionWindow,
  publishSelectionWindow,
  activateSelectionWindow,
  closeSelectionWindow,
  getSemesterList,
} from '@/lib/api'
import CourseSelectionWindowEditDialog from '@/components/CourseSelectionWindow/CourseSelectionWindowEditDialog.vue'
import PaginationBar from '@/components/PaginationBar.vue'

const { success, error } = useNotification()

// 状态映射
const statusMap: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  DRAFT: { label: '草稿', variant: 'secondary' },
  PUBLISHED: { label: '已发布', variant: 'outline' },
  ACTIVE: { label: '进行中', variant: 'default' },
  CLOSED: { label: '已关闭', variant: 'destructive' },
}

// 窗口类型映射（改为课程类型）
const courseTypeMap: Record<string, string> = {
  REQUIRED: '必修',
  LIMITED_ELECTIVE: '限选',
  OPEN_ELECTIVE: '任选',
}

// 数据状态
const isLoading = ref(false)
const tableData = ref<CourseSelectionWindowVO[]>([])
const total = ref(0)
const semesters = ref<SemesterVO[]>([])

// 查询参数
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  semesterId: undefined as number | undefined,
  name: '',
  courseType: undefined as CourseType | undefined,
  status: undefined as CourseSelectionWindowStatus | undefined,
})

// 弹窗状态
const editDialogRef = ref<InstanceType<typeof CourseSelectionWindowEditDialog> | null>(null)
const deleteDialogOpen = ref(false)
const itemToDelete = ref<CourseSelectionWindowVO | null>(null)
const isDeleting = ref(false)

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
      status: queryParams.status || undefined,
    }
    const res = await getSelectionWindowList(params)
    if (res?.data) {
      tableData.value = res.data.records
      total.value = res.data.total
    }
  } catch (err: unknown) {
    console.error('获取选课窗口列表失败', err)
    error('获取数据失败，请重试')
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
  queryParams.name = ''
  queryParams.courseType = undefined
  queryParams.status = undefined
  fetchData()
}

// 创建
const handleCreate = () => {
  editDialogRef.value?.openDialog()
}

// 编辑
const handleEdit = (row: CourseSelectionWindowVO) => {
  editDialogRef.value?.openDialog(row)
}

// 删除
const handleDeleteClick = (row: CourseSelectionWindowVO) => {
  itemToDelete.value = row
  deleteDialogOpen.value = true
}

const handleConfirmDelete = async () => {
  if (!itemToDelete.value) return
  isDeleting.value = true
  try {
    await deleteSelectionWindow(itemToDelete.value.id)
    success('删除成功')
    deleteDialogOpen.value = false
    fetchData()
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '删除失败'
    error(message)
  } finally {
    isDeleting.value = false
  }
}

// 发布
const handlePublish = async (row: CourseSelectionWindowVO) => {
  try {
    await publishSelectionWindow(row.id)
    success('发布成功')
    fetchData()
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '发布失败'
    error(message)
  }
}

// 激活
const handleActivate = async (row: CourseSelectionWindowVO) => {
  try {
    await activateSelectionWindow(row.id)
    success('已激活')
    fetchData()
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '激活失败'
    error(message)
  }
}

// 关闭
const handleClose = async (row: CourseSelectionWindowVO) => {
  try {
    await closeSelectionWindow(row.id)
    success('已关闭')
    fetchData()
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '关闭失败'
    error(message)
  }
}

// 编辑成功回调
const handleEditSuccess = () => {
  fetchData()
}

// 格式化日期时间
const formatDateTime = (dateStr: string | undefined) => {
  if (!dateStr) return '-'
  return formatDate(dateStr, 'YYYY-MM-DD HH:mm')
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
          <Calendar class="h-6 w-6" />
          选课窗口管理
        </h2>
        <p class="text-muted-foreground">管理选课时间窗口，控制学生选课的开放时间</p>
      </div>
      <Button @click="handleCreate">
        <Plus class="mr-2 h-4 w-4" />
        新增窗口
      </Button>
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
      <div class="grid gap-2 w-[200px]">
        <label class="text-sm font-medium">窗口名称</label>
        <Input v-model="queryParams.name" placeholder="输入名称" @keyup.enter="handleSearch" />
      </div>
      <div class="grid gap-2 w-[150px]">
        <label class="text-sm font-medium">课程类型</label>
        <Select v-model="queryParams.courseType">
          <SelectTrigger>
            <SelectValue placeholder="全部" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="REQUIRED">必修</SelectItem>
            <SelectItem value="LIMITED_ELECTIVE">限选</SelectItem>
            <SelectItem value="OPEN_ELECTIVE">任选</SelectItem>
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
            <SelectItem value="DRAFT">草稿</SelectItem>
            <SelectItem value="PUBLISHED">已发布</SelectItem>
            <SelectItem value="ACTIVE">进行中</SelectItem>
            <SelectItem value="CLOSED">已关闭</SelectItem>
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
            <TableHead>窗口名称</TableHead>
            <TableHead>学期</TableHead>
            <TableHead>课程类型</TableHead>
            <TableHead>开始时间</TableHead>
            <TableHead>结束时间</TableHead>
            <TableHead>状态</TableHead>
            <TableHead class="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="isLoading">
            <TableCell colspan="7" class="h-24 text-center">
              <div class="flex items-center justify-center gap-2">
                <Loader2 class="h-4 w-4 animate-spin" /> 加载中...
              </div>
            </TableCell>
          </TableRow>
          <TableRow v-else-if="tableData.length === 0">
            <TableCell colspan="7" class="h-24 text-center text-muted-foreground"
              >暂无数据</TableCell
            >
          </TableRow>
          <TableRow v-for="row in tableData" :key="row.id">
            <TableCell class="font-medium">{{ row.name }}</TableCell>
            <TableCell>{{ row.semesterName }}</TableCell>
            <TableCell>{{
              courseTypeMap[row.courseType || ''] || row.courseType || '-'
            }}</TableCell>
            <TableCell>{{ formatDateTime(row.startTime) }}</TableCell>
            <TableCell>{{ formatDateTime(row.endTime) }}</TableCell>
            <TableCell>
              <Badge :variant="statusMap[row.status]?.variant || 'default'">
                {{ statusMap[row.status]?.label || row.status }}
              </Badge>
            </TableCell>
            <TableCell class="text-right">
              <div class="flex flex-wrap justify-end gap-2">
                <Button variant="ghost" size="sm" title="编辑" @click="handleEdit(row)">
                  <Pencil class="h-4 w-4" />编辑
                </Button>
                <!-- 发布按钮 -->
                <Button
                  v-if="row.status === 'DRAFT'"
                  variant="ghost"
                  size="sm"
                  title="发布"
                  @click="handlePublish(row)"
                >
                  <Send class="h-4 w-4 text-blue-600" />发布
                </Button>
                <!-- 激活按钮 -->
                <Button
                  v-if="row.status === 'PUBLISHED'"
                  variant="ghost"
                  size="sm"
                  title="激活"
                  @click="handleActivate(row)"
                >
                  <Play class="h-4 w-4 text-green-600" />激活
                </Button>
                <!-- 关闭按钮 -->
                <Button
                  v-if="row.status === 'ACTIVE'"
                  variant="ghost"
                  size="sm"
                  title="关闭"
                  @click="handleClose(row)"
                >
                  <XCircle class="h-4 w-4 text-orange-600" />关闭
                </Button>
                <Button variant="ghost" size="sm" title="删除" @click="handleDeleteClick(row)">
                  <Trash2 class="h-4 w-4 text-red-600" />删除
                </Button>
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
      :total="total"
      :is-loading="isLoading"
      @change="fetchData"
    />

    <!-- 编辑对话框 -->
    <CourseSelectionWindowEditDialog ref="editDialogRef" @success="handleEditSuccess" />

    <!-- 删除确认对话框 -->
    <AlertDialog :open="deleteDialogOpen" @update:open="(v) => (deleteDialogOpen = v)">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle class="flex items-center gap-2 text-red-600">
            确认删除选课窗口？
          </AlertDialogTitle>
          <AlertDialogDescription>
            您正在尝试删除选课窗口：
            <span class="font-bold text-foreground">{{ itemToDelete?.name }}</span>
            <br />
            <span class="text-red-500 text-xs mt-2 block">
              注意：删除后学生将无法在此时间段内选课
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel :disabled="isDeleting">取消</AlertDialogCancel>
          <AlertDialogAction
            :disabled="isDeleting"
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            @click.prevent="handleConfirmDelete"
          >
            {{ isDeleting ? '删除中...' : '确认删除' }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
