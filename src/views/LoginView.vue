<script setup lang="ts">
import LoginForm from '../components/LoginForm.vue'
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="page-container">
    <LoginForm />
    <div class="mt-4 text-center text-sm">
      还没有账户?
      <RouterLink to="/register" class="underline">
        立即注册
      </RouterLink>
    </div>
    <div class="mt-4 text-center text-sm">
      忘记密码?
      <RouterLink to="/find-password" class="underline">
        找回密码
      </RouterLink>
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