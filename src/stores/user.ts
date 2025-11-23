import {defineStore} from 'pinia'
import {ref ,computed} from 'vue'
import { getCurrentUser } from '@/lib/api';
import type { UserInfo } from '@/types'




//定义store
export const useUserStore=defineStore('user',()=>{
    //用户信息状态
   const token=ref<string|null>(null);
   const userInfo=ref<UserInfo|null>(null);
   const isInitialized =ref(false);
   const isLoggedIn=computed(()=>!!token.value&&!!userInfo.value);//判断用户是否登录
   const userRealName=computed(()=>userInfo.value?.username||userInfo.value?.realName||'访客')
   const isSoftLoggedOut =ref();

   //计算用户姓名首字母，用于 Avatar Fallbac
    const userInitial = computed(() => {
        const name=userInfo.value?.realName||userInfo.value?.username;

        if (name) {
            return name.charAt(0).toUpperCase();
        }
        return 'U';//默认值
    })
   function setUser(data:{token:string;user:UserInfo}){
       token.value=data.token;
       userInfo.value=data.user;
       isSoftLoggedOut.value=false;
      // localStorage.setItem('token',data.token);
       //localStorage.setItem('userInfo',JSON.stringify(data.user));
   }

    //用于更新用户头像
    function setAvatar(url: string) {
        if (userInfo.value) {
            userInfo.value.avatarUrl = url;
           //localStorage.setItem('userInfo', JSON.stringify(userInfo.value));
        }
    }


   function logout(){
       token.value=null;
       userInfo.value=null;
       //localStorage.removeItem('token');
      // localStorage.removeItem('userInfo');
       //router.push('/login');
   }

   function softLogout(){
    isSoftLoggedOut.value=true;
   }

   //初始化当前用户的action
   async function initializeUser(){
    //如果有token但无用户信息，尝试获取
    if(token.value&&userInfo.value?.id){
        try{
            const result =await getCurrentUser(userInfo.value.id);
                userInfo.value=result.data
        }catch (error){
            console.error('初始化用户失败',error);
            logout();
        }
    }
    isInitialized.value =true;
   }

    


   return {
       token,
       userInfo,
       isLoggedIn,
       setUser,
       logout,
       userRealName,
       setAvatar,
       userInitial,
       isInitialized,
       initializeUser,
       isSoftLoggedOut,
       softLogout,
   };

},
{

persist:true,

   
});