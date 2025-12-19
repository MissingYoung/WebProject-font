<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { getMajorList, deleteMajor, enableMajor, disableMajor, getDepartmentList } from '@/lib/api'
import type { MajorVO, MajorQueryParams, DegreeLevel, DepartmentVO } from '@/types'
import { formatDate } from '@/lib/date'
import MajorEditDialog from '@/components/Major/MajorEditDialog.vue'
import { toast } from 'vue-sonner'

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
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  Trash2,
  AlertTriangle,
  Play,
  PauseCircle,
} from 'lucide-vue-next'
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

// --- 状态管理 ---
const isLoading = ref(false)
const tableData = ref<MajorVO[]>([])
const total = ref(0)
const editDialogRef = ref<InstanceType<typeof MajorEditDialog> | null>(null)

// 部门列表（用于筛选）
const departmentList = ref<DepartmentVO[]>([])

// 删除相关的状态
const deleteDialogOpen = ref(false)
const majorToDelete = ref<MajorVO | null>(null)
const isDeleting = ref(false)

// 查询参数
const queryParams = reactive<MajorQueryParams>({
  pageNum: 1,
  pageSize: 10,
  departmentId: undefined,
  code: '',
  name: '',
  degreeLevel: undefined,
  status: undefined,
})

// 学位等级映射
const degreeLevelMap: Record<DegreeLevel, string> = {
  ASSOCIATE: '专科',
  BACHELOR: '本科',
  MASTER: '硕士',
  DOCTOR: '博士',
}

// 状态映射字典
const statusMap: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' }
> = {
  ACTIVE: { label: '正常', variant: 'default' },
  DISABLED: { label: '禁用', variant: 'destructive' },
}

// --- 方法 ---

// 获取部门列表
const fetchDepartments = async () => {
  try {
    const res = await getDepartmentList({
      pageNum: 1,
      pageSize: 100,
      status: 'ACTIVE',
    })
    if (res && res.data) {
      departmentList.value = res.data.records
    }
  } catch (err: unknown) {
    console.error('获取部门列表失败', err)
  }
}

