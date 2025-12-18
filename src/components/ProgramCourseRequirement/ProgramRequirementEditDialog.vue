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
  ProgramCourseRequirementVO,
  CreateProgramCourseRequirementPayload,
  MajorVO,
  CourseVO,
  CourseType,
} from '@/types'
import {
  createProgramCourseRequirement,
  updateProgramCourseRequirement,
  getMajorList,
  getCourseList,
} from '@/lib/api'

const emit = defineEmits(['success'])

const open = ref(false)
const isLoading = ref(false)
const error = ref<string | null>(null)
const isEditMode = ref(false)
const currentId = ref<number | null>(null)

// 下拉选项
const majors = ref<MajorVO[]>([])
const courses = ref<CourseVO[]>([])
const isLoadingMajors = ref(false)
const isLoadingCourses = ref(false)

// 表单初始状态
const initialState: CreateProgramCourseRequirementPayload = {
  majorId: 0,
  courseId: 0,
  courseType: 'REQUIRED' as CourseType,
  gradeLevel: undefined,
  recommendedSemesterId: undefined,
  mandatory: true,
  remark: '',
}

const formData = reactive<CreateProgramCourseRequirementPayload>({ ...initialState })

// 加载专业列表
const loadMajors = async () => {
  isLoadingMajors.value = true
  try {
    const res = await getMajorList({ pageNum: 1, pageSize: 100, status: 'ACTIVE' })
    if (res?.data) {
      majors.value = res.data.records
    }
  } catch (err: unknown) {
    console.error('加载专业列表失败', err)
    toast.error('加载专业列表失败')
  } finally {
    isLoadingMajors.value = false
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
const openDialog = (item?: ProgramCourseRequirementVO) => {
  open.value = true
  error.value = null

  if (item) {
    isEditMode.value = true
    currentId.value = item.id
    formData.majorId = item.majorId
    formData.courseId = item.courseId
    formData.courseType = item.courseType
    formData.gradeLevel = item.gradeLevel
    formData.recommendedSemesterId = item.recommendedSemesterId
    formData.mandatory = item.mandatory ?? true
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
  if (!formData.majorId) {
    error.value = '请选择专业'
    return
  }
  if (!formData.courseId) {
    error.value = '请选择课程'
    return
  }
  if (!formData.courseType) {
    error.value = '请选择课程类型'
    return
  }

  isLoading.value = true
  error.value = null

  try {
    const payload: CreateProgramCourseRequirementPayload = {
      majorId: Number(formData.majorId),
      courseId: Number(formData.courseId),
      courseType: formData.courseType,
      gradeLevel: formData.gradeLevel ? Number(formData.gradeLevel) : undefined,
      recommendedSemesterId: formData.recommendedSemesterId
        ? Number(formData.recommendedSemesterId)
        : undefined,
      mandatory: formData.mandatory,
      remark: formData.remark || undefined,
    }

    if (isEditMode.value && currentId.value) {
      await updateProgramCourseRequirement(currentId.value, payload)
      toast.success('更新成功')
    } else {
      await createProgramCourseRequirement(payload)
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
  loadMajors()
  loadCourses()
})
</script>

<template>
  <Dialog :open="open" @update:open="(v) => (open = v)">
    <DialogContent class="sm:max-w-[550px]">
      <DialogHeader>
        <DialogTitle>{{ isEditMode ? '编辑培养计划' : '新增培养计划' }}</DialogTitle>
        <DialogDescription>
          {{ isEditMode ? '修改培养计划课程要求' : '为专业添加课程培养要求' }}
        </DialogDescription>
      </DialogHeader>

      <Alert v-if="error" variant="destructive" class="mb-4">
        <AlertDescription>{{ error }}</AlertDescription>
      </Alert>

      <div class="grid gap-4 py-4">
        <!-- 专业 -->
        <div class="grid grid-cols-4 items-center gap-4">
          <Label class="text-right text-red-500">专业 *</Label>
          <div class="col-span-3">
            <Select v-model="formData.majorId" :disabled="isLoadingMajors || isEditMode">
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
        </div>

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

        <!-- 建议年级 -->
        <div class="grid grid-cols-4 items-center gap-4">
          <Label class="text-right">建议年级</Label>
          <Input
            v-model.number="formData.gradeLevel"
            type="number"
            class="col-span-3"
            placeholder="1-4"
            min="1"
            max="10"
          />
        </div>

        <!-- 建议学期 -->
        <div class="grid grid-cols-4 items-center gap-4">
          <Label class="text-right">建议学期</Label>
          <div class="col-span-3">
            <Select v-model="formData.recommendedSemesterId">
              <SelectTrigger>
                <SelectValue placeholder="选择学期" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem :value="1">第一学期</SelectItem>
                <SelectItem :value="2">第二学期</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <!-- 是否必修 -->
        <div class="grid grid-cols-4 items-center gap-4">
          <Label class="text-right">是否必修</Label>
          <div class="col-span-3 flex items-center">
            <Switch v-model:checked="formData.mandatory" />
            <span class="ml-2 text-sm text-muted-foreground">
              {{ formData.mandatory ? '是' : '否' }}
            </span>
          </div>
        </div>

        <!-- 备注 -->
        <div class="grid grid-cols-4 items-center gap-4">
          <Label class="text-right">备注</Label>
          <Textarea v-model="formData.remark" class="col-span-3" placeholder="备注信息" rows="2" />
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
