<script setup lang="ts">
import { KeyRound, LogOut, Upload } from 'lucide-vue-next';
import { useUserStore } from '@/stores/user';
import { useRouter } from 'vue-router';

import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


const userStore = useUserStore();
const router=useRouter();
const goToChangePassword=()=>{
   //userStore.changePassword();
    router.push({name:'ChangePassword'});
};

const handleSwitchAccount=async()=>{
    userStore.softLogout();
    alert('您是否退出当前账号？')
    router.push({name:'Login'});
     
};
</script>



<!-- 导航栏整体布局 -->
<template>
    <header class="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background sm:static sm:h-auto sm:border-0 sm:bg-transparent px-6">
        <div class="container mx-auto flex w-full items-center justify-between px-4 sm:px-6">
            <div>
            <h1 class="text-lg font-semibold">欢迎回来，{{ userStore.userRealName }}</h1>
            </div>
            
        
        <!-- 个人中心下拉菜单 -->
        <div class="flex items-center gap-2">
            <span class="text-sm font-medium hidden md:inline">个人中心</span>
            <DropdownMenu>
                <DropdownMenuTrigger as-child>
                    <Button variant="outline" size="icon" class="overflow-hidden rounded-full">
                        <Avatar class="h-9 w-9">
                            <AvatarImage :src="userStore.userInfo?.avatarUrl || ''" alt="Avatar" />
                            <AvatarFallback>{{ userStore.userInitial }}</AvatarFallback>
                        </Avatar>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" v-if="userStore.userInfo">
                    <DropdownMenuLabel>我的账户</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem class="flex flex-col items-start !text-muted-foreground">
                        <span>用户名: {{ userStore.userInfo.username }}</span>
                        <span>学工号: {{ userStore.userInfo.sduId }}</span>
                        <span>姓名：{{ userStore.userInfo.realName||userStore.userInfo.username }}</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem >
                        <Upload class="mr-2 h-4 w-4" />
                        <span>上传头像</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem @click="goToChangePassword">
                        <KeyRound class="mr-2 h-4 w-4" />
                        <span>修改密码</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem v-if="userStore.isLoggedIn" @click="handleSwitchAccount">
                        <LogOut class="mr-2 h-4 w-4" />
                        <span>切换账号</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
        </div>
    </header>
</template>