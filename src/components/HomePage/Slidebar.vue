<!--主页侧边导航栏样式-->
<script setup lang="ts">
import { shallowRef } from 'vue';
import { Home, BookCheck, School, FileText, PencilRuler, MessageSquareQuote } from 'lucide-vue-next';
const menuItems=shallowRef([
    {name:'我的桌面',path:'/dashboard',icon:Home}


])
</script>

<template>
    <aside class="hidden w-64 flex-col border-r bg-background sm:flex">
        <div class="flex h-16 items-center border-b px-6">
            <a href="/dashboard" class="flex items-center gap-2 font-semibold">

                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6">
                    <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
                </svg>
                <span class="">智慧作业管理平台</span>
            </a>
        </div>
        <div class="flex-1 overflow-auto py-2">
            <nav class="grid items-start px-4 text-sm font-medium">
                <!-- 使用 router-link 来进行导航 -->
                <router-link v-for="item in menuItems" :key="item.name" :to="item.path"
                    class="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                    active-class="bg-muted text-primary">
                    <component :is="item.icon" class="h-4 w-4" />
                    {{ item.name }}
                </router-link>
            </nav>
        </div>
    </aside>
</template>