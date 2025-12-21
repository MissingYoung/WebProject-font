<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import {
  getDepartmentList,
  deleteDepartment,
  getDepartmentById,
  enableDepartment,
  disableDepartment,
} from '@/lib/api'
import type { DepartmentVO } from '@/types'
import { formatDate } from '@/lib/date'
import DepartmentEditDialog from '@/components/Department/DepartmentEditDialog.vue'
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
  Building2,
  Trash2,
  Play,
  PauseCircle,
} from 'lucide-vue-next'
import PaginationBar from '@/components/PaginationBar.vue'

const { success, error, confirm, extractErrorMessage } = useNotification()

// --- 状态管理 ---
const isLoading = ref(false)
const tableData = ref<DepartmentVO[]>([])
const total = ref(0)
const editDialogRef = ref<InstanceType<typeof DepartmentEditDialog> | null>(null)
const departments = ref<DepartmentVO[]>([])

// 查询参数
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  code: '',
  name: '',
  status: undefined as string | undefined,
  id: '',
  // parentId: undefined // 暂时不放父级ID筛选，通常用左侧树选择
})

// 状态映射字典
const statusMap: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' }
> = {
  ACTIVE: { label: '正常', variant: 'default' }, // 黑色/绿色
  DISABLED: { label: '禁用', variant: 'destructive' }, // 红色
}

// --- 方法 ---

// 加载部门列表用于映射上级部门名称
const loadDepartments = async () => {
  try {
    console.log('开始加载部门列表...')
    const res = await getDepartmentList({ pageNum: 1, pageSize: 100 })
    console.log('部门列表 API 响应:', res)
    if (res && res.data) {
      departments.value = res.data.records
      console.log('已加载部门列表，共', departments.value.length, '个部门')
    } else {
      console.warn('部门列表 API 返回数据为空:', res)
    }
  } catch (err) {
    console.error('加载部门列表失败', err)
  }
}

// 获取上级部门名称
const getParentDepartmentName = (parentId: number | null | undefined) => {
  if (!parentId || parentId === 0) return '无'
  const dept = departments.value.find((d) => d.id === parentId)
  if (!dept) {
    console.warn(`未找到ID为 ${parentId} 的上级部门，当前已加载部门数：`, departments.value.length)
  }
  return dept?.name || `ID: ${parentId}`
}

