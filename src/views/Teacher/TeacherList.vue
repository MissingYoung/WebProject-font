<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { getTeacherList, getDepartmentList } from '@/lib/api'
import type { TeacherVO, TeacherQueryParams, DepartmentVO } from '@/types'
import TeacherEditDialog from '@/components/Teacher/TeacherEditDialog.vue'
import UserPersonalEditDialog from '@/components/User/UserPersonalEditDialog.vue'

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
import { Loader2, Search, RotateCcw, Pencil, Users, Eye, User } from 'lucide-vue-next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import PaginationBar from '@/components/PaginationBar.vue'

// --- 状态管理 ---
const isLoading = ref(false)
const tableData = ref<TeacherVO[]>([])
const total = ref(0)
const editDialogRef = ref<InstanceType<typeof TeacherEditDialog> | null>(null)
const personalEditDialogRef = ref<InstanceType<typeof UserPersonalEditDialog> | null>(null)

// 详情弹窗状态
const detailDialogOpen = ref(false)
const selectedTeacher = ref<TeacherVO | null>(null)

// 下拉选项数据
const departments = ref<DepartmentVO[]>([])

// 查询参数
const queryParams = reactive<TeacherQueryParams>({
  pageNum: 1,
  pageSize: 10,
  sduId: '',
  realName: '',
  username: '',
  status: undefined,
  departmentId: undefined,
  title: '',
})

// 状态映射字典
const statusMap: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' }
> = {
  ACTIVE: { label: '正常', variant: 'default' },
  DISABLED: { label: '禁用', variant: 'destructive' },
}

// 性别映射
const genderMap: Record<string, string> = {
  MALE: '男',
  FEMALE: '女',
  UNKNOWN: '未知',
}

// --- 方法 ---

// 加载部门列表
const loadDepartments = async () => {
  try {
    const res = await getDepartmentList({ pageNum: 1, pageSize: 100, status: 'ACTIVE' })
    if (res && res.data) {
      departments.value = res.data.records
    }
  } catch (err) {
    console.error('加载部门列表失败', err)
  }
}

