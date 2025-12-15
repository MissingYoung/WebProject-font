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
  TeachingClassVO,
  CreateTeachingClassPayload,
  CourseOfferingVO,
  TeacherVO,
} from '@/types'
import {
  createTeachingClass,
  updateTeachingClass,
  getCourseOfferingList,
  getTeacherList,
} from '@/lib/api'

const emit = defineEmits(['success'])

const open = ref(false)
const isLoading = ref(false)
const error = ref<string | null>(null)
const isEditMode = ref(false)
const currentId = ref<number | null>(null)

// 下拉选项
const courseOfferings = ref<CourseOfferingVO[]>([])
const teachers = ref<TeacherVO[]>([])
const isLoadingOfferings = ref(false)
const isLoadingTeachers = ref(false)

// 表单初始状态
const initialState: CreateTeachingClassPayload = {
  courseOfferingId: 0,
  code: '',
  name: '',
  capacity: undefined,
  teacherId: undefined,
}

const formData = reactive<CreateTeachingClassPayload>({ ...initialState })

// 加载开课列表
const loadCourseOfferings = async () => {
  isLoadingOfferings.value = true
  try {
    const res = await getCourseOfferingList({ pageNum: 1, pageSize: 200 })
    if (res?.data) {
      courseOfferings.value = res.data.records
    }
  } catch (err: unknown) {
    console.error('加载开课列表失败', err)
    toast.error('加载开课列表失败')
  } finally {
    isLoadingOfferings.value = false
  }
}

// 加载教师列表
const loadTeachers = async () => {
  isLoadingTeachers.value = true
  try {
    const res = await getTeacherList({ pageNum: 1, pageSize: 200, status: 'ACTIVE' })
    if (res?.data) {
      teachers.value = res.data.records
    }
  } catch (err: unknown) {
    console.error('加载教师列表失败', err)
    toast.error('加载教师列表失败')
  } finally {
    isLoadingTeachers.value = false
  }
}

// 打开对话框
const openDialog = (item?: TeachingClassVO) => {
  open.value = true
  error.value = null

  if (item) {
    isEditMode.value = true
    currentId.value = item.id
    formData.courseOfferingId = item.courseOfferingId
    formData.code = item.code
    formData.name = item.name
    formData.capacity = item.capacity
    formData.teacherId = item.teacherId
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
  if (!formData.courseOfferingId) {
    error.value = '请选择开课'
    return
  }
  if (!formData.code.trim()) {
    error.value = '请输入教学班编码'
    return
  }
  if (!formData.name.trim()) {
    error.value = '请输入教学班名称'
    return
  }

  isLoading.value = true
  error.value = null

  try {
    const payload: CreateTeachingClassPayload = {
      courseOfferingId: Number(formData.courseOfferingId),
      code: formData.code.trim(),
      name: formData.name.trim(),
      capacity: formData.capacity ? Number(formData.capacity) : undefined,
      teacherId: formData.teacherId ? Number(formData.teacherId) : undefined,
    }

    if (isEditMode.value && currentId.value) {
      await updateTeachingClass(currentId.value, payload)
      toast.success('更新成功')
    } else {
      await createTeachingClass(payload)
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
  loadCourseOfferings()
  loadTeachers()
})
</script>

<template>
  <Dialog :open="open" @update:open="(v) => (open = v)">
    <DialogContent class="sm:max-w-[550px]">
      <DialogHeader>
        <DialogTitle>{{ isEditMode ? '编辑教学班' : '新增教学班' }}</DialogTitle>
        <DialogDescription>
          {{ isEditMode ? '修改教学班信息' : '创建新的教学班' }}
        </DialogDescription>
      </DialogHeader>

      <Alert v-if="error" variant="destructive" class="mb-4">
        <AlertDescription>{{ error }}</AlertDescription>
      </Alert>

      <div class="grid gap-4 py-4">
        <!-- 开课 -->
        <div class="grid grid-cols-4 items-center gap-4">
          <Label class="text-right text-red-500">开课 *</Label>
          <div class="col-span-3">
            <Select
              v-model="formData.courseOfferingId"
              :disabled="isLoadingOfferings || isEditMode"
            >
              <SelectTrigger>
                <SelectValue placeholder="选择开课" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="offering in courseOfferings"
                  :key="offering.id"
                  :value="offering.id"
                >
                  {{ offering.courseCode }} - {{ offering.courseName }} ({{
                    offering.semesterName
                  }})
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <!-- 教学班编码 -->
        <div class="grid grid-cols-4 items-center gap-4">
          <Label class="text-right text-red-500">编码 *</Label>
          <Input
            v-model="formData.code"
            class="col-span-3"
            placeholder="请输入教学班编码"
            :disabled="isEditMode"
          />
        </div>

        <!-- 教学班名称 -->
        <div class="grid grid-cols-4 items-center gap-4">
          <Label class="text-right text-red-500">名称 *</Label>
          <Input v-model="formData.name" class="col-span-3" placeholder="请输入教学班名称" />
        </div>

        <!-- 容量 -->
        <div class="grid grid-cols-4 items-center gap-4">
          <Label class="text-right">容量</Label>
          <Input
            v-model.number="formData.capacity"
            type="number"
            class="col-span-3"
            placeholder="选课容量限制"
          />
        </div>

        <!-- 主讲教师 -->
        <div class="grid grid-cols-4 items-center gap-4">
          <Label class="text-right">主讲教师</Label>
          <div class="col-span-3">
            <Select v-model="formData.teacherId" :disabled="isLoadingTeachers">
              <SelectTrigger>
                <SelectValue placeholder="选择主讲教师" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="teacher in teachers"
                  :key="teacher.teacherId"
                  :value="teacher.teacherId"
                >
                  {{ teacher.realName }} ({{ teacher.sduId }})
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
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
