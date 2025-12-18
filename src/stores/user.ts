import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getCurrentUser, logout as apiLogout, getCurrentUserMenu } from '@/lib/api'
import type { UserInfo, MenuVO } from '@/types'

//定义store
export const useUserStore = defineStore(
  'user',
  () => {
    //用户信息状态
    const token = ref<string | null>(null)
    const userInfo = ref<UserInfo | null>(null)
    const menuTree = ref<MenuVO[]>([])
    const isInitialized = ref(false)
    const isLoggedIn = computed(() => !!token.value && !!userInfo.value) //判断用户是否登录
    const userRealName = computed(
      () => userInfo.value?.username || userInfo.value?.realName || '访客'
    )
    const isSoftLoggedOut = ref(false)

    //计算用户姓名首字母，用于 Avatar Fallbac
    const userInitial = computed(() => {
      const name = userInfo.value?.realName || userInfo.value?.username

      if (name) {
        return name.charAt(0).toUpperCase()
      }
      return 'U' //默认值
    })
    function setUser(data: { token: string; user: UserInfo }) {
      token.value = data.token
      userInfo.value = data.user
      isSoftLoggedOut.value = false
    }

    //用于更新用户头像
    function setAvatar(url: string) {
      if (userInfo.value) {
        userInfo.value.avatarUrl = url
      }
    }

    async function logout() {
      try {
        if (token.value) {
          await apiLogout()
        }
      } catch (error) {
        console.warn('后端登出失败（可能是Token已过期），继续执行本地清理:', error)
      } finally {
        token.value = null
        userInfo.value = null
        menuTree.value = []
      }
    }

    // 获取当前用户的菜单树
    async function fetchMenuTree() {
      if (!token.value) {
        console.warn('未登录，无法获取菜单')
        return
      }

      try {
        const result = await getCurrentUserMenu()
        if (result && result.data) {
          menuTree.value = result.data
        }
      } catch (error) {
        console.error('获取菜单失败', error)
        menuTree.value = []
      }
    }

    // 初始化当前用户的 action
    async function initializeUser() {
      // 如果有 token 且还没初始化过，才尝试获取
      if (token.value && !isInitialized.value) {
        try {
          // 只有当 store 里存了 id 才去取
          if (userInfo.value?.id) {
            const result = await getCurrentUser(userInfo.value.id)
            // 只有成功获取才更新
            if (result && result.data) {
              userInfo.value = result.data
            }
          }
          // 获取菜单树
          await fetchMenuTree()
        } catch (error) {
          console.error('初始化用户失败，Token 可能已失效', error)
          await logout()
        }
      }
      isInitialized.value = true
    }

    return {
      token,
      userInfo,
      menuTree,
      isLoggedIn,
      setUser,
      logout,
      userRealName,
      setAvatar,
      userInitial,
      isInitialized,
      initializeUser,
      fetchMenuTree,
      isSoftLoggedOut,
    }
  },
  {
    persist: true,
  }
)
