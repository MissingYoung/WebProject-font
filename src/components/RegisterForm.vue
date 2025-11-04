<script setup lang="ts">
import { reactive } from 'vue'
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
import { Loader2 } from 'lucide-vue-next'

const router = useRouter()

// 1. 更新 formData 以匹配 RegisterPayload 类型和后端 API 要求
const formData = reactive<RegisterPayload>({
  username: '',
  password: '',
  sduId: '',
  realName: '',
})

// 复用完全相同的 Composable，只传入不同的 API 函数
const { isLoading, error, submit } = useAuthForm(register)

const handleRegister = async () => {
  const result = await submit(formData)
  if (result && result.code === 200) {
    console.log('注册成功:', result)
    alert('注册成功！即将跳转到登录页...')
    // 注册成功后，自动跳转到登录页面
    router.push('/login')
  }
  else {
    error.value = '注册失败,请检查输入信息'
  }
}
</script>

<template>
  <Card class="w-full max-w-sm">
    <CardHeader>
      <CardTitle class="text-2xl">创建账户</CardTitle>
      <CardDescription>输入信息以注册新账户。</CardDescription>
    </CardHeader>
    <CardContent class="grid gap-4">
      <Alert v-if="error" variant="destructive">
        <AlertDescription>{{ error }}</AlertDescription>
      </Alert>

      
      <div class="grid gap-2">
        <Label for="username">用户名</Label>
        <Input id="username" type="text" placeholder="请输入用户名" v-model="formData.username" />
      </div>
      <div class="grid gap-2">
        <Label for="realName">真实姓名</Label>
        <Input id="realName" type="text" placeholder="请输入真实姓名" v-model="formData.realName" />
      </div>
      <div class="grid gap-2">
        <Label for="sduId">SDU ID</Label>
        <Input id="sduId" type="text" placeholder="请输入 SDU ID" v-model="formData.sduId" />
      </div>
      <div class="grid gap-2">
        <Label for="password">密码</Label>
        <Input id="password" type="password" placeholder="请输入密码" v-model="formData.password" />
      </div>
    </CardContent>
    <CardFooter>
      <Button class="w-full" :disabled="isLoading" @click="handleRegister">
        <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
        {{ isLoading ? '创建中...' : '创建账户' }}
      </Button>
    </CardFooter>
  </Card>
</template>