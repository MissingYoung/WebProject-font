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
  const result = await submit(formData)
  if (result&&result.code===200) {

    console.log('登录成功，Token:', result.data.token)
    alert('登录成功！')
  }
  else {
    error.value=result?.message||'登录失败,请检查用户名和密码'
  }
}
</script>

<template>
 
  <Card class="w-full max-w-sm">
    <CardHeader>
      <CardTitle class="text-2xl">登录</CardTitle>
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