<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import {
  GraduationCap,
  Plus,
  Search,
  RotateCcw,
  Pencil,
  Trash2,
  Send,
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
import { toast } from 'vue-sonner'
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

// 状态映射
const statusMap: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  DRAFT: { label: '草稿', variant: 'secondary' },
  PUBLISHED: { label: '已发布', variant: 'default' },
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
      pageSize: 200,
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
  queryParams.courseOfferingId = undefined
  queryParams.code = ''
  queryParams.name = ''
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

// 创建
const handleCreate = () => {
  editDialogRef.value?.openDialog()
}

// 编辑
const handleEdit = (row: TeachingClassVO) => {
  editDialogRef.value?.openDialog(row)
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
    toast.success('删除成功')
    deleteDialogOpen.value = false
    fetchData()
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '删除失败'
    toast.error(message)
  } finally {
    isDeleting.value = false
  }
}

// 发布
const handlePublish = async (row: TeachingClassVO) => {
  try {
    await publishTeachingClass(row.id)
    toast.success('发布成功')
    fetchData()
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '发布失败'
    toast.error(message)
  }
}

// 关闭
const handleClose = async (row: TeachingClassVO) => {
  try {
    await closeTeachingClass(row.id)
    toast.success('已关闭')
    fetchData()
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '操作失败'
    toast.error(message)
  }
}

// 编辑成功回调
const handleEditSuccess = () => {
  fetchData()
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
  <div class="space-y-4">
    <!-- 标题栏 -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold tracking-tight flex items-center gap-2">
          <GraduationCap class="h-6 w-6" />
          教学班管理
        </h2>
        <p class="text-muted-foreground">管理课程教学班信息，包括分班、教师、容量等</p>
      </div>
      <Button @click="handleCreate">
        <Plus class="mr-2 h-4 w-4" />
        新增教学班
      </Button>
    </div>

    <!-- 搜索区域 -->
    <div class="flex flex-wrap gap-4 items-end">
      <div class="flex-1 min-w-[200px] max-w-[250px]">
        <Select v-model="queryParams.semesterId" @update:model-value="handleSemesterChange">
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
      <div class="flex-1 min-w-[200px] max-w-[280px]">
        <Select v-model="queryParams.courseOfferingId">
          <SelectTrigger>
            <SelectValue placeholder="选择开课" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="offering in courseOfferings" :key="offering.id" :value="offering.id">
              {{ offering.courseCode }} - {{ offering.courseName }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div class="flex-1 min-w-[150px] max-w-[180px]">
        <Input v-model="queryParams.code" placeholder="教学班编码" @keyup.enter="handleSearch" />
      </div>
      <div class="flex-1 min-w-[150px] max-w-[180px]">
        <Input v-model="queryParams.name" placeholder="教学班名称" @keyup.enter="handleSearch" />
      </div>
      <div class="flex-1 min-w-[150px] max-w-[180px]">
        <Select v-model="queryParams.status">
          <SelectTrigger>
            <SelectValue placeholder="状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="DRAFT">草稿</SelectItem>
            <SelectItem value="PUBLISHED">已发布</SelectItem>
            <SelectItem value="CLOSED">已关闭</SelectItem>
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
            <TableCell colspan="10" class="text-center py-8 text-muted-foreground">
              加载中...
            </TableCell>
          </TableRow>
          <TableRow v-else-if="tableData.length === 0">
            <TableCell colspan="10" class="text-center py-8 text-muted-foreground">
              暂无数据
            </TableCell>
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
              <div class="flex justify-end gap-1">
                <Button variant="ghost" size="icon" title="编辑" @click="handleEdit(row)">
                  <Pencil class="h-4 w-4" />
                </Button>
                <!-- 发布按钮 -->
                <Button
                  v-if="row.status === 'DRAFT'"
                  variant="ghost"
                  size="icon"
                  title="发布"
                  @click="handlePublish(row)"
                >
                  <Send class="h-4 w-4 text-green-600" />
                </Button>
                <!-- 关闭按钮 -->
                <Button
                  v-if="row.status === 'PUBLISHED'"
                  variant="ghost"
                  size="icon"
                  title="关闭"
                  @click="handleClose(row)"
                >
                  <XCircle class="h-4 w-4 text-orange-600" />
                </Button>
                <Button variant="ghost" size="icon" title="删除" @click="handleDeleteClick(row)">
                  <Trash2 class="h-4 w-4 text-red-600" />
                </Button>
              </div>
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

    <!-- 编辑对话框 -->
    <TeachingClassEditDialog ref="editDialogRef" @success="handleEditSuccess" />

    <!-- 删除确认对话框 -->
    <AlertDialog :open="deleteDialogOpen" @update:open="(v) => (deleteDialogOpen = v)">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle class="flex items-center gap-2 text-red-600">
            确认删除教学班？
          </AlertDialogTitle>
          <AlertDialogDescription>
            您正在尝试删除教学班：
            <span class="font-bold text-black">{{ itemToDelete?.name }}</span>
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
            class="bg-red-600 hover:bg-red-700 text-white"
            @click.prevent="handleConfirmDelete"
          >
            {{ isDeleting ? '删除中...' : '确认删除' }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
