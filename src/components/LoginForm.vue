<script setup lang="ts"> 
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthForm } from '@/composables/userAuthForm'
import { login } from '@/lib/api'
import type { LoginPayload } from '@/types' 

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-vue-next'



const router = useRouter()


const formData = reactive<LoginPayload>({
  sduId: '',
  password: '',
})


const { isLoading, error, submit } = useAuthForm(login)

const handleLogin = async () => {

  const {sduId, password} = formData;
  if (!sduId || !password) {
    error.value = '用户名和密码均为必填项，请完整填写后重试';
    return;
  }

  try {
    const result = await submit(formData)
    console.log('登录结果: ', result);
    if (result && result.code === 200) {
      console.log('登录成功: Token:', result.data?.token);
      alert('登录成功！即将跳转到首页...')
      error.value = ''
      //router.push('/')

    } if (result&&result.code === 500) {
      error.value = '用户名或密码错误,请检查后重试'
      console.error('登录失败:(Code:500) ', result.message);
    }
    if (result && result.code === 400) {
      error.value = '登录失败: ' + result.message
      console.error('登录失败:(Code:400) ', result.message);
    }
  } catch (err) {
    error.value = '登录过程中出现错误，请检查你的网络或稍后重试'
    console.error('登录异常: ', err);
  }
}
</script>

<template>
 
  <Card class="w-full max-w-sm">
    <CardHeader>
      <CardTitle class="text-2xl" style="text-align: center;">作业管理系统</CardTitle>
      <CardTitle class="text-lg">登录</CardTitle>
      <CardDescription>请输入您的账户信息。</CardDescription>
    </CardHeader>
    <CardContent class="grid gap-4">
      <Alert v-if="error" variant="destructive">
        <AlertDescription>{{ error }}</AlertDescription>
      </Alert>
      <div class="grid gap-2">
        <Label for="sduId">用户名</Label>
        <Input id="sduId" type="text" placeholder="请输入用户id" v-model="formData.sduId" />
      </div>
      <div class="grid gap-2">
        <Label for="password">密码</Label>
        <Input id="password" type="password" v-model="formData.password" />
      </div>
    </CardContent>
    <CardFooter>
      <Button class="w-full" :disabled="isLoading" @click="handleLogin">
        <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
        {{ isLoading ? '登录中...' : '登 录' }}
      </Button>
    </CardFooter>
  </Card>
</template>