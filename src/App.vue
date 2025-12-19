<script setup lang="ts">
import { onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { useNotification } from '@/composables/useNotification'
import { Loader2 } from 'lucide-vue-next'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import NotificationDialog from '@/components/NotificationDialog.vue'
import { Toaster } from '@/components/ui/sonner'

const userStore = useUserStore()
const { notificationState, closeNotification } = useNotification()

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

  <!-- Sonner Toast 通知 -->
  <Toaster
    position="top-center"
    rich-colors
    close-button
    expand
    :visible-toasts="3"
    :offset="24"
    :toast-options="{
      style: {
        margin: '0 auto',
      },
    }"
  />
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
