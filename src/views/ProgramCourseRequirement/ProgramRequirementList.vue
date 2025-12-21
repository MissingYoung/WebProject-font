<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { FileText, Loader2, Plus, Search, RotateCcw, Pencil, Trash2 } from 'lucide-vue-next'
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
import type { ProgramCourseRequirementVO, MajorVO, CourseType } from '@/types'
import {
  getProgramCourseRequirementList,
  deleteProgramCourseRequirement,
  getMajorList,
} from '@/lib/api'
import ProgramRequirementEditDialog from '@/components/ProgramCourseRequirement/ProgramRequirementEditDialog.vue'
import PaginationBar from '@/components/PaginationBar.vue'

const { success, error } = useNotification()

// 课程类型映射
const courseTypeMap: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'outline' }
> = {
  REQUIRED: { label: '必修', variant: 'default' },
  LIMITED_ELECTIVE: { label: '限选', variant: 'secondary' },
  OPEN_ELECTIVE: { label: '任选', variant: 'outline' },
}

// 数据状态
const isLoading = ref(false)
const tableData = ref<ProgramCourseRequirementVO[]>([])
const total = ref(0)
const majors = ref<MajorVO[]>([])

// 查询参数
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  majorId: undefined as number | undefined,
  courseType: undefined as CourseType | undefined,
  courseName: '',
  gradeLevel: undefined as number | undefined,
})

// 弹窗状态
const editDialogRef = ref<InstanceType<typeof ProgramRequirementEditDialog> | null>(null)
const deleteDialogOpen = ref(false)
const itemToDelete = ref<ProgramCourseRequirementVO | null>(null)
const isDeleting = ref(false)

// 加载专业列表
const loadMajors = async () => {
  try {
    const res = await getMajorList({ pageNum: 1, pageSize: 100, status: 'ACTIVE' })
    if (res?.data) {
      majors.value = res.data.records
    }
  } catch (err: unknown) {
    console.error('加载专业列表失败', err)
  }
}

// 获取列表数据
const fetchData = async () => {
  isLoading.value = true
  try {
    const params = {
      ...queryParams,
      majorId: queryParams.majorId || undefined,
      courseType: queryParams.courseType || undefined,
      gradeLevel: queryParams.gradeLevel || undefined,
    }
    const res = await getProgramCourseRequirementList(params)
    if (res?.data) {
      tableData.value = res.data.records
      total.value = res.data.total
    }
  } catch (err: unknown) {
    console.error('获取培养计划列表失败', err)
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
  queryParams.majorId = undefined
  queryParams.courseType = undefined
  queryParams.courseName = ''
  queryParams.gradeLevel = undefined
  fetchData()
}

// 创建
const handleCreate = () => {
  editDialogRef.value?.openDialog()
}

// 编辑
const handleEdit = (row: ProgramCourseRequirementVO) => {
  editDialogRef.value?.openDialog(row)
}

// 删除
const handleDeleteClick = (row: ProgramCourseRequirementVO) => {
  itemToDelete.value = row
  deleteDialogOpen.value = true
}

const handleConfirmDelete = async () => {
  if (!itemToDelete.value) return
  isDeleting.value = true
  try {
    await deleteProgramCourseRequirement(itemToDelete.value.id)
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

// 编辑成功回调
const handleEditSuccess = () => {
  fetchData()
}

// 格式化建议学期
const formatSemester = (semesterName?: string) => {
  if (!semesterName) return '-'
  return semesterName
}

onMounted(() => {
  loadMajors()
  fetchData()
})
</script>

<template>
  <div class="space-y-6 p-6">
    <!-- 标题栏 -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold tracking-tight flex items-center gap-2">
          <FileText class="h-6 w-6" />
          培养计划管理
        </h2>
        <p class="text-muted-foreground">管理各专业的课程培养要求和推荐修读计划</p>
      </div>
      <Button @click="handleCreate">
        <Plus class="mr-2 h-4 w-4" />
        新增要求
      </Button>
    </div>

    <!-- 搜索区域 -->
    <div class="flex flex-wrap gap-4 items-end border p-4 rounded-lg bg-card">
      <div class="grid gap-2 w-[200px]">
        <label class="text-sm font-medium">专业</label>
        <Select v-model="queryParams.majorId">
          <SelectTrigger>
            <SelectValue placeholder="全部" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="major in majors" :key="major.id" :value="major.id">
              {{ major.name }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div class="grid gap-2 w-[200px]">
        <label class="text-sm font-medium">课程名称</label>
        <Input
          v-model="queryParams.courseName"
          placeholder="输入名称"
          @keyup.enter="handleSearch"
        />
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
        <label class="text-sm font-medium">建议年级</label>
        <Input
          v-model.number="queryParams.gradeLevel"
          type="number"
          placeholder="输入年级"
          @keyup.enter="handleSearch"
        />
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
            <TableHead>专业</TableHead>
            <TableHead>课程编码</TableHead>
            <TableHead>课程名称</TableHead>
            <TableHead>学分</TableHead>
            <TableHead>课程类型</TableHead>
            <TableHead>建议年级</TableHead>
            <TableHead>建议学期</TableHead>
            <TableHead>必修</TableHead>
            <TableHead class="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="isLoading">
            <TableCell colspan="9" class="h-24 text-center">
              <div class="flex items-center justify-center gap-2">
                <Loader2 class="h-4 w-4 animate-spin" /> 加载中...
              </div>
            </TableCell>
          </TableRow>
          <TableRow v-else-if="tableData.length === 0">
            <TableCell colspan="9" class="h-24 text-center text-muted-foreground"
              >暂无数据</TableCell
            >
          </TableRow>
          <TableRow v-for="row in tableData" :key="row.id">
            <TableCell>{{ row.majorName }}</TableCell>
            <TableCell class="font-medium">{{ row.courseId }}</TableCell>
            <TableCell>{{ row.courseName }}</TableCell>
            <TableCell>-</TableCell>
            <TableCell>
              <Badge :variant="courseTypeMap[row.courseType]?.variant || 'default'">
                {{ courseTypeMap[row.courseType]?.label || row.courseType }}
              </Badge>
            </TableCell>
            <TableCell>{{ row.gradeLevel || '-' }}</TableCell>
            <TableCell>{{ formatSemester(row.recommendedSemesterName) }}</TableCell>
            <TableCell>{{ row.mandatory ? '是' : '否' }}</TableCell>
            <TableCell class="text-right">
              <div class="flex flex-wrap justify-end gap-2">
                <Button variant="ghost" size="sm" title="编辑" @click="handleEdit(row)">
                  <Pencil class="h-4 w-4" />编辑
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
    <ProgramRequirementEditDialog ref="editDialogRef" @success="handleEditSuccess" />

    <!-- 删除确认对话框 -->
    <AlertDialog :open="deleteDialogOpen" @update:open="(v) => (deleteDialogOpen = v)">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle class="flex items-center gap-2 text-red-600">
            确认删除培养计划要求？
          </AlertDialogTitle>
          <AlertDialogDescription>
            您正在尝试删除培养计划：
            <span class="font-bold text-foreground">
              {{ itemToDelete?.majorName }} - {{ itemToDelete?.courseName }}
            </span>
            <br />
            <span class="text-red-500 text-xs mt-2 block">
              注意：删除后该课程将不再作为该专业的培养要求
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
