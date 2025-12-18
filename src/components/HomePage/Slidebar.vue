<!--主页侧边导航栏样式 - 支持多层级菜单-->
<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { Command } from 'lucide-vue-next'
import MenuItem from './MenuItem.vue'

const userStore = useUserStore()

// 从 store 获取菜单树
const menuTree = computed(() => userStore.menuTree)

// 组件挂载时，如果菜单为空则尝试获取
onMounted(async () => {
  if (userStore.isLoggedIn && userStore.menuTree.length === 0) {
    await userStore.fetchMenuTree()
  }
})
</script>

<template>
  <div
    class="hidden border-r bg-muted/40 md:block w-[220px] lg:w-[280px] h-screen flex-col flex sticky top-0"
  >
    <!-- 1. 顶部 Logo 区域 -->
    <div class="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
      <a href="/" class="flex items-center gap-2 font-semibold">
        <Command class="h-6 w-6" />
        <span class="">智慧作业管理平台</span>
      </a>
    </div>

    <!-- 2. 导航菜单区域 -->
    <div class="flex-1 overflow-y-auto">
      <nav class="grid items-start px-2 text-sm font-medium lg:px-4 mt-4 gap-1">
        <!-- 循环渲染菜单项 -->
        <MenuItem v-for="item in menuTree" :key="item.id" :menu-item="item" />
      </nav>
    </div>
  </div>
</template>
