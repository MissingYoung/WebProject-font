<!--主页侧边导航栏样式 - 支持多层级菜单-->
<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'
import { Command, User } from 'lucide-vue-next'
import MenuItem from './MenuItem.vue'

const userStore = useUserStore()
const router = useRouter()

// 从 store 获取菜单树
const menuTree = computed(() => userStore.menuTree)

// 组件挂载时，如果菜单为空则尝试获取
onMounted(async () => {
  if (userStore.isLoggedIn && userStore.menuTree.length === 0) {
    await userStore.fetchMenuTree()
  }
})

// 导航到个人中心
const goToProfile = () => {
  router.push({ name: 'UserProfile' })
}
</script>

<template>
  <aside
    class="hidden border-r bg-muted/40 md:flex md:flex-col w-[220px] lg:w-[280px] h-screen sticky top-0"
  >
    <!-- 1. 顶部 Logo 区域 - 固定不滚动 -->
    <div class="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6 shrink-0 bg-white">
      <a
        href="/"
        class="flex items-center gap-2 font-semibold text-base hover:opacity-80 transition-opacity"
      >
        <Command class="h-6 w-6" />
        <span class="truncate">智慧作业管理平台</span>
      </a>
    </div>

    <!-- 2. 导航菜单区域 - 独立滚动条 -->
    <nav
      class="flex-1 overflow-y-auto overflow-x-hidden px-2 lg:px-4 py-4 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent hover:scrollbar-thumb-gray-600 transition-colors"
    >
      <div class="grid items-start text-sm font-medium gap-1">
        <!-- 个人中心菜单项 -->
        <button
          class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors w-full"
          @click="goToProfile"
        >
          <User class="h-4 w-4 shrink-0" />
          <span class="truncate">个人中心</span>
        </button>

        <!-- 循环渲染菜单项 -->
        <MenuItem v-for="item in menuTree" :key="item.id" :menu-item="item" />
      </div>
    </nav>
  </aside>
</template>

<style scoped>
/* 自定义滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

/* Firefox 滚动条 */
* {
  scrollbar-color: #d1d5db transparent;
  scrollbar-width: thin;
}
</style>
