<script setup lang="ts">
import { reactive, ref, onUnmounted } from 'vue'
import { sendEmailBindingCode, bindEmail } from '@/lib/api'
import { useNotification } from '@/composables/useNotification'
import { Mail, Loader2 } from 'lucide-vue-next'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

const { success, error: notifyError } = useNotification()

interface Props {
  open?: boolean
  userId?: string
  currentEmail?: string
}

interface Emits {
  (e: 'update:open', value: boolean): void
  (e: 'verified', email: string): void
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  userId: '',
  currentEmail: '',
})

const emit = defineEmits<Emits>()

// 步骤控制
const step = ref<'input' | 'verify'>('input')

// 表单数据
const formData = reactive({
  email: '',
  verificationCode: '',
})

// 状态管理
const isLoading = ref(false)
const isSendingCode = ref(false)
const error = ref<string | null>(null)
const countdown = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

// 组件卸载时清除定时器
onUnmounted(() => {
  if (timer) clearInterval(timer)
})

// 打开对话框时的处理
const handleOpenChange = (open: boolean) => {
  emit('update:open', open)
  if (!open) {
    reset()
  }
}

// 重置表单
const reset = () => {
  step.value = 'input'
  formData.email = ''
  formData.verificationCode = ''
  error.value = null
  countdown.value = 0
  if (timer) clearInterval(timer)
}

// 邮箱格式校验
const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// 发送验证码
const handleSendCode = async () => {
  error.value = null

  // 校验邮箱
  if (!formData.email) {
    error.value = '请输入邮箱地址'
    return
  }

  if (!validateEmail(formData.email)) {
    error.value = '请输入有效的邮箱地址'
    return
  }

  // 检查是否与当前邮箱相同
  if (formData.email === props.currentEmail) {
    error.value = '新邮箱不能与当前邮箱相同'
    return
  }

  isSendingCode.value = true

  try {
    if (!props.userId) {
      throw new Error('用户ID不存在')
    }

    const res = await sendEmailBindingCode({ email: formData.email }, props.userId)

    if (res && (res.code === 0 || res.code === 200 || res.data === null)) {
      success('验证码已发送，请查收邮件')
      step.value = 'verify'
      startCountdown()
    } else {
      throw new Error(res.message || '发送验证码失败')
    }
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : '发送验证码请求失败，请稍后重试'
    error.value = errMessage
    notifyError(errMessage)
  } finally {
    isSendingCode.value = false
  }
}

// 开启60秒倒计时
const startCountdown = () => {
  countdown.value = 60
  timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      if (timer) clearInterval(timer)
    }
  }, 1000)
}

// 提交验证
const handleVerify = async () => {
  error.value = null

  if (!formData.verificationCode) {
    error.value = '请输入验证码'
    return
  }

  if (formData.verificationCode.length < 4) {
    error.value = '验证码长度不正确'
    return
  }

  isLoading.value = true

  try {
    if (!props.userId) {
      throw new Error('用户ID不存在')
    }

    const res = await bindEmail(
      {
        email: formData.email,
        verificationCode: formData.verificationCode,
      },
      props.userId
    )

    if (res && (res.code === 0 || res.code === 200 || res.data === null)) {
      success('邮箱验证成功')
      emit('verified', formData.email)
      handleOpenChange(false)
    } else {
      throw new Error(res.message || '验证失败')
    }
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : '验证请求失败，请稍后重试'
    error.value = errMessage
    notifyError(errMessage)
  } finally {
    isLoading.value = false
  }
}

// 返回上一步
const handleBack = () => {
  step.value = 'input'
  formData.verificationCode = ''
  error.value = null
  if (timer) clearInterval(timer)
  countdown.value = 0
}

// 重新发送验证码
const handleResendCode = async () => {
  formData.verificationCode = ''
  await handleSendCode()
}
</script>

<template>
  <Dialog :open="open" @update:open="handleOpenChange">
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <Mail class="h-4 w-4" />
          {{ step === 'input' ? '邮箱绑定' : '验证邮箱' }}
        </DialogTitle>
        <DialogDescription>
          {{ step === 'input' ? '请输入您要绑定的邮箱地址' : `验证码已发送至 ${formData.email}` }}
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4 py-4">
        <!-- 错误提示 -->
        <Alert v-if="error" variant="destructive">
          <AlertDescription>{{ error }}</AlertDescription>
        </Alert>

        <!-- 第一步：输入邮箱 -->
        <div v-if="step === 'input'" class="space-y-4">
          <div class="space-y-2">
            <Label for="bind-email">邮箱地址</Label>
            <Input
              id="bind-email"
              v-model="formData.email"
              type="email"
              placeholder="输入新的邮箱地址"
              :disabled="isSendingCode"
            />
            <p class="text-xs text-muted-foreground">当前邮箱：{{ currentEmail || '未设置' }}</p>
          </div>

          <Button
            class="w-full"
            :disabled="isSendingCode || !formData.email"
            @click="handleSendCode"
          >
            <Loader2 v-if="isSendingCode" class="mr-2 h-4 w-4 animate-spin" />
            {{ isSendingCode ? '发送中...' : '发送验证码' }}
          </Button>
        </div>

        <!-- 第二步：验证邮箱 -->
        <div v-if="step === 'verify'" class="space-y-4">
          <div class="space-y-2">
            <Label for="verification-code">验证码</Label>
            <Input
              id="verification-code"
              v-model="formData.verificationCode"
              type="text"
              placeholder="请输入验证码"
              :disabled="isLoading"
              maxlength="6"
            />
            <p class="text-xs text-muted-foreground">
              {{ countdown > 0 ? `请在 ${countdown}s 内输入验证码` : '验证码已过期，请重新发送' }}
            </p>
          </div>

          <div class="flex gap-2">
            <Button variant="outline" class="flex-1" :disabled="isLoading" @click="handleBack">
              返回
            </Button>
            <Button
              variant="outline"
              class="flex-1"
              :disabled="isLoading || countdown <= 0"
              @click="handleResendCode"
            >
              重新发送 {{ countdown > 0 ? `(${countdown}s)` : '' }}
            </Button>
          </div>

          <Button
            class="w-full"
            :disabled="isLoading || !formData.verificationCode || countdown <= 0"
            @click="handleVerify"
          >
            <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
            {{ isLoading ? '验证中...' : '确认验证' }}
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
