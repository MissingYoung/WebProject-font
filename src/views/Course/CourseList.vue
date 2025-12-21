<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import {
  getCourseList,
  deleteCourse,
  activateCourse,
  deactivateCourse,
  archiveCourse,
} from '@/lib/api'
import type { CourseVO, CourseQueryParams } from '@/types'
import CourseEditDialog from '@/components/Course/CourseEditDialog.vue'
import { useNotification } from '@/composables/useNotification'

// UI 组件
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
  Loader2,
  Search,
  RotateCcw,
  Plus,
  Pencil,
  Trash2,
  Play,
  PauseCircle,
  Archive,
  Eye,
} from 'lucide-vue-next'
import { formatDate } from '@/lib/date'
import CourseDetailDialog from '@/components/Course/CourseDetailDialog.vue'
import PaginationBar from '@/components/PaginationBar.vue'

const { success, error, confirm, extractErrorMessage } = useNotification()

// --- 状态管理 ---
const isLoading = ref(false)
const tableData = ref<CourseVO[]>([])
const total = ref(0)

//定义弹窗组件引用，用于调用子组件方法
const dialogRef = ref<InstanceType<typeof CourseEditDialog> | null>(null)
//定义抽屉组件
const detailDialogRef = ref<InstanceType<typeof CourseDetailDialog> | null>(null)

// 查询参数
const queryParams = reactive<CourseQueryParams>({
  pageNum: 1,
  pageSize: 10,
  code: '',
  name: '',
  defaultCourseType: undefined,
  status: undefined,
  // departmentId: undefined //按学院筛选
})

// --- 字典/枚举 映射 ---
const courseTypeMap: Record<string, string> = {
  REQUIRED: '必修',
  LIMITED_ELECTIVE: '限选',
  OPEN_ELECTIVE: '任选',
}

const statusMap: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  DRAFT: { label: '草稿', variant: 'secondary' },
  ACTIVE: { label: '已发布', variant: 'default' },
  INACTIVE: { label: '停用', variant: 'destructive' },
  ARCHIVED: { label: '归档', variant: 'outline' },
}

// --- 方法 ---

// 获取数据
const fetchData = async () => {
  isLoading.value = true
  try {
    const res = await getCourseList(queryParams)
    if (res && res.data) {
      tableData.value = res.data.records
      total.value = res.data.total
    }
  } catch (error) {
    console.error('获取课程列表失败', error)
  } finally {
    isLoading.value = false
  }
}

// 搜索
const handleSearch = () => {
  queryParams.pageNum = 1 // 搜索时重置到第一页
  fetchData()
}

// 重置
const handleReset = () => {
  queryParams.code = ''
  queryParams.name = ''
  queryParams.defaultCourseType = undefined
  queryParams.status = undefined
  handleSearch()
}

//点击创建按钮
const handleCreate = () => {
  dialogRef.value?.openDialog()
}

//点击编辑按钮
const handleEdit = (row: CourseVO) => {
  dialogRef.value?.openDialog(row)
}
//刷新列表，统一由弹窗的success事件触发
const handleRefresh = () => {
  fetchData()
}

