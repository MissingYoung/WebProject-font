<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Clock, Loader2, Plus, Search, RotateCcw, Pencil, Trash2, Sparkles } from 'lucide-vue-next'
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
import AutoScheduleDialog from '@/components/TeachingClassSchedule/AutoScheduleDialog.vue'
import PaginationBar from '@/components/PaginationBar.vue'

const { success, error } = useNotification()

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
const autoScheduleDialogRef = ref<InstanceType<typeof AutoScheduleDialog> | null>(null)
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

// 创建
const handleCreate = () => {
  editDialogRef.value?.openDialog()
}

// 自动排课
const handleAutoSchedule = () => {
  autoScheduleDialogRef.value?.openDialog(queryParams.semesterId)
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

// 自动排课成功回调
const handleAutoScheduleSuccess = () => {
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
  <div class="space-y-6 p-6">
    <!-- 标题栏 -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Clock class="h-6 w-6" />
          排课管理
        </h2>
        <p class="text-muted-foreground">管理教学班的上课时间和地点安排</p>
      </div>
      <div class="flex items-center gap-2">
        <Button variant="outline" @click="handleAutoSchedule">
          <Sparkles class="mr-2 h-4 w-4" />
          自动排课
        </Button>
        <Button @click="handleCreate">
          <Plus class="mr-2 h-4 w-4" />
          新增排课
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
        <label class="text-sm font-medium">教学班</label>
        <Select v-model="queryParams.teachingClassId">
          <SelectTrigger>
            <SelectValue placeholder="全部" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="tc in teachingClasses" :key="tc.id" :value="tc.id">
              {{ tc.name }} ({{ tc.courseName }})
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div class="grid gap-2 w-[150px]">
        <label class="text-sm font-medium">星期</label>
        <Select v-model="queryParams.dayOfWeek">
          <SelectTrigger>
            <SelectValue placeholder="全部" />
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
      <div class="grid gap-2 w-[180px]">
        <label class="text-sm font-medium">上课地点</label>
        <Input v-model="queryParams.location" placeholder="输入地点" @keyup.enter="handleSearch" />
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
            <TableCell colspan="8" class="h-24 text-center">
              <div class="flex items-center justify-center gap-2">
                <Loader2 class="h-4 w-4 animate-spin" /> 加载中...
              </div>
            </TableCell>
          </TableRow>
          <TableRow v-else-if="tableData.length === 0">
            <TableCell colspan="8" class="h-24 text-center text-muted-foreground"
              >暂无数据</TableCell
            >
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
    <ScheduleEditDialog ref="editDialogRef" @success="handleEditSuccess" />

    <!-- 自动排课对话框 -->
    <AutoScheduleDialog ref="autoScheduleDialogRef" @success="handleAutoScheduleSuccess" />

    <!-- 删除确认对话框 -->
    <AlertDialog :open="deleteDialogOpen" @update:open="(v) => (deleteDialogOpen = v)">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle class="flex items-center gap-2 text-red-600">
            确认删除排课？
          </AlertDialogTitle>
          <AlertDialogDescription>
            您正在尝试删除排课：
            <span class="font-bold text-foreground">
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
