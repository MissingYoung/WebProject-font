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
  </div>
</template>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, hsl(210 40% 98%) 0%, hsl(210 50% 95%) 50%, hsl(220 45% 96%) 100%);
  position: relative;
}

.page-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(147, 51, 234, 0.08) 0%, transparent 50%);
  pointer-events: none;
}
</style>