<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { getRoleList, deleteRole, activateRole, deactivateRole } from '@/lib/api'
import type { RoleVO, RoleQueryParams } from '@/types'
import { formatDate } from '@/lib/date'
import { useNotification } from '@/composables/useNotification'
import RoleEditDialog from '@/components/Role/RoleEditDialog.vue'
import RolePermissionDialog from '@/components/Role/RolePermissionDialog.vue'

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
  UserCog,
  ChevronLeft,
  ChevronRight,
  Trash2,
  AlertTriangle,
  Play,
  PauseCircle,
  Shield,
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

// 使用通知
const { success: showSuccess, error: showError } = useNotification()

// --- 状态管理 ---
const isLoading = ref(false)
const tableData = ref<RoleVO[]>([])
const total = ref(0)
const editDialogRef = ref<InstanceType<typeof RoleEditDialog> | null>(null)
const permissionDialogRef = ref<InstanceType<typeof RolePermissionDialog> | null>(null)

// 删除相关的状态
const deleteDialogOpen = ref(false)
const roleToDelete = ref<RoleVO | null>(null)
const isDeleting = ref(false)

// 查询参数
const queryParams = reactive<RoleQueryParams>({
  pageNum: 1,
  pageSize: 10,
  name: '',
  key: '',
  status: undefined,
})

// 状态映射字典
const statusMap: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' }
> = {
  ACTIVE: { label: '正常', variant: 'default' },
  DISABLED: { label: '禁用', variant: 'destructive' },
}

// --- 方法 ---

// 获取数据
const fetchData = async () => {
  isLoading.value = true
  tableData.value = []
  try {
    const res = await getRoleList(queryParams)

    if (res && res.data) {
      tableData.value = res.data.records
      total.value = res.data.total
    }
  } catch (error) {
    console.error('获取角色数据失败', error)
    showError('获取角色数据失败，请重试')
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
  queryParams.name = ''
  queryParams.key = ''
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
const handleEdit = (row: RoleVO) => {
  editDialogRef.value?.openDialog(row)
}

// 操作：分配权限
const handleAssignPermissions = (row: RoleVO) => {
  permissionDialogRef.value?.openDialog(row)
}

// 点击删除按钮
const handleDeleteClick = (row: RoleVO) => {
  roleToDelete.value = row
  deleteDialogOpen.value = true
}

// 确认删除
const handleConfirmDelete = async () => {
  if (!roleToDelete.value) return

  isDeleting.value = true
  try {
    await deleteRole(roleToDelete.value.id)
    deleteDialogOpen.value = false
    showSuccess('删除成功')
    fetchData()
  } catch (err) {
    console.error('删除失败', err)
    showError(err instanceof Error ? err.message : '删除失败，请重试')
  } finally {
    isDeleting.value = false
  }
}

// 启用角色
const handleActivate = async (row: RoleVO) => {
  try {
    await activateRole(row.id)
    showSuccess('角色启用成功')
    fetchData()
  } catch (err) {
    console.error('启用失败', err)
    showError(err instanceof Error ? err.message : '启用失败')
  }
}

// 禁用角色
const handleDeactivate = async (row: RoleVO) => {
  try {
    await deactivateRole(row.id)
    showSuccess('角色禁用成功')
    fetchData()
  } catch (err) {
    console.error('禁用失败', err)
    showError(err instanceof Error ? err.message : '禁用失败')
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
          <UserCog class="h-6 w-6" /> 角色管理
        </h2>
        <p class="text-muted-foreground">管理系统中的用户角色及权限分配</p>
      </div>

      <Button @click="handleCreate">
        <Plus class="mr-2 h-4 w-4" />
        添加角色
      </Button>
    </div>

    <!-- 2. 筛选区域 -->
    <div class="flex flex-wrap gap-4 items-end border p-4 rounded-lg bg-card">
      <div class="grid gap-2 w-[180px]">
        <label class="text-sm font-medium">角色名称</label>
        <Input v-model="queryParams.name" placeholder="输入名称" @keyup.enter="handleSearch" />
      </div>

      <div class="grid gap-2 w-[180px]">
        <label class="text-sm font-medium">角色标识</label>
        <Input v-model="queryParams.key" placeholder="输入标识" @keyup.enter="handleSearch" />
      </div>

      <div class="grid gap-2 w-[150px]">
        <label class="text-sm font-medium">状态</label>
        <Select
          :model-value="queryParams.status"
          @update:model-value="(v) => (queryParams.status = v as 'ACTIVE' | 'DISABLED' | undefined)"
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
            <TableHead>角色名称</TableHead>
            <TableHead>角色标识</TableHead>
            <TableHead>描述</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>创建时间</TableHead>
            <TableHead class="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <!-- Loading -->
          <TableRow v-if="isLoading">
            <TableCell colspan="7" class="h-24 text-center">
              <div class="flex items-center justify-center gap-2">
                <Loader2 class="h-4 w-4 animate-spin" /> 加载中...
              </div>
            </TableCell>
          </TableRow>

          <!-- 空表格 -->
          <TableRow v-else-if="tableData.length === 0">
            <TableCell colspan="7" class="h-24 text-center text-muted-foreground">
              暂无数据
            </TableCell>
          </TableRow>

          <!-- Data -->
          <TableRow v-for="item in tableData" v-else :key="item.id">
            <TableCell class="font-medium">{{ item.id }}</TableCell>
            <TableCell>{{ item.name }}</TableCell>
            <TableCell>
              <code class="bg-gray-100 px-2 py-1 rounded text-sm">{{ item.key }}</code>
            </TableCell>
            <TableCell class="max-w-[200px] truncate" :title="item.description">
              {{ item.description || '-' }}
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
                <!-- 分配权限按钮 -->
                <Button
                  variant="ghost"
                  size="sm"
                  title="分配权限"
                  class="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                  @click="handleAssignPermissions(item)"
                >
                  <Shield class="h-4 w-4" />权限
                </Button>

                <!-- 启用按钮 (只在 DISABLED 状态显示) -->
                <Button
                  v-if="item.status === 'DISABLED'"
                  variant="ghost"
                  size="sm"
                  title="启用角色"
                  class="text-green-600 hover:text-green-700 hover:bg-green-50"
                  @click="handleActivate(item)"
                >
                  <Play class="h-4 w-4" />启用
                </Button>

                <!-- 禁用按钮 (状态为 ACTIVE 时显示) -->
                <Button
                  v-else
                  variant="ghost"
                  size="sm"
                  title="禁用角色"
                  class="text-orange-500 hover:text-orange-600 hover:bg-orange-50"
                  @click="handleDeactivate(item)"
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
                  title="删除角色"
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
            确认删除该角色吗？
          </AlertDialogTitle>
          <AlertDialogDescription>
            您正在尝试删除角色：<span class="font-bold text-black">{{ roleToDelete?.name }}</span>
            ({{ roleToDelete?.key }})。
            <br />
            <span class="text-red-500 text-xs mt-2 block">
              注意：删除角色可能会影响拥有该角色的用户权限。
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

    <!-- 编辑弹窗 -->
    <RoleEditDialog ref="editDialogRef" @success="fetchData" />

    <!-- 权限分配弹窗 -->
    <RolePermissionDialog ref="permissionDialogRef" @success="fetchData" />
  </div>
</template>
