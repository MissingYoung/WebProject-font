<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Clock, Plus, Search, RotateCcw, Pencil, Trash2, Wand2, AlertCircle } from 'lucide-vue-next'
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'vue-sonner'
import type {
  TeachingClassScheduleVO,
  SemesterVO,
  TeachingClassVO,
  AutoScheduleResultVO,
  AdministrativeClassVO,
  CourseOfferingVO,
  CourseVO,
} from '@/types'
import {
  getTeachingClassScheduleList,
  deleteTeachingClassSchedule,
  getSemesterList,
  getTeachingClassList,
  autoSchedule,
  getAdministrativeClassList,
  getCourseOfferingList,
  getCourseList,
  getTeachingClassAdminClasses,
} from '@/lib/api'
import ScheduleEditDialog from '@/components/TeachingClassSchedule/ScheduleEditDialog.vue'

// 星期映射
const weekDayMap: Record<number, string> = {
  1: '周一',
  2: '周二',
  3: '周三',
  4: '周四',
  5: '周五',
  6: '周六',
  7: '周日',
}

// 数据状态
const isLoading = ref(false)
const tableData = ref<TeachingClassScheduleVO[]>([])
const total = ref(0)
const semesters = ref<SemesterVO[]>([])
const teachingClasses = ref<TeachingClassVO[]>([])
const administrativeClasses = ref<AdministrativeClassVO[]>([])
const courseOfferings = ref<CourseOfferingVO[]>([])
const courses = ref<CourseVO[]>([])

// 查询参数
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  semesterId: undefined as number | undefined,
  teachingClassId: undefined as number | undefined,
  dayOfWeek: undefined as number | undefined,
  location: '',
})

// 弹窗状态
const editDialogRef = ref<InstanceType<typeof ScheduleEditDialog> | null>(null)
const deleteDialogOpen = ref(false)
const itemToDelete = ref<TeachingClassScheduleVO | null>(null)
const isDeleting = ref(false)

// 自动排课状态
const autoScheduleDialogOpen = ref(false)
const autoScheduleParams = reactive({
  semesterId: undefined as number | undefined,
  courseOfferingId: undefined as number | undefined,
  teachingClassIds: [] as number[],
})
const isAutoScheduling = ref(false)
const autoScheduleResult = ref<AutoScheduleResultVO | null>(null)
const showResultDialog = ref(false)

// 加载学期列表
const loadSemesters = async () => {
  try {
    const res = await getSemesterList({ pageNum: 1, pageSize: 50 })
    if (res?.data) {
      semesters.value = res.data.records
    }
  } catch (err: unknown) {
    console.error('加载学期列表失败', err)
  }
}

// 加载教学班列表
const loadTeachingClasses = async () => {
  try {
    const params: { pageNum: number; pageSize: number; semesterId?: number } = {
      pageNum: 1,
      pageSize: 100,
    }
    if (queryParams.semesterId) {
      params.semesterId = queryParams.semesterId
    }
    const res = await getTeachingClassList(params)
    if (res?.data) {
      teachingClasses.value = res.data.records
    }
  } catch (err: unknown) {
    console.error('加载教学班列表失败', err)
  }
}

