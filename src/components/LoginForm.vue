<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthForm } from '@/composables/userAuthForm'
import { login } from '@/lib/api'
import type { LoginPayload } from '@/types'
import { useUserStore } from '@/stores/user'
import type { UserInfo } from '@/types';

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-vue-next'
import IdentifyCode from './IdentifyCode.vue'



const router = useRouter()
const route = useRoute();
const userStore = useUserStore();



const formData = reactive({
  sduId: '',
  password: '',
  verifyCode: '',
})



const isLoading = ref(false);
const error = ref<string | null>(null);
const correctCode = ref('');
// 获取验证码组件的实例（用于手动触发刷新
const verifyCodeRef = ref<InstanceType<typeof IdentifyCode> | null>(null)
//接收生成的验证码
const handleCode = (code: string) => {
  correctCode.value = code
}

const submit = async (payload: LoginPayload) => {
  return await login(payload);
};

const handleLogin = async () => {

  const { sduId, password,verifyCode } = formData;
  if (!sduId || !password || !verifyCode) {
    error.value = '用户名,密码和验证码均为必填项，请完整填写后重试';
    return;
  }
  if (formData.verifyCode.toLowerCase() !== correctCode.value.toLowerCase()) {
    error.value='验证码错误，请重试'

    // 验证失败后，清空输入框并刷新验证码
    formData.verifyCode = ''
    verifyCodeRef.value?.refresh()
    return
  }

  isLoading.value = true;
  error.value = '';


  try {
    const result = await login(formData)
    console.log('登录结果: ', result);
    if (!result || !result.data) {
      throw new Error('登录服务响应异常，请稍后重试');
    }
    console.log('登录成功: ', result);
    const { token, username, userId, realName, role } = result.data;


    const miniUserInfo: UserInfo = {
      id: result.data.userId,
      username: username,
      sduId: formData.sduId,
      realName: result.data.realName || '',
      role: result.data.role,
      avatarUrl: '',
      gender: 2,// 0=MALE, 1=FEMALE, 2=UNKNOWN
      birthday: '',
      phone: '',
      email: '',
      ethnic: '',
      politicalStatus: '',
      description: ''


    }

    userStore.setUser({
      token: token,
      user: miniUserInfo,
    });


    alert('登陆成功，即将跳转到首页');
    await router.push({ name: 'Dashboard' });
    error.value = '';




  } catch (err: any) {
    const errorMessage = err.message || '登录过程中出现未知错误，请稍后重试';
    error.value = errorMessage;
    console.error('登录异常: ', errorMessage);
  } finally {
    isLoading.value = false;
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
        <Label for="sduId">学工号</Label>
        <Input id="sduId" type="text" placeholder="请输入用户id" v-model="formData.sduId" />
      </div>
      <div class="grid gap-2">
        <Label for="password">密码</Label>
        <Input id="password" type="password" v-model="formData.password" />
      </div>
      <!-- 验证码区域  -->
      <div class="grid gap-2">
        <Label for="verifyCode">验证码</Label>
        <div class="flex items-center gap-3">
          <!-- 输入框占据剩余空间 -->
          <Input id="verifyCode" class="flex-1" type="text" placeholder="输入右侧字符" v-model="formData.verifyCode"
            @keyup.enter="handleLogin" maxlength="4" />

          <!-- 验证码组件 -->
          <IdentifyCode ref="verifyCodeRef" :width="120" :height="40" @update:code="handleCode" />
        </div>
      </div>
    </CardContent>
    <CardFooter>
      <Button class="w-full  bg-black text-white hover:bg-blue-600 focus-visible:ring-blue-500" :disabled="isLoading"
        @click="handleLogin">
        <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
        {{ isLoading ? '登录中...' : '登 录' }}
      </Button>
    </CardFooter>
  </Card>
</template>