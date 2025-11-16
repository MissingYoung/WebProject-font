<script setup lang="ts">
import RegisterForm from '../components/RegisterForm.vue'
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="page-container">
    
    <RegisterForm />
    
    <div class="mt-4 text-center text-sm">
      已有账户?
      <RouterLink to="/login" class="underline">
        返回登录
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