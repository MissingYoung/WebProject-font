<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { createMajor, updateMajor, getDepartmentList } from '@/lib/api'
import type { CreateMajorPayload, MajorVO, DegreeLevel, DepartmentVO } from '@/types'
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
import { Textarea } from '@/components/ui/textarea'
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

// 部门列表（用于选择所属学院）
const departmentList = ref<DepartmentVO[]>([])
const isLoadingDepartments = ref(false)

// 模式标记
const isEditMode = ref(false)
const currentId = ref<number | null>(null)

// 学位等级选项
const degreeLevelOptions: { value: DegreeLevel; label: string }[] = [
  { value: 'ASSOCIATE', label: '专科' },
  { value: 'BACHELOR', label: '本科' },
  { value: 'MASTER', label: '硕士' },
  { value: 'DOCTOR', label: '博士' },
]

// 初始数据
const initialState: CreateMajorPayload = {
  departmentId: 0,
  code: '',
  name: '',
  degreeLevel: 'BACHELOR',
  durationYears: 4,
  remark: '',
}

const formData = reactive<CreateMajorPayload>({ ...initialState })

// 获取部门列表
const fetchDepartments = async () => {
  isLoadingDepartments.value = true
  try {
    const res = await getDepartmentList({
      pageNum: 1,
      pageSize: 100,
      status: 'ACTIVE',
    })
    if (res && res.data) {
      departmentList.value = res.data.records
    }
  } catch (err: unknown) {
    console.error('获取部门列表失败', err)
    toast.error('获取部门列表失败')
  } finally {
    isLoadingDepartments.value = false
  }
}

// 打开弹窗方法
const openDialog = (major?: MajorVO) => {
  open.value = true
  error.value = null

  // 如果部门列表为空，先加载
  if (departmentList.value.length === 0) {
    fetchDepartments()
  }

  if (major) {
    // --- 编辑模式 ---
    isEditMode.value = true
    currentId.value = major.id
    // 回显数据
    Object.assign(formData, {
      departmentId: major.departmentId,
      code: major.code,
      name: major.name,
      degreeLevel: major.degreeLevel,
      durationYears: major.durationYears || 4,
      remark: major.remark || '',
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
  if (!formData.departmentId || !formData.code || !formData.name || !formData.degreeLevel) {
    error.value = '所属学院、专业编码、专业名称和学位等级为必填项'
    return
  }

  isLoading.value = true
  error.value = null

  try {
    const payload: CreateMajorPayload = {
      departmentId: Number(formData.departmentId),
      code: formData.code,
      name: formData.name,
      degreeLevel: formData.degreeLevel,
      durationYears: formData.durationYears ? Number(formData.durationYears) : undefined,
      remark: formData.remark || undefined,
    }

    if (isEditMode.value && currentId.value) {
      await updateMajor(currentId.value, payload)
      toast.success('专业更新成功')
    } else {
      await createMajor(payload)
      toast.success('专业创建成功')
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

// 组件挂载时加载部门列表
onMounted(() => {
  fetchDepartments()
})
</script>

<template>
  <Dialog :open="open" @update:open="(val) => (open = val)">
    <DialogContent class="sm:max-w-[550px]">
      <DialogHeader>
        <DialogTitle>{{ isEditMode ? '编辑专业' : '添加专业' }}</DialogTitle>
        <DialogDescription> 填写专业的基本信息。 </DialogDescription>
      </DialogHeader>

      <Alert v-if="error" variant="destructive" class="mb-4">
        <AlertDescription>{{ error }}</AlertDescription>
      </Alert>

      <div class="grid gap-4 py-4">
        <!-- 1. 所属学院 -->
        <div class="grid gap-2">
          <Label for="departmentId" class="text-red-500">所属学院 *</Label>
          <Select
            :model-value="formData.departmentId ? String(formData.departmentId) : undefined"
            @update:model-value="(v) => (formData.departmentId = Number(v))"
          >
            <SelectTrigger>
              <SelectValue placeholder="选择所属学院" />
            </SelectTrigger>
            <SelectContent>
              <div v-if="isLoadingDepartments" class="p-2 text-center text-muted-foreground">
                <Loader2 class="h-4 w-4 animate-spin inline mr-2" />
                加载中...
              </div>
              <SelectItem
                v-for="dept in departmentList"
                v-else
                :key="dept.id"
                :value="String(dept.id)"
              >
                {{ dept.name }} ({{ dept.code }})
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- 2. 专业编码 & 专业名称 -->
        <div class="grid grid-cols-2 gap-4">
          <div class="grid gap-2">
            <Label for="code" class="text-red-500">专业编码 *</Label>
            <Input
              id="code"
              v-model="formData.code"
              placeholder="例如: CS001"
              :disabled="isEditMode"
            />
          </div>
          <div class="grid gap-2">
            <Label for="name" class="text-red-500">专业名称 *</Label>
            <Input id="name" v-model="formData.name" placeholder="例如: 计算机科学与技术" />
          </div>
        </div>

        <!-- 3. 学位等级 & 学制 -->
        <div class="grid grid-cols-2 gap-4">
          <div class="grid gap-2">
            <Label for="degreeLevel" class="text-red-500">学位等级 *</Label>
            <Select
              :model-value="formData.degreeLevel"
              @update:model-value="(v) => (formData.degreeLevel = v as DegreeLevel)"
            >
              <SelectTrigger>
                <SelectValue placeholder="选择学位等级" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="option in degreeLevelOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="grid gap-2">
            <Label for="durationYears">学制（年）</Label>
            <Input
              id="durationYears"
              v-model="formData.durationYears"
              type="number"
              min="1"
              max="10"
              placeholder="例如: 4"
            />
          </div>
        </div>

        <!-- 4. 备注 -->
        <div class="grid gap-2">
          <Label for="remark">备注</Label>
          <Textarea id="remark" v-model="formData.remark" placeholder="请输入备注信息..." />
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
