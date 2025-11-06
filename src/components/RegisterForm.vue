<script setup lang="ts">
import { reactive, computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthForm } from '@/composables/userAuthForm'
import { register } from '@/lib/api'
import type { RegisterPayload } from '@/types' 

// 引入 UI 组件
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Eye, EyeOff } from 'lucide-vue-next'

const router = useRouter()

// 密码可见性状态
const showPassword = ref(false)

// 1. 更新 formData 以匹配 RegisterPayload 类型和后端 API 要求
const formData = reactive<RegisterPayload>({
  username: '',
  password: '',
  sduId: '',
  realName: '',
})

// 输入验证
const isFormValid = computed(() => {
  const usernameValid = formData.username && formData.username.trim().length >= 2
  const passwordValid = formData.password && formData.password.length >= 6
  const sduIdValid = formData.sduId && formData.sduId.trim().length > 0
  const realNameValid = formData.realName && formData.realName.trim().length >= 2
  return usernameValid && passwordValid && sduIdValid && realNameValid
})

// 复用完全相同的 Composable，只传入不同的 API 函数
const { isLoading, error, submit } = useAuthForm(register)

const handleRegister = async () => {
  // 前端验证
  if (!formData.username || formData.username.trim().length < 2) {
    error.value = '用户名至少需要2个字符'
    return
  }
  
  if (!formData.realName || formData.realName.trim().length < 2) {
    error.value = '真实姓名至少需要2个字符'
    return
  }
  
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
    console.log('注册成功:', result)
    alert('注册成功！即将跳转到登录页...')
    // 注册成功后，自动跳转到登录页面
    router.push('/login')
  } else {
    // 显示后端返回的错误信息，如果没有则使用友好的默认提示
    const backendMessage = result?.message || ''
    // 对常见的技术错误进行友好转换
    if (backendMessage.includes('500') || backendMessage.includes('Internal Server Error')) {
      error.value = '服务器暂时无法处理您的请求，请稍后重试'
    } else if (backendMessage.includes('Network') || backendMessage.includes('timeout')) {
      error.value = '网络连接失败，请检查您的网络连接'
    } else if (backendMessage.includes('duplicate') || backendMessage.includes('已存在')) {
      error.value = '该用户名或学号已被注册，请更换后重试'
    } else if (backendMessage) {
      error.value = backendMessage
    } else {
      error.value = '注册失败，请检查输入信息是否正确'
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
      <CardTitle class="text-2xl">创建账户</CardTitle>
      <CardDescription>填写以下信息以注册新账户</CardDescription>
    </CardHeader>
    <CardContent class="grid gap-4">
      <Alert v-if="error" variant="destructive">
        <AlertDescription>{{ error }}</AlertDescription>
      </Alert>

      <div class="grid gap-2">
        <Label for="username" class="flex items-center gap-1">
          用户名
          <span class="text-destructive">*</span>
          <span class="text-xs text-muted-foreground">(至少2位，必填)</span>
        </Label>
        <Input 
          id="username" 
          type="text" 
          placeholder="请输入用户名" 
          v-model="formData.username"
          :aria-invalid="error ? 'true' : undefined"
        />
      </div>
      <div class="grid gap-2">
        <Label for="realName" class="flex items-center gap-1">
          真实姓名
          <span class="text-destructive">*</span>
          <span class="text-xs text-muted-foreground">(至少2位，必填)</span>
        </Label>
        <Input 
          id="realName" 
          type="text" 
          placeholder="请输入真实姓名" 
          v-model="formData.realName"
          :aria-invalid="error ? 'true' : undefined"
        />
      </div>
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
            placeholder="请输入密码（至少6位）"
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
        @click="handleRegister"
      >
        <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
        {{ isLoading ? '注册中...' : '注册账户' }}
      </Button>
    </CardFooter>
  </Card>
</template>