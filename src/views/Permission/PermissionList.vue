<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { getPermissionList } from '@/lib/api'
import type { PermissionVO, PermissionQueryParams } from '@/types'
import { formatDate } from '@/lib/date'
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
  Search,
  RotateCcw,
  Shield,
  ChevronLeft,
  ChevronRight,
  Folder,
  Menu,
} from 'lucide-vue-next'

const { success: showSuccess, error: showError, info: showInfo } = useNotification()

// --- 状态管理 ---
const isLoading = ref(false)
const tableData = ref<PermissionVO[]>([])
const total = ref(0)

// 查询参数
const queryParams = reactive<PermissionQueryParams>({
  pageNum: 1,
  pageSize: 10,
  name: '',
  key: '',
  type: undefined,
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

// 权限类型映射
const typeMap: Record<string, { label: string; icon: typeof Folder }> = {
  DIRECTORY: { label: '目录', icon: Folder },
  MENU: { label: '菜单', icon: Menu },
}

// --- 方法 ---

// 获取数据
const fetchData = async () => {
  isLoading.value = true
  tableData.value = []
  try {
    const res = await getPermissionList(queryParams)

    if (res && res.data) {
      tableData.value = res.data.records
      total.value = res.data.total
    }
  } catch (error) {
    console.error('获取权限数据失败', error)
    showError('获取权限数据失败，请重试')
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
  queryParams.type = undefined
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
          <Shield class="h-6 w-6" /> 权限管理
        </h2>
        <p class="text-muted-foreground">查看系统中所有的权限配置</p>
      </div>
    </div>

    <!-- 2. 筛选区域 -->
    <div class="flex flex-wrap gap-4 items-end border p-4 rounded-lg bg-card">
      <div class="grid gap-2 w-[180px]">
        <label class="text-sm font-medium">权限名称</label>
        <Input v-model="queryParams.name" placeholder="输入名称" @keyup.enter="handleSearch" />
      </div>

      <div class="grid gap-2 w-[180px]">
        <label class="text-sm font-medium">权限标识</label>
        <Input v-model="queryParams.key" placeholder="输入标识" @keyup.enter="handleSearch" />
      </div>

      <div class="grid gap-2 w-[150px]">
        <label class="text-sm font-medium">类型</label>
        <Select
          :model-value="queryParams.type"
          @update:model-value="(v) => (queryParams.type = v as 'DIRECTORY' | 'MENU' | undefined)"
        >
          <SelectTrigger>
            <SelectValue placeholder="全部" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="DIRECTORY">目录</SelectItem>
            <SelectItem value="MENU">菜单</SelectItem>
          </SelectContent>
        </Select>
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
            <TableHead>权限名称</TableHead>
            <TableHead>权限标识</TableHead>
            <TableHead>类型</TableHead>
            <TableHead>父权限 ID</TableHead>
            <TableHead>菜单路径</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>创建时间</TableHead>
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

          <!-- 空表格 -->
          <TableRow v-else-if="tableData.length === 0">
            <TableCell colspan="8" class="h-24 text-center text-muted-foreground">
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
            <TableCell>
              <div class="flex items-center gap-1">
                <component
                  :is="typeMap[item.type]?.icon || Folder"
                  class="h-4 w-4 text-muted-foreground"
                />
                {{ typeMap[item.type]?.label || item.type }}
              </div>
            </TableCell>
            <TableCell class="text-muted-foreground">
              {{ item.parentId === 0 ? '顶级' : item.parentId }}
            </TableCell>
            <TableCell>
              <span v-if="item.menuUrl" class="text-sm text-blue-600">{{ item.menuUrl }}</span>
              <span v-else class="text-muted-foreground">-</span>
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
  </div>
</template>
