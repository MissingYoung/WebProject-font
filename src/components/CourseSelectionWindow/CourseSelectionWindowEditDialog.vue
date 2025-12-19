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
  CourseSelectionWindowVO,
  CreateSelectionWindowPayload,
  SemesterVO,
  CourseType,
} from '@/types'
import { createSelectionWindow, updateSelectionWindow, getSemesterList } from '@/lib/api'

const emit = defineEmits(['success'])

const open = ref(false)
const isLoading = ref(false)
const error = ref<string | null>(null)
const isEditMode = ref(false)
const currentId = ref<number | null>(null)

// 下拉选项
const semesters = ref<SemesterVO[]>([])
const isLoadingSemesters = ref(false)

// 表单初始状态
const initialState: CreateSelectionWindowPayload = {
  semesterId: 0,
  name: '',
  courseType: 'REQUIRED' as CourseType,
  startTime: '',
  endTime: '',
  remark: '',
}

const formData = reactive<CreateSelectionWindowPayload>({ ...initialState })

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

// 打开对话框
const openDialog = (item?: CourseSelectionWindowVO) => {
  open.value = true
  error.value = null

  if (item) {
    isEditMode.value = true
    currentId.value = item.id
    formData.semesterId = item.semesterId
    formData.name = item.name
    formData.courseType = item.courseType
    formData.startTime = item.startTime ? item.startTime.slice(0, 16) : ''
    formData.endTime = item.endTime ? item.endTime.slice(0, 16) : ''
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
  if (!formData.semesterId) {
    error.value = '请选择学期'
    return
  }
  if (!formData.name.trim()) {
    error.value = '请输入窗口名称'
    return
  }
  if (!formData.startTime) {
    error.value = '请选择开始时间'
    return
  }
  if (!formData.endTime) {
    error.value = '请选择结束时间'
    return
  }

  isLoading.value = true
  error.value = null

  try {
    const payload: CreateSelectionWindowPayload = {
      semesterId: Number(formData.semesterId),
      name: formData.name.trim(),
      courseType: formData.courseType,
      startTime: formData.startTime + ':00+08:00',
      endTime: formData.endTime + ':00+08:00',
      remark: formData.remark || undefined,
    }

    if (isEditMode.value && currentId.value) {
      await updateSelectionWindow(currentId.value, payload)
      toast.success('更新成功')
    } else {
      await createSelectionWindow(payload)
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
})
</script>

<template>
  <Dialog :open="open" @update:open="(v) => (open = v)">
    <DialogContent class="sm:max-w-[550px]">
      <DialogHeader>
        <DialogTitle>{{ isEditMode ? '编辑选课窗口' : '新增选课窗口' }}</DialogTitle>
        <DialogDescription>
          {{ isEditMode ? '修改选课窗口信息' : '创建新的选课时间窗口' }}
        </DialogDescription>
      </DialogHeader>

      <Alert v-if="error" variant="destructive" class="mb-4">
        <AlertDescription>{{ error }}</AlertDescription>
      </Alert>

      <div class="grid gap-4 py-4">
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

        <!-- 窗口名称 -->
        <div class="grid grid-cols-4 items-center gap-4">
          <Label class="text-right text-red-500">名称 *</Label>
          <Input v-model="formData.name" class="col-span-3" placeholder="请输入窗口名称" />
        </div>

        <!-- 课程类型 -->
        <div class="grid grid-cols-4 items-center gap-4">
          <Label class="text-right">课程类型</Label>
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

        <!-- 开始时间 -->
        <div class="grid grid-cols-4 items-center gap-4">
          <Label class="text-right text-red-500">开始时间 *</Label>
          <Input v-model="formData.startTime" type="datetime-local" class="col-span-3" />
        </div>

        <!-- 结束时间 -->
        <div class="grid grid-cols-4 items-center gap-4">
          <Label class="text-right text-red-500">结束时间 *</Label>
          <Input v-model="formData.endTime" type="datetime-local" class="col-span-3" />
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
