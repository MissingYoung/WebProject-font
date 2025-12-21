<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { getUserInfo, updateUserProfile, uploadFile, changePassword } from '@/lib/api'
import { useNotification } from '@/composables/useNotification'
import { User, Mail, Upload, KeyRound } from 'lucide-vue-next'
import type { Gender } from '@/types'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import EmailVerificationDialog from '@/components/EmailVerificationDialog.vue'

const { success, error: notifyError } = useNotification()

const userStore = useUserStore()
const isLoading = ref(false)
const isLoadingProfile = ref(true)
const error = ref<string | null>(null)
const isEditMode = ref(false)
const isEmailDialogOpen = ref(false)
const isUploadingAvatar = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

// 表单数据
const formData = reactive({
  username: '',
  realName: '',
  gender: undefined as Gender | undefined,
  birthday: '',
  phone: '',
  email: '',
  avatarUrl: '',
  ethnic: '',
  politicalStatus: '',
  description: '',
})

// 保存原始邮箱用于邮箱验证功能
const originalEmail = ref('')

// 加载用户信息
const loadUserProfile = async () => {
  isLoadingProfile.value = true
  error.value = null
  try {
    const userId = userStore.userInfo?.id || localStorage.getItem('userId')
    if (!userId) {
      error.value = '无法获取用户ID'
      return
    }

    const res = await getUserInfo(String(userId))
    if (res?.data) {
      Object.assign(formData, res.data)
      originalEmail.value = res.data.email || ''
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '加载个人信息失败'
    error.value = message
    notifyError(message)
  } finally {
    isLoadingProfile.value = false
  }
}

// 保存信息
const handleSave = async () => {
  isLoading.value = true
  error.value = null
  try {
    const userId = userStore.userInfo?.id || localStorage.getItem('userId')
    if (!userId) {
      throw new Error('用户ID不存在')
    }
    console.log('123')
    await updateUserProfile(
      {
        username: formData.username,
        email: formData.email,
        avatarUrl: formData.avatarUrl,
        description: formData.description,
      },
      String(userId)
    )

    // 更新本地用户信息
    if (userStore.userInfo) {
      Object.assign(userStore.userInfo, formData)
    }

    success('个人信息已保存')
    isEditMode.value = false
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '保存失败'
    error.value = message
    notifyError(message)
  } finally {
    isLoading.value = false
  }
}

// 取消编辑
const handleCancel = async () => {
  isEditMode.value = false
  await loadUserProfile()
}

// 处理邮箱验证完成
const handleEmailVerified = async (newEmail: string) => {
  try {
    // 更新表单数据
    formData.email = newEmail
    originalEmail.value = newEmail

    // 同步更新到服务器
    const userId = userStore.userInfo?.id
    if (userId) {
      await updateUserProfile({ email: newEmail }, String(userId))

      // 同步更新到 userStore
      if (userStore.userInfo) {
        userStore.userInfo.email = newEmail
      }
    }

    success('邮箱绑定成功！')
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '邮箱更新失败'
    notifyError(message)
    console.error('邮箱更新失败:', err)
  }
}

// 打开邮箱验证对话框
const openEmailVerification = () => {
  isEmailDialogOpen.value = true
}

// 触发文件选择对话框
const handleAvatarClick = () => {
  if (!isUploadingAvatar.value) {
    fileInputRef.value?.click()
  }
}

// 处理头像上传
const handleAvatarFileSelected = async (event: Event) => {
  console.log('[UserProfile] handleAvatarFileSelected 被调用')
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  console.log('[UserProfile] 选择的文件:', file)
  if (!file) return

  // 验证文件类型
  if (!file.type.startsWith('image/')) {
    notifyError('请选择图片文件')
    return
  }

  // 验证文件大小（限制为10MB）
  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    notifyError('文件大小不能超过10MB')
    console.log('[UserProfile] 文件太大，已拒绝')
    return
  }

  isUploadingAvatar.value = true
  console.log('[UserProfile] 开始上传...')
  try {
    // 第一步：上传文件
    const uploadRes = await uploadFile(file)
    console.log('[UserProfile] 上传响应:', uploadRes)
    if (!uploadRes.data) {
      throw new Error('上传失败')
    }

    const avatarUrl = uploadRes.data.fileUrl
    if (!avatarUrl) {
      throw new Error('获取上传文件URL失败')
    }

    // 第二步：更新用户信息
    const userId = userStore.userInfo?.id
    if (!userId) {
      throw new Error('用户信息不完整')
    }

    await updateUserProfile({ avatarUrl }, String(userId))

    // 第三步：更新本地用户信息和表单数据
    if (userStore.userInfo) {
      userStore.userInfo.avatarUrl = avatarUrl
    }
    formData.avatarUrl = avatarUrl

    success('头像上传成功')
  } catch (err: unknown) {
    let message = '头像上传失败'

    if (err instanceof Error) {
      if (err.message.includes('file_upload') || err.message.includes("doesn't exist")) {
        message = '服务器配置错误：文件存储服务未初始化，请联系管理员'
      } else if (err.message.includes('获取上传文件URL失败')) {
        message = '上传文件成功，但获取URL失败，请重试'
      } else {
        message = err.message
      }
    }

    notifyError(message)
    console.error('上传头像失败:', err)
  } finally {
    isUploadingAvatar.value = false
    // 重置文件输入
    if (fileInputRef.value) {
      fileInputRef.value.value = ''
    }
  }
}

