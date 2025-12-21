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
import { useNotification } from '@/composables/useNotification'
import type { TeachingClassScheduleVO, CreateSchedulePayload, TeachingClassVO } from '@/types'
import {
  addTeachingClassSchedule,
  updateTeachingClassSchedule,
  getTeachingClassList,
} from '@/lib/api'

const { success, error: notifyError } = useNotification()

const emit = defineEmits(['success'])

const open = ref(false)
const isLoading = ref(false)
const error = ref<string | null>(null)
const isEditMode = ref(false)
const currentId = ref<number | null>(null)

// 下拉选项
const teachingClasses = ref<TeachingClassVO[]>([])
const isLoadingClasses = ref(false)

// 星期映射
const weekDays = [
  { value: 1, label: '星期一' },
  { value: 2, label: '星期二' },
  { value: 3, label: '星期三' },
  { value: 4, label: '星期四' },
  { value: 5, label: '星期五' },
  { value: 6, label: '星期六' },
  { value: 7, label: '星期日' },
]

// 表单初始状态
interface FormData extends CreateSchedulePayload {
  teachingClassId: number
}

const initialState: FormData = {
  teachingClassId: 0,
  weekDay: 1,
  startSection: 1,
  endSection: 2,
  startWeek: 1,
  endWeek: 16,
  classroom: '',
  remark: '',
}

const formData = reactive<FormData>({ ...initialState })

// 加载教学班列表
const loadTeachingClasses = async () => {
  isLoadingClasses.value = true
  try {
    const res = await getTeachingClassList({ pageNum: 1, pageSize: 100 })
    if (res?.data) {
      teachingClasses.value = res.data.records || []
    }
  } catch (err: unknown) {
    console.error('加载教学班列表失败', err)
    notifyError('加载教学班列表失败')
    teachingClasses.value = []
  } finally {
    isLoadingClasses.value = false
  }
}

// 打开对话框
const openDialog = (item?: TeachingClassScheduleVO, teachingClassId?: number) => {
  open.value = true
  error.value = null

  // 打开对话框时加载数据
  loadTeachingClasses()

  if (item) {
    isEditMode.value = true
    currentId.value = item.id
    formData.teachingClassId = item.teachingClassId
    formData.weekDay = item.weekDay
    formData.startSection = item.startSection
    formData.endSection = item.endSection
    formData.startWeek = item.startWeek || 1
    formData.endWeek = item.endWeek || 16
    formData.classroom = item.classroom || ''
    formData.remark = item.remark || ''
  } else {
    isEditMode.value = false
    currentId.value = null
    Object.assign(formData, initialState)
    if (teachingClassId) {
      formData.teachingClassId = teachingClassId
    }
  }
}

// 关闭对话框
const closeDialog = () => {
  open.value = false
}

defineExpose({ openDialog })

// 获取当前选中的教学班
const getSelectedTeachingClass = () => {
  return teachingClasses.value.find((tc) => tc.id === formData.teachingClassId)
}

// 提交表单
const handleSubmit = async () => {
  // 基础校验
  if (!formData.teachingClassId) {
    error.value = '请选择教学班'
    return
  }
  if (!formData.weekDay) {
    error.value = '请选择星期'
    return
  }
  if (!formData.startSection || !formData.endSection) {
    error.value = '请输入上课节次'
    return
  }
  if (formData.startSection > formData.endSection) {
    error.value = '开始节次不能大于结束节次'
    return
  }

  isLoading.value = true
  error.value = null

  try {
    const payload: CreateSchedulePayload = {
      weekDay: Number(formData.weekDay),
      startSection: Number(formData.startSection),
      endSection: Number(formData.endSection),
      startWeek: formData.startWeek ?? 1,
      endWeek: formData.endWeek ?? 16,
      classroom: formData.classroom || undefined,
      remark: formData.remark || undefined,
    }

    if (isEditMode.value && currentId.value) {
      await updateTeachingClassSchedule(currentId.value, payload)
      success('更新成功')
    } else {
      await addTeachingClassSchedule(formData.teachingClassId, payload)
      success('创建成功')
    }

    open.value = false
    emit('success')
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '操作失败'
    error.value = message
    notifyError(message)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadTeachingClasses()
})
</script>

<template>
  <Dialog :open="open" @update:open="closeDialog">
    <DialogContent class="sm:max-w-[550px]">
      <DialogHeader>
        <DialogTitle>{{ isEditMode ? '编辑排课' : '新增排课' }}</DialogTitle>
        <DialogDescription>
          {{ isEditMode ? '修改排课信息' : '为教学班添加上课时间安排' }}
        </DialogDescription>
      </DialogHeader>

      <Alert v-if="error" variant="destructive" class="mb-4">
        <AlertDescription>{{ error }}</AlertDescription>
      </Alert>

      <div class="grid gap-4 py-4">
        <!-- 教学班 -->
        <div class="grid grid-cols-4 items-center gap-4">
          <Label class="text-right text-red-500">教学班 *</Label>
          <div class="col-span-3">
            <Select
              :model-value="String(formData.teachingClassId)"
              :disabled="isLoadingClasses || isEditMode"
              @update:model-value="(val) => (formData.teachingClassId = Number(val))"
            >
              <SelectTrigger>
                <SelectValue placeholder="选择教学班" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="tc in teachingClasses" :key="tc.id" :value="String(tc.id)">
                  {{ tc.name }}
                  <span class="text-xs text-muted-foreground ml-1">({{ tc.courseName }})</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <!-- 课程名称（只读） -->
        <div class="grid grid-cols-4 items-center gap-4">
          <Label class="text-right">课程名称</Label>
          <div class="col-span-3 px-3 py-2 bg-muted rounded-md text-sm">
            {{ getSelectedTeachingClass()?.courseName || '-' }}
          </div>
        </div>

        <!-- 星期 -->
        <div class="grid grid-cols-4 items-center gap-4">
          <Label class="text-right text-red-500">星期 *</Label>
          <div class="col-span-3">
            <Select v-model="formData.weekDay">
              <SelectTrigger>
                <SelectValue placeholder="选择星期" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="day in weekDays" :key="day.value" :value="day.value">
                  {{ day.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <!-- 节次 -->
        <div class="grid grid-cols-4 items-center gap-4">
          <Label class="text-right text-red-500">节次 *</Label>
          <div class="col-span-3 flex gap-2 items-center">
            <Input
              v-model.number="formData.startSection"
              type="number"
              class="w-20"
              placeholder="开始"
              min="1"
              max="12"
            />
            <span class="text-muted-foreground">至</span>
            <Input
              v-model.number="formData.endSection"
              type="number"
              class="w-20"
              placeholder="结束"
              min="1"
              max="12"
            />
            <span class="text-sm text-muted-foreground">节</span>
          </div>
        </div>

        <!-- 周次 -->
        <div class="grid grid-cols-4 items-center gap-4">
          <Label class="text-right">周次</Label>
          <div class="col-span-3 flex gap-2 items-center">
            <Input
              v-model.number="formData.startWeek"
              type="number"
              class="w-20"
              placeholder="开始"
              min="1"
              max="20"
            />
            <span class="text-muted-foreground">至</span>
            <Input
              v-model.number="formData.endWeek"
              type="number"
              class="w-20"
              placeholder="结束"
              min="1"
              max="20"
            />
            <span class="text-sm text-muted-foreground">周</span>
          </div>
        </div>

        <!-- 上课地点 -->
        <div class="grid grid-cols-4 items-center gap-4">
          <Label class="text-right">上课地点</Label>
          <Input v-model="formData.classroom" class="col-span-3" placeholder="请输入上课地点" />
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
