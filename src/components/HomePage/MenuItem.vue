<!--菜单项组件 - 递归渲染多层级菜单-->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import type { MenuVO } from '@/types'
import { ChevronDown } from 'lucide-vue-next'
import * as LucideIcons from 'lucide-vue-next'

interface Props {
  menuItem: MenuVO
  level?: number
}

const props = withDefaults(defineProps<Props>(), {
  level: 0,
})

const router = useRouter()

// 判断是否为目录
const isDirectory = computed(() => props.menuItem.type === 'DIRECTORY')

// 判断是否有子菜单
const hasChildren = computed(() => props.menuItem.children && props.menuItem.children.length > 0)

// 控制目录展开/收起
const isExpanded = ref(true)

// 切换展开状态
const toggleExpand = () => {
  if (isDirectory.value && hasChildren.value) {
    isExpanded.value = !isExpanded.value
  }
}

// 处理菜单点击
const handleClick = () => {
  if (isDirectory.value) {
    // 目录：切换展开状态
    toggleExpand()
  } else if (props.menuItem.menuUrl) {
    // 菜单：跳转路由
    router.push(props.menuItem.menuUrl)
  }
}

// 判断当前菜单是否激活
const isActive = computed(() => {
  if (!props.menuItem.menuUrl) return false
  return router.currentRoute.value.path === props.menuItem.menuUrl
})

// 动态加载图标组件
const IconComponent = computed(() => {
  if (!props.menuItem.icon) return null

  // 将 kebab-case 转换为 PascalCase
  // 例如: "layout-dashboard" -> "LayoutDashboard"
  const iconName = props.menuItem.icon
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')

  // 从 lucide-vue-next 中获取对应的图标组件
  return (LucideIcons as Record<string, unknown>)[iconName] || null
})

// 计算缩进样式
const indentStyle = computed(() => ({
  paddingLeft: `${props.level * 1 + 0.75}rem`,
}))
</script>

<template>
  <div>
    <!-- 菜单项 -->
    <div
      :class="[
        'flex items-center justify-between rounded-lg px-3 py-2 transition-colors cursor-pointer',
        'hover:text-sidebar-primary hover:bg-sidebar-accent',
        {
          'bg-sidebar-accent text-sidebar-primary': isActive,
          'text-sidebar-foreground/70': !isActive,
          'font-semibold': isDirectory && level === 0,
        },
      ]"
      :style="indentStyle"
      @click="handleClick"
    >
      <!-- 左侧：图标 + 名称 -->
      <div class="flex items-center gap-3">
        <component :is="IconComponent" v-if="IconComponent" class="h-4 w-4 flex-shrink-0" />
        <span>{{ menuItem.name }}</span>
      </div>

      <!-- 右侧：展开/收起图标（仅目录显示） -->
      <ChevronDown
        v-if="isDirectory && hasChildren"
        :class="['h-4 w-4 transition-transform', { 'rotate-180': !isExpanded }]"
      />
    </div>

    <!-- 子菜单 -->
    <div v-if="isDirectory && hasChildren && isExpanded" class="mt-1 space-y-1">
      <MenuItem
        v-for="child in menuItem.children"
        :key="child.id"
        :menu-item="child"
        :level="level + 1"
      />
    </div>
  </div>
</template>