// 删除课程
const handleDelete = async (row: CourseVO) => {
  if (
    !(await confirm({
      title: '确认删除该课程吗？',
      description: `您正在尝试删除课程：${row.name} (${row.code})。注意：删除后数据将无法恢复。`,
      destructive: true,
    }))
  )
    return

  try {
    await deleteCourse(row.id)
    console.log('删除成功')
    success('课程删除成功')
    fetchData()
  } catch (err: unknown) {
    console.error('删除失败', err)
    error(extractErrorMessage(err, '删除失败，请稍后重试'))
  }
}
//课程启用逻辑
const handleActivate = async (row: CourseVO) => {
  try {
    await activateCourse(row.id)
    console.log('课程启用成功')
    success(`课程"${row.name}"启用成功`)
    fetchData()
  } catch (err: unknown) {
    console.error('启用失败', err)
    error(extractErrorMessage(err, '启用失败'))
  }
}
//课程停用逻辑
const handleDeactivate = async (row: CourseVO) => {
  try {
    await deactivateCourse(row.id)
    console.log('课程停用成功')
    success(`课程"${row.name}"停用成功`)
    fetchData()
  } catch (err: unknown) {
    console.error('停用失败', err)
    error(extractErrorMessage(err, '停用失败'))
  }
}
//课程归档逻辑
const handleArchive = async (row: CourseVO) => {
  if (
    !(await confirm({
      title: '归档课程',
      description: `确认要将课程"${row.name}"归档吗？`,
      destructive: true,
    }))
  )
    return

  try {
    await archiveCourse(row.id)
    console.log('课程归档成功')
    success('课程归档成功')
    fetchData()
  } catch (err: unknown) {
    console.error('归档失败', err)
    error(extractErrorMessage(err, '归档失败'))
  }
}
//点击查看课程详情
const handleViewDetail = (row: CourseVO) => {
  // 1. 检查点击是否生效
  console.log('>>> 父组件点击了详情按钮，ID:', row.id)

  // 2. 检查 ref 是否连接成功
  console.log('>>> detailSheetRef 的值:', detailDialogRef.value)

  if (detailDialogRef.value) {
    detailDialogRef.value?.openDialog(row.id)
  } else {
    console.error('>>> 严重错误：无法找到子组件实例！请检查 ref 绑定。')
  }
}