// 性别选项
const genderOptions = [
  { value: 'MALE', label: '男' },
  { value: 'FEMALE', label: '女' },
  { value: 'UNKNOWN', label: '保密' },
]

// 修改密码相关
const passwordData = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})
const isPasswordEditMode = ref(false)
const isChangingPassword = ref(false)
const passwordError = ref<string | null>(null)

// 开启密码编辑模式
const startPasswordEdit = () => {
  isPasswordEditMode.value = true
  passwordError.value = null
}

// 取消密码修改
const cancelPasswordEdit = () => {
  isPasswordEditMode.value = false
  passwordData.oldPassword = ''
  passwordData.newPassword = ''
  passwordData.confirmPassword = ''
  passwordError.value = null
}

// 提交密码修改
const handleChangePassword = async () => {
  passwordError.value = null

  // 验证
  if (!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
    passwordError.value = '所有字段均为必填项'
    return
  }

  if (passwordData.newPassword !== passwordData.confirmPassword) {
    passwordError.value = '两次输入的新密码不一致'
    return
  }

  if (passwordData.newPassword.length < 6) {
    passwordError.value = '新密码长度至少为6位'
    return
  }

  const userId = userStore.userInfo?.id
  if (!userId) {
    passwordError.value = '用户信息不完整'
    return
  }

  isChangingPassword.value = true

  try {
    await changePassword(userId, {
      oldPassword: passwordData.oldPassword,
      newPassword: passwordData.newPassword,
    })

    success('密码修改成功！请使用新密码重新登录')

    // 登出并跳转到登录页
    await userStore.logout()
    window.location.href = '/login'
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '密码修改失败'
    passwordError.value = message
    notifyError(message)
  } finally {
    isChangingPassword.value = false
  }
}

onMounted(() => {
  loadUserProfile()
})
</script>

