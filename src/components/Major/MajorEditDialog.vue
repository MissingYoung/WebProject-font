<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { createMajor, getDepartmentList,updateMajor, } from '@/lib/api' 
import type { CreateMajorPayload, MajorVO, DepartmentVO } from '@/types'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'

const emit = defineEmits(['success'])

const open = ref(false)
const isLoading = ref(false)
const error = ref<string | null>(null)

// 模式标记 (预留编辑功能)
const isEditMode = ref(false)
const currentId = ref<number | null>(null)

// 部门下拉选项数据
const departmentOptions = ref<DepartmentVO[]>([])

// 初始数据
const initialState: CreateMajorPayload = {
  departmentId: undefined as unknown as number, // 必填，初始为空
  code: '',
  name: '',
  degreeLevel: 'BACHELOR', // 默认本科
  durationYears: 4, // 默认4年
  remark: ''
}

const formData = reactive<CreateMajorPayload>({ ...initialState })

// 学位字典映射
const degreeMap: Record<string, string> = {
  'ASSOCIATE': '专科 (Associate)',
  'BACHELOR': '本科 (Bachelor)',
  'MASTER': '硕士 (Master)',
  'DOCTOR': '博士 (Doctor)'
}

// 获取部门列表 (用于下拉框)
const fetchDepartments = async () => {
  try {
    const res = await getDepartmentList({ pageNum: 1, pageSize: 100, status: 'ACTIVE' })
    if (res && res.data) {
      departmentOptions.value = res.data.records
    }
  } catch (err) {
    console.error('加载部门列表失败', err)
  }
}

// 打开弹窗方法
const openDialog = (major?: MajorVO) => {
  open.value = true
  error.value = null
  
  // 每次打开都尝试刷新一下部门列表，防止新建了部门这里没更新
  if (departmentOptions.value.length === 0) {
    fetchDepartments()
  }

  if (major) {
    // 编辑模式 
    isEditMode.value = true
    currentId.value = major.id
    Object.assign(formData, {
      departmentId: major.departmentId,
      code: major.code,
      name: major.name,
      degreeLevel: major.degreeLevel,
      durationYears: major.durationYears,
      remark: major.remark || ''
    })
  } else {
    // --- 新增模式 ---
    isEditMode.value = false
    currentId.value = null
    Object.assign(formData, initialState)// 重置表单
  }
}

defineExpose({ openDialog })

// 组件挂载时获取部门
onMounted(() => {
  fetchDepartments()
})

// 提交逻辑
const handleSubmit = async () => {
  // 校验
  if (!formData.departmentId) {
    error.value = '请选择所属学院'
    return
  }
  if (!formData.code || !formData.name) {
    error.value = '专业编码和名称为必填项'
    return
  }

  isLoading.value = true
  error.value = null

  try {
    // 数据转换
    const payload = {
      ...formData,
      departmentId: Number(formData.departmentId),
      durationYears: Number(formData.durationYears)
    }

    if (isEditMode.value && currentId.value) {
      // 更新接口
      await updateMajor(currentId.value, payload)
      console.log('专业更新成功')
    } else {
      // 调用创建接口
      await createMajor(payload)
      console.log('专业创建成功')
    }

    console.log('专业操作成功')
    open.value = false
    emit('success')

  } catch (err: any) {
    error.value = err.message ||  (isEditMode.value ? '更新失败' : '创建失败')
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="(val) => open = val">
    <DialogContent class="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle>{{ isEditMode ? '编辑专业' : '添加专业' }}</DialogTitle>
        <DialogDescription>
          {{ isEditMode ? '修改下方信息并保存。' : '请填写专业的基本信息。' }}。
        </DialogDescription>
      </DialogHeader>

      <Alert v-if="error" variant="destructive" class="mb-4">
        <AlertDescription>{{ error }}</AlertDescription>
      </Alert>

      <div class="grid gap-4 py-4">
        <!-- 1. 所属学院 (下拉框) -->
        <div class="grid gap-2">
          <Label for="deptId" class="text-red-500">所属学院 *</Label>
          <Select 
            :model-value="formData.departmentId?.toString()" 
            @update:model-value="(v) => formData.departmentId = Number(v)"
          >
            <SelectTrigger>
              <SelectValue placeholder="请选择所属学院/部门" />
            </SelectTrigger>
            <SelectContent class="max-h-[200px]">
              <SelectItem 
                v-for="dept in departmentOptions" 
                :key="dept.id" 
                :value="dept.id.toString()"
              >
                {{ dept.name }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- 2. 专业名称 & 编码 -->
        <div class="grid grid-cols-2 gap-4">
          <div class="grid gap-2">
            <Label for="name" class="text-red-500">专业名称 *</Label>
            <Input id="name" v-model="formData.name" placeholder="例如: 软件工程" />
          </div>
          <div class="grid gap-2">
            <Label for="code" class="text-red-500">专业编码 *</Label>
            <Input id="code" v-model="formData.code" placeholder="例如: SE001" :disabled="isEditMode" />
          </div>
        </div>

        <!-- 3. 学位层次 & 学制 -->
        <div class="grid grid-cols-2 gap-4">
          <div class="grid gap-2">
            <Label class="text-red-500">学位层次 *</Label>
            <Select 
              :model-value="formData.degreeLevel" 
              @update:model-value="(v) => formData.degreeLevel = v as any"
            >
              <SelectTrigger>
                <SelectValue placeholder="选择学位" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ASSOCIATE">专科 (Associate)</SelectItem>
                <SelectItem value="BACHELOR">本科 (Bachelor)</SelectItem>
                <SelectItem value="MASTER">硕士 (Master)</SelectItem>
                <SelectItem value="DOCTOR">博士 (Doctor)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="grid gap-2">
            <Label for="duration">学制 (年)</Label>
            <Input id="duration" type="number" v-model.number="formData.durationYears" />
          </div>
        </div>

        <!-- 4. 备注 -->
        <div class="grid gap-2">
          <Label for="remark">备注</Label>
          <Textarea id="remark" v-model="formData.remark" placeholder="请输入相关备注..." />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="open = false" :disabled="isLoading">取消</Button>
        <Button @click="handleSubmit" :disabled="isLoading">
          <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
          {{ isEditMode ? '保存修改' : '确认创建' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>