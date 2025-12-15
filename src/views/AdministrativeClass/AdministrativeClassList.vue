<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Users, Plus, Search, RotateCcw, Pencil, Trash2, Play, PauseCircle } from 'lucide-vue-next'
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
import type { AdministrativeClassVO, MajorVO, AdministrativeClassStatus } from '@/types'
import {
  getAdministrativeClassList,
  deleteAdministrativeClass,
  enableAdministrativeClass,
  disableAdministrativeClass,
  getMajorList,
} from '@/lib/api'
import AdministrativeClassEditDialog from '@/components/AdministrativeClass/AdministrativeClassEditDialog.vue'

// 状态映射
const statusMap: Record<string, { label: string; variant: 'default' | 'destructive' }> = {
  ACTIVE: { label: '正常', variant: 'default' },
  DISABLED: { label: '禁用', variant: 'destructive' },
}

// 数据状态
const isLoading = ref(false)
const tableData = ref<AdministrativeClassVO[]>([])
const total = ref(0)
const majors = ref<MajorVO[]>([])

// 查询参数
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  majorId: undefined as number | undefined,
  code: '',
  name: '',
  entryYear: undefined as number | undefined,
  status: undefined as AdministrativeClassStatus | undefined,
})

// 弹窗状态
const editDialogRef = ref<InstanceType<typeof AdministrativeClassEditDialog> | null>(null)
const deleteDialogOpen = ref(false)
const itemToDelete = ref<AdministrativeClassVO | null>(null)
const isDeleting = ref(false)

// 加载专业列表
const loadMajors = async () => {
  try {
    const res = await getMajorList({ pageNum: 1, pageSize: 200, status: 'ACTIVE' })
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
      entryYear: queryParams.entryYear || undefined,
      status: queryParams.status || undefined,
    }
    const res = await getAdministrativeClassList(params)
    if (res?.data) {
      tableData.value = res.data.records
      total.value = res.data.total
    }
  } catch (err: unknown) {
    console.error('获取行政班列表失败', err)
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
  queryParams.majorId = undefined
  queryParams.code = ''
  queryParams.name = ''
  queryParams.entryYear = undefined
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
const handleEdit = (row: AdministrativeClassVO) => {
  editDialogRef.value?.openDialog(row)
}

// 删除
const handleDeleteClick = (row: AdministrativeClassVO) => {
  itemToDelete.value = row
  deleteDialogOpen.value = true
}

const handleConfirmDelete = async () => {
  if (!itemToDelete.value) return
  isDeleting.value = true
  try {
    await deleteAdministrativeClass(itemToDelete.value.id)
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

// 启用
const handleEnable = async (row: AdministrativeClassVO) => {
  try {
    await enableAdministrativeClass(row.id)
    toast.success('启用成功')
    fetchData()
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '启用失败'
    toast.error(message)
  }
}

// 禁用
const handleDisable = async (row: AdministrativeClassVO) => {
  try {
    await disableAdministrativeClass(row.id)
    toast.success('禁用成功')
    fetchData()
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '禁用失败'
    toast.error(message)
  }
}

// 编辑成功回调
const handleEditSuccess = () => {
  fetchData()
}

onMounted(() => {
  loadMajors()
  fetchData()
})
</script>

<template>
  <div class="space-y-4">
    <!-- 标题栏 -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Users class="h-6 w-6" />
          行政班管理
        </h2>
        <p class="text-muted-foreground">管理学校行政班信息</p>
      </div>
      <Button @click="handleCreate">
        <Plus class="mr-2 h-4 w-4" />
        添加行政班
      </Button>
    </div>

    <!-- 搜索区域 -->
    <div class="flex flex-wrap gap-4 items-end">
      <div class="flex-1 min-w-[200px] max-w-[250px]">
        <Input v-model="queryParams.code" placeholder="班级编码" @keyup.enter="handleSearch" />
      </div>
      <div class="flex-1 min-w-[200px] max-w-[250px]">
        <Input v-model="queryParams.name" placeholder="班级名称" @keyup.enter="handleSearch" />
      </div>
      <div class="flex-1 min-w-[200px] max-w-[250px]">
        <Select v-model="queryParams.majorId">
          <SelectTrigger>
            <SelectValue placeholder="选择专业" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="major in majors" :key="major.id" :value="major.id">
              {{ major.name }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div class="flex-1 min-w-[150px] max-w-[180px]">
        <Input
          v-model.number="queryParams.entryYear"
          type="number"
          placeholder="入学年份"
          @keyup.enter="handleSearch"
        />
      </div>
      <div class="flex-1 min-w-[150px] max-w-[180px]">
        <Select v-model="queryParams.status">
          <SelectTrigger>
            <SelectValue placeholder="状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ACTIVE">正常</SelectItem>
            <SelectItem value="DISABLED">禁用</SelectItem>
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
            <TableHead>班级编码</TableHead>
            <TableHead>班级名称</TableHead>
            <TableHead>所属专业</TableHead>
            <TableHead>入学年份</TableHead>
            <TableHead>班主任</TableHead>
            <TableHead>学生人数</TableHead>
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
            <TableCell class="font-medium">{{ row.code }}</TableCell>
            <TableCell>{{ row.name }}</TableCell>
            <TableCell>{{ row.majorName || '-' }}</TableCell>
            <TableCell>{{ row.entryYear || '-' }}</TableCell>
            <TableCell>{{ row.counselorName || '-' }}</TableCell>
            <TableCell>{{ row.studentCount || 0 }}</TableCell>
            <TableCell>
              <Badge :variant="statusMap[row.status]?.variant || 'default'">
                {{ statusMap[row.status]?.label || row.status }}
              </Badge>
            </TableCell>
            <TableCell>{{ formatDate(row.createTime) }}</TableCell>
            <TableCell class="text-right">
              <div class="flex justify-end gap-2">
                <Button variant="ghost" size="icon" @click="handleEdit(row)">
                  <Pencil class="h-4 w-4" />
                </Button>
                <Button
                  v-if="row.status === 'DISABLED'"
                  variant="ghost"
                  size="icon"
                  @click="handleEnable(row)"
                >
                  <Play class="h-4 w-4 text-green-600" />
                </Button>
                <Button
                  v-if="row.status === 'ACTIVE'"
                  variant="ghost"
                  size="icon"
                  @click="handleDisable(row)"
                >
                  <PauseCircle class="h-4 w-4 text-orange-600" />
                </Button>
                <Button variant="ghost" size="icon" @click="handleDeleteClick(row)">
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
    <AdministrativeClassEditDialog ref="editDialogRef" @success="handleEditSuccess" />

    <!-- 删除确认对话框 -->
    <AlertDialog :open="deleteDialogOpen" @update:open="(v) => (deleteDialogOpen = v)">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle class="flex items-center gap-2 text-red-600">
            确认删除行政班？
          </AlertDialogTitle>
          <AlertDialogDescription>
            您正在尝试删除行政班：
            <span class="font-bold text-black">{{ itemToDelete?.name }}</span>
            <br />
            <span class="text-red-500 text-xs mt-2 block">
              注意：删除后该班级的学生将不再关联此行政班
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
