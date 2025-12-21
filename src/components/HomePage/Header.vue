<script setup lang="ts">
import { ref } from 'vue'
import { KeyRound, Loader2, LogOut, Shield, Upload } from 'lucide-vue-next'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'
import { login, uploadFile, updateUserProfile } from '@/lib/api'
import { useNotification } from '@/composables/useNotification'
import type { UserInfo } from '@/types'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const userStore = useUserStore()
const router = useRouter()
const { confirm, success, error } = useNotification()
const isUploading = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const isLoggingInDemoAdmin = ref(false)
const isLoggingInDemoStudent = ref(false)
const isLoggingInDemoTeacher = ref(false)

const goToProfile = () => {
  router.push({ name: 'UserProfile' })
}

const goToChangePassword = () => {
  router.push({ name: 'UserProfile' })
}

const handleSwitchAccount = async () => {
  console.log('[Header] handleSwitchAccount 开始')
  const confirmed = await confirm({
    title: '退出登录',
    description: '确认要退出当前账号吗？',
  })
  console.log('[Header] confirm 返回值:', confirmed)

  if (!confirmed) {
    console.log('[Header] 用户取消，退出函数')
    return
  }

  console.log('[Header] 开始执行登出')
  await userStore.logout()
  success('已退出登录')
  router.push({ name: 'Login' })
}

const handleDemoAdminLogin = async () => {
  const confirmed = userStore.isLoggedIn
    ? await confirm({
        title: '切换为演示管理员',
        description: '将退出当前账号，并使用演示用管理员账号登录，是否继续？',
      })
    : true

  if (!confirmed) return

  isLoggingInDemoAdmin.value = true
  try {
    if (userStore.isLoggedIn) {
      await userStore.logout()
    }

    const result = await login({ sduId: '202400011111', password: '123456' })
    if (!result?.data) {
      throw new Error('登录服务响应异常，请稍后重试')
    }

    const { token, username } = result.data
    const miniUserInfo: UserInfo = {
      id: result.data.userId,
      username: username,
      sduId: '202400011111',
      realName: result.data.realName || '',
      role: result.data.role,
      avatarUrl: '',
      gender: 'UNKNOWN',
      birthday: '',
      phone: '',
      email: '',
      ethnic: '',
      politicalStatus: '',
      description: '',
    }

    userStore.setUser({ token, user: miniUserInfo })
    await userStore.fetchMenuTree()

    success('已使用演示用管理员登录')
    await router.push({ name: 'Dashboard' })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '登录失败，请稍后重试'
    error(message)
  } finally {
    isLoggingInDemoAdmin.value = false
  }
}

const handleDemoStudentLogin = async () => {
  const confirmed = userStore.isLoggedIn
    ? await confirm({
        title: '切换为演示学生',
        description: '将退出当前账号，并使用演示用学生账号登录，是否继续？',
      })
    : true

  if (!confirmed) return

  isLoggingInDemoStudent.value = true
  try {
    if (userStore.isLoggedIn) {
      await userStore.logout()
    }

    const result = await login({ sduId: '202500011111', password: '123456' })
    if (!result?.data) {
      throw new Error('登录服务响应异常，请稍后重试')
    }

    const { token, username } = result.data
    const miniUserInfo: UserInfo = {
      id: result.data.userId,
      username: username,
      sduId: '202500011111',
      realName: result.data.realName || '',
      role: result.data.role,
      avatarUrl: '',
      gender: 'UNKNOWN',
      birthday: '',
      phone: '',
      email: '',
      ethnic: '',
      politicalStatus: '',
      description: '',
    }

    userStore.setUser({ token, user: miniUserInfo })
    await userStore.fetchMenuTree()

    success('已使用演示用学生登录')
    await router.push({ name: 'Dashboard' })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '登录失败，请稍后重试'
    error(message)
  } finally {
    isLoggingInDemoStudent.value = false
  }
}

const handleDemoTeacherLogin = async () => {
  const confirmed = userStore.isLoggedIn
    ? await confirm({
        title: '切换为演示教师',
        description: '将退出当前账号，并使用演示用教师账号登录，是否继续？',
      })
    : true

  if (!confirmed) return

  isLoggingInDemoTeacher.value = true
  try {
    if (userStore.isLoggedIn) {
      await userStore.logout()
    }

    const result = await login({ sduId: '202300011111', password: '123456' })
    if (!result?.data) {
      throw new Error('登录服务响应异常，请稍后重试')
    }

    const { token, username } = result.data
    const miniUserInfo: UserInfo = {
      id: result.data.userId,
      username: username,
      sduId: '202300011111',
      realName: result.data.realName || '',
      role: result.data.role,
      avatarUrl: '',
      gender: 'UNKNOWN',
      birthday: '',
      phone: '',
      email: '',
      ethnic: '',
      politicalStatus: '',
      description: '',
    }

    userStore.setUser({ token, user: miniUserInfo })
    await userStore.fetchMenuTree()

    success('已使用演示用教师登录')
    await router.push({ name: 'Dashboard' })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '登录失败，请稍后重试'
    error(message)
  } finally {
    isLoggingInDemoTeacher.value = false
  }
}

