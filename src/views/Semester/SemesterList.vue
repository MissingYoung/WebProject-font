<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { getSemesterList, deleteSemester, setCurrentSemester } from '@/lib/api'
import type { SemesterVO, SemesterQueryParams } from '@/types'
import SemesterEditDialog from '@/components/Semester/SemesterEditDialog.vue'
import { useNotification } from '@/composables/useNotification'

// UI 组件
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Loader2,
  Plus,
  Search,
  RotateCcw,
  Pencil,
  Calendar,
  Trash2,
  AlertTriangle,
  CheckCircle,
} from 'lucide-vue-next'
import PaginationBar from '@/components/PaginationBar.vue'
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

const { success, error } = useNotification()

// --- 状态管理 ---
const isLoading = ref(false)
const tableData = ref<SemesterVO[]>([])
const total = ref(0)
const editDialogRef = ref<InstanceType<typeof SemesterEditDialog> | null>(null)

// 删除相关的状态
const deleteDialogOpen = ref(false)
const semesterToDelete = ref<SemesterVO | null>(null)
const isDeleting = ref(false)

// 设置当前学期相关的状态
const setCurrentDialogOpen = ref(false)
const semesterToSetCurrent = ref<SemesterVO | null>(null)
const isSettingCurrent = ref(false)

// 查询参数
const queryParams = reactive<SemesterQueryParams & { id?: string }>({
  pageNum: 1,
  pageSize: 10,
  academicYear: '',
  termOrder: undefined,
  name: '',
  id: '',
})

// 学期序号映射
const termOrderMap: Record<number, string> = {
  1: '秋季学期',
  2: '春季学期',
  3: '夏季学期',
}

// --- 方法 ---

