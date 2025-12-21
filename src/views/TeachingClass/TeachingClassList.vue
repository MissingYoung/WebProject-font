<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import {
  GraduationCap,
  Users,
  Clock,
  Layers,
  Loader2,
  Plus,
  Search,
  RotateCcw,
  Pencil,
  Trash2,
  Send,
  XCircle,
} from 'lucide-vue-next'
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
import type { TeachingClassVO, SemesterVO, CourseOfferingVO, TeachingClassStatus } from '@/types'
import {
  getTeachingClassList,
  deleteTeachingClass,
  publishTeachingClass,
  closeTeachingClass,
  getSemesterList,
  getCourseOfferingList,
} from '@/lib/api'
import TeachingClassEditDialog from '@/components/TeachingClass/TeachingClassEditDialog.vue'
import TeachingClassAdminClassesDialog from '@/components/TeachingClass/TeachingClassAdminClassesDialog.vue'
import BulkCreateTeachingClassesDialog from '@/components/TeachingClass/BulkCreateTeachingClassesDialog.vue'
import PaginationBar from '@/components/PaginationBar.vue'

const { success, error } = useNotification()
const router = useRouter()

// 状态映射
const statusMap: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  DRAFT: { label: '草稿', variant: 'secondary' },
  PUBLISHED: { label: '已发布', variant: 'default' },
  FULL: { label: '已满', variant: 'outline' },
  CLOSED: { label: '已关闭', variant: 'destructive' },
}

// 数据状态
const isLoading = ref(false)
const tableData = ref<TeachingClassVO[]>([])
const total = ref(0)
const semesters = ref<SemesterVO[]>([])
const courseOfferings = ref<CourseOfferingVO[]>([])

// 查询参数
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  semesterId: undefined as number | undefined,
  courseOfferingId: undefined as number | undefined,
  code: '',
  name: '',
  status: undefined as TeachingClassStatus | undefined,
})

// 弹窗状态
const editDialogRef = ref<InstanceType<typeof TeachingClassEditDialog> | null>(null)
const adminClassesDialogRef = ref<InstanceType<typeof TeachingClassAdminClassesDialog> | null>(null)
const bulkCreateDialogRef = ref<InstanceType<typeof BulkCreateTeachingClassesDialog> | null>(null)
const deleteDialogOpen = ref(false)
const itemToDelete = ref<TeachingClassVO | null>(null)
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

// 加载开课列表
const loadCourseOfferings = async () => {
  try {
    const params: { pageNum: number; pageSize: number; semesterId?: number } = {
      pageNum: 1,
      pageSize: 100,
    }
    if (queryParams.semesterId) {
      params.semesterId = queryParams.semesterId
    }
    const res = await getCourseOfferingList(params)
    if (res?.data) {
      courseOfferings.value = res.data.records
    }
  } catch (err: unknown) {
    console.error('加载开课列表失败', err)
  }
}

