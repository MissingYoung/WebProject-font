<!--主页侧边导航栏样式 - 支持多层级菜单-->
<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'
import { LayoutDashboard, User } from 'lucide-vue-next'
import MenuItem from './MenuItem.vue'
import type { MenuVO } from '@/types'

const userStore = useUserStore()
const router = useRouter()

// 从 store 获取菜单树
const role = computed(() => userStore.me?.role || userStore.userInfo?.role || '')
const isAdmin = computed(() => role.value === 'admin')

const ADMIN_HIDDEN_MENU_URLS = new Set(['/available-courses', '/my-enrollments'])

function filterMenuTreeForAdmin(items: MenuVO[]): MenuVO[] {
  return items
    .map((item) => {
      const nextChildren = item.children?.length ? filterMenuTreeForAdmin(item.children) : []
      return { ...item, children: nextChildren }
    })
    .filter((item) => {
      if (item.menuUrl && ADMIN_HIDDEN_MENU_URLS.has(item.menuUrl)) return false
      if (item.type === 'DIRECTORY') return item.children?.length > 0
      return true
    })
}

const menuTree = computed(() => {
  const tree = userStore.menuTree
  return isAdmin.value ? filterMenuTreeForAdmin(tree) : tree
})

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
    class="hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex md:flex-col w-[220px] lg:w-[280px] h-screen sticky top-0"
  >
    <!-- 1. 顶部 Logo 区域 - 固定不滚动 -->
    <div
      class="flex h-14 items-center border-b border-sidebar-border px-4 lg:h-[60px] lg:px-6 shrink-0 bg-sidebar"
    >
      <a
        href="/"
        class="flex items-center gap-2 font-semibold text-base hover:opacity-80 transition-opacity"
      >
        <LayoutDashboard class="h-6 w-6" />
        <span class="truncate">综合信息管理平台</span>
      </a>
    </div>

    <!-- 2. 导航菜单区域 - 独立滚动条 -->
    <nav class="flex-1 overflow-y-auto overflow-x-hidden px-2 lg:px-4 py-4 scrollbar-thin">
      <div class="grid items-start text-sm font-medium gap-1">
        <!-- 个人中心菜单项 -->
        <button
          class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-primary transition-colors w-full"
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
