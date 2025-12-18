<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'vue-sonner'
import type {
  CourseOfferingVO,
  CreateCourseOfferingPayload,
  SemesterVO,
  CourseVO,
  CourseType,
} from '@/types'
import {
  createCourseOffering,
  updateCourseOffering,
  getSemesterList,
  getCourseList,
} from '@/lib/api'

const emit = defineEmits(['success'])

const open = ref(false)
const isLoading = ref(false)
const error = ref<string | null>(null)
const isEditMode = ref(false)
const currentId = ref<number | null>(null)

// 下拉选项
const semesters = ref<SemesterVO[]>([])
const courses = ref<CourseVO[]>([])
const isLoadingSemesters = ref(false)
const isLoadingCourses = ref(false)

// 表单初始状态
const initialState: CreateCourseOfferingPayload = {
  courseId: 0,
  semesterId: 0,
  courseType: 'REQUIRED' as CourseType,
  capacity: undefined,
  targetGradeLevel: undefined,
  allowRetake: false,
  remark: '',
}

const formData = reactive<CreateCourseOfferingPayload>({ ...initialState })

// 加载学期列表
const loadSemesters = async () => {
  isLoadingSemesters.value = true
  try {
    const res = await getSemesterList({ pageNum: 1, pageSize: 50 })
    if (res?.data) {
      semesters.value = res.data.records
    }
  } catch (err: unknown) {
    console.error('加载学期列表失败', err)
    toast.error('加载学期列表失败')
  } finally {
    isLoadingSemesters.value = false
  }
}

// 加载课程列表
const loadCourses = async () => {
  isLoadingCourses.value = true
  try {
    const res = await getCourseList({ pageNum: 1, pageSize: 100, status: 'ACTIVE' })
    if (res?.data) {
      courses.value = res.data.records
    }
  } catch (err: unknown) {
    console.error('加载课程列表失败', err)
    toast.error('加载课程列表失败')
  } finally {
    isLoadingCourses.value = false
  }
}

// 打开对话框
const openDialog = (item?: CourseOfferingVO) => {
  open.value = true
  error.value = null

  if (item) {
    isEditMode.value = true
    currentId.value = item.id
    formData.courseId = item.courseId
    formData.semesterId = item.semesterId
    formData.courseType = item.courseType
    formData.capacity = item.capacity
    formData.targetGradeLevel = item.targetGradeLevel
    formData.allowRetake = item.allowRetake || false
    formData.remark = item.remark || ''
  } else {
    isEditMode.value = false
    currentId.value = null
    Object.assign(formData, initialState)
  }
}

defineExpose({ openDialog })

// 提交表单
const handleSubmit = async () => {
  // 基础校验
  if (!formData.courseId) {
    error.value = '请选择课程'
    return
  }
  if (!formData.semesterId) {
    error.value = '请选择学期'
    return
  }
  if (!formData.courseType) {
    error.value = '请选择课程类型'
    return
  }

  isLoading.value = true
  error.value = null

  try {
    const payload: CreateCourseOfferingPayload = {
      courseId: Number(formData.courseId),
      semesterId: Number(formData.semesterId),
      courseType: formData.courseType,
      capacity: formData.capacity ? Number(formData.capacity) : undefined,
      targetGradeLevel: formData.targetGradeLevel ? Number(formData.targetGradeLevel) : undefined,
      allowRetake: formData.allowRetake,
      remark: formData.remark || undefined,
    }

    if (isEditMode.value && currentId.value) {
      await updateCourseOffering(currentId.value, payload)
      toast.success('更新成功')
    } else {
      await createCourseOffering(payload)
      toast.success('创建成功')
    }

    open.value = false
    emit('success')
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '操作失败'
    error.value = message
    toast.error(message)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadSemesters()
  loadCourses()
})
</script>

<template>
  <Dialog :open="open" @update:open="(v) => (open = v)">
    <DialogContent class="sm:max-w-[550px]">
      <DialogHeader>
        <DialogTitle>{{ isEditMode ? '编辑开课' : '新增开课' }}</DialogTitle>
        <DialogDescription>
          {{ isEditMode ? '修改开课信息' : '创建新的课程开设记录' }}
        </DialogDescription>
      </DialogHeader>

      <Alert v-if="error" variant="destructive" class="mb-4">
        <AlertDescription>{{ error }}</AlertDescription>
      </Alert>

      <div class="grid gap-4 py-4">
        <!-- 课程 -->
        <div class="grid grid-cols-4 items-center gap-4">
          <Label class="text-right text-red-500">课程 *</Label>
          <div class="col-span-3">
            <Select v-model="formData.courseId" :disabled="isLoadingCourses || isEditMode">
              <SelectTrigger>
                <SelectValue placeholder="选择课程" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="course in courses" :key="course.id" :value="course.id">
                  {{ course.code }} - {{ course.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <!-- 学期 -->
        <div class="grid grid-cols-4 items-center gap-4">
          <Label class="text-right text-red-500">学期 *</Label>
          <div class="col-span-3">
            <Select v-model="formData.semesterId" :disabled="isLoadingSemesters || isEditMode">
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
        </div>

        <!-- 课程类型 -->
        <div class="grid grid-cols-4 items-center gap-4">
          <Label class="text-right text-red-500">课程类型 *</Label>
          <div class="col-span-3">
            <Select v-model="formData.courseType">
              <SelectTrigger>
                <SelectValue placeholder="选择课程类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="REQUIRED">必修</SelectItem>
                <SelectItem value="LIMITED_ELECTIVE">限选</SelectItem>
                <SelectItem value="OPEN_ELECTIVE">任选</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <!-- 容量 -->
        <div class="grid grid-cols-4 items-center gap-4">
          <Label class="text-right">总容量</Label>
          <Input
            v-model.number="formData.capacity"
            type="number"
            class="col-span-3"
            placeholder="选课容量限制"
          />
        </div>

        <!-- 面向年级 -->
        <div class="grid grid-cols-4 items-center gap-4">
          <Label class="text-right">面向年级</Label>
          <Input
            v-model.number="formData.targetGradeLevel"
            type="number"
            class="col-span-3"
            placeholder="1-10，留空表示不限"
          />
        </div>

        <!-- 允许重修 -->
        <div class="grid grid-cols-4 items-center gap-4">
          <Label class="text-right">允许重修</Label>
          <div class="col-span-3 flex items-center">
            <Switch v-model:checked="formData.allowRetake" />
            <span class="ml-2 text-sm text-muted-foreground">
              {{ formData.allowRetake ? '是' : '否' }}
            </span>
          </div>
        </div>

        <!-- 备注 -->
        <div class="grid grid-cols-4 items-center gap-4">
          <Label class="text-right">备注</Label>
          <Textarea v-model="formData.remark" class="col-span-3" placeholder="备注信息" rows="3" />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" :disabled="isLoading" @click="open = false"> 取消 </Button>
        <Button :disabled="isLoading" @click="handleSubmit">
          {{ isLoading ? '提交中...' : isEditMode ? '保存' : '创建' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