// 获取列表数据
const fetchData = async () => {
  isLoading.value = true
  try {
    const params = {
      ...queryParams,
      semesterId: queryParams.semesterId || undefined,
      courseOfferingId: queryParams.courseOfferingId || undefined,
      status: queryParams.status || undefined,
    }
    const res = await getTeachingClassList(params)
    if (res?.data) {
      tableData.value = res.data.records
      total.value = res.data.total
    }
  } catch (err: unknown) {
    console.error('获取教学班列表失败', err)
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
  queryParams.courseOfferingId = undefined
  queryParams.code = ''
  queryParams.name = ''
  queryParams.status = undefined
  fetchData()
}

// 创建
const handleCreate = () => {
  editDialogRef.value?.openDialog()
}

// 编辑
const handleEdit = (row: TeachingClassVO) => {
  editDialogRef.value?.openDialog(row)
}

const handleAdminClassRestriction = (row: TeachingClassVO) => {
  adminClassesDialogRef.value?.openDialog(row)
}

const handleSchedule = (row: TeachingClassVO) => {
  router.push({
    name: 'ScheduleList',
    query: {
      semesterId: row.semesterId ? String(row.semesterId) : undefined,
      teachingClassId: String(row.id),
    },
  })
}

// 删除
const handleDeleteClick = (row: TeachingClassVO) => {
  itemToDelete.value = row
  deleteDialogOpen.value = true
}

const handleConfirmDelete = async () => {
  if (!itemToDelete.value) return
  isDeleting.value = true
  try {
    await deleteTeachingClass(itemToDelete.value.id)
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
const handlePublish = async (row: TeachingClassVO) => {
  try {
    await publishTeachingClass(row.id)
    success('发布成功')
    fetchData()
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '发布失败'
    error(message)
  }
}

// 关闭
const handleClose = async (row: TeachingClassVO) => {
  try {
    await closeTeachingClass(row.id)
    success('已关闭')
    fetchData()
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '操作失败'
    error(message)
  }
}

// 编辑成功回调
const handleEditSuccess = () => {
  fetchData()
}

const handleBulkCreate = () => {
  bulkCreateDialogRef.value?.openDialog(queryParams.courseOfferingId)
}

// 学期变化时重新加载开课列表
const handleSemesterChange = () => {
  queryParams.courseOfferingId = undefined
  loadCourseOfferings()
}

onMounted(() => {
  loadSemesters()
  loadCourseOfferings()
  fetchData()
})
</script>

<template>
  <div class="space-y-6 p-6">
    <!-- 标题栏 -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold tracking-tight flex items-center gap-2">
          <GraduationCap class="h-6 w-6" />
          教学班管理
        </h2>
        <p class="text-muted-foreground">管理课程教学班信息，包括分班、教师、容量等</p>
      </div>
      <div class="flex items-center gap-2">
        <Button variant="outline" @click="handleBulkCreate">
          <Layers class="mr-2 h-4 w-4" />
          批量创建
        </Button>
        <Button @click="handleCreate">
          <Plus class="mr-2 h-4 w-4" />
          新增教学班
        </Button>
      </div>
    </div>

    <!-- 搜索区域 -->
    <div class="flex flex-wrap gap-4 items-end border p-4 rounded-lg bg-card">
      <div class="grid gap-2 w-[180px]">
        <label class="text-sm font-medium">学期</label>
        <Select v-model="queryParams.semesterId" @update:model-value="handleSemesterChange">
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
      <div class="grid gap-2 w-[260px]">
        <label class="text-sm font-medium">开课</label>
        <Select v-model="queryParams.courseOfferingId">
          <SelectTrigger>
            <SelectValue placeholder="全部" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="offering in courseOfferings" :key="offering.id" :value="offering.id">
              {{ offering.courseCode }} - {{ offering.courseName }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div class="grid gap-2 w-[180px]">
        <label class="text-sm font-medium">教学班编码</label>
        <Input v-model="queryParams.code" placeholder="输入编码" @keyup.enter="handleSearch" />
      </div>
      <div class="grid gap-2 w-[180px]">
        <label class="text-sm font-medium">教学班名称</label>
        <Input v-model="queryParams.name" placeholder="输入名称" @keyup.enter="handleSearch" />
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
            <SelectItem value="FULL">已满</SelectItem>
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
            <TableHead>教学班编码</TableHead>
            <TableHead>教学班名称</TableHead>
            <TableHead>课程名称</TableHead>
            <TableHead>学期</TableHead>
            <TableHead>主讲教师</TableHead>
            <TableHead>容量</TableHead>
            <TableHead>已选人数</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>创建时间</TableHead>
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
              >暂无数据</TableCell
            >
          </TableRow>
          <TableRow v-for="row in tableData" :key="row.id">
            <TableCell class="font-medium">{{ row.code }}</TableCell>
            <TableCell>{{ row.name }}</TableCell>
            <TableCell>{{ row.courseName }}</TableCell>
            <TableCell>{{ row.semesterName }}</TableCell>
            <TableCell>{{ row.teacherName || '-' }}</TableCell>
            <TableCell>{{ row.capacity || '-' }}</TableCell>
            <TableCell>{{ row.enrolledCount || 0 }}</TableCell>
            <TableCell>
              <Badge :variant="statusMap[row.status]?.variant || 'default'">
                {{ statusMap[row.status]?.label || row.status }}
              </Badge>
            </TableCell>
            <TableCell>{{ formatDate(row.createTime) }}</TableCell>
            <TableCell class="text-right">
              <div class="flex flex-wrap justify-end gap-2">
                <Button variant="ghost" size="sm" title="编辑" @click="handleEdit(row)">
                  <Pencil class="h-4 w-4" />编辑
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  title="行政班限制"
                  @click="handleAdminClassRestriction(row)"
                >
                  <Users class="h-4 w-4 text-blue-600" />行政班限制
                </Button>
                <Button variant="ghost" size="sm" title="排课" @click="handleSchedule(row)">
                  <Clock class="h-4 w-4 text-purple-600" />排课
                </Button>
                <!-- 发布按钮 -->
                <Button
                  v-if="row.status === 'DRAFT'"
                  variant="ghost"
                  size="sm"
                  title="发布"
                  @click="handlePublish(row)"
                >
                  <Send class="h-4 w-4 text-green-600" />发布
                </Button>
                <!-- 关闭按钮 -->
                <Button
                  v-if="row.status === 'PUBLISHED'"
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
    <TeachingClassEditDialog ref="editDialogRef" @success="handleEditSuccess" />
    <TeachingClassAdminClassesDialog ref="adminClassesDialogRef" @success="handleEditSuccess" />
    <BulkCreateTeachingClassesDialog ref="bulkCreateDialogRef" @success="handleEditSuccess" />

    <!-- 删除确认对话框 -->
    <AlertDialog :open="deleteDialogOpen" @update:open="(v) => (deleteDialogOpen = v)">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle class="flex items-center gap-2 text-red-600">
            确认删除教学班？
          </AlertDialogTitle>
          <AlertDialogDescription>
            您正在尝试删除教学班：
            <span class="font-bold text-foreground">{{ itemToDelete?.name }}</span>
            <br />
            <span class="text-red-500 text-xs mt-2 block">
              注意：删除后相关的排课和选课记录将受到影响
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