// 初始化
onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="space-y-6 p-6">
    <!-- 1. 顶部标题与操作栏 -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">课程管理</h2>
        <p class="text-muted-foreground">管理系统内的所有课程信息</p>
      </div>
      <Button @click="handleCreate">
        <Plus class="mr-2 h-4 w-4" />
        添加课程
      </Button>
    </div>

    <!-- 2. 筛选区域 -->
    <div class="flex flex-wrap gap-4 items-end border p-4 rounded-lg bg-card">
      <div class="grid gap-2 w-[150px]">
        <label class="text-sm font-medium">课程编号</label>
        <Input v-model="queryParams.code" placeholder="输入编号" @keyup.enter="handleSearch" />
      </div>

      <div class="grid gap-2 w-[150px]">
        <label class="text-sm font-medium">课程名称</label>
        <Input v-model="queryParams.name" placeholder="输入名称" @keyup.enter="handleSearch" />
      </div>

      <div class="grid gap-2 w-[150px]">
        <label class="text-sm font-medium">课程类型</label>
        <Select
          :model-value="queryParams.defaultCourseType"
          @update:model-value="(v) => (queryParams.defaultCourseType = v as string)"
        >
          <SelectTrigger>
            <SelectValue placeholder="全部" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="REQUIRED">必修</SelectItem>
            <SelectItem value="LIMITED_ELECTIVE">限选</SelectItem>
            <SelectItem value="OPEN_ELECTIVE">任选</SelectItem>
          </SelectContent>
        </Select>
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
            <SelectItem value="DRAFT">草稿</SelectItem>
            <SelectItem value="ACTIVE">已发布</SelectItem>
            <SelectItem value="INACTIVE">停用</SelectItem>
            <SelectItem value="ARCHIVED">归档</SelectItem>
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

    <!-- 3. 数据表格区域 -->
    <div class="border rounded-md bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead class="w-[100px] font-bold">课程编号</TableHead>
            <TableHead class="font-bold">课程名称</TableHead>
            <TableHead class="font-bold">类型</TableHead>
            <TableHead class="font-bold">学分/学时</TableHead>
            <TableHead class="font-bold">学院</TableHead>
            <TableHead class="font-bold">状态</TableHead>
            <TableHead class="font-bold">更新时间</TableHead>
            <TableHead class="text-right font-bold">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <!-- Loading 状态 -->
          <TableRow v-if="isLoading">
            <TableCell colspan="7" class="h-24 text-center">
              <div class="flex items-center justify-center gap-2">
                <Loader2 class="h-4 w-4 animate-spin" /> 加载中...
              </div>
            </TableCell>
          </TableRow>

          <!-- 空数据状态 -->
          <TableRow v-else-if="tableData.length === 0">
            <TableCell colspan="7" class="h-24 text-center text-muted-foreground">
              暂无数据
            </TableCell>
          </TableRow>

          <!-- 正常数据 -->
          <TableRow v-for="item in tableData" v-else :key="item.id">
            <TableCell class="font-medium">{{ item.code }}</TableCell>
            <TableCell>{{ item.name }}</TableCell>
            <TableCell>
              {{ courseTypeMap[item.defaultCourseType] || item.defaultCourseType }}
            </TableCell>
            <TableCell> {{ item.credit }} 学分 / {{ item.totalHours }} 学时 </TableCell>
            <TableCell>
              {{ item.departmentName || item.departmentId }}
            </TableCell>
            <TableCell>
              <Badge v-if="statusMap[item.status]" :variant="statusMap[item.status]?.variant">
                {{ statusMap[item.status]?.label }}
              </Badge>
              <span v-else>{{ item.status }}</span>
            </TableCell>
            <TableCell class="text-sm text-muted-foreground">
              {{ formatDate(item.updateTime) }}
            </TableCell>
            <TableCell class="text-right">
              <div class="flex justify-end gap-2 pr-2">
                <!--查看详情按钮  -->
                <Button variant="ghost" size="sm" title="查看详情" @click="handleViewDetail(item)">
                  <Eye class="h-4 w-4 text-muted-foreground mr-2" />详情
                </Button>

                <!-- 归档按钮 -->
                <!-- 只有没归档的才能归档 -->
                <Button
                  v-if="item.status !== 'ARCHIVED'"
                  variant="ghost"
                  size="sm"
                  title="归档课程"
                  class="text-purple-600 hover:text-purple-700 hover:bg-purple-50 mr-4"
                  @click="handleArchive(item)"
                >
                  <Archive class="h-4 w-4" />归档
                </Button>
                <!-- 启用按钮 -->
                <!-- 只有当状态不是 ACTIVE 时才显示 -->
                <Button
                  v-if="item.status !== 'ACTIVE'"
                  variant="ghost"
                  size="sm"
                  title="发布/启用课程"
                  class="text-green-600 hover:text-green-700 hover:bg-green-50"
                  @click="handleActivate(item)"
                >
                  <Play class="h-4 w-4" />发布
                </Button>
                <!-- 停用按钮 (只在 ACTIVE 状态显示) -->
                <Button
                  v-else
                  variant="ghost"
                  size="sm"
                  title="停用/下架课程"
                  class="text-orange-500 hover:text-orange-600 hover:bg-orange-50"
                  @click="handleDeactivate(item)"
                >
                  <PauseCircle class="h-4 w-4" />停用
                </Button>
                <Button
                  v-if="item.status !== 'ARCHIVED'"
                  variant="ghost"
                  size="sm"
                  title="编辑课程"
                  @click="handleEdit(item)"
                >
                  <Pencil class="h-4 w-4 text-blue-600" />
                  <span class="ml-2 hidden sm:inline">编辑</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  title="删除课程"
                  class="text-red-600 hover:text-red-700 hover:bg-red-50 mr-2"
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
      class="justify-center"
      :total="total"
      :is-loading="isLoading"
      @change="fetchData"
    />
    <!-- 挂载弹窗组件，放到 template 底部 -->
    <!--编辑功能弹窗-->
    <CourseEditDialog ref="dialogRef" @success="handleRefresh" />
    <!-- 挂载详情抽屉 -->
    <CourseDetailDialog ref="detailDialogRef" />
  </div>
</template>
