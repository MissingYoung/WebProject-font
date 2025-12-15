<script setup lang="ts">
import { ref, computed } from 'vue'
import { getAllPermissions, getRolePermissions, assignRolePermissions } from '@/lib/api'
import type { RoleVO, PermissionVO } from '@/types'
import { toast } from 'vue-sonner'

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
const selectedPermissionIds = ref<Set<number>>(new Set())

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

// 打开对话框
const openDialog = async (role: RoleVO) => {
  currentRole.value = role
  selectedPermissionIds.value = new Set()
  isOpen.value = true
  isLoading.value = true

  try {
    // 并行加载所有权限和当前角色的权限
    const [allRes, roleRes] = await Promise.all([getAllPermissions(), getRolePermissions(role.id)])

    if (allRes && allRes.data) {
      // 处理分页格式响应 - 后端返回 {records: [...]} 格式
      const data = allRes.data as unknown
      if (Array.isArray(data)) {
        allPermissions.value = data as PermissionVO[]
      } else if (data && typeof data === 'object' && 'records' in data) {
        allPermissions.value = (data as { records: PermissionVO[] }).records
      }
    }

    if (roleRes && roleRes.data) {
      // 处理分页格式响应
      const data = roleRes.data as unknown
      let permissions: PermissionVO[] = []
      if (Array.isArray(data)) {
        permissions = data as PermissionVO[]
      } else if (data && typeof data === 'object' && 'records' in data) {
        permissions = (data as { records: PermissionVO[] }).records
      }
      selectedPermissionIds.value = new Set(permissions.map((p) => p.id))
    }
  } catch (error) {
    console.error('加载权限数据失败', error)
    toast.error('加载权限数据失败')
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
  selectedPermissionIds.value = new Set()
}

// 切换权限选择
const togglePermission = (permissionId: number) => {
  const newSet = new Set(selectedPermissionIds.value)
  if (newSet.has(permissionId)) {
    newSet.delete(permissionId)
  } else {
    newSet.add(permissionId)
  }
  selectedPermissionIds.value = newSet
}

// 全选/取消全选某类型的权限
const toggleAllType = (type: 'directories' | 'menus', selected: boolean) => {
  const newSet = new Set(selectedPermissionIds.value)
  const permissions =
    type === 'directories' ? groupedPermissions.value.directories : groupedPermissions.value.menus

  permissions.forEach((p) => {
    if (selected) {
      newSet.add(p.id)
    } else {
      newSet.delete(p.id)
    }
  })
  selectedPermissionIds.value = newSet
}

// 检查某类型是否全选
const isAllTypeSelected = (type: 'directories' | 'menus') => {
  const permissions =
    type === 'directories' ? groupedPermissions.value.directories : groupedPermissions.value.menus
  if (permissions.length === 0) return false
  return permissions.every((p) => selectedPermissionIds.value.has(p.id))
}

// 提交权限分配
const handleSubmit = async () => {
  if (!currentRole.value) return

  isSubmitting.value = true
  try {
    await assignRolePermissions(currentRole.value.id, {
      permissionIds: Array.from(selectedPermissionIds.value),
    })
    toast.success('权限分配成功')
    closeDialog()
    emit('success')
  } catch (error) {
    console.error('权限分配失败', error)
    toast.error(error instanceof Error ? error.message : '权限分配失败，请重试')
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
              class="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
            >
              <div class="flex-1 min-w-0">
                <div class="font-medium text-sm truncate">{{ permission.name }}</div>
                <code class="text-xs text-muted-foreground">{{ permission.key }}</code>
              </div>
              <Switch
                :checked="selectedPermissionIds.has(permission.id)"
                @update:checked="() => togglePermission(permission.id)"
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
              class="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
            >
              <div class="flex-1 min-w-0">
                <div class="font-medium text-sm truncate">{{ permission.name }}</div>
                <code class="text-xs text-muted-foreground">{{ permission.key }}</code>
              </div>
              <Switch
                :checked="selectedPermissionIds.has(permission.id)"
                @update:checked="() => togglePermission(permission.id)"
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
        已选择 {{ selectedPermissionIds.size }} / {{ allPermissions.length }} 个权限
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