// 获取列表数据
const fetchData = async () => {
  isLoading.value = true
  try {
    const params = {
      ...queryParams,
      semesterId: queryParams.semesterId || undefined,
      teachingClassId: queryParams.teachingClassId || undefined,
      dayOfWeek: queryParams.dayOfWeek || undefined,
    }
    const res = await getTeachingClassScheduleList(params)
    if (res?.data) {
      tableData.value = res.data.records
      total.value = res.data.total
    }
  } catch (err: unknown) {
    console.error('获取排课列表失败', err)
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
  queryParams.semesterId = undefined
  queryParams.teachingClassId = undefined
  queryParams.dayOfWeek = undefined
  queryParams.location = ''
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
const handleEdit = (row: TeachingClassScheduleVO) => {
  editDialogRef.value?.openDialog(row)
}

// 删除
const handleDeleteClick = (row: TeachingClassScheduleVO) => {
  itemToDelete.value = row
  deleteDialogOpen.value = true
}

const handleConfirmDelete = async () => {
  if (!itemToDelete.value) return
  isDeleting.value = true
  try {
    await deleteTeachingClassSchedule(itemToDelete.value.id)
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

// 编辑成功回调
const handleEditSuccess = () => {
  fetchData()
}

// 学期变化时重新加载教学班列表
const handleSemesterChange = () => {
  queryParams.teachingClassId = undefined
  loadTeachingClasses()
}

// 加载行政班列表
const loadAdministrativeClasses = async (semesterId?: number) => {
  try {
    const params: any = {
      pageNum: 1,
      pageSize: 100,
      status: 'ACTIVE',
    }
    const res = await getAdministrativeClassList(params)
    if (res?.data) {
      administrativeClasses.value = res.data.records
    }
  } catch (err: unknown) {
    console.error('加载行政班列表失败', err)
  }
}

// 加载开课列表
const loadCourseOfferings = async (semesterId?: number) => {
  if (!semesterId) return
  try {
    const res = await getCourseOfferingList({
      pageNum: 1,
      pageSize: 100,
      semesterId,
    })
    if (res?.data) {
      courseOfferings.value = res.data.records
    }
  } catch (err: unknown) {
    console.error('加载开课列表失败', err)
  }
}

// 加载课程列表
const loadCourses = async () => {
  try {
    const res = await getCourseList({
      pageNum: 1,
      pageSize: 100,
      status: 'ACTIVE',
    })
    if (res?.data) {
      courses.value = res.data.records
    }
  } catch (err: unknown) {
    console.error('加载课程列表失败', err)
  }
}

// 打开自动排课对话框
const openAutoScheduleDialog = () => {
  scheduleMode.value = 'semester'
  autoScheduleParams.semesterId = queryParams.semesterId
  autoScheduleParams.courseOfferingId = undefined
  autoScheduleParams.administrativeClassIds = []
  autoScheduleParams.teachingClassIds = []
  autoScheduleDialogOpen.value = true
  loadAdministrativeClasses()
  loadCourses()
  if (autoScheduleParams.semesterId) {
    loadCourseOfferings(autoScheduleParams.semesterId)
  }
}

// 排课模式变化处理
const handleScheduleModeChange = () => {
  autoScheduleParams.courseOfferingId = undefined
  autoScheduleParams.administrativeClassIds = []
  autoScheduleParams.teachingClassIds = []
}

// 学期变化时重新加载开课列表
const handleAutoScheduleSemesterChange = () => {
  autoScheduleParams.courseOfferingId = undefined
  if (autoScheduleParams.semesterId) {
    loadCourseOfferings(autoScheduleParams.semesterId)
  }
}

// 执行自动排课
const handleAutoSchedule = async () => {
  if (!autoScheduleParams.semesterId) {
    toast.error('请选择学期')
    return
  }

  isAutoScheduling.value = true
  try {
    const payload: {
      semesterId?: number
      courseOfferingId?: number
      teachingClassIds?: number[]
    } = {
      semesterId: autoScheduleParams.semesterId,
    }

    // 根据不同模式设置参数
    if (scheduleMode.value === 'offering' && autoScheduleParams.courseOfferingId) {
      // 按开课排课
      payload.courseOfferingId = autoScheduleParams.courseOfferingId
    } else if (scheduleMode.value === 'adminClass' && autoScheduleParams.administrativeClassIds.length > 0) {
      // 按行政班排课
      // 获取该学期的所有教学班，然后筛选出与选定行政班相关的教学班
      try {
        const teachingClassRes = await getTeachingClassList({
          pageNum: 1,
          pageSize: 1000,
          semesterId: autoScheduleParams.semesterId,
        })
        
        if (teachingClassRes?.data?.records) {
          const allTeachingClasses = teachingClassRes.data.records
          const relatedTeachingClassIds: number[] = []
          
          // 对每个教学班，检查是否关联了选定的行政班
          for (const tc of allTeachingClasses) {
            try {
              const adminClassRes = await getTeachingClassAdminClasses(tc.id)
              if (adminClassRes?.data) {
                const hasSelectedAdminClass = adminClassRes.data.some((ac) =>
                  autoScheduleParams.administrativeClassIds.includes(ac.administrativeClassId)
                )
                if (hasSelectedAdminClass) {
                  relatedTeachingClassIds.push(tc.id)
                }
              }
            } catch (err) {
              // 忽略单个教学班的查询失败
              console.warn(`获取教学班 ${tc.id} 的行政班关联失败`, err)
            }
          }
          
          if (relatedTeachingClassIds.length > 0) {
            payload.teachingClassIds = relatedTeachingClassIds
          } else {
            toast.warning('选定的行政班没有关联的教学班，或教学班尚未设置行政班关联')
            isAutoScheduling.value = false
            return
          }
        }
      } catch (err) {
        console.error('获取教学班列表失败', err)
        toast.error('获取教学班列表失败，请重试')
        isAutoScheduling.value = false
        return
      }
    } else if (autoScheduleParams.teachingClassIds.length > 0) {
      // 手动选择特定教学班
      payload.teachingClassIds = autoScheduleParams.teachingClassIds
    }
    // else: 按学期排课（默认，为该学期所有未排课的教学班排课）

    const res = await autoSchedule(payload)
    autoScheduleResult.value = res.data || null

    autoScheduleDialogOpen.value = false
    showResultDialog.value = true

    // 显示简要结果
    const result = res.data
    if (result) {
      if (result.failureCount === 0) {
        toast.success(`自动排课成功！共排课 ${result.successCount} 个教学班`)
      } else {
        toast.warning(
          `排课完成：成功 ${result.successCount} 个，失败 ${result.failureCount} 个`
        )
      }
    }

    // 刷新列表
    fetchData()
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '自动排课失败'
    toast.error(message)
  } finally {
    isAutoScheduling.value = false
  }
}

// 关闭结果对话框
const closeResultDialog = () => {
  showResultDialog.value = false
  autoScheduleResult.value = null
}

// 根据teachingClassId查找教学班信息
const findTeachingClass = (teachingClassId: number) => {
  return teachingClasses.value.find((tc) => tc.id === teachingClassId)
}

// 格式化时间段
const formatPeriod = (start: number, end: number) => {
  return `${start}-${end}节`
}

// 格式化周次
const formatWeeks = (start?: number, end?: number) => {
  if (!start && !end) return '全部'
  if (start && end) return `${start}-${end}周`
  if (start) return `${start}周起`
  if (end) return `至${end}周`
  return '-'
}

onMounted(() => {
  loadSemesters()
  loadTeachingClasses()
  fetchData()
})
</script>

<template>
  <div class="space-y-4">
    <!-- 标题栏 -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Clock class="h-6 w-6" />
          教学班排课管理
        </h2>
        <p class="text-muted-foreground">管理教师教学班的上课时间和教室安排（老师视角）</p>
      </div>
      <div class="flex gap-2">
        <Button variant="outline" @click="openAutoScheduleDialog">
          <Wand2 class="mr-2 h-4 w-4" />
          自动排课
        </Button>
        <Button @click="handleCreate">
          <Plus class="mr-2 h-4 w-4" />
          新增排课
        </Button>
      </div>
    </div>

    <!-- 搜索区域 -->
    <div class="flex flex-wrap gap-4 items-end">
      <div class="flex-1 min-w-[200px] max-w-[250px]">
        <Select v-model="queryParams.semesterId" @update:model-value="handleSemesterChange">
          <SelectTrigger>
            <SelectValue placeholder="选择学期" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="semester in semesters" :key="semester.id" :value="semester.id">
              {{ semester.name }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div class="flex-1 min-w-[200px] max-w-[280px]">
        <Select v-model="queryParams.teachingClassId">
          <SelectTrigger>
            <SelectValue placeholder="选择教学班" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="tc in teachingClasses" :key="tc.id" :value="tc.id">
              {{ tc.name }} ({{ tc.courseName }})
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div class="flex-1 min-w-[150px] max-w-[150px]">
        <Select v-model="queryParams.dayOfWeek">
          <SelectTrigger>
            <SelectValue placeholder="星期" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem :value="1">周一</SelectItem>
            <SelectItem :value="2">周二</SelectItem>
            <SelectItem :value="3">周三</SelectItem>
            <SelectItem :value="4">周四</SelectItem>
            <SelectItem :value="5">周五</SelectItem>
            <SelectItem :value="6">周六</SelectItem>
            <SelectItem :value="7">周日</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div class="flex-1 min-w-[150px] max-w-[180px]">
        <Input v-model="queryParams.location" placeholder="上课地点" @keyup.enter="handleSearch" />
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
            <TableHead>教学班</TableHead>
            <TableHead>课程名称</TableHead>
            <TableHead>星期</TableHead>
            <TableHead>节次</TableHead>
            <TableHead>周次</TableHead>
            <TableHead>上课地点</TableHead>
            <TableHead>备注</TableHead>
            <TableHead class="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="isLoading">
            <TableCell colspan="8" class="text-center py-8 text-muted-foreground">
              加载中...
            </TableCell>
          </TableRow>
          <TableRow v-else-if="tableData.length === 0">
            <TableCell colspan="8" class="text-center py-8 text-muted-foreground">
              暂无数据
            </TableCell>
          </TableRow>
          <TableRow v-for="row in tableData" :key="row.id">
            <TableCell class="font-medium">
              {{ findTeachingClass(row.teachingClassId)?.name || row.teachingClassId }}
            </TableCell>
            <TableCell>
              {{ findTeachingClass(row.teachingClassId)?.courseName || '-' }}
            </TableCell>
            <TableCell>{{ weekDayMap[row.weekDay] }}</TableCell>
            <TableCell>{{ formatPeriod(row.startSection, row.endSection) }}</TableCell>
            <TableCell>{{ formatWeeks(row.startWeek, row.endWeek) }}</TableCell>
            <TableCell>{{ row.classroom || '-' }}</TableCell>
            <TableCell>{{ row.remark || '-' }}</TableCell>
            <TableCell class="text-right">
              <div class="flex justify-end gap-1">
                <Button variant="ghost" size="icon" title="编辑" @click="handleEdit(row)">
                  <Pencil class="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" title="删除" @click="handleDeleteClick(row)">
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
    <ScheduleEditDialog ref="editDialogRef" @success="handleEditSuccess" />

    <!-- 删除确认对话框 -->
    <AlertDialog :open="deleteDialogOpen" @update:open="(v) => (deleteDialogOpen = v)">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle class="flex items-center gap-2 text-red-600">
            确认删除排课？
          </AlertDialogTitle>
          <AlertDialogDescription>
            您正在尝试删除排课：
            <span class="font-bold text-black">
              {{ weekDayMap[itemToDelete?.weekDay || 1] }}
              {{
                itemToDelete ? formatPeriod(itemToDelete.startSection, itemToDelete.endSection) : ''
              }}
            </span>
            <br />
            <span class="text-red-500 text-xs mt-2 block">
              注意：删除后相关的教学安排将受到影响
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

    <!-- 自动排课对话框 -->
    <AlertDialog :open="autoScheduleDialogOpen" @update:open="(v) => (autoScheduleDialogOpen = v)">
      <AlertDialogContent class="max-w-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle class="flex items-center gap-2">
            <Wand2 class="h-5 w-5 text-primary" />
            智能自动排课
          </AlertDialogTitle>
          <AlertDialogDescription>
            根据课程开设情况和行政班信息，自动为教学班安排上课时间和教室
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div class="space-y-4 py-4">
          <!-- 选择学期 -->
          <div class="space-y-2">
            <label class="text-sm font-medium">
              选择学期 <span class="text-red-500">*</span>
            </label>
            <Select v-model="autoScheduleParams.semesterId" @update:model-value="handleAutoScheduleSemesterChange">
              <SelectTrigger>
                <SelectValue placeholder="请选择学期" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="semester in semesters" :key="semester.id" :value="semester.id">
                  {{ semester.name }} ({{ semester.academicYear }})
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- 排课模式选择 -->
          <div class="space-y-2">
            <label class="text-sm font-medium">排课模式</label>
            <div class="grid grid-cols-3 gap-3">
              <Card
                :class="[
                  'cursor-pointer transition-all border-2',
                  scheduleMode === 'semester'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50',
                ]"
                @click="
                  () => {
                    scheduleMode = 'semester'
                    handleScheduleModeChange()
                  }
                "
              >
                <CardHeader class="pb-3">
                  <CardTitle class="text-sm">整学期排课</CardTitle>
                  <CardDescription class="text-xs">
                    为该学期所有未排课的教学班自动排课
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card
                :class="[
                  'cursor-pointer transition-all border-2',
                  scheduleMode === 'offering'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50',
                ]"
                @click="
                  () => {
                    scheduleMode = 'offering'
                    handleScheduleModeChange()
                  }
                "
              >
                <CardHeader class="pb-3">
                  <CardTitle class="text-sm">按开课排课</CardTitle>
                  <CardDescription class="text-xs">
                    为指定开课的所有教学班自动排课
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card
                :class="[
                  'cursor-pointer transition-all border-2',
                  scheduleMode === 'adminClass'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50',
                ]"
                @click="
                  () => {
                    scheduleMode = 'adminClass'
                    handleScheduleModeChange()
                  }
                "
              >
                <CardHeader class="pb-3">
                  <CardTitle class="text-sm">按行政班排课</CardTitle>
                  <CardDescription class="text-xs">
                    为指定行政班关联的教学班排课
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>

          <!-- 按开课排课 - 选择开课 -->
          <div v-if="scheduleMode === 'offering'" class="space-y-2">
            <label class="text-sm font-medium">
              选择开课 <span class="text-red-500">*</span>
            </label>
            <Select v-model="autoScheduleParams.courseOfferingId" :disabled="!autoScheduleParams.semesterId">
              <SelectTrigger>
                <SelectValue placeholder="请选择开课" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="offering in courseOfferings" :key="offering.id" :value="offering.id">
                  {{ offering.courseName }} ({{ offering.courseCode }})
                </SelectItem>
              </SelectContent>
            </Select>
            <p class="text-xs text-muted-foreground">将为该开课下的所有教学班进行排课</p>
          </div>

          <!-- 按行政班排课 - 选择行政班 -->
          <div v-if="scheduleMode === 'adminClass'" class="space-y-2">
            <label class="text-sm font-medium">
              选择行政班 <span class="text-red-500">*</span>
            </label>
            <div class="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
              <div
                v-for="adminClass in administrativeClasses"
                :key="adminClass.id"
                class="flex items-center space-x-2"
              >
                <input
                  type="checkbox"
                  :id="`admin-class-${adminClass.id}`"
                  :value="adminClass.id"
                  :checked="autoScheduleParams.administrativeClassIds.includes(adminClass.id)"
                  @change="
                    (e) => {
                      const checked = (e.target as HTMLInputElement).checked
                      if (checked) {
                        autoScheduleParams.administrativeClassIds.push(adminClass.id)
                      } else {
                        const index = autoScheduleParams.administrativeClassIds.indexOf(adminClass.id)
                        if (index > -1) {
                          autoScheduleParams.administrativeClassIds.splice(index, 1)
                        }
                      }
                    }
                  "
                  class="rounded border-gray-300"
                />
                <label :for="`admin-class-${adminClass.id}`" class="text-sm cursor-pointer">
                  {{ adminClass.name }} ({{ adminClass.code }})
                  <span v-if="adminClass.majorName" class="text-xs text-muted-foreground">
                    - {{ adminClass.majorName }}
                  </span>
                </label>
              </div>
            </div>
            <p class="text-xs text-muted-foreground">
              将为这些行政班关联的教学班进行排课
            </p>
            <Card class="bg-amber-50 border-amber-200 mt-2">
              <CardContent class="pt-3 text-xs text-muted-foreground">
                <p><strong>注意：</strong>此模式要求教学班已设置行政班关联关系</p>
                <p class="mt-1">如果没有找到关联的教学班，请在"教学班管理"中设置行政班关联</p>
              </CardContent>
            </Card>
          </div>

          <!-- 说明信息 -->
          <Card class="bg-blue-50 border-blue-200">
            <CardHeader class="pb-3">
              <CardTitle class="text-sm flex items-center gap-2">
                <AlertCircle class="h-4 w-4 text-blue-600" />
                自动排课说明
              </CardTitle>
            </CardHeader>
            <CardContent class="text-xs text-muted-foreground space-y-1">
              <p><strong>排课流程：</strong></p>
              <p>• <strong>整学期模式：</strong>为该学期所有已开课但未排课的教学班进行排课</p>
              <p>• <strong>按开课模式：</strong>为选定开课（课程在某学期的开设）下的所有教学班排课</p>
              <p>• <strong>按行政班模式：</strong>为选定行政班关联的教学班排课（基于培养计划）</p>
              <p class="mt-2"><strong>排课规则：</strong></p>
              <p>• 自动检测时间冲突（教师、教室、学生）</p>
              <p>• 优先使用工作日（周一至周五）</p>
              <p>• 同一教师的课程会分散到不同天</p>
            </CardContent>
          </Card>

          <!-- 优缺点提示 -->
          <div class="grid grid-cols-2 gap-4 text-xs">
            <Card class="bg-green-50 border-green-200">
              <CardHeader class="pb-2">
                <CardTitle class="text-xs text-green-700">✅ 优点</CardTitle>
              </CardHeader>
              <CardContent class="space-y-1 text-muted-foreground">
                <p>• 效率高，批量处理</p>
                <p>• 自动冲突检测</p>
                <p>• 资源优化利用</p>
                <p>• 规则统一公平</p>
              </CardContent>
            </Card>
            <Card class="bg-amber-50 border-amber-200">
              <CardHeader class="pb-2">
                <CardTitle class="text-xs text-amber-700">⚠️ 注意事项</CardTitle>
              </CardHeader>
              <CardContent class="space-y-1 text-muted-foreground">
                <p>• 可能无法100%成功</p>
                <p>• 需要完整基础数据</p>
                <p>• 可能需人工调整</p>
                <p>• 无法处理特殊需求</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel :disabled="isAutoScheduling">取消</AlertDialogCancel>
          <AlertDialogAction
            :disabled="
              isAutoScheduling ||
              !autoScheduleParams.semesterId ||
              (scheduleMode === 'offering' && !autoScheduleParams.courseOfferingId) ||
              (scheduleMode === 'adminClass' && autoScheduleParams.administrativeClassIds.length === 0)
            "
            @click.prevent="handleAutoSchedule"
          >
            <Wand2 v-if="!isAutoScheduling" class="mr-2 h-4 w-4" />
            {{ isAutoScheduling ? '排课中...' : '开始自动排课' }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <!-- 排课结果对话框 -->
    <AlertDialog :open="showResultDialog" @update:open="closeResultDialog">
      <AlertDialogContent class="max-w-3xl max-h-[80vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle class="flex items-center gap-2">
            <Wand2 class="h-5 w-5 text-primary" />
            自动排课结果
          </AlertDialogTitle>
          <AlertDialogDescription>以下是本次自动排课的详细结果</AlertDialogDescription>
        </AlertDialogHeader>

        <div v-if="autoScheduleResult" class="space-y-4 py-4">
          <!-- 统计信息 -->
          <div class="grid grid-cols-2 gap-4">
            <Card class="bg-green-50 border-green-200">
              <CardHeader class="pb-2">
                <CardTitle class="text-sm text-green-700">排课成功</CardTitle>
                <CardDescription class="text-2xl font-bold text-green-600">
                  {{ autoScheduleResult.successCount }}
                </CardDescription>
              </CardHeader>
            </Card>
            <Card class="bg-red-50 border-red-200">
              <CardHeader class="pb-2">
                <CardTitle class="text-sm text-red-700">排课失败</CardTitle>
                <CardDescription class="text-2xl font-bold text-red-600">
                  {{ autoScheduleResult.failureCount }}
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <!-- 成功列表 -->
          <div v-if="autoScheduleResult.scheduledClasses && autoScheduleResult.scheduledClasses.length > 0">
            <h4 class="text-sm font-semibold mb-2 flex items-center gap-2">
              <Badge variant="default" class="bg-green-600">成功</Badge>
              排课成功的教学班
            </h4>
            <div class="border rounded-lg max-h-48 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>教学班</TableHead>
                    <TableHead>课程</TableHead>
                    <TableHead>教师</TableHead>
                    <TableHead>排课数量</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow
                    v-for="item in autoScheduleResult.scheduledClasses"
                    :key="item.teachingClassId"
                  >
                    <TableCell class="font-medium">{{ item.teachingClassName }}</TableCell>
                    <TableCell>{{ item.courseName }}</TableCell>
                    <TableCell>{{ item.teacherName }}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{{ item.schedules?.length || 0 }} 个时段</Badge>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>

          <!-- 失败列表 -->
          <div v-if="autoScheduleResult.failures && autoScheduleResult.failures.length > 0">
            <h4 class="text-sm font-semibold mb-2 flex items-center gap-2">
              <Badge variant="destructive">失败</Badge>
              需要手动处理的教学班
            </h4>
            <div class="border rounded-lg max-h-48 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>教学班</TableHead>
                    <TableHead>课程</TableHead>
                    <TableHead>失败原因</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-for="item in autoScheduleResult.failures" :key="item.teachingClassId">
                    <TableCell class="font-medium">{{ item.teachingClassName }}</TableCell>
                    <TableCell>{{ item.courseName }}</TableCell>
                    <TableCell class="text-red-600 text-xs">{{ item.reason }}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>

          <!-- 建议 -->
          <Card v-if="autoScheduleResult.failureCount > 0" class="bg-amber-50 border-amber-200">
            <CardHeader class="pb-2">
              <CardTitle class="text-sm text-amber-700">💡 处理建议</CardTitle>
            </CardHeader>
            <CardContent class="text-xs text-muted-foreground space-y-1">
              <p>1. 检查失败教学班的教师和教室信息是否完整</p>
              <p>2. 确认是否存在时间冲突（教师同时段有其他课程）</p>
              <p>3. 尝试手动为这些教学班安排不同的时间段</p>
              <p>4. 可以调整已排课程的时间，为失败的教学班腾出空间</p>
            </CardContent>
          </Card>
        </div>

        <AlertDialogFooter>
          <AlertDialogAction @click="closeResultDialog">确定</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