// 获取数据
const fetchData = async () => {
  isLoading.value = true
  tableData.value = []
  try {
    // 构造查询参数，排除空值
    const params: MajorQueryParams = {
      pageNum: queryParams.pageNum,
      pageSize: queryParams.pageSize,
    }
    if (queryParams.departmentId) params.departmentId = queryParams.departmentId
    if (queryParams.code) params.code = queryParams.code
    if (queryParams.name) params.name = queryParams.name
    if (queryParams.degreeLevel) params.degreeLevel = queryParams.degreeLevel
    if (queryParams.status) params.status = queryParams.status

    const res = await getMajorList(params)

    if (res && res.data) {
      tableData.value = res.data.records
      total.value = res.data.total
    }
  } catch (error: unknown) {
    console.error('获取专业数据失败', error)
    const message = error instanceof Error ? error.message : '获取专业列表失败'
    toast.error(message)
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
  queryParams.departmentId = undefined
  queryParams.code = ''
  queryParams.name = ''
  queryParams.degreeLevel = undefined
  queryParams.status = undefined
  handleSearch()
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

// 操作：添加
const handleCreate = () => {
  editDialogRef.value?.openDialog()
}

// 操作：编辑
const handleEdit = (row: MajorVO) => {
  editDialogRef.value?.openDialog(row)
}

// 点击删除按钮
const handleDeleteClick = (row: MajorVO) => {
  majorToDelete.value = row
  deleteDialogOpen.value = true
}

// 确认删除
const handleConfirmDelete = async () => {
  if (!majorToDelete.value) return

  isDeleting.value = true
  try {
    await deleteMajor(majorToDelete.value.id)
    toast.success('专业删除成功')
    deleteDialogOpen.value = false
    fetchData()
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '删除失败'
    toast.error(message)
  } finally {
    isDeleting.value = false
  }
}

// 启用专业
const handleEnable = async (row: MajorVO) => {
  try {
    await enableMajor(row.id)
    toast.success('专业启用成功')
    fetchData()
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '启用失败'
    toast.error(message)
  }
}

// 禁用专业
const handleDisable = async (row: MajorVO) => {
  try {
    await disableMajor(row.id)
    toast.success('专业禁用成功')
    fetchData()
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '禁用失败'
    toast.error(message)
  }
}

// 初始化
onMounted(() => {
  fetchDepartments()
  fetchData()
})
</script>

<template>
  <div class="space-y-6 p-6">
    <!-- 1. 顶部标题 -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold tracking-tight flex items-center gap-2">
          <GraduationCap class="h-6 w-6" /> 专业管理
        </h2>
        <p class="text-muted-foreground">管理学校的专业信息</p>
      </div>

      <Button @click="handleCreate">
        <Plus class="mr-2 h-4 w-4" />
        添加专业
      </Button>
    </div>

    <!-- 2. 筛选区域 -->
    <div class="flex flex-wrap gap-4 items-end border p-4 rounded-lg bg-card">
      <div class="grid gap-2 w-[180px]">
        <label class="text-sm font-medium">所属学院</label>
        <Select
          :model-value="queryParams.departmentId ? String(queryParams.departmentId) : undefined"
          @update:model-value="(v) => (queryParams.departmentId = v ? Number(v) : undefined)"
        >
          <SelectTrigger>
            <SelectValue placeholder="全部" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="dept in departmentList" :key="dept.id" :value="String(dept.id)">
              {{ dept.name }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="grid gap-2 w-[150px]">
        <label class="text-sm font-medium">专业编码</label>
        <Input v-model="queryParams.code" placeholder="输入编码" @keyup.enter="handleSearch" />
      </div>

      <div class="grid gap-2 w-[150px]">
        <label class="text-sm font-medium">专业名称</label>
        <Input v-model="queryParams.name" placeholder="输入名称" @keyup.enter="handleSearch" />
      </div>

      <div class="grid gap-2 w-[120px]">
        <label class="text-sm font-medium">学位等级</label>
        <Select
          :model-value="queryParams.degreeLevel"
          @update:model-value="(v) => (queryParams.degreeLevel = (v as DegreeLevel) || undefined)"
        >
          <SelectTrigger>
            <SelectValue placeholder="全部" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ASSOCIATE">专科</SelectItem>
            <SelectItem value="BACHELOR">本科</SelectItem>
            <SelectItem value="MASTER">硕士</SelectItem>
            <SelectItem value="DOCTOR">博士</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="grid gap-2 w-[120px]">
        <label class="text-sm font-medium">状态</label>
        <Select
          :model-value="queryParams.status"
          @update:model-value="
            (v) => (queryParams.status = (v as 'ACTIVE' | 'DISABLED') || undefined)
          "
        >
          <SelectTrigger>
            <SelectValue placeholder="全部" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ACTIVE">正常</SelectItem>
            <SelectItem value="DISABLED">禁用</SelectItem>
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
    <div class="border rounded-md bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead class="w-[80px]">ID</TableHead>
            <TableHead>专业编码</TableHead>
            <TableHead>专业名称</TableHead>
            <TableHead>所属学院</TableHead>
            <TableHead>学位等级</TableHead>
            <TableHead>学制</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>创建时间</TableHead>
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
            <TableCell>{{ item.code }}</TableCell>
            <TableCell>{{ item.name }}</TableCell>
            <TableCell>{{ item.departmentName || '-' }}</TableCell>
            <TableCell>{{ degreeLevelMap[item.degreeLevel] || item.degreeLevel }}</TableCell>
            <TableCell>{{ item.durationYears ? `${item.durationYears}年` : '-' }}</TableCell>
            <TableCell>
              <Badge v-if="statusMap[item.status]" :variant="statusMap[item.status]?.variant">
                {{ statusMap[item.status]?.label }}
              </Badge>
              <span v-else>{{ item.status }}</span>
            </TableCell>
            <TableCell class="text-sm text-muted-foreground">
              {{ formatDate(item.createTime) }}
            </TableCell>

            <TableCell class="text-right">
              <div class="flex justify-end gap-2 items-center">
                <!-- 启用按钮 (只在 DISABLED 状态显示) -->
                <Button
                  v-if="item.status === 'DISABLED'"
                  variant="ghost"
                  size="sm"
                  title="启用专业"
                  class="text-green-600 hover:text-green-700 hover:bg-green-50"
                  @click="handleEnable(item)"
                >
                  <Play class="h-4 w-4" />启用
                </Button>
                <!-- 禁用按钮 (状态不为 DISABLED，即 ACTIVE 时显示) -->
                <Button
                  v-else
                  variant="ghost"
                  size="sm"
                  title="禁用专业"
                  class="text-orange-500 hover:text-orange-600 hover:bg-orange-50"
                  @click="handleDisable(item)"
                >
                  <PauseCircle class="h-4 w-4" />禁用
                </Button>

                <!-- 编辑按钮 -->
                <Button variant="ghost" size="sm" title="编辑" @click="handleEdit(item)">
                  <Pencil class="h-4 w-4 text-blue-600" />编辑
                </Button>

                <!-- 删除按钮 -->
                <Button
                  variant="ghost"
                  size="sm"
                  title="删除专业"
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
    <div class="flex items-center justify-end space-x-2 py-4">
      <div class="text-sm text-muted-foreground mr-4">共 {{ total }} 条记录</div>
      <Button
        variant="outline"
        size="sm"
        :disabled="queryParams.pageNum <= 1 || isLoading"
        @click="prevPage"
      >
        <ChevronLeft class="h-4 w-4" /> 上一页
      </Button>
      <div class="text-sm font-medium">第 {{ queryParams.pageNum }} 页</div>
      <Button
        variant="outline"
        size="sm"
        :disabled="tableData.length < queryParams.pageSize || isLoading"
        @click="nextPage"
      >
        下一页
        <ChevronRight class="h-4 w-4" />
      </Button>
    </div>

    <!-- 删除确认弹窗 -->
    <AlertDialog :open="deleteDialogOpen" @update:open="(v) => (deleteDialogOpen = v)">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle class="flex items-center gap-2 text-red-600">
            <AlertTriangle class="h-5 w-5" />
            确认删除该专业吗？
          </AlertDialogTitle>
          <AlertDialogDescription>
            您正在尝试删除专业：<span class="font-bold text-black">{{ majorToDelete?.name }}</span>
            ({{ majorToDelete?.code }})。
            <br />
            <span class="text-red-500 text-xs mt-2 block"
              >注意：删除后可能影响相关的学生数据和培养方案。</span
            >
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

    <!-- 编辑弹窗 -->
    <MajorEditDialog ref="editDialogRef" @success="fetchData" />
  </div>
</template>
