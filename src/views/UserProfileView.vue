<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { useUserStore } from '@/stores/user'
import { getUserInfo, updateUserInfo } from '@/lib/api'
import { toast } from 'vue-sonner'
import { User, Mail } from 'lucide-vue-next'

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

const userStore = useUserStore()
const isLoading = ref(false)
const isLoadingProfile = ref(true)
const error = ref<string | null>(null)
const isEditMode = ref(false)
const isEmailDialogOpen = ref(false)

// 表单数据
const formData = reactive({
  username: '',
  realName: '',
  gender: undefined as 0 | 1 | 2 | undefined,
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

// 监听 userStore 的头像变化，实时同步到 formData
watch(
  () => userStore.userInfo?.avatarUrl,
  (newAvatarUrl) => {
    if (newAvatarUrl) {
      formData.avatarUrl = newAvatarUrl
    }
  }
)

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
    toast.error(message)
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
    await updateUserInfo(formData, String(userId))

    // 更新本地用户信息
    if (userStore.userInfo) {
      Object.assign(userStore.userInfo, formData)
    }

    toast.success('个人信息已保存')
    isEditMode.value = false
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '保存失败'
    error.value = message
    toast.error(message)
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
const handleEmailVerified = (newEmail: string) => {
  formData.email = newEmail
  originalEmail.value = newEmail
  toast.success('邮箱验证成功！')
}

// 打开邮箱验证对话框
const openEmailVerification = () => {
  isEmailDialogOpen.value = true
}

// 性别选项
const genderOptions = [
  { value: 0, label: '男' },
  { value: 1, label: '女' },
  { value: 2, label: '保密' },
]

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
    <div v-if="!isLoadingProfile" class="grid gap-6 md:grid-cols-3">
      <!-- 左侧头像卡片 -->
      <Card class="md:col-span-1">
        <CardHeader>
          <CardTitle class="text-lg">头像</CardTitle>
        </CardHeader>
        <CardContent class="flex flex-col items-center gap-4">
          <Avatar class="h-24 w-24">
            <AvatarImage
              v-if="formData.avatarUrl"
              :src="formData.avatarUrl"
              :alt="formData.realName"
            />
            <AvatarFallback>{{ userStore.userInitial }}</AvatarFallback>
          </Avatar>
          <p class="text-sm text-muted-foreground text-center">
            在右上角个人菜单中点击"上传头像"来更新您的头像
          </p>
        </CardContent>
      </Card>

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

        <CardContent class="space-y-6">
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
            <Input
              id="realName"
              v-model="formData.realName"
              :disabled="!isEditMode"
              placeholder="输入姓名"
            />
          </div>

          <!-- 性别 -->
          <div class="grid gap-2">
            <Label for="gender">性别</Label>
            <Select
              :model-value="formData.gender?.toString()"
              :disabled="!isEditMode"
              @update:model-value="
                (val) => (formData.gender = val ? (parseInt(String(val)) as 0 | 1 | 2) : undefined)
              "
            >
              <SelectTrigger id="gender">
                <SelectValue placeholder="选择性别" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="option in genderOptions"
                  :key="option.value"
                  :value="String(option.value)"
                >
                  {{ option.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- 生日 -->
          <div class="grid gap-2">
            <Label for="birthday">生日</Label>
            <Input id="birthday" v-model="formData.birthday" type="date" :disabled="!isEditMode" />
          </div>

          <!-- 电话 -->
          <div class="grid gap-2">
            <Label for="phone">电话</Label>
            <Input
              id="phone"
              v-model="formData.phone"
              :disabled="!isEditMode"
              placeholder="输入电话号码"
            />
          </div>

          <!-- 邮箱 -->
          <div class="grid gap-2">
            <div class="flex items-center justify-between">
              <Label for="email">邮箱</Label>
              <Button
                v-if="!isEditMode"
                type="button"
                variant="ghost"
                size="sm"
                class="h-auto p-0 text-xs text-blue-600 hover:text-blue-700"
                @click="openEmailVerification"
              >
                <Mail class="mr-1 h-3 w-3" />
                验证邮箱
              </Button>
            </div>
            <Input
              id="email"
              v-model="formData.email"
              type="email"
              :disabled="!isEditMode"
              placeholder="输入邮箱地址"
            />
          </div>

          <!-- 民族 -->
          <div class="grid gap-2">
            <Label for="ethnic">民族</Label>
            <Input
              id="ethnic"
              v-model="formData.ethnic"
              :disabled="!isEditMode"
              placeholder="输入民族"
            />
          </div>

          <!-- 政治面目 -->
          <div class="grid gap-2">
            <Label for="politicalStatus">政治面目</Label>
            <Input
              id="politicalStatus"
              v-model="formData.politicalStatus"
              :disabled="!isEditMode"
              placeholder="输入政治面目"
            />
          </div>

          <!-- 个人描述 -->
          <div class="grid gap-2">
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
          <div v-if="isEditMode" class="flex justify-end gap-2 pt-4">
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
  </div>
</template>
