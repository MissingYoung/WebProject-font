<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthForm } from '@/composables/userAuthForm'
import { updateUserInfo } from '@/lib/api'
import type { UpdateUserInfoPayload } from '@/types'

// 引入 UI 组件
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-vue-next'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

const router = useRouter()

// 从本地读取 userId （先这样）
const userId = localStorage.getItem('userId') || ''

// 表单数据
const formData = reactive<UpdateUserInfoPayload>({
  username: '',
  realName: '',
  gender: undefined,
  birthday: '',
  phone: '',
  email: '',
  avatarUrl: '',
  ethnic: '',
  politicalStatus: '',
  description: '',
})

const { isLoading, error, submit } = useAuthForm((data) => updateUserInfo(data, userId))
const isLoadingUserInfo = ref(false) // 用于禁用按钮/占位

// 提交
const handleUpdate = async () => {
  if (!userId) {
    error.value = '未找到用户ID'
    return
  }
  try {
    const result = await submit(formData)
    if (result && (result as any).code === 200) {
      alert('用户信息更新成功！')
      router.back()
    } else {
      if (!error.value) {
        error.value = (result && (result as any).message) || '更新失败,请检查输入信息'
      }
    }
  } catch (err: any) {
    error.value = err?.message || '提交过程中发生异常'
  }
}
</script>

<template>
  <Card class="w-screen h-screen rounded-none">
    <CardHeader class="text-center pb-10 pt-10 px-10 border-b">
      <CardTitle class="text-3xl font-semibold mb-3">更新用户信息</CardTitle>
      <CardDescription class="text-base">修改您的个人信息</CardDescription>
    </CardHeader>
    <CardContent class="pt-12 px-10 pb-10 h-auto overflow-y-auto">
      <div v-if="isLoadingUserInfo" class="flex justify-center py-16">
        <Loader2 class="h-8 w-8 animate-spin" />
      </div>

      <div v-else class="flex flex-col items-center">
        <div class="w-full max-w-2xl grid gap-5">
          <Alert v-if="error" class="bg-red-100 border-red-500 flex justify-center">
            <AlertDescription class="text-red-700 text-center text-lg font-semibold">{{ error }}</AlertDescription>
          </Alert>

          <div class="grid gap-3">
            <Label for="username">用户名</Label>
            <Input id="username" type="text" v-model="formData.username" placeholder="请输入用户名" class="h-9 pl-6" />
          </div>

          <div class="grid grid-cols-3 gap-32">
            <div class="grid gap-3">
              <Label for="realName">真实姓名</Label>
              <Input id="realName" type="text" v-model="formData.realName" placeholder="请输入真实姓名" class="h-9 pl-6" />
            </div>

            <div class="grid gap-3">
              <Label for="gender">性别</Label>
              <Select :model-value="formData.gender?.toString()" @update:model-value="(val) => formData.gender = val ? parseInt(val) as (0 | 1 | 2) : undefined">
                <SelectTrigger id="gender" class="h-9 pl-6">
                  <SelectValue placeholder="选择性别" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">男</SelectItem>
                  <SelectItem value="1">女</SelectItem>
                  <SelectItem value="2">Fish</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="grid gap-3">
              <Label for="birthday">生日</Label>
              <Input id="birthday" type="date" v-model="formData.birthday" class="h-9 pl-6" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="grid gap-3">
              <Label for="ethnic">民族</Label>
              <Input id="ethnic" type="text" v-model="formData.ethnic" placeholder="请输入民族" class="h-9 pl-6" />
            </div>

            <div class="grid gap-3">
              <Label for="politicalStatus">政治面貌</Label>
              <Input id="politicalStatus" type="text" v-model="formData.politicalStatus" placeholder="请输入政治面貌" class="h-9 pl-6" />
            </div>
          </div>

          <div class="grid gap-3">
            <Label for="phone">电话</Label>
            <Input id="phone" type="tel" v-model="formData.phone" placeholder="请输入电话号码" class="h-9 pl-6" />
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
              :rows="4"
            />
          </div>
        </div>
      </div>

    </CardContent>
    <CardFooter class="flex gap-4 px-10 py-6 border-t justify-center flex-wrap">
      <Button class="h-8 w-20" :disabled="isLoading || isLoadingUserInfo" @click="handleUpdate">
        <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
        {{ isLoading ? '更新中...' : '更新信息' }}
      </Button>
      <Button variant="outline" class="h-8 w-20" @click="router.push('/update-profile')">
        资料编辑
      </Button>
      <Button variant="outline" class="h-8 w-20" @click="router.back()">
        取消
      </Button>
    </CardFooter>
  </Card>
</template>

<style scoped>

</style>