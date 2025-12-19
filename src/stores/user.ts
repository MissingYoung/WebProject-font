import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getCurrentUser, getCurrentUserMenu, logout as apiLogout } from '@/lib/api'
import type { MenuVO, UserInfo } from '@/types'

export const useUserStore = defineStore(
  'user',
  () => {
    const token = ref<string | null>(null)
    const userInfo = ref<UserInfo | null>(null)
    const menuTree = ref<MenuVO[]>([])
    const isInitialized = ref(false)
    const isSoftLoggedOut = ref(false)

    const isLoggedIn = computed(() => !!token.value && !!userInfo.value)
    const userRealName = computed(
      () => userInfo.value?.realName || userInfo.value?.username || 'Visitor'
    )
    const userInitial = computed(() => {
      const name = userInfo.value?.realName || userInfo.value?.username
      return name ? name.charAt(0).toUpperCase() : 'U'
    })

    function setUser(data: { token: string; user: UserInfo }) {
      token.value = data.token
      userInfo.value = data.user
      isSoftLoggedOut.value = false
    }

    function setAvatar(url: string) {
      if (userInfo.value) {
        userInfo.value = { ...userInfo.value, avatarUrl: url }
      }
    }

    async function logout() {
      try {
        if (token.value) {
          await apiLogout()
        }
      } catch (error) {
        console.warn('Backend logout failed, clearing local state anyway', error)
      } finally {
        token.value = null
        userInfo.value = null
        menuTree.value = []
      }
    }

    async function fetchMenuTree() {
      if (!token.value) {
        console.warn('Cannot fetch menu without token')
        return
      }

      try {
        const result = await getCurrentUserMenu()
        if (result && result.data) {
          menuTree.value = result.data
        }
      } catch (error) {
        console.error('Failed to fetch menu', error)
        menuTree.value = []
      }
    }

    async function initializeUser() {
      if (token.value && !isInitialized.value) {
        try {
          if (userInfo.value?.id) {
            const result = await getCurrentUser(userInfo.value.id)
            if (result && result.data) {
              userInfo.value = result.data
            }
          }
          await fetchMenuTree()
        } catch (error) {
          console.error('Initialize user failed, token may be invalid', error)
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
