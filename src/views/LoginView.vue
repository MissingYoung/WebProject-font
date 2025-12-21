<script setup lang="ts">
import LoginForm from '../components/LoginForm.vue'
import { RouterLink } from 'vue-router'
import { ref } from 'vue'
import { Button } from '@/components/ui/button'

type LoginFormExposed = {
  loginDemo: (role: 'student' | 'teacher' | 'admin') => Promise<void>
}

const loginFormRef = ref<LoginFormExposed | null>(null)
</script>

<template>
  <div class="page-container">
    <div class="fixed right-4 top-4 z-50 flex gap-2">
      <Button variant="outline" size="sm" @click="loginFormRef?.loginDemo('student')"
        >演示学生</Button
      >
      <Button variant="outline" size="sm" @click="loginFormRef?.loginDemo('teacher')"
        >演示教师</Button
      >
      <Button variant="secondary" size="sm" @click="loginFormRef?.loginDemo('admin')"
        >演示管理员</Button
      >
    </div>

    <LoginForm ref="loginFormRef" />
    <div class="mt-4 text-center text-sm">
      还没有账户?
      <RouterLink to="/register" class="underline"> 立即注册 </RouterLink>
    </div>
    <div class="mt-4 text-center text-sm">
      忘记密码?
      <RouterLink to="/find-password" class="underline"> 立即找回 </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: hsl(210 40% 98%);
}
</style>
