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
  AdministrativeClassVO,
  CreateAdministrativeClassPayload,
  MajorVO,
  TeacherVO,
} from '@/types'
import {
  createAdministrativeClass,
  updateAdministrativeClass,
  getMajorList,
  getTeacherList,
} from '@/lib/api'

const emit = defineEmits(['success'])

const open = ref(false)
const isLoading = ref(false)
const error = ref<string | null>(null)
const isEditMode = ref(false)
const currentId = ref<number | null>(null)

// 下拉选项
const majors = ref<MajorVO[]>([])
const teachers = ref<TeacherVO[]>([])
const isLoadingMajors = ref(false)
const isLoadingTeachers = ref(false)

// 表单初始状态
const initialState: CreateAdministrativeClassPayload = {
  majorId: 0,
  code: '',
  name: '',
  entryYear: undefined,
  counselorTeacherId: undefined,
}

const formData = reactive<CreateAdministrativeClassPayload>({ ...initialState })

// 加载专业列表
const loadMajors = async () => {
  isLoadingMajors.value = true
  try {
    const res = await getMajorList({ pageNum: 1, pageSize: 200, status: 'ACTIVE' })
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
const openDialog = (item?: AdministrativeClassVO) => {
  open.value = true
  error.value = null

  if (item) {
    isEditMode.value = true
    currentId.value = item.id
    formData.majorId = item.majorId || 0
    formData.code = item.code
    formData.name = item.name
    formData.entryYear = item.entryYear
    formData.counselorTeacherId = item.counselorTeacherId
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
    error.value = '请选择所属专业'
    return
  }
  if (!formData.code.trim()) {
    error.value = '请输入班级编码'
    return
  }
  if (!formData.name.trim()) {
    error.value = '请输入班级名称'
    return
  }

  isLoading.value = true
  error.value = null

  try {
    const payload: CreateAdministrativeClassPayload = {
      majorId: Number(formData.majorId),
      code: formData.code.trim(),
      name: formData.name.trim(),
      entryYear: formData.entryYear ? Number(formData.entryYear) : undefined,
      counselorTeacherId: formData.counselorTeacherId
        ? Number(formData.counselorTeacherId)
        : undefined,
    }

    if (isEditMode.value && currentId.value) {
      await updateAdministrativeClass(currentId.value, payload)
      toast.success('更新成功')
    } else {
      await createAdministrativeClass(payload)
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
  loadTeachers()
})
</script>

<template>
  <Dialog :open="open" @update:open="(v) => (open = v)">
    <DialogContent class="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>{{ isEditMode ? '编辑行政班' : '添加行政班' }}</DialogTitle>
        <DialogDescription>
          {{ isEditMode ? '修改行政班信息' : '创建新的行政班' }}
        </DialogDescription>
      </DialogHeader>

      <Alert v-if="error" variant="destructive" class="mb-4">
        <AlertDescription>{{ error }}</AlertDescription>
      </Alert>

      <div class="grid gap-4 py-4">
        <!-- 所属专业 -->
        <div class="grid grid-cols-4 items-center gap-4">
          <Label class="text-right text-red-500">所属专业 *</Label>
          <div class="col-span-3">
            <Select v-model="formData.majorId" :disabled="isLoadingMajors">
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

        <!-- 班级编码 -->
        <div class="grid grid-cols-4 items-center gap-4">
          <Label class="text-right text-red-500">班级编码 *</Label>
          <Input
            v-model="formData.code"
            class="col-span-3"
            placeholder="请输入班级编码"
            :disabled="isEditMode"
          />
        </div>

        <!-- 班级名称 -->
        <div class="grid grid-cols-4 items-center gap-4">
          <Label class="text-right text-red-500">班级名称 *</Label>
          <Input v-model="formData.name" class="col-span-3" placeholder="请输入班级名称" />
        </div>

        <!-- 入学年份 -->
        <div class="grid grid-cols-4 items-center gap-4">
          <Label class="text-right">入学年份</Label>
          <Input
            v-model.number="formData.entryYear"
            type="number"
            class="col-span-3"
            placeholder="请输入入学年份"
          />
        </div>

        <!-- 班主任 -->
        <div class="grid grid-cols-4 items-center gap-4">
          <Label class="text-right">班主任/辅导员</Label>
          <div class="col-span-3">
            <Select v-model="formData.counselorTeacherId" :disabled="isLoadingTeachers">
              <SelectTrigger>
                <SelectValue placeholder="选择班主任" />
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
