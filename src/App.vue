<script setup lang="ts">
import { onMounted } from 'vue';
import { useUserStore } from '@/stores/user';
import { Loader2 } from 'lucide-vue-next'; 
const userStore = useUserStore();

// 当组件挂载时，执行初始化检查
onMounted(() => {
  userStore.initializeUser();
});

</script>

<template>
    <!-- 当应用正在初始化时，显示一个全屏的加载动画 -->
  <div v-if="!userStore.isInitialized" class="fixed inset-0 flex items-center justify-center bg-background">
    <Loader2 class="h-10 w-10 animate-spin" />
  </div>
  
  <RouterView  v-else/>
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
