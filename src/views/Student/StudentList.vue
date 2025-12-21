<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { getStudentList, getDepartmentList, getMajorList } from '@/lib/api'
import type { StudentVO, StudentQueryParams, DepartmentVO, MajorVO } from '@/types'
import StudentEditDialog from '@/components/Student/StudentEditDialog.vue'
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
import { Loader2, Search, RotateCcw, Pencil, GraduationCap, Eye, User } from 'lucide-vue-next'
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
const tableData = ref<StudentVO[]>([])
const total = ref(0)
const editDialogRef = ref<InstanceType<typeof StudentEditDialog> | null>(null)
const personalEditDialogRef = ref<InstanceType<typeof UserPersonalEditDialog> | null>(null)

// 详情弹窗状态
const detailDialogOpen = ref(false)
const selectedStudent = ref<StudentVO | null>(null)

// 下拉选项数据
const departments = ref<DepartmentVO[]>([])
const majors = ref<MajorVO[]>([])

// 查询参数
const queryParams = reactive<StudentQueryParams & { id: string }>({
  pageNum: 1,
  pageSize: 10,
  sduId: '',
  realName: '',
  username: '',
  status: undefined,
  departmentId: undefined,
  majorId: undefined,
  entryYear: undefined,
  gradeLevel: undefined,
  id: '',
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

// 加载专业列表
const loadMajors = async () => {
  try {
    const res = await getMajorList({ pageNum: 1, pageSize: 200, status: 'ACTIVE' })
    majors.value = res?.data?.records || []
  } catch (err) {
    console.error('加载专业列表失败', err)
    majors.value = []
  }
}

// 获取数据
const fetchData = async () => {
  isLoading.value = true
  tableData.value = []
  try {
    const { id: _id, ...apiParams } = queryParams
    // 过滤空值
    const cleanParams: Partial<StudentQueryParams> = {
      pageNum: apiParams.pageNum,
      pageSize: apiParams.pageSize,
    }
    if (apiParams.sduId) cleanParams.sduId = apiParams.sduId
    if (apiParams.realName) cleanParams.realName = apiParams.realName
    if (apiParams.username) cleanParams.username = apiParams.username
    if (apiParams.status) cleanParams.status = apiParams.status
    if (apiParams.departmentId) cleanParams.departmentId = apiParams.departmentId
    if (apiParams.majorId) cleanParams.majorId = apiParams.majorId
    if (apiParams.entryYear) cleanParams.entryYear = apiParams.entryYear
    if (apiParams.gradeLevel) cleanParams.gradeLevel = apiParams.gradeLevel

    const res = await getStudentList(cleanParams as StudentQueryParams)
    if (res && res.data) {
      tableData.value = res.data.records
      total.value = res.data.total
    }
  } catch (error) {
    console.error('获取学生数据失败', error)
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
  queryParams.sduId = ''
  queryParams.realName = ''
  queryParams.username = ''
  queryParams.status = undefined
  queryParams.departmentId = undefined
  queryParams.majorId = undefined
  queryParams.entryYear = undefined
  queryParams.gradeLevel = undefined
  handleSearch()
}

// 操作：编辑
const handleEdit = (row: StudentVO) => {
  editDialogRef.value?.openDialog(row)
}

// 操作：编辑个人信息
const handleEditPersonal = (row: StudentVO) => {
  personalEditDialogRef.value?.openDialog(row.userId)
}

// 查看详情
const handleViewDetail = (row: StudentVO) => {
  selectedStudent.value = row
  detailDialogOpen.value = true
}

// 获取部门名称
const getDepartmentName = (departmentId?: number) => {
  if (!departmentId) return '-'
  const dept = departments.value.find((d) => d.id === departmentId)
  return dept?.name || `ID: ${departmentId}`
}

const getMajorName = (majorId?: number) => {
  if (!majorId) return '-'
  const major = majors.value.find((m) => m.id === majorId)
  return major?.name || `ID: ${majorId}`
}

// 初始化
onMounted(() => {
  loadDepartments()
  loadMajors()
  fetchData()
})
</script>

<template>
  <div class="space-y-6 p-6">
    <!-- 1. 顶部标题 -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold tracking-tight flex items-center gap-2">
          <GraduationCap class="h-6 w-6" /> 学生管理
        </h2>
        <p class="text-muted-foreground">管理学校的学生信息</p>
      </div>
    </div>

    <!-- 2. 筛选区域 -->
    <div class="flex flex-wrap gap-4 items-end border p-4 rounded-lg bg-card">
      <div class="grid gap-2 w-[150px]">
        <label class="text-sm font-medium">学号</label>
        <Input v-model="queryParams.sduId" placeholder="输入学号" @keyup.enter="handleSearch" />
      </div>

      <div class="grid gap-2 w-[150px]">
        <label class="text-sm font-medium">姓名</label>
        <Input v-model="queryParams.realName" placeholder="输入姓名" @keyup.enter="handleSearch" />
      </div>

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
            <SelectItem v-for="dept in departments" :key="dept.id" :value="String(dept.id)">
              {{ dept.name }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="grid gap-2 w-[120px]">
        <label class="text-sm font-medium">入学年份</label>
        <Input
          v-model.number="queryParams.entryYear"
          type="number"
          placeholder="年份"
          @keyup.enter="handleSearch"
        />
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
    <div class="border rounded-md bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead class="w-[80px]">用户ID</TableHead>
            <TableHead>学号</TableHead>
            <TableHead>姓名</TableHead>
            <TableHead>性别</TableHead>
            <TableHead>所属学院</TableHead>
            <TableHead>入学年份</TableHead>
            <TableHead>年级</TableHead>
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
          <TableRow v-for="item in tableData" v-else :key="item.userId">
            <TableCell class="font-medium">{{ item.userId }}</TableCell>
            <TableCell>{{ item.sduId || '-' }}</TableCell>
            <TableCell>{{ item.realName || '-' }}</TableCell>
            <TableCell>{{ genderMap[item.gender || ''] || '-' }}</TableCell>
            <TableCell>{{ getDepartmentName(item.departmentId) }}</TableCell>
            <TableCell>{{ item.entryYear || '-' }}</TableCell>
            <TableCell>{{ item.gradeLevel || '-' }}</TableCell>
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
                  <Eye class="h-4 w-4 text-muted-foreground" />详情
                </Button>
                <!-- 编辑按钮 -->
                <Button variant="ghost" size="sm" title="编辑学业信息" @click="handleEdit(item)">
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

    <!-- 学生详情弹窗 -->
    <Dialog :open="detailDialogOpen" @update:open="(v) => (detailDialogOpen = v)">
      <DialogContent class="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>学生详情</DialogTitle>
          <DialogDescription> 查看学生的详细信息 </DialogDescription>
        </DialogHeader>

        <div v-if="selectedStudent" class="grid gap-4 py-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <p class="text-sm text-muted-foreground">学号</p>
              <p class="font-medium">{{ selectedStudent.sduId || '-' }}</p>
            </div>
            <div class="space-y-1">
              <p class="text-sm text-muted-foreground">姓名</p>
              <p class="font-medium">{{ selectedStudent.realName || '-' }}</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <p class="text-sm text-muted-foreground">用户名</p>
              <p class="font-medium">{{ selectedStudent.username || '-' }}</p>
            </div>
            <div class="space-y-1">
              <p class="text-sm text-muted-foreground">性别</p>
              <p class="font-medium">{{ genderMap[selectedStudent.gender || ''] || '-' }}</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <p class="text-sm text-muted-foreground">邮箱</p>
              <p class="font-medium">{{ selectedStudent.email || '-' }}</p>
            </div>
            <div class="space-y-1">
              <p class="text-sm text-muted-foreground">手机号</p>
              <p class="font-medium">{{ selectedStudent.phone || '-' }}</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <p class="text-sm text-muted-foreground">所属学院</p>
              <p class="font-medium">{{ getDepartmentName(selectedStudent.departmentId) }}</p>
            </div>
            <div class="space-y-1">
              <p class="text-sm text-muted-foreground">专业</p>
              <p class="font-medium">{{ getMajorName(selectedStudent.majorId) }}</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <p class="text-sm text-muted-foreground">入学年份</p>
              <p class="font-medium">{{ selectedStudent.entryYear || '-' }}</p>
            </div>
            <div class="space-y-1">
              <p class="text-sm text-muted-foreground">年级</p>
              <p class="font-medium">{{ selectedStudent.gradeLevel || '-' }}</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <p class="text-sm text-muted-foreground">民族</p>
              <p class="font-medium">{{ selectedStudent.ethnic || '-' }}</p>
            </div>
            <div class="space-y-1">
              <p class="text-sm text-muted-foreground">政治面貌</p>
              <p class="font-medium">{{ selectedStudent.politicalStatus || '-' }}</p>
            </div>
          </div>

          <div class="space-y-1">
            <p class="text-sm text-muted-foreground">个人简介</p>
            <p class="font-medium">{{ selectedStudent.description || '-' }}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <!-- 编辑对话框 -->
    <StudentEditDialog ref="editDialogRef" @success="fetchData" />
    <UserPersonalEditDialog ref="personalEditDialogRef" @success="fetchData" />
  </div>
</template>
