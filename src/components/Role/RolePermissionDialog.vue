<script setup lang="ts">
import { ref, computed } from 'vue'
import { getAllPermissions, getRolePermissions, assignRolePermissions } from '@/lib/api'
import type { RoleVO, PermissionVO } from '@/types'
import { useNotification } from '@/composables/useNotification'

// UI 组件
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2, Shield, Folder, Menu } from 'lucide-vue-next'

const { success: showSuccess, error: showError } = useNotification()

// --- 类型和事件 ---
const emit = defineEmits<{
  (e: 'success'): void
}>()

// --- 状态 ---
const isOpen = ref(false)
const isLoading = ref(false)
const isSubmitting = ref(false)
const currentRole = ref<RoleVO | null>(null)
const allPermissions = ref<PermissionVO[]>([])
const selectedPermissionKeys = ref<Set<string>>(new Set())

// 按类型分组的权限
const groupedPermissions = computed(() => {
  const directories: PermissionVO[] = []
  const menus: PermissionVO[] = []

  allPermissions.value.forEach((p) => {
    if (p.type === 'DIRECTORY') {
      directories.push(p)
    } else {
      menus.push(p)
    }
  })

  return { directories, menus }
})

// --- 方法 ---

const DEFAULT_PAGE_SIZE = 100
const MAX_PAGES_SAFETY_LIMIT = 200

type PageResultLike<T> = {
  records: T[]
  total?: number
  pageNum?: number
  pageSize?: number
  pages?: number
}

const normalizePermissionKey = (raw: unknown): string => {
  if (typeof raw !== 'string') return ''
  const key = raw.trim()
  if (!key) return ''
  // 兼容后端可能返回的菜单/目录权限 key 前缀，例如 "menu:system:role"
  return key.startsWith('menu:') ? key.slice('menu:'.length) : key
}

const isPermissionSelected = (permissionKey: string): boolean =>
  selectedPermissionKeys.value.has(normalizePermissionKey(permissionKey))

const extractRecordsFromResponse = <T,>(data: unknown): { records: T[]; pages: number } => {
  if (Array.isArray(data)) return { records: data as T[], pages: 1 }

  if (data && typeof data === 'object' && 'records' in data) {
    const page = data as PageResultLike<T>
    const records = Array.isArray(page.records) ? page.records : []
    const pages =
      typeof page.pages === 'number' && Number.isFinite(page.pages) && page.pages > 0
        ? page.pages
        : typeof page.total === 'number' && Number.isFinite(page.total) && page.total >= 0
          ? Math.max(1, Math.ceil(page.total / (page.pageSize || DEFAULT_PAGE_SIZE)))
          : 1
    return { records, pages }
  }

  return { records: [], pages: 1 }
}

const fetchAllPermissions = async (): Promise<PermissionVO[]> => {
  const result: PermissionVO[] = []
  let pageNum = 1
  let pages = 1

  for (let i = 0; i < MAX_PAGES_SAFETY_LIMIT; i += 1) {
    const res = await getAllPermissions({ pageNum, pageSize: DEFAULT_PAGE_SIZE })
    const extracted = extractRecordsFromResponse<PermissionVO>(res?.data as unknown)
    result.push(...extracted.records)
    pages = extracted.pages

    if (pageNum >= pages) break
    if (extracted.records.length === 0) break
    pageNum += 1
  }

  return result
}

const fetchAllRolePermissions = async (roleId: number): Promise<PermissionVO[]> => {
  const result: PermissionVO[] = []
  let pageNum = 1
  let pages = 1

  for (let i = 0; i < MAX_PAGES_SAFETY_LIMIT; i += 1) {
    const res = await getRolePermissions(roleId, { pageNum, pageSize: DEFAULT_PAGE_SIZE })
    const extracted = extractRecordsFromResponse<PermissionVO>(res?.data as unknown)
    result.push(...extracted.records)
    pages = extracted.pages

    if (pageNum >= pages) break
    if (extracted.records.length === 0) break
    pageNum += 1
  }

  return result
}

// 打开对话框
const openDialog = async (role: RoleVO) => {
  currentRole.value = role
  selectedPermissionKeys.value = new Set()
  isOpen.value = true
  isLoading.value = true

  try {
    // 注意：/permission/all 和 /role/{id}/permissions 都是分页接口，这里需要把所有页取全
    const [all, rolePermissions] = await Promise.all([
      fetchAllPermissions(),
      fetchAllRolePermissions(role.id),
    ])

    allPermissions.value = all
    const allKeySet = new Set(
      all.map((p) => normalizePermissionKey(p.key)).filter((key) => key.length > 0)
    )
    const roleKeySet = new Set(
      rolePermissions.map((p) => normalizePermissionKey(p.key)).filter((key) => key.length > 0)
    )
    selectedPermissionKeys.value = new Set(
      Array.from(roleKeySet).filter((key) => allKeySet.has(key))
    )
  } catch (error) {
    console.error('加载权限数据失败', error)
    showError('加载权限数据失败')
    isOpen.value = false
  } finally {
    isLoading.value = false
  }
}

// 关闭对话框
const closeDialog = () => {
  isOpen.value = false
  currentRole.value = null
  allPermissions.value = []
  selectedPermissionKeys.value = new Set()
}

