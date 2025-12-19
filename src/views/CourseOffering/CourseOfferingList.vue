<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import {
  BookOpen,
  Plus,
  Search,
  RotateCcw,
  Pencil,
  Trash2,
  Play,
  Archive,
  StopCircle,
  Lock,
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
import type { CourseOfferingVO, SemesterVO, CourseType, CourseOfferingStatus } from '@/types'
import {
  getCourseOfferingList,
  deleteCourseOffering,
  setCourseOfferingDraft,
  setCourseOfferingScheduling,
  setCourseOfferingEnrollmentOpen,
  setCourseOfferingEnrollmentClosed,
  setCourseOfferingArchived,
  getSemesterList,
} from '@/lib/api'
import CourseOfferingEditDialog from '@/components/CourseOffering/CourseOfferingEditDialog.vue'

// 状态映射
const statusMap: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  DRAFT: { label: '草稿', variant: 'secondary' },
  SCHEDULING: { label: '排课中', variant: 'outline' },
  ENROLLMENT_OPEN: { label: '选课开放', variant: 'default' },
  ENROLLMENT_CLOSED: { label: '选课关闭', variant: 'destructive' },
  ARCHIVED: { label: '已归档', variant: 'secondary' },
}

// 课程类型映射
const courseTypeMap: Record<string, string> = {
  REQUIRED: '必修',
  LIMITED_ELECTIVE: '限选',
  OPEN_ELECTIVE: '任选',
}

// 数据状态
const isLoading = ref(false)
const tableData = ref<CourseOfferingVO[]>([])
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
  status: undefined as CourseOfferingStatus | undefined,
})

// 弹窗状态
const editDialogRef = ref<InstanceType<typeof CourseOfferingEditDialog> | null>(null)
const deleteDialogOpen = ref(false)
const itemToDelete = ref<CourseOfferingVO | null>(null)
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
    const res = await getCourseOfferingList(params)
    if (res?.data) {
      tableData.value = res.data.records
      total.value = res.data.total
    }
  } catch (err: unknown) {
    console.error('获取开课列表失败', err)
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
const handleEdit = (row: CourseOfferingVO) => {
  editDialogRef.value?.openDialog(row)
}

// 删除
const handleDeleteClick = (row: CourseOfferingVO) => {
  itemToDelete.value = row
  deleteDialogOpen.value = true
}

const handleConfirmDelete = async () => {
  if (!itemToDelete.value) return
  isDeleting.value = true
  try {
    await deleteCourseOffering(itemToDelete.value.id)
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

// 状态操作
const handleSetDraft = async (row: CourseOfferingVO) => {
  try {
    await setCourseOfferingDraft(row.id)
    toast.success('已设为草稿')
    fetchData()
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '操作失败'
    toast.error(message)
  }
}

const handleSetScheduling = async (row: CourseOfferingVO) => {
  try {
    await setCourseOfferingScheduling(row.id)
    toast.success('已进入排课阶段')
    fetchData()
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '操作失败'
    toast.error(message)
  }
}

const handleOpenEnrollment = async (row: CourseOfferingVO) => {
  try {
    await setCourseOfferingEnrollmentOpen(row.id)
    toast.success('已开放选课')
    fetchData()
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '操作失败'
    toast.error(message)
  }
}

const handleCloseEnrollment = async (row: CourseOfferingVO) => {
  try {
    await setCourseOfferingEnrollmentClosed(row.id)
    toast.success('已关闭选课')
    fetchData()
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '操作失败'
    toast.error(message)
  }
}

const handleArchive = async (row: CourseOfferingVO) => {
  try {
    await setCourseOfferingArchived(row.id)
    toast.success('已归档')
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
          <BookOpen class="h-6 w-6" />
          开课管理
        </h2>
        <p class="text-muted-foreground">管理课程开设信息，包括学期、课程类型、教师分配等</p>
      </div>
      <Button @click="handleCreate">
        <Plus class="mr-2 h-4 w-4" />
        新增开课
      </Button>
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
      <div class="flex-1 min-w-[150px] max-w-[180px]">
        <Select v-model="queryParams.status">
          <SelectTrigger>
            <SelectValue placeholder="状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="DRAFT">草稿</SelectItem>
            <SelectItem value="SCHEDULING">排课中</SelectItem>
            <SelectItem value="ENROLLMENT_OPEN">选课开放</SelectItem>
            <SelectItem value="ENROLLMENT_CLOSED">选课关闭</SelectItem>
            <SelectItem value="ARCHIVED">已归档</SelectItem>
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
            <TableHead>学期</TableHead>
            <TableHead>课程类型</TableHead>
            <TableHead>学分</TableHead>
            <TableHead>容量</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>创建时间</TableHead>
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
              暂无数据
            </TableCell>
          </TableRow>
          <TableRow v-for="row in tableData" :key="row.id">
            <TableCell class="font-medium">{{ row.courseCode }}</TableCell>
            <TableCell>{{ row.courseName }}</TableCell>
            <TableCell>{{ row.semesterName }}</TableCell>
            <TableCell>{{ courseTypeMap[row.courseType] || row.courseType }}</TableCell>
            <TableCell>{{ row.credit }}</TableCell>
            <TableCell>{{ row.capacity || '-' }}</TableCell>
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
                <!-- 状态流转按钮 -->
                <Button
                  v-if="row.status === 'DRAFT'"
                  variant="ghost"
                  size="icon"
                  title="进入排课"
                  @click="handleSetScheduling(row)"
                >
                  <Play class="h-4 w-4 text-blue-600" />
                </Button>
                <Button
                  v-if="row.status === 'SCHEDULING'"
                  variant="ghost"
                  size="icon"
                  title="开放选课"
                  @click="handleOpenEnrollment(row)"
                >
                  <Play class="h-4 w-4 text-green-600" />
                </Button>
                <Button
                  v-if="row.status === 'ENROLLMENT_OPEN'"
                  variant="ghost"
                  size="icon"
                  title="关闭选课"
                  @click="handleCloseEnrollment(row)"
                >
                  <Lock class="h-4 w-4 text-orange-600" />
                </Button>
                <Button
                  v-if="['SCHEDULING', 'ENROLLMENT_CLOSED'].includes(row.status)"
                  variant="ghost"
                  size="icon"
                  title="归档"
                  @click="handleArchive(row)"
                >
                  <Archive class="h-4 w-4 text-gray-600" />
                </Button>
                <Button
                  v-if="row.status !== 'DRAFT'"
                  variant="ghost"
                  size="icon"
                  title="退回草稿"
                  @click="handleSetDraft(row)"
                >
                  <StopCircle class="h-4 w-4 text-yellow-600" />
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
    <CourseOfferingEditDialog ref="editDialogRef" @success="handleEditSuccess" />

    <!-- 删除确认对话框 -->
    <AlertDialog :open="deleteDialogOpen" @update:open="(v) => (deleteDialogOpen = v)">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle class="flex items-center gap-2 text-red-600">
            确认删除开课记录？
          </AlertDialogTitle>
          <AlertDialogDescription>
            您正在尝试删除开课：
            <span class="font-bold text-black">{{ itemToDelete?.courseName }}</span>
            <br />
            <span class="text-red-500 text-xs mt-2 block">
              注意：删除后相关的教学班和选课记录将受到影响
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
