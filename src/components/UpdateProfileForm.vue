<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthForm } from '@/composables/userAuthForm'
import { updateUserProfile, getUserInfo } from '@/lib/api'
import type { UpdateProfilePayload } from '@/types'

// 引入 UI 组件
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-vue-next'
import { Textarea } from '@/components/ui/textarea'

const router = useRouter()

// 从本地读取 userId（不考虑登录态）
const userId = localStorage.getItem('userId') || ''

// 表单数据
const formData = reactive<UpdateProfilePayload>({
  username: '',
  email: '',
  avatarUrl: '',
  description: '',
})


const { isLoading, error, submit } = useAuthForm((data) => updateUserProfile(data as UpdateProfilePayload, userId))
const isLoadingProfile = ref(false)
const userRole = ref('')
const hasPermission = ref(false) // 这个页面只要有 userId 即可编辑（测试）

onMounted(async () => {
  if (!userId) {
    error.value = '未找到用户ID'
    return
  }
  isLoadingProfile.value = true
  try {
    const res = await getUserInfo(userId)
    userRole.value = res?.data?.role || ''
  } catch (e: any) {
    console.warn('获取角色失败(可忽略)：', e?.message)
  } finally {
    isLoadingProfile.value = false
  }
  hasPermission.value = true
})

const handleUpdate = async () => {
  if (!userId) {
    error.value = '未找到用户ID'
    return
  }
  try {
    const result = await submit(formData)
    if (result && (result as any).code === 200) {
      alert('用户资料更新成功！')
      router.back()
    } else if (!error.value) {
      error.value = (result && (result as any).message) || '更新失败,请检查输入信息'
    }
  } catch (err: any) {
    error.value = err?.message || '提交过程中发生异常'
  }
}
</script>

<template>
  <Card class="w-screen h-screen rounded-none">
    <CardHeader class="text-center pb-10 pt-10 px-10 border-b">
      <CardTitle class="text-3xl font-semibold mb-3">编辑用户资料</CardTitle>
      <CardDescription class="text-base">修改您的个人资料信息</CardDescription>
    </CardHeader>

    <CardContent class="pt-12 px-10 pb-10 h-auto overflow-y-auto">
      <div v-if="error || !hasPermission" class="flex justify-center mb-6">
        <Alert class="bg-red-100 border-red-500 w-full max-w-2xl flex justify-center px-4">
          <div class="w-full text-center">
            <AlertDescription class="text-red-700 text-lg font-semibold !text-center w-full block">
              {{ error || '正在验证登录状态...' }}
            </AlertDescription>
          </div>
        </Alert>
      </div>

      <p class="text-sm text-gray-500 mb-4 text-center">当前角色：{{ userRole || '未知' }}</p>

      <div class="flex flex-col items-center">
        <div class="w-full max-w-2xl grid gap-5">

          <div class="grid gap-3">
            <Label for="username">用户名</Label>
            <Input id="username" type="text" v-model="formData.username" placeholder="请输入用户名" class="h-9 pl-6" />
          </div>

          <div class="grid gap-3">
            <Label for="email">邮箱</Label>
            <Input id="email" type="email" v-model="formData.email" placeholder="请输入邮箱" class="h-9 pl-6" />
          </div>

          <div class="grid gap-3">
            <Label for="avatarUrl">头像 URL</Label>
            <Input id="avatarUrl" type="url" v-model="formData.avatarUrl" placeholder="请输入头像 URL" class="h-9 pl-6" />
            <div v-if="formData.avatarUrl" class="mt-3 flex justify-center">
              <img :src="formData.avatarUrl" :alt="formData.username" class="h-24 w-24 rounded-full object-cover border-2 border-gray-200" />
            </div>
          </div>

          <div class="grid gap-3">
            <Label for="description">个人描述</Label>
            <Textarea
              id="description"
              v-model="formData.description"
              placeholder="请输入个人描述…"
              class="resize-none pl-6"
              :rows="6"
            />
          </div>
        </div>
      </div>
    </CardContent>

    <CardFooter class="flex gap-4 px-10 py-6 border-t justify-center">
      <Button
        class="h-8 w-20"
        :disabled="isLoading || isLoadingProfile || !userId"
        @click="handleUpdate"
      >
        <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
        {{ isLoading ? '更新中...' : '更新资料' }}
      </Button>
      <Button variant="outline" class="h-8 w-20" @click="router.back()">
        取消
      </Button>
    </CardFooter>
  </Card>
</template>

<style scoped>

</style>