// 触发文件选择对话框
const handleUploadAvatarClick = () => {
  fileInputRef.value?.click()
}

// 处理文件选择
const handleFileSelected = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  // 验证文件类型
  if (!file.type.startsWith('image/')) {
    error('请选择图片文件')
    return
  }

  // 验证文件大小（限制为10MB）
  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    error('文件大小不能超过10MB')
    return
  }

  isUploading.value = true
  try {
    // 第一步：上传文件
    const uploadRes = await uploadFile(file)
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

    // 第三步：更新本地用户信息
    if (userStore.userInfo) {
      userStore.userInfo.avatarUrl = avatarUrl
    }

    success('头像上传成功')
  } catch (err: unknown) {
    let message = '头像上传失败'

    if (err instanceof Error) {
      // 检查是否是数据库表不存在的错误
      if (err.message.includes('file_upload') || err.message.includes("doesn't exist")) {
        message = '服务器配置错误：文件存储服务未初始化，请联系管理员'
      } else if (err.message.includes('获取上传文件URL失败')) {
        message = '上传文件成功，但获取URL失败，请重试'
      } else {
        message = err.message
      }
    }

    error(message)
    console.error('上传头像失败:', err)
  } finally {
    isUploading.value = false
    // 重置文件输入
    if (fileInputRef.value) {
      fileInputRef.value.value = ''
    }
  }
}
</script>

<!-- 导航栏整体布局 -->
<template>
  <header
    class="sticky top-0 z-50 flex h-14 items-center gap-4 border-b bg-card px-6 sm:static lg:h-[60px]"
  >
    <div class="container mx-auto flex w-full items-center justify-between pr-4 sm:pr-6">
      <div>
        <h1 class="text-lg font-semibold">欢迎回来，{{ userStore.userRealName }}</h1>
      </div>

      <!-- 个人资料下拉菜单 -->
      <div class="flex items-center gap-2">
        <Button
          variant="outline"
          class="whitespace-nowrap"
          :disabled="isLoggingInDemoStudent"
          title="使用 202500011111 / 123456 登录"
          @click="handleDemoStudentLogin"
        >
          <Loader2 v-if="isLoggingInDemoStudent" class="mr-2 h-4 w-4 animate-spin" />
          <Shield v-else class="mr-2 h-4 w-4" />
          演示学生
        </Button>
        <Button
          variant="outline"
          class="whitespace-nowrap"
          :disabled="isLoggingInDemoTeacher"
          title="使用 202300011111 / 123456 登录"
          @click="handleDemoTeacherLogin"
        >
          <Loader2 v-if="isLoggingInDemoTeacher" class="mr-2 h-4 w-4 animate-spin" />
          <Shield v-else class="mr-2 h-4 w-4" />
          演示教师
        </Button>
        <Button
          variant="secondary"
          class="whitespace-nowrap"
          :disabled="isLoggingInDemoAdmin"
          title="使用 202400011111 / 123456 登录"
          @click="handleDemoAdminLogin"
        >
          <Loader2 v-if="isLoggingInDemoAdmin" class="mr-2 h-4 w-4 animate-spin" />
          <Shield v-else class="mr-2 h-4 w-4" />
          演示用管理员
        </Button>
        <span class="text-sm font-medium hidden md:inline">个人资料</span>
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button
              variant="outline"
              size="icon"
              title="打开个人资料菜单"
              aria-label="打开个人资料菜单"
              class="overflow-hidden rounded-full"
            >
              <Avatar class="h-9 w-9">
                <AvatarImage :src="userStore.userInfo?.avatarUrl || ''" alt="Avatar" />
                <AvatarFallback>{{ userStore.userInitial }}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent v-if="userStore.userInfo" align="end">
            <DropdownMenuLabel>我的账户</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem class="flex flex-col items-start cursor-pointer" @click="goToProfile">
              <span>用户名: {{ userStore.userInfo.username }}</span>
              <span>学工号: {{ userStore.userInfo.sduId }}</span>
              <span>姓名：{{ userStore.userInfo.realName || userStore.userInfo.username }}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem :disabled="isUploading" @click="handleUploadAvatarClick">
              <Upload class="mr-2 h-4 w-4" />
              <span>{{ isUploading ? '上传中...' : '上传头像' }}</span>
            </DropdownMenuItem>
            <DropdownMenuItem @click="goToChangePassword">
              <KeyRound class="mr-2 h-4 w-4" />
              <span>修改密码</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem v-if="userStore.isLoggedIn" @click="handleSwitchAccount">
              <LogOut class="mr-2 h-4 w-4" />
              <span>切换账号</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  </header>

  <!-- 隐藏的文件输入框 -->
  <input
    ref="fileInputRef"
    type="file"
    accept="image/*"
    style="display: none"
    @change="handleFileSelected"
  />
</template>
