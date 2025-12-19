<script setup lang="ts">
import { ref, reactive } from 'vue'
import { createRole, updateRole } from '@/lib/api'
import type { RoleVO, CreateRolePayload, UpdateRolePayload } from '@/types'
import { useNotification } from '@/composables/useNotification'

// UI 组件
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2 } from 'lucide-vue-next'

const { success: showSuccess, error: showError, info: showInfo } = useNotification()

// --- 类型和事件 ---
const emit = defineEmits<{
  (e: 'success'): void
}>()

// --- 状态 ---
const isOpen = ref(false)
const isSubmitting = ref(false)
const isEditMode = ref(false)
const editingRole = ref<RoleVO | null>(null)

const formData = reactive<CreateRolePayload>({
  name: '',
  key: '',
  description: '',
})

// --- 方法 ---
const resetForm = () => {
  formData.name = ''
  formData.key = ''
  formData.description = ''
}

// 打开对话框
const openDialog = (role?: RoleVO) => {
  resetForm()
  if (role) {
    isEditMode.value = true
    editingRole.value = role
    formData.name = role.name
    formData.key = role.key
    formData.description = role.description || ''
  } else {
    isEditMode.value = false
    editingRole.value = null
  }
  isOpen.value = true
}

// 关闭对话框
const closeDialog = () => {
  isOpen.value = false
  resetForm()
}

// 表单验证
const validateForm = (): boolean => {
  if (!formData.name.trim()) {
    showError('请输入角色名称')
    return false
  }
  if (formData.name.length > 50) {
    showError('角色名称不能超过 50 个字符')
    return false
  }
  if (!formData.key.trim()) {
    showError('请输入角色标识')
    return false
  }
  if (formData.key.length > 50) {
    showError('角色标识不能超过 50 个字符')
    return false
  }
  if (formData.description && formData.description.length > 200) {
    showError('角色描述不能超过 200 个字符')
    return false
  }
  return true
}

// 提交表单
const handleSubmit = async () => {
  if (!validateForm()) return

  isSubmitting.value = true
  try {
    if (isEditMode.value && editingRole.value) {
      // 编辑模式
      const payload: UpdateRolePayload = {
        name: formData.name,
        key: formData.key,
        description: formData.description,
      }
      await updateRole(editingRole.value.id, payload)
      showSuccess('角色更新成功')
    } else {
      // 创建模式
      await createRole(formData)
      showSuccess('角色创建成功')
    }
    closeDialog()
    emit('success')
  } catch (error) {
    console.error('保存角色失败', error)
    showError(error instanceof Error ? error.message : '保存失败，请重试')
  } finally {
    isSubmitting.value = false
  }
}

// 暴露方法给父组件
defineExpose({
  openDialog,
  closeDialog,
})
</script>

<template>
  <Dialog :open="isOpen" @update:open="(v) => (isOpen = v)">
    <DialogContent class="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>{{ isEditMode ? '编辑角色' : '添加角色' }}</DialogTitle>
        <DialogDescription>
          {{ isEditMode ? '修改角色的基本信息' : '创建一个新的系统角色' }}
        </DialogDescription>
      </DialogHeader>

      <div class="grid gap-4 py-4">
        <!-- 角色名称 -->
        <div class="grid gap-2">
          <Label for="name"> 角色名称 <span class="text-red-500">*</span> </Label>
          <Input id="name" v-model="formData.name" placeholder="例如：超级管理员" maxlength="50" />
          <p class="text-xs text-muted-foreground">最多 50 个字符</p>
        </div>

        <!-- 角色标识 -->
        <div class="grid gap-2">
          <Label for="key"> 角色标识 <span class="text-red-500">*</span> </Label>
          <Input id="key" v-model="formData.key" placeholder="例如：admin" maxlength="50" />
          <p class="text-xs text-muted-foreground">唯一标识，用于程序识别，最多 50 个字符</p>
        </div>

        <!-- 角色描述 -->
        <div class="grid gap-2">
          <Label for="description">角色描述</Label>
          <Textarea
            id="description"
            v-model="formData.description"
            placeholder="描述该角色的职责和权限范围"
            maxlength="200"
            rows="3"
          />
          <p class="text-xs text-muted-foreground">最多 200 个字符</p>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" :disabled="isSubmitting" @click="closeDialog"> 取消 </Button>
        <Button :disabled="isSubmitting" @click="handleSubmit">
          <Loader2 v-if="isSubmitting" class="mr-2 h-4 w-4 animate-spin" />
          {{ isSubmitting ? '保存中...' : '保存' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
