<script setup lang="ts">
import { reactive, ref } from 'vue'
import { createSemester, updateSemester } from '@/lib/api'
import type { CreateSemesterPayload, SemesterVO } from '@/types'
import { Loader2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

// Shadcn UI 组件
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const emit = defineEmits(['success'])

const open = ref(false)
const isLoading = ref(false)
const error = ref<string | null>(null)

// 模式标记
const isEditMode = ref(false)
const currentId = ref<number | null>(null)

// 初始数据
const initialState: CreateSemesterPayload = {
  academicYear: '',
  termOrder: 1,
  name: '',
  startDate: '',
  endDate: '',
  weekCount: undefined,
}

const formData = reactive<CreateSemesterPayload>({ ...initialState })

// 打开弹窗方法
const openDialog = (semester?: SemesterVO) => {
  open.value = true
  error.value = null

  if (semester) {
    // --- 编辑模式 ---
    isEditMode.value = true
    currentId.value = semester.id
    // 回显数据
    Object.assign(formData, {
      academicYear: semester.academicYear,
      termOrder: semester.termOrder,
      name: semester.name,
      startDate: semester.startDate,
      endDate: semester.endDate,
      weekCount: semester.weekCount,
    })
  } else {
    // --- 新增模式 ---
    isEditMode.value = false
    currentId.value = null
    Object.assign(formData, initialState)
  }
}

defineExpose({ openDialog })

// 提交逻辑
const handleSubmit = async () => {
  // 基础校验
  if (!formData.academicYear || !formData.name || !formData.startDate || !formData.endDate) {
    error.value = '学年、学期名称、开始日期和结束日期为必填项'
    return
  }

  if (formData.termOrder < 1) {
    error.value = '学期序号必须大于等于 1'
    return
  }

  // 日期校验
  if (new Date(formData.startDate) >= new Date(formData.endDate)) {
    error.value = '结束日期必须晚于开始日期'
    return
  }

  isLoading.value = true
  error.value = null

  try {
    const payload: CreateSemesterPayload = {
      academicYear: formData.academicYear,
      termOrder: Number(formData.termOrder),
      name: formData.name,
      startDate: formData.startDate,
      endDate: formData.endDate,
      weekCount: formData.weekCount ? Number(formData.weekCount) : undefined,
    }

    if (isEditMode.value && currentId.value) {
      await updateSemester(currentId.value, payload)
      toast.success('学期更新成功')
    } else {
      await createSemester(payload)
      toast.success('学期创建成功')
    }

    open.value = false
    emit('success') // 通知父组件刷新列表
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '操作失败'
    error.value = message
    toast.error(message)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="(val) => (open = val)">
    <DialogContent class="sm:max-w-[550px]">
      <DialogHeader>
        <DialogTitle>{{ isEditMode ? '编辑学期' : '添加学期' }}</DialogTitle>
        <DialogDescription> 填写学期的基本信息。 </DialogDescription>
      </DialogHeader>

      <Alert v-if="error" variant="destructive" class="mb-4">
        <AlertDescription>{{ error }}</AlertDescription>
      </Alert>

      <div class="grid gap-4 py-4">
        <!-- 1. 学年 & 学期名称 -->
        <div class="grid grid-cols-2 gap-4">
          <div class="grid gap-2">
            <Label for="academicYear" class="text-red-500">学年 *</Label>
            <Input
              id="academicYear"
              v-model="formData.academicYear"
              placeholder="例如: 2024-2025"
            />
          </div>
          <div class="grid gap-2">
            <Label for="name" class="text-red-500">学期名称 *</Label>
            <Input id="name" v-model="formData.name" placeholder="例如: 2024-2025学年秋季学期" />
          </div>
        </div>

        <!-- 2. 学期序号 & 周数 -->
        <div class="grid grid-cols-2 gap-4">
          <div class="grid gap-2">
            <Label for="termOrder" class="text-red-500">学期序号 *</Label>
            <Select
              :model-value="String(formData.termOrder)"
              @update:model-value="(v) => (formData.termOrder = Number(v))"
            >
              <SelectTrigger>
                <SelectValue placeholder="选择学期序号" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 - 秋季学期</SelectItem>
                <SelectItem value="2">2 - 春季学期</SelectItem>
                <SelectItem value="3">3 - 夏季学期</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="grid gap-2">
            <Label for="weekCount">教学周数</Label>
            <Input
              id="weekCount"
              v-model="formData.weekCount"
              type="number"
              min="1"
              placeholder="例如: 18"
            />
          </div>
        </div>

        <!-- 3. 开始日期 & 结束日期 -->
        <div class="grid grid-cols-2 gap-4">
          <div class="grid gap-2">
            <Label for="startDate" class="text-red-500">开始日期 *</Label>
            <Input id="startDate" v-model="formData.startDate" type="date" />
          </div>
          <div class="grid gap-2">
            <Label for="endDate" class="text-red-500">结束日期 *</Label>
            <Input id="endDate" v-model="formData.endDate" type="date" />
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" :disabled="isLoading" @click="open = false">取消</Button>
        <Button :disabled="isLoading" @click="handleSubmit">
          <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
          {{ isEditMode ? '保存修改' : '确认创建' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
