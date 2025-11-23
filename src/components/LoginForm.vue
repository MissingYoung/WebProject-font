<script setup lang="ts"> 
import { reactive,ref } from 'vue'
import { useRouter ,useRoute} from 'vue-router'
import { useAuthForm } from '@/composables/userAuthForm'
import { login } from '@/lib/api'
import type { LoginPayload } from '@/types' 
import { useUserStore, } from '@/stores/user'
import type { UserInfo } from '@/types'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-vue-next'
import IdentifyCode from './IdentifyCode.vue'



const router = useRouter()
const route = useRoute();
const userStore =useUserStore();


const formData = reactive({
  sduId: '',
  password: '',
  verifyCode:'',
})


const realCode =ref('');
const isLoading = ref(false);
const error = ref<string | null>(null);

// 接收子组件生成的验证码
const handleUpdateCode = (code: string) => {
  realCode.value = code
}

const submit = async (payload: LoginPayload) => {
  return await login(payload);
};

const handleLogin = async () => {

  const {sduId, password,verifyCode} = formData;
  if (!sduId || !password||!verifyCode) {
    error.value = '用户名,密码和图形验证码均为必填项，请完整填写后重试';
    return;
  }

    // 忽略大小写比较的前端验证码
  if (verifyCode.toLowerCase() !== realCode.value.toLowerCase()) {
    error.value = '验证码错误，请重新输入'
    return
  }

  isLoading.value=true;
  error.value='';


  try {
    const result = await login(formData)
    console.log('登录结果: ', result);
    if (!result || !result.data) {
      throw new Error('登录服务响应异常，请稍后重试');
    }
    console.log('登录成功: ', result);
    const {token,username,userId,realName,role}=result.data;


      const miniUserInfo:UserInfo={
        id:result.data.userId,
        username:username,
        sduId:formData.sduId,
        realName:result.data.realName||'',
        role:result.data.role,
        avatarUrl:null,
        
      }

      userStore.setUser({
        token:token,
        user:miniUserInfo,
      });


      alert('登陆成功，即将跳转到首页');
      await router.push({name:'Dashboard'});
      error.value='';
     
   


  } catch (err:any) {
    const errorMessage = err.message || '登录过程中出现未知错误，请稍后重试';
    error.value=errorMessage;
    console.error('登录异常: ', errorMessage);
  }finally{
    isLoading.value=false;
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
      <div class="grid gap-2">
        <Label for="verifyCode">验证码</Label>
        <div class="flex gap-3 items-center">
          <Input
          id="verifyCode"
          type="text"
          placeholder="不区分大小写"
          v-model="formData.verifyCode"
          class="flex-1"
          @key.enter="handleLogin"
          />
          <!--验证码图片组件-->
          <IdentifyCode
          :width="120"
          :height="40"
          @update:code="handleUpdateCode"
          />
        </div>
      </div>
    </CardContent>
    <CardFooter>
      <Button class="w-full  bg-black text-white hover:bg-blue-600 focus-visible:ring-blue-500" 
      :disabled="isLoading" 
      @click="handleLogin">
        <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
        {{ isLoading ? '登录中...' : '登 录' }}
      </Button>
    </CardFooter>
  </Card>
</template>