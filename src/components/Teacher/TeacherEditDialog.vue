<script setup lang="ts">
import { reactive, ref } from 'vue'
import { updateTeacherInfo, getDepartmentList } from '@/lib/api'
import type { TeacherVO, UpdateTeacherInfoRequest, DepartmentVO } from '@/types'
import { Loader2 } from 'lucide-vue-next'

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

// 当前教师信息
const currentTeacher = ref<TeacherVO | null>(null)

// 下拉选项数据
const departments = ref<DepartmentVO[]>([])
const isLoadingDepartments = ref(false)

// 初始数据
const initialState: UpdateTeacherInfoRequest = {
  departmentId: 0,
  title: '',
}

const formData = reactive<UpdateTeacherInfoRequest>({ ...initialState })

// 加载部门列表
const loadDepartments = async () => {
  isLoadingDepartments.value = true
  try {
    const res = await getDepartmentList({ pageNum: 1, pageSize: 100, status: 'ACTIVE' })
    if (res && res.data) {
      departments.value = res.data.records
    }
  } catch (err) {
    console.error('加载部门列表失败', err)
  } finally {
    isLoadingDepartments.value = false
  }
}

// 打开弹窗方法
const openDialog = (teacher: TeacherVO) => {
  open.value = true
  error.value = null
  currentTeacher.value = teacher

  // 回显数据
  Object.assign(formData, {
    departmentId: teacher.departmentId || 0,
    title: teacher.title || '',
  })

  // 加载下拉选项
  loadDepartments()
}

defineExpose({ openDialog })

// 提交逻辑
const handleSubmit = async () => {
  // 基础校验
  if (!formData.departmentId) {
    error.value = '所属部门为必填项'
    return
  }

  if (!currentTeacher.value) {
    error.value = '教师信息无效'
    return
  }

  isLoading.value = true
  error.value = null

  try {
    await updateTeacherInfo(currentTeacher.value.userId, formData)
    open.value = false
    emit('success')
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '更新失败'
    error.value = message
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="(val) => (open = val)">
    <DialogContent class="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>编辑教师工作信息</DialogTitle>
        <DialogDescription>
          修改教师：{{ currentTeacher?.realName }}（{{ currentTeacher?.sduId }}）的工作信息
        </DialogDescription>
      </DialogHeader>

      <Alert v-if="error" variant="destructive" class="mb-4">
        <AlertDescription>{{ error }}</AlertDescription>
      </Alert>

      <div class="grid gap-4 py-4">
        <!-- 1. 所属部门 -->
        <div class="grid gap-2">
          <Label class="text-red-500">所属部门 *</Label>
          <Select
            :model-value="formData.departmentId ? String(formData.departmentId) : undefined"
            @update:model-value="(v) => (formData.departmentId = Number(v))"
          >
            <SelectTrigger :disabled="isLoadingDepartments">
              <SelectValue placeholder="请选择部门" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="dept in departments" :key="dept.id" :value="String(dept.id)">
                {{ dept.name }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- 2. 职称 -->
        <div class="grid gap-2">
          <Label>职称</Label>
          <Input v-model="formData.title" placeholder="例如: 教授、副教授、讲师" />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" :disabled="isLoading" @click="open = false">取消</Button>
        <Button :disabled="isLoading" @click="handleSubmit">
          <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
          保存修改
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