// 切换权限选择
const setPermissionSelected = (permissionKey: string, selected: boolean) => {
  const key = normalizePermissionKey(permissionKey)
  if (!key) return

  const newSet = new Set(selectedPermissionKeys.value)
  if (selected) newSet.add(key)
  else newSet.delete(key)
  selectedPermissionKeys.value = newSet
}

// 全选/取消全选某类型的权限
const toggleAllType = (type: 'directories' | 'menus', selected: boolean) => {
  const newSet = new Set(selectedPermissionKeys.value)
  const permissions =
    type === 'directories' ? groupedPermissions.value.directories : groupedPermissions.value.menus

  permissions.forEach((p) => {
    const key = normalizePermissionKey(p.key)
    if (!key) return
    if (selected) {
      newSet.add(key)
    } else {
      newSet.delete(key)
    }
  })
  selectedPermissionKeys.value = newSet
}

// 检查某类型是否全选
const isAllTypeSelected = (type: 'directories' | 'menus') => {
  const permissions =
    type === 'directories' ? groupedPermissions.value.directories : groupedPermissions.value.menus
  if (permissions.length === 0) return false
  return permissions.every((p) => selectedPermissionKeys.value.has(normalizePermissionKey(p.key)))
}

// 提交权限分配
const handleSubmit = async () => {
  if (!currentRole.value) return

  isSubmitting.value = true
  try {
    const permissionIds = allPermissions.value
      .filter((p) => selectedPermissionKeys.value.has(normalizePermissionKey(p.key)))
      .map((p) => Number(p.id))
      .filter((id) => Number.isFinite(id))

    await assignRolePermissions(currentRole.value.id, {
      permissionIds,
    })
    showSuccess('权限分配成功')
    closeDialog()
    emit('success')
  } catch (error) {
    console.error('权限分配失败', error)
    showError(error instanceof Error ? error.message : '权限分配失败，请重试')
  } finally {
    isSubmitting.value = false
  }
}

// 暴露方法给父组件
defineExpose({
  openDialog,
  closeDialog,
})
</script>

<template>
  <Dialog :open="isOpen" @update:open="(v) => (isOpen = v)">
    <DialogContent class="sm:max-w-[700px] max-h-[80vh] overflow-hidden flex flex-col">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <Shield class="h-5 w-5" />
          分配权限
        </DialogTitle>
        <DialogDescription>
          为角色 <Badge variant="secondary">{{ currentRole?.name }}</Badge> 分配系统权限
        </DialogDescription>
      </DialogHeader>

      <!-- 加载状态 -->
      <div v-if="isLoading" class="flex items-center justify-center py-12">
        <Loader2 class="h-6 w-6 animate-spin mr-2" />
        加载权限数据中...
      </div>

      <!-- 权限列表 -->
      <div v-else class="flex-1 overflow-y-auto py-4 space-y-6">
        <!-- 目录权限 -->
        <div v-if="groupedPermissions.directories.length > 0">
          <div class="flex items-center justify-between mb-3">
            <h4 class="font-medium text-sm flex items-center gap-2">
              <Folder class="h-4 w-4" /> 目录权限
            </h4>
            <Button
              variant="ghost"
              size="sm"
              @click="toggleAllType('directories', !isAllTypeSelected('directories'))"
            >
              {{ isAllTypeSelected('directories') ? '取消全选' : '全选' }}
            </Button>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div
              v-for="permission in groupedPermissions.directories"
              :key="permission.id"
              class="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
            >
              <div class="flex-1 min-w-0">
                <div class="font-medium text-sm truncate">{{ permission.name }}</div>
                <code class="text-xs text-muted-foreground">{{ permission.key }}</code>
              </div>
              <Switch
                :model-value="isPermissionSelected(permission.key)"
                @update:model-value="(v: boolean) => setPermissionSelected(permission.key, v)"
              />
            </div>
          </div>
        </div>

        <!-- 菜单权限 -->
        <div v-if="groupedPermissions.menus.length > 0">
          <div class="flex items-center justify-between mb-3">
            <h4 class="font-medium text-sm flex items-center gap-2">
              <Menu class="h-4 w-4" /> 菜单权限
            </h4>
            <Button
              variant="ghost"
              size="sm"
              @click="toggleAllType('menus', !isAllTypeSelected('menus'))"
            >
              {{ isAllTypeSelected('menus') ? '取消全选' : '全选' }}
            </Button>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div
              v-for="permission in groupedPermissions.menus"
              :key="permission.id"
              class="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
            >
              <div class="flex-1 min-w-0">
                <div class="font-medium text-sm truncate">{{ permission.name }}</div>
                <code class="text-xs text-muted-foreground">{{ permission.key }}</code>
              </div>
              <Switch
                :model-value="isPermissionSelected(permission.key)"
                @update:model-value="(v: boolean) => setPermissionSelected(permission.key, v)"
              />
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="allPermissions.length === 0" class="text-center py-8 text-muted-foreground">
          暂无可分配的权限
        </div>
      </div>

      <!-- 统计信息 -->
      <div class="py-2 text-sm text-muted-foreground border-t">
        已选择 {{ selectedPermissionKeys.size }} / {{ allPermissions.length }} 个权限
      </div>

      <DialogFooter>
        <Button variant="outline" :disabled="isSubmitting" @click="closeDialog"> 取消 </Button>
        <Button :disabled="isSubmitting || isLoading" @click="handleSubmit">
          <Loader2 v-if="isSubmitting" class="mr-2 h-4 w-4 animate-spin" />
          {{ isSubmitting ? '保存中...' : '保存' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
