<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { getCourseList, deleteCourse, activateCourse, deactivateCourse, archiveCourse } from '@/lib/api'
import type { CourseVO, CourseQueryParams } from '@/types'
import CourseEditDialog from '@/components/Course/CourseEditDialog.vue'

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
import { Badge } from '@/components/ui/badge'
import {
  Loader2,
  Search, RotateCcw,
  ChevronLeft,
  ChevronRight,
  Plus,
  Pencil,
  AlertTriangle,
  Trash2,
  Play,
  PauseCircle,
  Archive,
  Eye,
} from 'lucide-vue-next'
import { formatDate } from '@/lib/date'
import CourseDetailDialog from '@/components/Course/CourseDetailDialog.vue'

// --- 状态管理 ---
const isLoading = ref(false)
const tableData = ref<CourseVO[]>([])
const total = ref(0)
//删除相关状态
const deleteDialogOpen = ref(false)
const courseToDelete = ref<CourseVO | null>(null) // 暂存要删除的课程对象
const isDeleting = ref(false)

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
  'REQUIRED': '必修',
  'LIMITED_ELECTIVE': '限选',
  'OPEN_ELECTIVE': '任选'
}

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  'DRAFT': { label: '草稿', variant: 'secondary' },
  'ACTIVE': { label: '已发布', variant: 'default' },
  'INACTIVE': { label: '停用', variant: 'destructive' },
  'ARCHIVED': { label: '归档', variant: 'outline' }
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
  dialogRef.value?.openDialog();
}

//点击编辑按钮
const handleEdit = (row: CourseVO) => {
  dialogRef.value?.openDialog(row);
}
//刷新列表，统一由弹窗的success事件触发
const handleRefresh = () => {
  fetchData();
}

//点击删除按钮(打开弹窗，实际上还未删)
const handleDeleteClick = (row: CourseVO) => {
  courseToDelete.value = row;
  deleteDialogOpen.value = true;
}
// 确认删除（点击弹窗的“继续”后触发）
const handleConfirmDelete = async () => {
  if (!courseToDelete.value) return

  isDeleting.value = true
  try {
    await deleteCourse(courseToDelete.value.id)
    console.log('删除成功')

    // 关闭弹窗
    deleteDialogOpen.value = false
    // 刷新列表
    fetchData()
  } catch (err: any) {
    console.error('删除失败', err)
    alert(err.message || '删除失败，请稍后重试')
  } finally {
    isDeleting.value = false
  }
}
//课程启用逻辑
const handleActivate = async (row: CourseVO) => {
  try {
    await activateCourse(row.id)
    console.log('课程启用成功')
    alert(`课程“${row.name}”启用成功`)
    fetchData()
  } catch (err: any) {
    console.error('启用失败', err)
    alert(err.message || '启用失败')
  }
}
//课程停用逻辑
const handleDeactivate = async (row: CourseVO) => {
  try {
    await deactivateCourse(row.id)
    console.log('课程停用成功')
    alert(`课程“${row.name}”停用成功`)
    fetchData()
  } catch (err: any) {
    console.error('停用失败', err)
    alert(err.message || '停用失败')
  }
}
//课程归档逻辑
const handleArchive = async (row: CourseVO) => {
  // 归档通常是一个不可逆（或者很麻烦）的操作所以加个确认
  if (!confirm(`确认要将课程“${row.name}”归档吗？`)) {
    return
  }
  try {
    await archiveCourse(row.id)
    console.log('课程归档成功')
    alert('课程归档成功')
    fetchData() // 刷新列表，状态变为 ARCHIVED
  } catch (err: any) {
    console.error('归档失败', err)
    alert(err.message || '归档失败')
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
  }else{
     console.error('>>> 严重错误：无法找到子组件实例！请检查 ref 绑定。')
  }
}

// 分页：上一页
const prevPage = () => {
  if (queryParams.pageNum > 1) {
    queryParams.pageNum--
    fetchData()
  }
}

