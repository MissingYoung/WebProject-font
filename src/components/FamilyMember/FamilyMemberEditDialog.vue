<script setup lang="ts">
import { reactive, ref } from 'vue'
import { createFamilyMember, updateFamilyMember } from '@/lib/api'
import type {
  FamilyMemberVO,
  CreateFamilyMemberRequest,
  UpdateFamilyMemberRequest,
  FamilyRelationship,
  Gender,
} from '@/types'
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

// 模式标记
const isEditMode = ref(false)
const currentMemberId = ref<number | null>(null)
const currentUserId = ref<number | null>(null)

// 关系选项
const relationshipOptions: { value: FamilyRelationship; label: string }[] = [
  { value: 'FATHER', label: '父亲' },
  { value: 'MOTHER', label: '母亲' },
  { value: 'SPOUSE', label: '配偶' },
  { value: 'SON', label: '儿子' },
  { value: 'DAUGHTER', label: '女儿' },
  { value: 'BROTHER', label: '兄弟' },
  { value: 'SISTER', label: '姐妹' },
  { value: 'GRANDFATHER', label: '祖父' },
  { value: 'GRANDMOTHER', label: '祖母' },
  { value: 'OTHER', label: '其他' },
]

// 性别选项
const genderOptions: { value: Gender; label: string }[] = [
  { value: 'MALE', label: '男' },
  { value: 'FEMALE', label: '女' },
  { value: 'UNKNOWN', label: '未知' },
]

// 初始数据
const initialState = {
  name: '',
  relationship: '' as FamilyRelationship | '',
  gender: '' as Gender | '',
  phone: '',
}

const formData = reactive({ ...initialState })

// 打开弹窗方法 - 新增
const openDialogForCreate = (userId: number) => {
  open.value = true
  error.value = null
  isEditMode.value = false
  currentMemberId.value = null
  currentUserId.value = userId

  Object.assign(formData, initialState)
}

// 打开弹窗方法 - 编辑
const openDialogForEdit = (member: FamilyMemberVO) => {
  open.value = true
  error.value = null
  isEditMode.value = true
  currentMemberId.value = member.id
  currentUserId.value = member.userId

  Object.assign(formData, {
    name: member.name,
    relationship: member.relationship,
    gender: member.gender,
    phone: member.phone,
  })
}

defineExpose({ openDialogForCreate, openDialogForEdit })

// 提交逻辑
const handleSubmit = async () => {
  // 基础校验
  if (!formData.name || !formData.relationship || !formData.gender || !formData.phone) {
    error.value = '请填写所有必填项'
    return
  }

  // 手机号校验
  const phoneRegex = /^1[3-9]\d{9}$/
  if (!phoneRegex.test(formData.phone)) {
    error.value = '请输入正确的手机号'
    return
  }

  isLoading.value = true
  error.value = null

  try {
    if (isEditMode.value && currentMemberId.value) {
      // 编辑模式
      const payload: UpdateFamilyMemberRequest = {
        name: formData.name,
        relationship: formData.relationship as FamilyRelationship,
        gender: formData.gender as Gender,
        phone: formData.phone,
      }
      await updateFamilyMember(currentMemberId.value, payload)
    } else if (currentUserId.value) {
      // 新增模式
      const payload: CreateFamilyMemberRequest = {
        userId: currentUserId.value,
        name: formData.name,
        relationship: formData.relationship as FamilyRelationship,
        gender: formData.gender as Gender,
        phone: formData.phone,
      }
      await createFamilyMember(payload)
    }

    open.value = false
    emit('success')
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : isEditMode.value ? '更新失败' : '创建失败'
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
        <DialogTitle>{{ isEditMode ? '编辑家庭成员' : '添加家庭成员' }}</DialogTitle>
        <DialogDescription>
          {{ isEditMode ? '修改家庭成员信息' : '添加新的家庭成员信息' }}
        </DialogDescription>
      </DialogHeader>

      <Alert v-if="error" variant="destructive" class="mb-4">
        <AlertDescription>{{ error }}</AlertDescription>
      </Alert>

      <div class="grid gap-4 py-4">
        <!-- 1. 家属姓名 -->
        <div class="grid gap-2">
          <Label class="text-red-500">家属姓名 *</Label>
          <Input v-model="formData.name" placeholder="请输入姓名" />
        </div>

        <!-- 2. 与用户关系 & 性别 -->
        <div class="grid grid-cols-2 gap-4">
          <div class="grid gap-2">
            <Label class="text-red-500">与用户关系 *</Label>
            <Select
              :model-value="formData.relationship"
              @update:model-value="(v) => (formData.relationship = v as FamilyRelationship)"
            >
              <SelectTrigger>
                <SelectValue placeholder="请选择关系" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="option in relationshipOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="grid gap-2">
            <Label class="text-red-500">性别 *</Label>
            <Select
              :model-value="formData.gender"
              @update:model-value="(v) => (formData.gender = v as Gender)"
            >
              <SelectTrigger>
                <SelectValue placeholder="请选择性别" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="option in genderOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <!-- 3. 手机号 -->
        <div class="grid gap-2">
          <Label class="text-red-500">手机号 *</Label>
          <Input v-model="formData.phone" placeholder="请输入手机号" />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" :disabled="isLoading" @click="open = false">取消</Button>
        <Button :disabled="isLoading" @click="handleSubmit">
          <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
          {{ isEditMode ? '保存修改' : '确认添加' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