<template>
  <div class="space-y-6">
    <!-- 标题栏 -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold tracking-tight flex items-center gap-2">
          <User class="h-6 w-6" />
          个人中心
        </h2>
        <p class="text-muted-foreground">查看和编辑您的个人信息</p>
      </div>
    </div>

    <!-- 加载中 -->
    <div v-if="isLoadingProfile" class="flex justify-center py-8">
      <div class="text-muted-foreground">加载中...</div>
    </div>

    <!-- 错误提示 -->
    <Alert v-if="error && !isLoadingProfile" variant="destructive">
      <AlertDescription>{{ error }}</AlertDescription>
    </Alert>

    <!-- 内容区 -->
    <div v-if="!isLoadingProfile" class="grid gap-6 md:grid-cols-3 items-start">
      <!-- 左侧列 -->
      <div class="md:col-span-1 space-y-6">
        <!-- 头像卡片 -->
        <Card>
          <CardHeader>
            <CardTitle class="text-lg">头像</CardTitle>
          </CardHeader>
          <CardContent class="flex flex-col items-center gap-4">
            <div
              class="relative cursor-pointer group"
              :class="{ 'pointer-events-none opacity-50': isUploadingAvatar }"
              @click="handleAvatarClick"
            >
              <Avatar class="h-32 w-32 transition-opacity group-hover:opacity-80">
                <AvatarImage
                  v-if="formData.avatarUrl"
                  :src="formData.avatarUrl"
                  :alt="formData.realName"
                />
                <AvatarFallback>{{ userStore.userInitial }}</AvatarFallback>
              </Avatar>
              <div
                class="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Upload class="h-8 w-8 text-white" />
              </div>
            </div>
            <p class="text-sm text-muted-foreground text-center">
              {{ isUploadingAvatar ? '上传中...' : '点击头像上传新头像' }}
            </p>
          </CardContent>
        </Card>

        <!-- 修改密码卡片 -->
        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle class="text-lg flex items-center gap-2">
                <KeyRound class="h-4 w-4" />
                修改密码
              </CardTitle>
            </div>
            <Button
              v-if="!isPasswordEditMode"
              variant="outline"
              size="sm"
              @click="startPasswordEdit"
            >
              修改
            </Button>
          </CardHeader>

          <CardContent v-if="isPasswordEditMode" class="space-y-4">
            <!-- 错误提示 -->
            <Alert v-if="passwordError" variant="destructive" class="py-2">
              <AlertDescription class="text-xs">{{ passwordError }}</AlertDescription>
            </Alert>

            <!-- 旧密码 -->
            <div class="space-y-2">
              <Label for="oldPassword" class="text-sm">旧密码</Label>
              <Input
                id="oldPassword"
                v-model="passwordData.oldPassword"
                type="password"
                placeholder="请输入旧密码"
                :disabled="isChangingPassword"
              />
            </div>

            <!-- 新密码 -->
            <div class="space-y-2">
              <Label for="newPassword" class="text-sm">新密码</Label>
              <Input
                id="newPassword"
                v-model="passwordData.newPassword"
                type="password"
                placeholder="请输入新密码"
                :disabled="isChangingPassword"
              />
            </div>

            <!-- 确认新密码 -->
            <div class="space-y-2">
              <Label for="confirmPassword" class="text-sm">确认新密码</Label>
              <Input
                id="confirmPassword"
                v-model="passwordData.confirmPassword"
                type="password"
                placeholder="请再次输入新密码"
                :disabled="isChangingPassword"
              />
            </div>

            <!-- 按钮 -->
            <div class="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                class="flex-1"
                :disabled="isChangingPassword"
                @click="cancelPasswordEdit"
              >
                取消
              </Button>
              <Button
                size="sm"
                class="flex-1"
                :disabled="isChangingPassword"
                @click="handleChangePassword"
              >
                {{ isChangingPassword ? '修改中...' : '确认' }}
              </Button>
            </div>
          </CardContent>

          <CardContent v-else class="pt-0">
            <p class="text-xs text-muted-foreground">修改密码后需要重新登录</p>
          </CardContent>
        </Card>
      </div>

      <!-- 右侧信息卡片 -->
      <Card class="md:col-span-2">
        <CardHeader class="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>基本信息</CardTitle>
            <CardDescription>您的个人档案信息</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            :disabled="isLoading"
            @click="isEditMode ? handleCancel() : (isEditMode = true)"
          >
            {{ isEditMode ? '取消' : '编辑' }}
          </Button>
        </CardHeader>

        <CardContent class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- 用户名 -->
          <div class="grid gap-2">
            <Label for="username">用户名</Label>
            <Input
              id="username"
              v-model="formData.username"
              :disabled="!isEditMode"
              placeholder="输入用户名"
            />
          </div>

          <!-- 姓名 -->
          <div class="grid gap-2">
            <Label for="realName">姓名</Label>
            <Input id="realName" v-model="formData.realName" disabled placeholder="不可修改" />
          </div>

          <!-- 性别 -->
          <div class="grid gap-2">
            <Label for="gender">性别</Label>
            <Select
              :model-value="formData.gender"
              disabled
              @update:model-value="(val) => (formData.gender = val as Gender | undefined)"
            >
              <SelectTrigger id="gender">
                <SelectValue placeholder="选择性别" />
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

          <!-- 生日 -->
          <div class="grid gap-2">
            <Label for="birthday">生日</Label>
            <Input id="birthday" v-model="formData.birthday" type="date" disabled />
          </div>

          <!-- 电话 -->
          <div class="grid gap-2">
            <Label for="phone">电话</Label>
            <Input id="phone" v-model="formData.phone" disabled placeholder="不可修改" />
          </div>

          <!-- 邮箱 -->
          <div class="grid gap-2">
            <div class="flex items-center justify-between">
              <Label for="email">邮箱</Label>
              <Button type="button" variant="outline" size="sm" @click="openEmailVerification">
                <Mail class="mr-2 h-4 w-4" />
                {{ formData.email ? '修改邮箱' : '绑定邮箱' }}
              </Button>
            </div>
            <Input
              id="email"
              v-model="formData.email"
              type="email"
              disabled
              :placeholder="formData.email || '点击右侧按钮绑定邮箱'"
            />
          </div>

          <!-- 民族 -->
          <div class="grid gap-2">
            <Label for="ethnic">民族</Label>
            <Input id="ethnic" v-model="formData.ethnic" disabled placeholder="不可修改" />
          </div>

          <!-- 政治面目 -->
          <div class="grid gap-2">
            <Label for="politicalStatus">政治面目</Label>
            <Input
              id="politicalStatus"
              v-model="formData.politicalStatus"
              disabled
              placeholder="不可修改"
            />
          </div>

          <!-- 个人描述 -->
          <div class="grid gap-2 md:col-span-2">
            <Label for="description">个人描述</Label>
            <Textarea
              id="description"
              v-model="formData.description"
              :disabled="!isEditMode"
              placeholder="输入个人描述或签名"
              rows="4"
            />
          </div>

          <!-- 保存按钮 -->
          <div v-if="isEditMode" class="flex justify-end gap-2 pt-4 md:col-span-2">
            <Button variant="outline" :disabled="isLoading" @click="handleCancel">取消</Button>
            <Button :disabled="isLoading" @click="handleSave">
              {{ isLoading ? '保存中...' : '保存' }}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- 邮箱验证对话框 -->
    <EmailVerificationDialog
      :open="isEmailDialogOpen"
      :user-id="userStore.userInfo?.id?.toString()"
      :current-email="originalEmail"
      @update:open="isEmailDialogOpen = $event"
      @verified="handleEmailVerified"
    />

    <!-- 隐藏的文件输入框 -->
    <input
      ref="fileInputRef"
      type="file"
      accept="image/*"
      style="display: none"
      @change="handleAvatarFileSelected"
    />
  </div>
</template>