// 分页：下一页
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
        <Select :model-value="queryParams.defaultCourseType"
          @update:model-value="(v) => queryParams.defaultCourseType = v as string">
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
        <Select :model-value="queryParams.status" @update:model-value="(v) => queryParams.status = v as string">
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
        <Button @click="handleSearch">
          <Search class="mr-2 h-4 w-4" /> 搜索
        </Button>
        <Button variant="outline" @click="handleReset">
          <RotateCcw class="mr-2 h-4 w-4" /> 重置
        </Button>
      </div>
    </div>

    <!-- 3. 数据表格区域 -->
    <div class="border rounded-md bg-white">
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
          <TableRow v-else v-for="item in tableData" :key="item.id">
            <TableCell class="font-medium">{{ item.code }}</TableCell>
            <TableCell>{{ item.name }}</TableCell>
            <TableCell>
              {{ courseTypeMap[item.defaultCourseType] || item.defaultCourseType }}
            </TableCell>
            <TableCell>
              {{ item.credit }} 学分 / {{ item.totalHours }} 学时
            </TableCell>
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
                <Button variant="ghost" size="icon" title="查看详情" @click="handleViewDetail(item)">
                  <Eye class="h-4 w-4 text-gray-500 mr-6" />
                </Button>

                <!-- 归档按钮 -->
                <!-- 只有没归档的才能归档 -->
                <Button v-if="item.status !== 'ARCHIVED'" variant="ghost" size="icon" title="归档课程"
                  class="text-purple-600 hover:text-purple-700 hover:bg-purple-50 mr-4" @click="handleArchive(item)">
                  <Archive class="h-4 w-4" />归档
                </Button>
                <!-- 启用按钮 -->
                <!-- 只有当状态不是 ACTIVE 时才显示 -->
                <Button v-if="item.status !== 'ACTIVE'" variant="ghost" size="icon" title="发布/启用课程"
                  class="text-green-600 hover:text-green-700 hover:bg-green-50" @click="handleActivate(item)">
                  <Play class="h-4 w-4" />发布
                </Button>
                <!-- 停用按钮 (只在 ACTIVE 状态显示) -->
                <Button v-else variant="ghost" size="icon" title="停用/下架课程"
                  class="text-orange-500 hover:text-orange-600 hover:bg-orange-50" @click="handleDeactivate(item)">
                  <PauseCircle class="h-4 w-4" />停用
                </Button>
                <Button variant="ghost" size="sm" @click="handleEdit(item)" title="编辑课程">
                  <Pencil class="h-4 w-4 text-blue-600" />
                  <span class="ml-2 hidden sm:inline">编辑</span>
                </Button>
                <Button variant="ghost" size="icon" title="删除课程"
                  class="text-red-600 hover:text-red-700 hover:bg-red-50 mr-2" @click="handleDeleteClick(item)">
                  <Trash2 class="h-4 w-4" />删除
                </Button>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <!-- 4. 分页控件 -->
    <div class="flex items-center justify-center space-x-2 py-4">
      <div class="text-sm text-muted-foreground mr-4">
        共 {{ total }} 条记录
      </div>
      <Button variant="outline" size="sm" :disabled="queryParams.pageNum <= 1 || isLoading" @click="prevPage">
        <ChevronLeft class="h-4 w-4" /> 上一页
      </Button>
      <div class="text-sm font-medium">
        第 {{ queryParams.pageNum }} 页
      </div>
      <Button variant="outline" size="sm" :disabled="tableData.length < queryParams.pageSize || isLoading"
        @click="nextPage">
        下一页
        <ChevronRight class="h-4 w-4" />
      </Button>
    </div>
    <!-- 挂载弹窗组件，放到 template 底部 -->
    <!--删除确认弹窗-->
    <AlertDialog :open="deleteDialogOpen" @update:open="(v) => deleteDialogOpen = v">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle class="flex items-center gap-2 text-red-600">
            <AlertTriangle class="h-5 w-5" />
            确认删除该课程吗？
          </AlertDialogTitle>
          <AlertDialogDescription>
            <!-- 动态显示课程名称，防止误删 -->
            您正在尝试删除课程：<span class="font-bold text-black">{{ courseToDelete?.name }}</span> ({{ courseToDelete?.code }})。
            <br>
            此操作无法撤销，将会永久移除该课程及相关数据。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel :disabled="isDeleting">取消</AlertDialogCancel>
          <AlertDialogAction @click.prevent="handleConfirmDelete" :disabled="isDeleting"
            class="bg-red-600 hover:bg-red-700 text-white focus:ring-red-600">
            {{ isDeleting ? '删除中...' : '确认删除' }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    <!--编辑功能弹窗-->
    <CourseEditDialog ref="dialogRef" @success="handleRefresh" />
    <!-- 挂载详情抽屉 -->
    <CourseDetailDialog ref="detailDialogRef" />
  </div>
</template>