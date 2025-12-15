<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { updateStudentInfo, getDepartmentList, getMajorList } from '@/lib/api'
import type { StudentVO, UpdateStudentInfoRequest, DepartmentVO, MajorVO } from '@/types'
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

// 当前学生信息
const currentStudent = ref<StudentVO | null>(null)

// 下拉选项数据
const departments = ref<DepartmentVO[]>([])
const majors = ref<MajorVO[]>([])
const isLoadingDepartments = ref(false)
const isLoadingMajors = ref(false)

// 初始数据
const initialState: UpdateStudentInfoRequest = {
  departmentId: 0,
  majorId: 0,
  administrativeClassId: undefined,
  entryYear: undefined,
  gradeLevel: undefined,
}

const formData = reactive<UpdateStudentInfoRequest>({ ...initialState })

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

// 加载专业列表
const loadMajors = async (departmentId?: number) => {
  isLoadingMajors.value = true
  try {
    const params: { pageNum: number; pageSize: number; status: 'ACTIVE'; departmentId?: number } = {
      pageNum: 1,
      pageSize: 100,
      status: 'ACTIVE',
    }
    if (departmentId) {
      params.departmentId = departmentId
    }
    const res = await getMajorList(params)
    if (res && res.data) {
      majors.value = res.data.records
    }
  } catch (err) {
    console.error('加载专业列表失败', err)
  } finally {
    isLoadingMajors.value = false
  }
}

// 监听部门变化，重新加载专业
watch(
  () => formData.departmentId,
  (newVal) => {
    if (newVal) {
      loadMajors(newVal)
      // 如果部门变了，清空专业选择
      if (currentStudent.value && newVal !== currentStudent.value.departmentId) {
        formData.majorId = 0
      }
    }
  }
)

// 打开弹窗方法
const openDialog = (student: StudentVO) => {
  open.value = true
  error.value = null
  currentStudent.value = student

  // 回显数据
  Object.assign(formData, {
    departmentId: student.departmentId || 0,
    majorId: student.majorId || 0,
    administrativeClassId: student.administrativeClassId,
    entryYear: student.entryYear,
    gradeLevel: student.gradeLevel,
  })

  // 加载下拉选项
  loadDepartments()
  if (student.departmentId) {
    loadMajors(student.departmentId)
  }
}

defineExpose({ openDialog })

// 提交逻辑
const handleSubmit = async () => {
  // 基础校验
  if (!formData.departmentId || !formData.majorId) {
    error.value = '所属学院和专业为必填项'
    return
  }

  if (!currentStudent.value) {
    error.value = '学生信息无效'
    return
  }

  isLoading.value = true
  error.value = null

  try {
    await updateStudentInfo(currentStudent.value.userId, formData)
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
        <DialogTitle>编辑学生学业信息</DialogTitle>
        <DialogDescription>
          修改学生：{{ currentStudent?.realName }}（{{ currentStudent?.sduId }}）的学业信息
        </DialogDescription>
      </DialogHeader>

      <Alert v-if="error" variant="destructive" class="mb-4">
        <AlertDescription>{{ error }}</AlertDescription>
      </Alert>

      <div class="grid gap-4 py-4">
        <!-- 1. 所属学院 -->
        <div class="grid gap-2">
          <Label class="text-red-500">所属学院 *</Label>
          <Select
            :model-value="formData.departmentId ? String(formData.departmentId) : undefined"
            @update:model-value="(v) => (formData.departmentId = Number(v))"
          >
            <SelectTrigger :disabled="isLoadingDepartments">
              <SelectValue placeholder="请选择学院" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="dept in departments" :key="dept.id" :value="String(dept.id)">
                {{ dept.name }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- 2. 所属专业 -->
        <div class="grid gap-2">
          <Label class="text-red-500">所属专业 *</Label>
          <Select
            :model-value="formData.majorId ? String(formData.majorId) : undefined"
            @update:model-value="(v) => (formData.majorId = Number(v))"
          >
            <SelectTrigger :disabled="isLoadingMajors || !formData.departmentId">
              <SelectValue placeholder="请先选择学院" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="major in majors" :key="major.id" :value="String(major.id)">
                {{ major.name }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- 3. 行政班ID & 入学年份 -->
        <div class="grid grid-cols-2 gap-4">
          <div class="grid gap-2">
            <Label>行政班 ID</Label>
            <Input
              v-model.number="formData.administrativeClassId"
              type="number"
              placeholder="行政班 ID"
            />
          </div>
          <div class="grid gap-2">
            <Label>入学年份</Label>
            <Input v-model.number="formData.entryYear" type="number" placeholder="例如: 2023" />
          </div>
        </div>

        <!-- 4. 年级 -->
        <div class="grid gap-2">
          <Label>年级</Label>
          <Input v-model.number="formData.gradeLevel" type="number" placeholder="例如: 1" />
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
