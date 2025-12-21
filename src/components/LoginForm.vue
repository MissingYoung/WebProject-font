<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { login } from '@/lib/api'
import { useUserStore } from '@/stores/user'
import type { UserInfo } from '@/types'
import { useNotification } from '@/composables/useNotification'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Shield } from 'lucide-vue-next'
import IdentifyCode from './IdentifyCode.vue'

const router = useRouter()
const userStore = useUserStore()
const { success } = useNotification()

const formData = reactive({
  sduId: '',
  password: '',
  verifyCode: '',
})

const isLoading = ref(false)
const error = ref<string | null>(null)
const correctCode = ref('')
// 获取验证码组件的实例（用于手动触发刷新
const verifyCodeRef = ref<InstanceType<typeof IdentifyCode> | null>(null)
//接收生成的验证码
const handleCode = (code: string) => {
  correctCode.value = code
}

const finalizeLogin = async (result: any, sduId: string) => {
  if (!result || !result.data) {
    throw new Error('登录服务响应异常，请稍后重试')
  }

  const { token, username } = result.data

  const miniUserInfo: UserInfo = {
    id: result.data.userId,
    username: username,
    sduId,
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

  userStore.setUser({
    token: token,
    user: miniUserInfo,
  })

  await userStore.fetchMenuTree()

  success('登陆成功，即将跳转到首页')
  await router.push({ name: 'Dashboard' })
  error.value = ''
}

const demoAccounts = {
  student: { sduId: '202500011111', password: '123456' },
  teacher: { sduId: '202300011111', password: '123456' },
  admin: { sduId: '202400011111', password: '123456' },
} as const

const loginDemo = async (role: keyof typeof demoAccounts) => {
  error.value = null
  isLoading.value = true

  try {
    const { sduId, password } = demoAccounts[role]
    const result = await login({ sduId, password })
    await finalizeLogin(result, sduId)
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : '登录过程中出现未知错误，请稍后重试'
    error.value = errorMessage
    console.error('登录异常: ', errorMessage)
  } finally {
    isLoading.value = false
  }
}

defineExpose({ loginDemo })

const handleLogin = async () => {
  const { sduId, password, verifyCode } = formData
  if (!sduId || !password || !verifyCode) {
    error.value = '用户名,密码和验证码均为必填项，请完整填写后重试'
    return
  }
  if (formData.verifyCode.toLowerCase() !== correctCode.value.toLowerCase()) {
    error.value = '验证码错误，请重试'

    // 验证失败后，清空输入框并刷新验证码
    formData.verifyCode = ''
    verifyCodeRef.value?.refresh()
    return
  }

  isLoading.value = true
  error.value = ''

  try {
    const result = await login(formData)
    await finalizeLogin(result, formData.sduId)
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : '登录过程中出现未知错误，请稍后重试'
    error.value = errorMessage
    console.error('登录异常: ', errorMessage)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <Card class="w-full max-w-sm">
    <CardHeader>
      <CardTitle class="text-2xl" style="text-align: center">作业管理系统</CardTitle>
      <CardTitle class="text-lg">登录</CardTitle>
      <CardDescription>请输入您的账户信息。</CardDescription>
    </CardHeader>
    <CardContent class="grid gap-4">
      <Alert v-if="error" variant="destructive">
        <AlertDescription>{{ error }}</AlertDescription>
      </Alert>
      <div class="grid gap-2">
        <Label for="sduId">学工号</Label>
        <Input id="sduId" v-model="formData.sduId" type="text" placeholder="请输入用户id" />
      </div>
      <div class="grid gap-2">
        <Label for="password">密码</Label>
        <Input id="password" v-model="formData.password" type="password" />
      </div>
      <!-- 验证码区域  -->
      <div class="grid gap-2">
        <Label for="verifyCode">验证码</Label>
        <div class="flex items-center gap-3">
          <!-- 输入框占据剩余空间 -->
          <Input
            id="verifyCode"
            v-model="formData.verifyCode"
            class="flex-1"
            type="text"
            placeholder="输入右侧字符"
            maxlength="4"
            @keyup.enter="handleLogin"
          />

          <!-- 验证码组件 -->
          <IdentifyCode ref="verifyCodeRef" :width="120" :height="40" @update:code="handleCode" />
        </div>
      </div>
    </CardContent>
    <CardFooter class="flex flex-col gap-2">
      <Button class="w-full" :disabled="isLoading" @click="handleLogin">
        <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
        {{ isLoading ? '登录中...' : '登 录' }}
      </Button>

      <div class="w-full pt-1">
        <div class="grid grid-cols-3 gap-2">
          <Button
            variant="outline"
            size="sm"
            class="w-full"
            :disabled="isLoading"
            @click="loginDemo('student')"
          >
            演示学生
          </Button>
          <Button
            variant="outline"
            size="sm"
            class="w-full"
            :disabled="isLoading"
            @click="loginDemo('teacher')"
          >
            演示教师
          </Button>
          <Button
            variant="secondary"
            size="sm"
            class="w-full"
            :disabled="isLoading"
            @click="loginDemo('admin')"
          >
            <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
            <Shield v-else class="mr-2 h-4 w-4" />
            演示管理员
          </Button>
        </div>
      </div>
    </CardFooter>
  </Card>
</template>