// 获取数据
const fetchData = async () => {
  isLoading.value = true
  tableData.value = []
  try {
    // 构造查询参数，排除空值和 id
    const params: SemesterQueryParams = {
      pageNum: queryParams.pageNum,
      pageSize: queryParams.pageSize,
    }
    if (queryParams.academicYear) params.academicYear = queryParams.academicYear
    if (queryParams.termOrder) params.termOrder = queryParams.termOrder
    if (queryParams.name) params.name = queryParams.name

    const res = await getSemesterList(params)

    if (res && res.data) {
      tableData.value = res.data.records
      total.value = res.data.total
    }
  } catch (err: unknown) {
    console.error('获取学期数据失败', err)
    const message = err instanceof Error ? err.message : '获取学期列表失败'
    error(message)
    tableData.value = []
    total.value = 0
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
  queryParams.id = ''
  queryParams.academicYear = ''
  queryParams.termOrder = undefined
  queryParams.name = ''
  handleSearch()
}

// 操作：添加
const handleCreate = () => {
  editDialogRef.value?.openDialog()
}

// 操作：编辑
const handleEdit = (row: SemesterVO) => {
  editDialogRef.value?.openDialog(row)
}

// 点击删除按钮
const handleDeleteClick = (row: SemesterVO) => {
  semesterToDelete.value = row
  deleteDialogOpen.value = true
}

// 确认删除
const handleConfirmDelete = async () => {
  if (!semesterToDelete.value) return

  isDeleting.value = true
  try {
    await deleteSemester(semesterToDelete.value.id)
    success('学期删除成功')
    deleteDialogOpen.value = false
    fetchData()
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '删除失败'
    error(message)
  } finally {
    isDeleting.value = false
  }
}

// 点击设为当前学期按钮
const handleSetCurrentClick = (row: SemesterVO) => {
  semesterToSetCurrent.value = row
  setCurrentDialogOpen.value = true
}

// 确认设为当前学期
const handleConfirmSetCurrent = async () => {
  if (!semesterToSetCurrent.value) return

  isSettingCurrent.value = true
  try {
    await setCurrentSemester(semesterToSetCurrent.value.id)
    success('当前学期设置成功')
    setCurrentDialogOpen.value = false
    fetchData()
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '设置失败'
    error(message)
  } finally {
    isSettingCurrent.value = false
  }
}

// 初始化
onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="space-y-6 p-6">
    <!-- 1. 顶部标题 -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Calendar class="h-6 w-6" /> 学期管理
        </h2>
        <p class="text-muted-foreground">管理学校的学期信息</p>
      </div>

      <Button @click="handleCreate">
        <Plus class="mr-2 h-4 w-4" />
        添加学期
      </Button>
    </div>

    <!-- 2. 筛选区域 -->
    <div class="flex flex-wrap gap-4 items-end border p-4 rounded-lg bg-card">
      <div class="grid gap-2 w-[150px]">
        <label class="text-sm font-medium">学年</label>
        <Input
          v-model="queryParams.academicYear"
          placeholder="例如: 2024-2025"
          @keyup.enter="handleSearch"
        />
      </div>

      <div class="grid gap-2 w-[180px]">
        <label class="text-sm font-medium">学期名称</label>
        <Input v-model="queryParams.name" placeholder="输入名称" @keyup.enter="handleSearch" />
      </div>

      <div class="grid gap-2 w-[150px]">
        <label class="text-sm font-medium">学期序号</label>
        <Select
          :model-value="queryParams.termOrder ? String(queryParams.termOrder) : undefined"
          @update:model-value="(v) => (queryParams.termOrder = v ? Number(v) : undefined)"
        >
          <SelectTrigger>
            <SelectValue placeholder="全部" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">秋季学期</SelectItem>
            <SelectItem value="2">春季学期</SelectItem>
            <SelectItem value="3">夏季学期</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="flex gap-2 pb-0.5">
        <Button @click="handleSearch"> <Search class="mr-2 h-4 w-4" /> 搜索 </Button>
        <Button variant="outline" @click="handleReset">
          <RotateCcw class="mr-2 h-4 w-4" /> 重置
        </Button>
      </div>
    </div>

    <!-- 3. 表格区域 -->
    <div class="border rounded-md bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead class="w-[80px]">ID</TableHead>
            <TableHead>学年</TableHead>
            <TableHead>学期名称</TableHead>
            <TableHead>学期类型</TableHead>
            <TableHead>开始日期</TableHead>
            <TableHead>结束日期</TableHead>
            <TableHead>周数</TableHead>
            <TableHead>状态</TableHead>
            <TableHead class="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <!-- Loading -->
          <TableRow v-if="isLoading">
            <TableCell colspan="9" class="h-24 text-center">
              <div class="flex items-center justify-center gap-2">
                <Loader2 class="h-4 w-4 animate-spin" /> 加载中...
              </div>
            </TableCell>
          </TableRow>

          <!-- 空表格 -->
          <TableRow v-else-if="tableData.length === 0">
            <TableCell colspan="9" class="h-24 text-center text-muted-foreground">
              暂无数据
            </TableCell>
          </TableRow>

          <!-- Data -->
          <TableRow v-for="item in tableData" v-else :key="item.id">
            <TableCell class="font-medium">{{ item.id }}</TableCell>
            <TableCell>{{ item.academicYear }}</TableCell>
            <TableCell>{{ item.name }}</TableCell>
            <TableCell>{{ termOrderMap[item.termOrder] || `第${item.termOrder}学期` }}</TableCell>
            <TableCell class="text-sm">{{ item.startDate }}</TableCell>
            <TableCell class="text-sm">{{ item.endDate }}</TableCell>
            <TableCell>{{ item.weekCount || '-' }}</TableCell>
            <TableCell>
              <Badge v-if="item.currentTerm" variant="default"> 当前学期 </Badge>
              <Badge v-else variant="secondary"> 非当前 </Badge>
            </TableCell>

            <TableCell class="text-right">
              <div class="flex justify-end gap-2 items-center">
                <!-- 设为当前学期按钮 (只在非当前学期时显示) -->
                <Button
                  v-if="!item.currentTerm"
                  variant="ghost"
                  size="sm"
                  title="设为当前学期"
                  class="text-primary hover:text-primary/90 hover:bg-accent"
                  @click="handleSetCurrentClick(item)"
                >
                  <CheckCircle class="h-4 w-4 mr-1" />设为当前
                </Button>

                <!-- 编辑按钮 -->
                <Button variant="ghost" size="sm" title="编辑" @click="handleEdit(item)">
                  <Pencil class="h-4 w-4 text-blue-600" />编辑
                </Button>

                <!-- 删除按钮 -->
                <Button
                  variant="ghost"
                  size="sm"
                  title="删除学期"
                  class="text-red-600 hover:text-red-700 hover:bg-red-50"
                  @click="handleDeleteClick(item)"
                >
                  <Trash2 class="h-4 w-4" />删除
                </Button>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <!-- 4. 分页控件 -->
    <PaginationBar
      v-model:page-num="queryParams.pageNum"
      v-model:page-size="queryParams.pageSize"
      :total="total"
      :is-loading="isLoading"
      @change="fetchData"
    />

    <!-- 删除确认弹窗 -->
    <AlertDialog :open="deleteDialogOpen" @update:open="(v) => (deleteDialogOpen = v)">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle class="flex items-center gap-2 text-red-600">
            <AlertTriangle class="h-5 w-5" />
            确认删除该学期吗？
          </AlertDialogTitle>
          <AlertDialogDescription>
            您正在尝试删除学期：<span class="font-bold text-foreground">{{
              semesterToDelete?.name
            }}</span>
            ({{ semesterToDelete?.academicYear }})。
            <br />
            <span class="text-red-500 text-xs mt-2 block"
              >注意：删除后可能影响相关的课程开设和选课数据。</span
            >
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

    <!-- 设为当前学期确认弹窗 -->
    <AlertDialog :open="setCurrentDialogOpen" @update:open="(v) => (setCurrentDialogOpen = v)">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle class="flex items-center gap-2 text-primary">
            <CheckCircle class="h-5 w-5" />
            确认设为当前学期吗？
          </AlertDialogTitle>
          <AlertDialogDescription>
            您正在将学期
            <span class="font-bold text-foreground">{{ semesterToSetCurrent?.name }}</span>
            设为当前学期。
            <br />
            <span class="text-muted-foreground text-xs mt-2 block"
              >设置后，原当前学期将自动取消。</span
            >
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel :disabled="isSettingCurrent">取消</AlertDialogCancel>
          <AlertDialogAction
            :disabled="isSettingCurrent"
            class="bg-primary text-primary-foreground hover:bg-primary/90"
            @click.prevent="handleConfirmSetCurrent"
          >
            {{ isSettingCurrent ? '设置中...' : '确认设置' }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <!-- 编辑弹窗 -->
    <SemesterEditDialog ref="editDialogRef" @success="fetchData" />
  </div>
</template>
