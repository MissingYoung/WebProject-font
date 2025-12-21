<script setup lang="ts">
import { reactive, ref } from 'vue'
import { getUserInfo, updateUserInfo, uploadFile } from '@/lib/api'
import type { UpdateUserInfoPayload, UserInfo } from '@/types'
import { Loader2 } from 'lucide-vue-next'

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
import { Textarea } from '@/components/ui/textarea'

const emit = defineEmits<{
  (e: 'success'): void
}>()

const open = ref(false)
const isLoading = ref(false)
const isFetching = ref(false)
const isUploadingAvatar = ref(false)
const error = ref<string | null>(null)

const currentUser = ref<UserInfo | null>(null)
const currentUserId = ref<number | null>(null)
const avatarFileInputRef = ref<HTMLInputElement | null>(null)

const initialState: UpdateUserInfoPayload = {
  username: '',
  realName: '',
  gender: undefined,
  birthday: '',
  phone: '',
  email: '',
  avatarUrl: '',
  ethnic: '',
  politicalStatus: '',
  description: '',
}

const formData = reactive<UpdateUserInfoPayload>({ ...initialState })

const handleAvatarFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement | null
  const file = input?.files?.[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    error.value = '请选择图片文件'
    return
  }

  // 避免过大的 base64 头像导致请求体过大
  if (file.size > 10 * 1024 * 1024) {
    error.value = '头像文件请小于 10MB'
    return
  }

  isUploadingAvatar.value = true
  error.value = null
  try {
    const uploadRes = await uploadFile(file)
    const avatarUrl = uploadRes?.data?.fileUrl
    if (!avatarUrl) throw new Error('获取上传文件URL失败')
    formData.avatarUrl = avatarUrl
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : '上传头像失败'
  } finally {
    isUploadingAvatar.value = false
    if (avatarFileInputRef.value) avatarFileInputRef.value.value = ''
  }
}

const clearAvatar = () => {
  formData.avatarUrl = ''
  if (avatarFileInputRef.value) avatarFileInputRef.value.value = ''
}

const openDialog = async (userId: number) => {
  open.value = true
  error.value = null
  currentUser.value = null
  currentUserId.value = userId
  Object.assign(formData, { ...initialState })

  isFetching.value = true
  try {
    const res = await getUserInfo(String(userId))
    currentUser.value = res?.data || null
    Object.assign(formData, {
      username: res?.data?.username ?? '',
      realName: res?.data?.realName ?? '',
      gender: res?.data?.gender,
      birthday: res?.data?.birthday ?? '',
      phone: res?.data?.phone ?? '',
      email: res?.data?.email ?? '',
      avatarUrl: res?.data?.avatarUrl ?? '',
      ethnic: res?.data?.ethnic ?? '',
      politicalStatus: res?.data?.politicalStatus ?? '',
      description: res?.data?.description ?? '',
    })
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : '获取用户信息失败'
  } finally {
    isFetching.value = false
  }
}

defineExpose({ openDialog })

const handleSubmit = async () => {
  if (!currentUserId.value) {
    error.value = '用户信息无效'
    return
  }
  if (!currentUser.value) {
    error.value = '用户信息尚未加载完成'
    return
  }

  isLoading.value = true
  error.value = null
  try {
    await updateUserInfo(formData, String(currentUserId.value))
    open.value = false
    emit('success')
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : '更新失败'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="(val) => (open = val)">
    <DialogContent class="sm:max-w-[650px]">
      <DialogHeader>
        <DialogTitle>编辑个人信息</DialogTitle>
        <DialogDescription>
          <span v-if="currentUser">
            修改用户：{{ currentUser.realName }}（{{ currentUser.username }}）的个人信息
          </span>
          <span v-else>加载用户信息中...</span>
        </DialogDescription>
      </DialogHeader>

      <Alert v-if="error" variant="destructive" class="mb-4">
        <AlertDescription>{{ error }}</AlertDescription>
      </Alert>

      <div v-if="isFetching" class="flex items-center justify-center py-10">
        <Loader2 class="h-6 w-6 animate-spin" />
      </div>

      <div v-else class="grid gap-4 py-2">
        <div class="grid grid-cols-2 gap-4">
          <div class="grid gap-2">
            <Label for="username">用户名</Label>
            <Input id="username" v-model="formData.username" placeholder="请输入用户名" />
          </div>
          <div class="grid gap-2">
            <Label for="realName">真实姓名</Label>
            <Input id="realName" v-model="formData.realName" placeholder="请输入真实姓名" />
          </div>
        </div>

        <div class="grid grid-cols-3 gap-4">
          <div class="grid gap-2">
            <Label for="gender">性别</Label>
            <Select
              :model-value="formData.gender"
              @update:model-value="
                (val) =>
                  (formData.gender = val ? (val as 'MALE' | 'FEMALE' | 'UNKNOWN') : undefined)
              "
            >
              <SelectTrigger id="gender">
                <SelectValue placeholder="选择性别" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MALE">男</SelectItem>
                <SelectItem value="FEMALE">女</SelectItem>
                <SelectItem value="UNKNOWN">未知</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="grid gap-2">
            <Label for="birthday">生日</Label>
            <Input id="birthday" v-model="formData.birthday" type="date" />
          </div>
          <div class="grid gap-2">
            <Label for="phone">手机号</Label>
            <Input id="phone" v-model="formData.phone" type="tel" placeholder="请输入手机号" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="grid gap-2">
            <Label for="email">邮箱</Label>
            <Input id="email" v-model="formData.email" type="email" placeholder="请输入邮箱" />
          </div>
          <div class="grid gap-2">
            <Label for="avatarFile">头像</Label>
            <Input
              id="avatarFile"
              ref="avatarFileInputRef"
              type="file"
              accept="image/*"
              :disabled="isUploadingAvatar"
              @change="handleAvatarFileChange"
            />
            <div
              v-if="isUploadingAvatar"
              class="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <Loader2 class="h-4 w-4 animate-spin" />
              上传中...
            </div>
            <Button
              v-if="formData.avatarUrl"
              type="button"
              variant="outline"
              size="sm"
              class="w-fit"
              @click="clearAvatar"
            >
              移除头像
            </Button>
          </div>
        </div>

        <div v-if="formData.avatarUrl" class="flex justify-center">
          <img
            :src="formData.avatarUrl"
            :alt="formData.username || 'avatar'"
            class="h-20 w-20 rounded-full object-cover border"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="grid gap-2">
            <Label for="ethnic">民族</Label>
            <Input id="ethnic" v-model="formData.ethnic" placeholder="请输入民族" />
          </div>
          <div class="grid gap-2">
            <Label for="politicalStatus">政治面貌</Label>
            <Input
              id="politicalStatus"
              v-model="formData.politicalStatus"
              placeholder="请输入政治面貌"
            />
          </div>
        </div>

        <div class="grid gap-2">
          <Label for="description">个人简介</Label>
          <Textarea
            id="description"
            v-model="formData.description"
            placeholder="请输入个人简介…"
            class="resize-none"
            :rows="4"
          />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" :disabled="isLoading || isFetching" @click="open = false"
          >取消</Button
        >
        <Button
          :disabled="isLoading || isFetching || isUploadingAvatar || !currentUser"
          @click="handleSubmit"
        >
          <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
          保存修改
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
