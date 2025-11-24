<script setup lang="ts">
import { reactive, ref, onUnmounted,} from 'vue'
import { useRouter } from 'vue-router'
import { sendPasswordResetCode, resetPassword, } from '@/lib/api' 
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ArrowLeft, } from 'lucide-vue-next'


const router = useRouter()


// 表单数据
const formData = reactive({
  sduId:'',  
  email: '',
  verificationCode: '',
  newPassword: '',
  confirmPassword: '' // 仅用于前端校验，不传给后端
})

// 状态管理
const isLoading = ref(false) // 提交按钮 loading
const isSendingCode = ref(false) // 发送验证码 loading
const error = ref<string | null>(null)
const successMessage = ref<string | null>(null)
const infoMessage =ref<string|null>(null)//提示邮箱获取结果

// 倒计时相关
const countdown = ref(0)
let timer: ReturnType<typeof setInterval> | null = null
 
  

// 组件卸载时清除定时器
onUnmounted(() => {
  if (timer) clearInterval(timer)
})



// 发送验证码逻辑
const handleSendCode = async () => {
  if (!formData.email) {
    error.value = '请输入邮箱地址以获取验证码'
    return
  }
  // 简单的邮箱格式校验
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(formData.email)) {
    error.value = '请输入有效的邮箱地址'
    return
  }

  error.value = null
  isSendingCode.value = true

  try {
    const res = await sendPasswordResetCode({ email: formData.email })
    // 假设后端返回 code === 0 或 200 表示成功，请根据实际封装调整
    if (res && (res.code === 0 || res.code === 200)) {
      successMessage.value = '验证码已发送，请查收邮件'
      startCountdown()
    } else {
      throw new Error(res.message || '发送验证码失败')
    }
  } catch (err: any) {
    error.value = err.message || '发送验证码请求失败，请稍后重试'
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

// 提交重置密码逻辑
const handleSubmit = async () => {
  // 基础校验
  if (!formData.email || !formData.verificationCode || !formData.newPassword) {
    error.value = '请填写完整信息'
    return
  }
  
  //  密码一致性校验
  if (formData.newPassword !== formData.confirmPassword) {
    error.value = '两次输入的密码不一致'
    return
  }

  // 密码长度校验 (API文档要求 >= 6)
  if (formData.newPassword.length < 6 || formData.newPassword.length > 20) {
    error.value = '新密码长度必须在 6 到 20 个字符之间'
    return
  }

  isLoading.value = true
  error.value = null
  successMessage.value = null

  try {
    // 构造 API 需要的参数结构
    const payload = {
      email: formData.email,
      verificationCode: formData.verificationCode,
      newPassword: formData.newPassword
    }

    const res = await resetPassword(payload)
    
    if (res && (res.code === 0 || res.code === 200)) {
      successMessage.value = '密码重置成功！3秒后跳转登录页...'
      // 3秒后跳转回登录页
      setTimeout(() => {
        router.push({ name: 'Login' }) 
      }, 3000)
    } else {
      throw new Error(res.message || '重置密码失败')
    }
  } catch (err: any) {
    error.value = err.message || '重置密码过程中出现错误'
  } finally {
    isLoading.value = false
  }
}

// 返回登录页
const goBack = () => {
  router.push({ name: 'Login' })
}
</script>

<template>
<div  class="flex items-center justify-center min-h-screen bg-gray-50 px-4">
  <Card class="w-full max-w-sm" >
    <CardHeader style="center">
      <CardTitle class="text-2xl text-center">找回密码</CardTitle>
      <CardDescription class="text-center">
        请输入有效的邮箱地址
      </CardDescription>
    </CardHeader>
    
    <CardContent class="grid gap-4">
      <!-- 错误提示 -->
      <Alert v-if="error" variant="destructive">
        <AlertDescription>{{ error }}</AlertDescription>
      </Alert>
      
      <!-- 成功提示 -->
      <Alert v-if="successMessage" class="border-green-500 text-green-600 bg-green-50">
        <AlertDescription>{{ successMessage }}</AlertDescription>
      </Alert>
      <Alert v-if="infoMessage && !successMessage && !error" class="border-blue-500 text-blue-600 bg-blue-50">
        <AlertDescription>{{ infoMessage }}</AlertDescription>
      </Alert>



      <!-- 邮箱输入 + 发送验证码 -->
      <div class="grid gap-2">
        <Label for="email">邮箱</Label>
        <div class="flex gap-2">
          <Input 
            id="email" 
            type="email" 
            placeholder="name@example.com" 
            v-model="formData.email" 
            :disabled="isLoading || countdown > 0"
          />
          <Button 
            variant="outline" 
            @click="handleSendCode" 
            :disabled="isSendingCode || countdown > 0"
            class="whitespace-nowrap w-[120px]"
          >
            <Loader2 v-if="isSendingCode" class="mr-2 h-4 w-4 animate-spin" />
            <span v-else>{{ countdown > 0 ? `${countdown}s` : '发送验证码' }}</span>
          </Button>
        </div>
      </div>

      <!-- 验证码输入 -->
      <div class="grid gap-2">
        <Label for="code">验证码</Label>
        <Input 
          id="code" 
          type="text" 
          placeholder="请输入邮件中的验证码" 
          v-model="formData.verificationCode"
        />
      </div>

      <!-- 新密码 -->
      <div class="grid gap-2">
        <Label for="newPassword">新密码</Label>
        <Input 
          id="newPassword" 
          type="password" 
          placeholder="6-20位字符"
          v-model="formData.newPassword" 
        />
      </div>

      <!-- 确认新密码 -->
      <div class="grid gap-2">
        <Label for="confirmPassword">确认新密码</Label>
        <Input 
          id="confirmPassword" 
          type="password" 
          placeholder="请再次输入新密码"
          v-model="formData.confirmPassword" 
        />
      </div>
    </CardContent>
    
    <CardFooter class="flex flex-col gap-2">
      <Button 
        class="w-full bg-black text-white hover:bg-blue-600 focus-visible:ring-blue-500" 
        :disabled="isLoading" 
        @click="handleSubmit"
      >
        <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
        {{ isLoading ? '提交中...' : '重置密码' }}
      </Button>
      
      <Button 
        variant="ghost" 
        class="w-full" 
        @click="goBack"
      >
        <ArrowLeft class="mr-2 h-4 w-4" />
        返回登录
      </Button>
    </CardFooter>
  </Card>
</div>
</template>


