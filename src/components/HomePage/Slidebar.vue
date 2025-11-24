<!--主页侧边导航栏样式-->
<script setup lang="ts">
import { shallowRef } from 'vue';
import {Button}from '@/components/ui/button'
import { Home,GraduationCap,Command} from 'lucide-vue-next';
const menuItems=shallowRef([
    {name:'我的桌面',routeName:'Dashboard',icon:Home},
    {name:'课程列表',routeName:'CourseList',icon:GraduationCap}


])
</script>

<template>
  <div class="hidden border-r bg-muted/40 md:block w-[220px] lg:w-[280px] h-screen flex-col flex sticky top-0">
    <!-- 1. 顶部 Logo 区域 -->
    <div class="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
      <a href="/" class="flex items-center gap-2 font-semibold">
        <Command class="h-6 w-6" />
        <span class="">智慧作业管理平台</span>
      </a>
    </div>

    <!-- 2. 导航菜单区域 -->
    <div class="flex-1">
      <nav class="grid items-start px-2 text-sm font-medium lg:px-4 mt-4 gap-2">
        
        <!-- 循环渲染菜单项 -->
        <router-link 
          v-for="item in menuItems" 
          :key="item.routeName"
          :to="{ name: item.routeName }"
          custom
          v-slot="{ href, navigate, isActive }"
        >
          <a 
            :href="href" 
            @click="navigate"
            :class="[
              'flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary',
              isActive ? 'bg-muted text-primary' : 'text-muted-foreground'
            ]"
          >
            <component :is="item.icon" class="h-4 w-4" />
            {{ item.name }}
          </a>
        </router-link>

      </nav>
    </div>
  </div>
</template>