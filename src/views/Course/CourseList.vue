<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { getCourseList } from '@/lib/api'
import type { CourseVO, CourseQueryParams } from '@/types'
import CreateCourseDialog from '@/components/Course/CreateCourseDialog.vue' 

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
import { Loader2, Search, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-vue-next'

// --- 状态管理 ---
const isLoading = ref(false)
const tableData = ref<CourseVO[]>([])
const total = ref(0)

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

// 辅助：格式化时间 
const formatTime = (time: any) => {
  if (!time) return '-'
  if (typeof time === 'string') return time.replace('T', ' ')
  if (typeof time === 'object' && time.dateTime) return time.dateTime.replace('T', ' ')
  return '-'
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
      <!-- 引入添加课程弹窗，监听 success 事件刷新列表 -->
      <CreateCourseDialog @success="handleSearch" />
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
        <Select :model-value="queryParams.defaultCourseType" @update:model-value= "(v) => queryParams.defaultCourseType = v as string">
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
            <TableHead class="w-[100px]">课程编号</TableHead>
            <TableHead>课程名称</TableHead>
            <TableHead>类型</TableHead>
            <TableHead>学分/学时</TableHead>
            <TableHead>学院</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>更新时间</TableHead>
            <!-- <TableHead class="text-right">操作</TableHead> -->
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
              {{ formatTime(item.updateTime) }}
            </TableCell>
            <!-- 操作列预留
            <TableCell class="text-right">
              <Button variant="ghost" size="sm">编辑</Button>
            </TableCell> 
            -->
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <!-- 4. 分页控件 -->
    <div class="flex items-center justify-end space-x-2 py-4">
      <div class="text-sm text-muted-foreground mr-4">
        共 {{ total }} 条记录
      </div>
      <Button 
        variant="outline" 
        size="sm" 
        :disabled="queryParams.pageNum <= 1 || isLoading"
        @click="prevPage"
      >
        <ChevronLeft class="h-4 w-4" /> 上一页
      </Button>
      <div class="text-sm font-medium">
        第 {{ queryParams.pageNum }} 页
      </div>
      <Button 
        variant="outline" 
        size="sm" 
        :disabled="tableData.length < queryParams.pageSize || isLoading"
        @click="nextPage"
      >
        下一页 <ChevronRight class="h-4 w-4" />
      </Button>
    </div>
  </div>
</template>