// 获取数据
const fetchData = async () => {
  isLoading.value = true
  tableData.value = []
  try {
    // 过滤空值
    const cleanParams: Partial<TeacherQueryParams> = {
      pageNum: queryParams.pageNum,
      pageSize: queryParams.pageSize,
    }
    if (queryParams.sduId) cleanParams.sduId = queryParams.sduId
    if (queryParams.realName) cleanParams.realName = queryParams.realName
    if (queryParams.username) cleanParams.username = queryParams.username
    if (queryParams.status) cleanParams.status = queryParams.status
    if (queryParams.departmentId) cleanParams.departmentId = queryParams.departmentId
    if (queryParams.title) cleanParams.title = queryParams.title

    const res = await getTeacherList(cleanParams as TeacherQueryParams)
    if (res && res.data) {
      tableData.value = res.data.records
      total.value = res.data.total
    }
  } catch (error) {
    console.error('获取教师数据失败', error)
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
  queryParams.sduId = ''
  queryParams.realName = ''
  queryParams.username = ''
  queryParams.status = undefined
  queryParams.departmentId = undefined
  queryParams.title = ''
  handleSearch()
}

// 操作：编辑
const handleEdit = (row: TeacherVO) => {
  editDialogRef.value?.openDialog(row)
}

// 操作：编辑个人信息
const handleEditPersonal = (row: TeacherVO) => {
  personalEditDialogRef.value?.openDialog(row.userId)
}

// 查看详情
const handleViewDetail = (row: TeacherVO) => {
  selectedTeacher.value = row
  detailDialogOpen.value = true
}

// 获取部门名称
const getDepartmentName = (departmentId?: number) => {
  if (!departmentId) return '-'
  const dept = departments.value.find((d) => d.id === departmentId)
  return dept?.name || `ID: ${departmentId}`
}

// 初始化
onMounted(() => {
  loadDepartments()
  fetchData()
})
</script>

<template>
  <div class="space-y-6 p-6">
    <!-- 1. 顶部标题 -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Users class="h-6 w-6" /> 教师管理
        </h2>
        <p class="text-muted-foreground">管理学校的教师信息</p>
      </div>
    </div>

    <!-- 2. 筛选区域 -->
    <div class="flex flex-wrap gap-4 items-end border p-4 rounded-lg bg-card">
      <div class="grid gap-2 w-[150px]">
        <label class="text-sm font-medium">工号</label>
        <Input v-model="queryParams.sduId" placeholder="输入工号" @keyup.enter="handleSearch" />
      </div>

      <div class="grid gap-2 w-[150px]">
        <label class="text-sm font-medium">姓名</label>
        <Input v-model="queryParams.realName" placeholder="输入姓名" @keyup.enter="handleSearch" />
      </div>

      <div class="grid gap-2 w-[180px]">
        <label class="text-sm font-medium">所属部门</label>
        <Select
          :model-value="queryParams.departmentId ? String(queryParams.departmentId) : undefined"
          @update:model-value="(v) => (queryParams.departmentId = v ? Number(v) : undefined)"
        >
          <SelectTrigger>
            <SelectValue placeholder="全部" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="dept in departments" :key="dept.id" :value="String(dept.id)">
              {{ dept.name }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="grid gap-2 w-[150px]">
        <label class="text-sm font-medium">职称</label>
        <Input v-model="queryParams.title" placeholder="输入职称" @keyup.enter="handleSearch" />
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
            <TableHead class="w-[80px]">用户ID</TableHead>
            <TableHead>工号</TableHead>
            <TableHead>姓名</TableHead>
            <TableHead>性别</TableHead>
            <TableHead>所属部门</TableHead>
            <TableHead>职称</TableHead>
            <TableHead>状态</TableHead>
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

          <!-- 空表格 -->
          <TableRow v-else-if="tableData.length === 0">
            <TableCell colspan="8" class="h-24 text-center text-muted-foreground">
              暂无数据
            </TableCell>
          </TableRow>

          <!-- Data -->
          <TableRow v-for="item in tableData" v-else :key="item.userId">
            <TableCell class="font-medium">{{ item.userId }}</TableCell>
            <TableCell>{{ item.sduId || '-' }}</TableCell>
            <TableCell>{{ item.realName || '-' }}</TableCell>
            <TableCell>{{ genderMap[item.gender || ''] || '-' }}</TableCell>
            <TableCell>{{ getDepartmentName(item.departmentId) }}</TableCell>
            <TableCell>{{ item.title || '-' }}</TableCell>
            <TableCell>
              <Badge
                v-if="item.userStatus && statusMap[item.userStatus]"
                :variant="statusMap[item.userStatus]?.variant"
              >
                {{ statusMap[item.userStatus]?.label }}
              </Badge>
              <span v-else>{{ item.userStatus || '-' }}</span>
            </TableCell>

            <TableCell class="text-right">
              <div class="flex justify-end gap-2 items-center">
                <!-- 查看详情 -->
                <Button variant="ghost" size="sm" title="查看详情" @click="handleViewDetail(item)">
                  <Eye class="h-4 w-4 text-gray-600" />详情
                </Button>
                <!-- 编辑按钮 -->
                <Button variant="ghost" size="sm" title="编辑工作信息" @click="handleEdit(item)">
                  <Pencil class="h-4 w-4 text-blue-600" />编辑
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  title="编辑个人信息"
                  @click="handleEditPersonal(item)"
                >
                  <User class="h-4 w-4 text-green-600" />个人
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

    <!-- 教师详情弹窗 -->
    <Dialog :open="detailDialogOpen" @update:open="(v) => (detailDialogOpen = v)">
      <DialogContent class="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>教师详情</DialogTitle>
          <DialogDescription> 查看教师的详细信息 </DialogDescription>
        </DialogHeader>

        <div v-if="selectedTeacher" class="grid gap-4 py-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <p class="text-sm text-muted-foreground">工号</p>
              <p class="font-medium">{{ selectedTeacher.sduId || '-' }}</p>
            </div>
            <div class="space-y-1">
              <p class="text-sm text-muted-foreground">姓名</p>
              <p class="font-medium">{{ selectedTeacher.realName || '-' }}</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <p class="text-sm text-muted-foreground">用户名</p>
              <p class="font-medium">{{ selectedTeacher.username || '-' }}</p>
            </div>
            <div class="space-y-1">
              <p class="text-sm text-muted-foreground">性别</p>
              <p class="font-medium">{{ genderMap[selectedTeacher.gender || ''] || '-' }}</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <p class="text-sm text-muted-foreground">邮箱</p>
              <p class="font-medium">{{ selectedTeacher.email || '-' }}</p>
            </div>
            <div class="space-y-1">
              <p class="text-sm text-muted-foreground">手机号</p>
              <p class="font-medium">{{ selectedTeacher.phone || '-' }}</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <p class="text-sm text-muted-foreground">所属部门</p>
              <p class="font-medium">{{ getDepartmentName(selectedTeacher.departmentId) }}</p>
            </div>
            <div class="space-y-1">
              <p class="text-sm text-muted-foreground">职称</p>
              <p class="font-medium">{{ selectedTeacher.title || '-' }}</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <p class="text-sm text-muted-foreground">民族</p>
              <p class="font-medium">{{ selectedTeacher.ethnic || '-' }}</p>
            </div>
            <div class="space-y-1">
              <p class="text-sm text-muted-foreground">政治面貌</p>
              <p class="font-medium">{{ selectedTeacher.politicalStatus || '-' }}</p>
            </div>
          </div>

          <div class="space-y-1">
            <p class="text-sm text-muted-foreground">个人简介</p>
            <p class="font-medium">{{ selectedTeacher.description || '-' }}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <!-- 编辑对话框 -->
    <TeacherEditDialog ref="editDialogRef" @success="fetchData" />
    <UserPersonalEditDialog ref="personalEditDialogRef" @success="fetchData" />
  </div>
</template>
