<script setup lang="ts">
import { onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { useNotification } from '@/composables/useNotification'
import { Loader2 } from 'lucide-vue-next'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import NotificationDialog from '@/components/NotificationDialog.vue'

const userStore = useUserStore()
const { notificationState, closeNotification } = useNotification()

// 当组件挂载时，执行初始化检查
onMounted(() => {
  userStore.initializeUser()
})
</script>

<template>
  <!-- 当应用正在初始化时，显示一个全屏的加载动画 -->
  <div
    v-if="!userStore.isInitialized"
    class="fixed inset-0 flex items-center justify-center bg-background"
  >
    <Loader2 class="h-10 w-10 animate-spin" />
  </div>

  <RouterView v-else />

  <!-- 全局确认对话框 -->
  <ConfirmDialog />

  <!-- 全局通知对话框 -->
  <NotificationDialog :state="notificationState" @close="closeNotification" />
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
