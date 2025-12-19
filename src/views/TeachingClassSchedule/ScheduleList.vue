<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Clock, Plus, Search, RotateCcw, Pencil, Trash2 } from 'lucide-vue-next'
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
import type { TeachingClassScheduleVO, SemesterVO, TeachingClassVO } from '@/types'
import {
  getTeachingClassScheduleList,
  deleteTeachingClassSchedule,
  getSemesterList,
  getTeachingClassList,
} from '@/lib/api'
import ScheduleEditDialog from '@/components/TeachingClassSchedule/ScheduleEditDialog.vue'

const { success, error, info } = useNotification()

// 星期映射
const weekDayMap: Record<number, string> = {
  1: '周一',
  2: '周二',
  3: '周三',
  4: '周四',
  5: '周五',
  6: '周六',
  7: '周日',
}

// 数据状态
const isLoading = ref(false)
const tableData = ref<TeachingClassScheduleVO[]>([])
const total = ref(0)
const semesters = ref<SemesterVO[]>([])
const teachingClasses = ref<TeachingClassVO[]>([])

// 查询参数
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  semesterId: undefined as number | undefined,
  teachingClassId: undefined as number | undefined,
  dayOfWeek: undefined as number | undefined,
  location: '',
})

// 弹窗状态
const editDialogRef = ref<InstanceType<typeof ScheduleEditDialog> | null>(null)
const deleteDialogOpen = ref(false)
const itemToDelete = ref<TeachingClassScheduleVO | null>(null)
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

// 加载教学班列表
const loadTeachingClasses = async () => {
  try {
    const params: { pageNum: number; pageSize: number; semesterId?: number } = {
      pageNum: 1,
      pageSize: 100,
    }
    if (queryParams.semesterId) {
      params.semesterId = queryParams.semesterId
    }
    const res = await getTeachingClassList(params)
    if (res?.data) {
      teachingClasses.value = res.data.records
    }
  } catch (err: unknown) {
    console.error('加载教学班列表失败', err)
  }
}

// 获取列表数据
const fetchData = async () => {
  isLoading.value = true
  try {
    const params = {
      ...queryParams,
      semesterId: queryParams.semesterId || undefined,
      teachingClassId: queryParams.teachingClassId || undefined,
      dayOfWeek: queryParams.dayOfWeek || undefined,
    }
    const res = await getTeachingClassScheduleList(params)
    if (res?.data) {
      tableData.value = res.data.records
      total.value = res.data.total
    }
  } catch (err: unknown) {
    console.error('获取排课列表失败', err)
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
  queryParams.teachingClassId = undefined
  queryParams.dayOfWeek = undefined
  queryParams.location = ''
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
const handleEdit = (row: TeachingClassScheduleVO) => {
  editDialogRef.value?.openDialog(row)
}

// 删除
const handleDeleteClick = (row: TeachingClassScheduleVO) => {
  itemToDelete.value = row
  deleteDialogOpen.value = true
}

const handleConfirmDelete = async () => {
  if (!itemToDelete.value) return
  isDeleting.value = true
  try {
    await deleteTeachingClassSchedule(itemToDelete.value.id)
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

// 学期变化时重新加载教学班列表
const handleSemesterChange = () => {
  queryParams.teachingClassId = undefined
  loadTeachingClasses()
}

// 根据teachingClassId查找教学班信息
const findTeachingClass = (teachingClassId: number) => {
  return teachingClasses.value.find((tc) => tc.id === teachingClassId)
}

// 格式化时间段
const formatPeriod = (start: number, end: number) => {
  return `${start}-${end}节`
}

// 格式化周次
const formatWeeks = (start?: number, end?: number) => {
  if (!start && !end) return '全部'
  if (start && end) return `${start}-${end}周`
  if (start) return `${start}周起`
  if (end) return `至${end}周`
  return '-'
}

onMounted(() => {
  loadSemesters()
  loadTeachingClasses()
  fetchData()
})
</script>

<template>
  <div class="space-y-4">
    <!-- 标题栏 -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Clock class="h-6 w-6" />
          排课管理
        </h2>
        <p class="text-muted-foreground">管理教学班的上课时间和地点安排</p>
      </div>
      <Button @click="handleCreate">
        <Plus class="mr-2 h-4 w-4" />
        新增排课
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
        <Select v-model="queryParams.teachingClassId">
          <SelectTrigger>
            <SelectValue placeholder="选择教学班" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="tc in teachingClasses" :key="tc.id" :value="tc.id">
              {{ tc.name }} ({{ tc.courseName }})
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div class="flex-1 min-w-[150px] max-w-[150px]">
        <Select v-model="queryParams.dayOfWeek">
          <SelectTrigger>
            <SelectValue placeholder="星期" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem :value="1">周一</SelectItem>
            <SelectItem :value="2">周二</SelectItem>
            <SelectItem :value="3">周三</SelectItem>
            <SelectItem :value="4">周四</SelectItem>
            <SelectItem :value="5">周五</SelectItem>
            <SelectItem :value="6">周六</SelectItem>
            <SelectItem :value="7">周日</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div class="flex-1 min-w-[150px] max-w-[180px]">
        <Input v-model="queryParams.location" placeholder="上课地点" @keyup.enter="handleSearch" />
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
            <TableHead>教学班</TableHead>
            <TableHead>课程名称</TableHead>
            <TableHead>星期</TableHead>
            <TableHead>节次</TableHead>
            <TableHead>周次</TableHead>
            <TableHead>上课地点</TableHead>
            <TableHead>备注</TableHead>
            <TableHead class="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="isLoading">
            <TableCell colspan="8" class="text-center py-8 text-muted-foreground">
              加载中...
            </TableCell>
          </TableRow>
          <TableRow v-else-if="tableData.length === 0">
            <TableCell colspan="8" class="text-center py-8 text-muted-foreground">
              暂无数据
            </TableCell>
          </TableRow>
          <TableRow v-for="row in tableData" :key="row.id">
            <TableCell class="font-medium">
              {{ findTeachingClass(row.teachingClassId)?.name || row.teachingClassId }}
            </TableCell>
            <TableCell>
              {{ findTeachingClass(row.teachingClassId)?.courseName || '-' }}
            </TableCell>
            <TableCell>{{ weekDayMap[row.weekDay] }}</TableCell>
            <TableCell>{{ formatPeriod(row.startSection, row.endSection) }}</TableCell>
            <TableCell>{{ formatWeeks(row.startWeek, row.endWeek) }}</TableCell>
            <TableCell>{{ row.classroom || '-' }}</TableCell>
            <TableCell>{{ row.remark || '-' }}</TableCell>
            <TableCell class="text-right">
              <div class="flex justify-end gap-1">
                <Button variant="ghost" size="icon" title="编辑" @click="handleEdit(row)">
                  <Pencil class="h-4 w-4" />
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
    <ScheduleEditDialog ref="editDialogRef" @success="handleEditSuccess" />

    <!-- 删除确认对话框 -->
    <AlertDialog :open="deleteDialogOpen" @update:open="(v) => (deleteDialogOpen = v)">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle class="flex items-center gap-2 text-red-600">
            确认删除排课？
          </AlertDialogTitle>
          <AlertDialogDescription>
            您正在尝试删除排课：
            <span class="font-bold text-black">
              {{ weekDayMap[itemToDelete?.weekDay || 1] }}
              {{
                itemToDelete ? formatPeriod(itemToDelete.startSection, itemToDelete.endSection) : ''
              }}
            </span>
            <br />
            <span class="text-red-500 text-xs mt-2 block">
              注意：删除后相关的教学安排将受到影响
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
