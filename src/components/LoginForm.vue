<script setup lang="ts"> 
import { reactive, computed, ref } from 'vue'
import { useAuthForm } from '@/composables/userAuthForm'
import { login } from '@/lib/api'
import type { LoginPayload } from '@/types' 

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Eye, EyeOff } from 'lucide-vue-next'

// 密码可见性状态
const showPassword = ref(false)

const formData = reactive<LoginPayload>({
  sduId: '',
  password: '',
})

// 输入验证
const isFormValid = computed(() => {
  const sduIdValid = formData.sduId && formData.sduId.trim().length > 0
  const passwordValid = formData.password && formData.password.length >= 6
  return sduIdValid && passwordValid
})

const { isLoading, error, submit } = useAuthForm(login)

const handleLogin = async () => {
  // 前端验证
  if (!formData.sduId || formData.sduId.trim().length === 0) {
    error.value = '请输入学号'
    return
  }
  
  if (!formData.password || formData.password.length < 6) {
    error.value = '密码长度至少为6位'
    return
  }

  const result = await submit(formData)
  if (result && result.code === 200) {
    console.log('登录成功，Token:', result.data.token)
    alert('登录成功！')
  } else {
    // 显示后端返回的错误信息，如果没有则使用友好的默认提示
    const backendMessage = result?.message || ''
    // 对常见的技术错误进行友好转换
    if (backendMessage.includes('500') || backendMessage.includes('Internal Server Error')) {
      error.value = '服务器暂时无法处理您的请求，请稍后重试'
    } else if (backendMessage.includes('Network') || backendMessage.includes('timeout')) {
      error.value = '网络连接失败，请检查您的网络连接'
    } else if (backendMessage) {
      error.value = backendMessage
    } else {
      error.value = '登录失败，请检查学号和密码是否正确'
    }
  }
}

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}
</script>

<template>
  <Card class="w-full max-w-sm">
    <CardHeader>
      <CardTitle class="text-2xl">登录</CardTitle>
      <CardDescription>请输入您的账户信息登录系统</CardDescription>
    </CardHeader>
    <CardContent class="grid gap-4">
      <Alert v-if="error" variant="destructive">
        <AlertDescription>{{ error }}</AlertDescription>
      </Alert>
      <div class="grid gap-2">
        <Label for="sduId" class="flex items-center gap-1">
          学号
          <span class="text-destructive">*</span>
          <span class="text-xs text-muted-foreground">(必填)</span>
        </Label>
        <Input 
          id="sduId" 
          type="text" 
          placeholder="请输入您的学号" 
          v-model="formData.sduId"
          :aria-invalid="error ? 'true' : undefined"
        />
      </div>
      <div class="grid gap-2">
        <Label for="password" class="flex items-center gap-1">
          密码
          <span class="text-destructive">*</span>
          <span class="text-xs text-muted-foreground">(至少6位，必填)</span>
        </Label>
        <div class="relative">
          <Input 
            id="password" 
            :type="showPassword ? 'text' : 'password'" 
            placeholder="请输入您的密码"
            v-model="formData.password"
            :aria-invalid="error ? 'true' : undefined"
            class="pr-10"
          />
          <button
            type="button"
            @click="togglePasswordVisibility"
            class="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            :aria-label="showPassword ? '隐藏密码' : '显示密码'"
          >
            <Eye v-if="!showPassword" class="h-4 w-4" />
            <EyeOff v-else class="h-4 w-4" />
          </button>
        </div>
      </div>
    </CardContent>
    <CardFooter>
      <Button 
        class="w-full" 
        :disabled="isLoading || !isFormValid" 
        @click="handleLogin"
      >
        <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
        {{ isLoading ? '登录中...' : '登录' }}
      </Button>
    </CardFooter>
  </Card>
</template>