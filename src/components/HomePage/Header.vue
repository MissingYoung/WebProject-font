<script setup lang="ts">
import { ref } from 'vue'
import { KeyRound, LogOut, Upload } from 'lucide-vue-next'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'
import { uploadFile, updateUserInfo } from '@/lib/api'
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

const goToChangePassword = () => {
  //userStore.changePassword();
  router.push({ name: 'ChangePassword' })
}

const handleSwitchAccount = async () => {
  await userStore.logout()
  alert('您是否退出当前账号？')
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

    // 第三步：更新本地用户信息
    if (userStore.userInfo) {
      userStore.userInfo.avatarUrl = avatarUrl
    }

    toast.success('头像上传成功')
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
    class="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background sm:static sm:h-auto sm:border-0 sm:bg-transparent px-6"
  >
    <div class="container mx-auto flex w-full items-center justify-between px-4 sm:px-6">
      <div>
        <h1 class="text-lg font-semibold">欢迎回来，{{ userStore.userRealName }}</h1>
      </div>

      <!-- 个人中心下拉菜单 -->
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium hidden md:inline">个人中心</span>
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="outline" size="icon" class="overflow-hidden rounded-full">
              <Avatar class="h-9 w-9">
                <AvatarImage :src="userStore.userInfo?.avatarUrl || ''" alt="Avatar" />
                <AvatarFallback>{{ userStore.userInitial }}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent v-if="userStore.userInfo" align="end">
            <DropdownMenuLabel>我的账户</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem class="flex flex-col items-start text-muted-foreground!">
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
