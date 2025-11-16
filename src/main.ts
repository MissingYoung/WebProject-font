import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'

import { createPinia } from 'pinia' 
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate' 

async function initializeApp(){
const app = createApp(App)
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)//将登录状态保存到一个持久化的地方,
//当应用重新加载时，需要从那里恢复状态到 Pinia Store;可以用来让守卫函数按正常逻辑正常执行

app.use(pinia)
app.use(router)
 // 等待路由器完成其初始导航解析。
  // 这将确保在挂载应用程序之前，任何来自导航守卫的重定向都已经完成。
await router.isReady()
app.mount('#app')
}
initializeApp();
