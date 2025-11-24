<!--主页整体布局-->
<script setup lang="ts">
import Header from '@/components/HomePage/Header.vue';
import Slidebar from '@/components/HomePage/Slidebar.vue';
import { useUserStore } from '@/stores/user';
import { watchEffect } from 'vue';
import { useRouter } from 'vue-router';
const userStore=useUserStore();
const router =useRouter();
//防御性验证
watchEffect(()=>{
    if(!userStore.isLoggedIn){
        alert('您还未登录，请先登录')
        router.replace({name:'Login'})
    }
})

</script>

<template>
    <div class="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        <!-- 引入侧边栏 -->
        <Slidebar />
        <div class="flex  flex-col">
            <!-- 引入顶部导航栏 -->
            <Header />
            <!-- 主内容区域 -->
            <main class="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-gray-50/50">
                <!-- 路由出口，用于显示具体的业务页面 -->
                <router-view />
            </main>
        </div>
    </div>
</template>