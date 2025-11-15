<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { changePassword } from '@/lib/api';
import type { ChangePasswordPayload } from '@/types/index';

// 引入你的 UI 组件
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-vue-next';

const router = useRouter();
const userStore = useUserStore();

const formData = reactive<ChangePasswordPayload>({
  oldPassword: '',
  newPassword: '',
});
const confirmNewPassword = ref('');
const isLoading = ref(false);
const error = ref<string | null>(null);
function cancelChangePassword(){
  alert('您确定放弃修改吗？')
  router.push({ name: 'Dashboard' }); 
}

const handleChangePassword = async () => {
  // 1. 前端校验
  if (!formData.oldPassword || !formData.newPassword || !confirmNewPassword.value) {
    error.value = '所有字段均为必填项。';
    return;
  }
  if (formData.newPassword !== confirmNewPassword.value) {
    error.value = '两次输入的新密码不一致，请重新输入。';
    return;
  }
  if (!userStore.userInfo?.id) {
    error.value = '无法获取用户信息，请重新登录。';
    return;
  }

  isLoading.value = true;
  error.value = null;

  try {
    // 2. 调用 API
    const result = await changePassword(userStore.userInfo.id, formData);

    if (result && result.code === 200) {
      // 3. 成功处理
      alert('密码修改成功！请使用新密码重新登录。');
      
      // 登出用户 (清除本地 token 和用户信息)
      userStore.logout();

      // 跳转到登录页
      router.push({ name: 'Login' }); // 确保你的登录路由 name 是 'Login'
    } else {
      // API 返回的业务错误
      error.value = result.message || '修改失败，请检查您的旧密码是否正确。';
    }
  } catch (err) {
    // 网络或其他异常
    error.value = '请求失败，请检查您的网络连接或稍后重试。';
    console.error('修改密码异常:', err);
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-muted/40">
    <Card class="w-full max-w-md">
      <CardHeader>
        <CardTitle class="text-2xl">修改密码</CardTitle>
        <CardDescription>
          密码修改成功后，您需要使用新密码重新登录。
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div v-if="error" class="mb-4">
          <Alert variant="destructive">
            <AlertDescription>{{ error }}</AlertDescription>
          </Alert>
        </div>
        <div class="space-y-2">
          <Label for="oldPassword">旧密码</Label>
          <Input id="oldPassword" type="password" v-model="formData.oldPassword" required />
        </div>
        <div class="space-y-2">
          <Label for="newPassword">新密码</Label>
          <Input id="newPassword" type="password" v-model="formData.newPassword" required />
        </div>
        <div class="space-y-2">
          <Label for="confirmNewPassword">确认新密码</Label>
          <Input id="confirmNewPassword" type="password" v-model="confirmNewPassword" required />
        </div>
    
      </CardContent>
      <CardFooter>
        <Button @click="handleChangePassword" :disabled="isLoading" class="w-full bg-black text-white hover:bg-green-600 focus-visible:ring-red-500">
          <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
          确认修改
        </Button>
      </CardFooter>
      <CardFooter>
        <Button @click="cancelChangePassword" :disabled="isLoading" class="w-full bg-black text-white hover:bg-red-600 focus-visible:ring-red-500">
          <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin " />
          放弃修改
        </Button>
      </CardFooter>
    </Card>
  </div>
</template>