// 获取数据
const fetchData = async () => {
  isLoading.value = true
  tableData.value = []
  try {
    if (queryParams.id) {
      const id = Number(queryParams.id)
      if (isNaN(id)) {
        // 如果输入的不是数字，直接算查不到
        tableData.value = []
        total.value = 0
        isLoading.value = false
        return
      }
      const res = await getDepartmentById(id)
      if (res.data) {
        tableData.value = [res.data]
        total.value = 1
      } else {
        tableData.value = []
        total.value = 0
      }
    } else {
      // 构造符合 DepartmentQueryParams 类型的参数（排除 id）
      const { id: _id, ...apiParams } = queryParams
      const res = await getDepartmentList(apiParams)

      if (res && res.data) {
        tableData.value = res.data.records
        total.value = res.data.total
      }
    }
  } catch (error) {
    console.error('获取部门数据失败', error)
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
  queryParams.code = ''
  queryParams.name = ''
  queryParams.status = undefined
  handleSearch()
}

// 操作：添加
const handleCreate = () => {
  editDialogRef.value?.openDialog()
}

// 操作：编辑
const handleEdit = (row: DepartmentVO) => {
  editDialogRef.value?.openDialog(row)
}

// 删除部门
const handleDelete = async (row: DepartmentVO) => {
  if (
    !(await confirm({
      title: '确认删除该部门吗？',
      description: `您正在尝试删除部门：${row.name} (${row.code})。注意：删除后可能影响相关的子部门和关联数据。`,
      destructive: true,
    }))
  )
    return

  try {
    await deleteDepartment(row.id)
    console.log('删除成功')
    success('删除成功')
    handleRefresh()
  } catch (err: unknown) {
    console.error('删除失败', err)
    error(extractErrorMessage(err, '删除失败，该部门下可能还有子部门或关联数据'))
  }
}

// 刷新数据（包括部门列表和表格数据）
const handleRefresh = async () => {
  await loadDepartments()
  fetchData()
}

//启用部门逻辑
const handleEnable = async (row: DepartmentVO) => {
  try {
    await enableDepartment(row.id)
    console.log('部门启用成功')
    success('部门启用成功')
    handleRefresh()
  } catch (err: unknown) {
    console.error('启用失败', err)
    error(extractErrorMessage(err, '启用失败'))
  }
}
//弃用部门逻辑
const handleDisable = async (row: DepartmentVO) => {
  if (
    !(await confirm({
      title: '禁用部门',
      description: '确定要禁用该部门吗？',
      destructive: true,
    }))
  )
    return

  try {
    await disableDepartment(row.id)
    console.log('部门禁用成功')
    success('部门禁用成功')
    handleRefresh()
  } catch (err: unknown) {
    console.error('禁用失败', err)
    error(extractErrorMessage(err, '禁用失败'))
  }
}

// 初始化
onMounted(async () => {
  await loadDepartments()
  fetchData()
})
</script>

<template>
  <div class="space-y-6 p-6">
    <!-- 1. 顶部标题 -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Building2 class="h-6 w-6" /> 部门管理
        </h2>
        <p class="text-muted-foreground">管理学校的学院及部门架构</p>
      </div>

      <Button @click="handleCreate">
        <Plus class="mr-2 h-4 w-4" />
        添加部门
      </Button>
    </div>

    <!-- 2. 筛选区域 -->
    <div class="flex flex-wrap gap-4 items-end border p-4 rounded-lg bg-card">
      <div class="grid gap-2 w-[120px]">
        <label class="text-sm font-medium">部门 ID</label>
        <Input
          v-model="queryParams.id"
          placeholder="精确查找"
          type="number"
          @keyup.enter="handleSearch"
        />
      </div>
      <div class="grid gap-2 w-[180px]">
        <label class="text-sm font-medium">部门编码</label>
        <Input
          v-model="queryParams.code"
          placeholder="输入编码"
          :disabled="!!queryParams.id"
          @keyup.enter="handleSearch"
        />
      </div>

      <div class="grid gap-2 w-[180px]">
        <label class="text-sm font-medium">部门名称</label>
        <Input
          v-model="queryParams.name"
          placeholder="输入名称"
          :disabled="!!queryParams.id"
          @keyup.enter="handleSearch"
        />
      </div>

      <div class="grid gap-2 w-[150px]">
        <label class="text-sm font-medium">状态</label>
        <Select
          :model-value="queryParams.status"
          @update:model-value="(v) => (queryParams.status = v as string)"
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
            <TableHead class="w-[100px]">ID</TableHead>
            <TableHead>部门编码</TableHead>
            <TableHead>部门名称</TableHead>
            <TableHead>简称</TableHead>
            <TableHead>上级部门</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>创建时间</TableHead>
            <TableHead class="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <!-- Loading -->
          <TableRow v-if="isLoading">
            <TableCell colspan="8" class="h-24 text-center">
              <div class="flex items-center justify-center gap-2">
                <Loader2 class="h-4 w-4 animate-spin" /> 加载中...
              </div>
            </TableCell>
          </TableRow>

          <!--空表格 -->
          <TableRow v-else-if="tableData.length === 0">
            <TableCell colspan="8" class="h-24 text-center text-muted-foreground">
              暂无数据
            </TableCell>
          </TableRow>

          <!-- Data -->
          <TableRow v-for="item in tableData" v-else :key="item.id">
            <TableCell class="font-medium">{{ item.id }}</TableCell>
            <TableCell>{{ item.code }}</TableCell>
            <TableCell>{{ item.name }}</TableCell>
            <TableCell>{{ item.shortName || '-' }}</TableCell>
            <TableCell class="text-muted-foreground">
              {{ getParentDepartmentName(item.parentId) }}
            </TableCell>
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
                  title="启用部门"
                  class="text-green-600 hover:text-green-700 hover:bg-green-50"
                  @click="handleEnable(item)"
                >
                  <Play class="h-4 w-4" />启用
                </Button>
                <!--禁用按钮 (状态不为 DISABLED，即 ACTIVE 时显示) -->
                <Button
                  v-else
                  variant="ghost"
                  size="sm"
                  title="禁用部门"
                  class="text-orange-500 hover:text-orange-600 hover:bg-orange-50"
                  @click="handleDisable(item)"
                >
                  <PauseCircle class="h-4 w-4" />禁用
                </Button>
                <!-- 编辑按钮 -->
                <Button variant="ghost" size="sm" title="编辑" @click="handleEdit(item)">
                  <Pencil class="h-4 w-4 text-blue-600" />编辑
                </Button>

                <!--  删除按钮 -->
                <Button
                  variant="ghost"
                  size="sm"
                  title="删除部门"
                  class="text-red-600 hover:text-red-700 hover:bg-red-50"
                  @click="handleDelete(item)"
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

    <!-- 挂载弹窗，success 事件触发刷新 -->
    <DepartmentEditDialog ref="editDialogRef" @success="handleRefresh" />
  </div>
</template>
