<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { KeyRound, LogOut, Upload } from 'lucide-vue-next'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'
import { uploadFile, updateUserInfo, getUserInfo } from '@/lib/api'
import { toast } from 'vue-sonner'

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
const isUploading = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

// --- 与个人中心一致的主动刷新逻辑 ---
const refreshUserInfo = async () => {
  const userId = userStore.userInfo?.id
  if (!userId) return

  try {
    const res = await getUserInfo(String(userId))
    if (res?.data && userStore.userInfo) {
      // 强制更新 store 中的用户信息，确保响应式
      userStore.userInfo = { ...userStore.userInfo, ...res.data }
    }
  } catch (err) {
    console.warn('Header: 自动同步用户信息失败', err)
  }
}

// 挂载时立即同步（解决切换账号后的数据延迟）
onMounted(() => {
  if (userStore.isLoggedIn) {
    refreshUserInfo()
  }
})

// 监听登录状态变化，确保切换账号后立即刷新
watch(
  () => userStore.isLoggedIn,
  (isLoggedIn) => {
    if (isLoggedIn) {
      refreshUserInfo()
    }
  }
)

// 判断用户角色
const roleLower = computed(() => (userStore.userInfo?.role || '').toLowerCase())
const isAdmin = computed(
  () => roleLower.value.includes('admin') || roleLower.value.includes('管理员')
)
const isTeacher = computed(
  () => roleLower.value.includes('teacher') || roleLower.value.includes('教师')
)
const isStudent = computed(
  () => roleLower.value.includes('student') || roleLower.value.includes('学生')
)

// 响应式获取头像URL
const avatarUrl = computed(() => userStore.userInfo?.avatarUrl || '')

// 根据角色返回背景色类名
const avatarBgClass = computed(() => {
  if (avatarUrl.value) {
    return '' // 有头像时不需要背景色
  }
  if (isAdmin.value) {
    return 'bg-purple-500' // 管理员紫色
  }
  if (isTeacher.value) {
    return 'bg-green-500' // 教师绿色
  }
  if (isStudent.value) {
    return 'bg-blue-500' // 学生蓝色
  }
  return 'bg-gray-500' // 默认灰色
})

const goToProfile = () => {
  router.push({ name: 'UserProfile' })
}

const goToChangePassword = () => {
  //userStore.changePassword();
  router.push({ name: 'ChangePassword' })
}

const handleSwitchAccount = async () => {
  await userStore.logout()
  toast.success('已退出当前账号')
  router.push({ name: 'Login' })
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
    toast.error('请选择图片文件')
    return
  }

  // 验证文件大小（限制为5MB）
  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) {
    toast.error('文件大小不能超过5MB')
    return
  }

  isUploading.value = true

  // 显示上传中的提示
  const uploadingToast = toast.loading('正在上传头像...', {
    duration: Infinity, // 一直显示直到手动关闭
  })

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

    await updateUserInfo(
      {
        avatarUrl,
      },
      String(userId)
    )

    // 第三步：更新本地用户信息（使用 store 的方法确保持久化）
    userStore.setAvatar(avatarUrl)

    // 关闭上传中的提示
    toast.dismiss(uploadingToast)
    // 显示成功提示
    toast.success('头像上传成功')
  } catch (err: unknown) {
    // 关闭上传中的提示
    toast.dismiss(uploadingToast)

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

    toast.error(message)
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
    class="sticky top-0 z-50 flex h-14 lg:h-[60px] items-center gap-4 border-b bg-background sm:static sm:h-auto sm:border-0 sm:bg-transparent px-6"
  >
    <div class="container mx-auto flex w-full items-center justify-between px-4 sm:px-6">
      <div>
        <h1 class="text-lg font-semibold">欢迎回来，{{ userStore.userRealName }}</h1>
      </div>

      <!-- 个人中心下拉菜单 -->
      <div class="flex items-center gap-2">
        <span class="text-lg font-semibold hidden md:inline">个人中心</span>
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="outline" size="icon" class="overflow-hidden rounded-full">
              <Avatar
                :key="`header-avatar-${userStore.userInfo?.id}-${userStore.userInfo?.avatarUrl}`"
                class="h-9 w-9"
              >
                <AvatarImage v-if="avatarUrl" :src="avatarUrl" alt="Avatar" />
                <AvatarFallback :class="[avatarBgClass, 'text-white']">
                  {{ userStore.userInitial }}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent v-if="userStore.userInfo" align="end">
            <DropdownMenuLabel>我的账户</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              class="flex flex-col items-start text-muted-foreground! cursor-pointer"
              @click="goToProfile"
            >
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
