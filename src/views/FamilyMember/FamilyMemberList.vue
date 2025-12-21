<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { getFamilyMemberList, deleteFamilyMember } from '@/lib/api'
import type { FamilyMemberVO, FamilyMemberQueryParams, FamilyRelationship } from '@/types'
import { formatDate } from '@/lib/date'
import FamilyMemberEditDialog from '@/components/FamilyMember/FamilyMemberEditDialog.vue'
import { useUserStore } from '@/stores/user'

// UI 组件
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Loader2,
  Search,
  RotateCcw,
  Pencil,
  Users2,
  Trash2,
  AlertTriangle,
  Plus,
} from 'lucide-vue-next'
import PaginationBar from '@/components/PaginationBar.vue'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

// --- 状态管理 ---
const isLoading = ref(false)
const tableData = ref<FamilyMemberVO[]>([])
const total = ref(0)
const editDialogRef = ref<InstanceType<typeof FamilyMemberEditDialog> | null>(null)

// 删除相关的状态
const deleteDialogOpen = ref(false)
const memberToDelete = ref<FamilyMemberVO | null>(null)
const isDeleting = ref(false)

// 用户信息
const userStore = useUserStore()

// 查询参数
const queryParams = reactive<FamilyMemberQueryParams>({
  pageNum: 1,
  pageSize: 10,
  userId: undefined,
  name: '',
})

// 关系映射
const relationshipMap: Record<FamilyRelationship, string> = {
  FATHER: '父亲',
  MOTHER: '母亲',
  SPOUSE: '配偶',
  SON: '儿子',
  DAUGHTER: '女儿',
  BROTHER: '兄弟',
  SISTER: '姐妹',
  GRANDFATHER: '祖父',
  GRANDMOTHER: '祖母',
  OTHER: '其他',
}

// 性别映射
const genderMap: Record<string, string> = {
  MALE: '男',
  FEMALE: '女',
  UNKNOWN: '未知',
}

// --- 方法 ---

// 获取数据
const fetchData = async () => {
  isLoading.value = true
  tableData.value = []
  try {
    // 过滤空值
    const cleanParams: FamilyMemberQueryParams = {
      pageNum: queryParams.pageNum,
      pageSize: queryParams.pageSize,
    }
    if (queryParams.userId) cleanParams.userId = queryParams.userId
    if (queryParams.name) cleanParams.name = queryParams.name

    const res = await getFamilyMemberList(cleanParams)
    if (res && res.data) {
      tableData.value = res.data.records
      total.value = res.data.total
    }
  } catch (error) {
    console.error('获取家庭成员数据失败', error)
    tableData.value = []
    total.value = 0
  } finally {
    isLoading.value = false
  }
}

// 搜索
const handleSearch = () => {
  queryParams.pageNum = 1
  fetchData()
}

// 重置
const handleReset = () => {
  queryParams.userId = undefined
  queryParams.name = ''
  handleSearch()
}

// 操作：添加
const handleCreate = () => {
  // 使用当前登录用户的 ID
  const userId = userStore.userInfo?.id || 0
  if (userId) {
    editDialogRef.value?.openDialogForCreate(userId)
  }
}

// 操作：编辑
const handleEdit = (row: FamilyMemberVO) => {
  editDialogRef.value?.openDialogForEdit(row)
}

// 点击删除按钮
const handleDeleteClick = (row: FamilyMemberVO) => {
  memberToDelete.value = row
  deleteDialogOpen.value = true
}

// 确认删除
const handleConfirmDelete = async () => {
  if (!memberToDelete.value) return

  isDeleting.value = true
  try {
    await deleteFamilyMember(memberToDelete.value.id)
    deleteDialogOpen.value = false
    // 刷新列表
    fetchData()
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '删除失败'
    console.error('删除失败', message)
  } finally {
    isDeleting.value = false
  }
}

// 初始化
onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="space-y-6 p-6">
    <!-- 1. 顶部标题 -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Users2 class="h-6 w-6" /> 家庭成员管理
        </h2>
        <p class="text-muted-foreground">管理用户的家庭成员信息</p>
      </div>

      <Button @click="handleCreate">
        <Plus class="mr-2 h-4 w-4" />
        添加家庭成员
      </Button>
    </div>

    <!-- 2. 筛选区域 -->
    <div class="flex flex-wrap gap-4 items-end border p-4 rounded-lg bg-card">
      <div class="grid gap-2 w-[150px]">
        <label class="text-sm font-medium">用户 ID</label>
        <Input
          v-model.number="queryParams.userId"
          type="number"
          placeholder="用户 ID"
          @keyup.enter="handleSearch"
        />
      </div>

      <div class="grid gap-2 w-[180px]">
        <label class="text-sm font-medium">家属姓名</label>
        <Input v-model="queryParams.name" placeholder="输入姓名" @keyup.enter="handleSearch" />
      </div>

      <div class="flex gap-2 pb-0.5">
        <Button @click="handleSearch"> <Search class="mr-2 h-4 w-4" /> 搜索 </Button>
        <Button variant="outline" @click="handleReset">
          <RotateCcw class="mr-2 h-4 w-4" /> 重置
        </Button>
      </div>
    </div>

    <!-- 3. 表格区域 -->
    <div class="border rounded-md bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead class="w-[80px]">ID</TableHead>
            <TableHead>用户 ID</TableHead>
            <TableHead>用户姓名</TableHead>
            <TableHead>家属姓名</TableHead>
            <TableHead>与用户关系</TableHead>
            <TableHead>性别</TableHead>
            <TableHead>手机号</TableHead>
            <TableHead>创建时间</TableHead>
            <TableHead class="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <!-- Loading -->
          <TableRow v-if="isLoading">
            <TableCell colspan="9" class="h-24 text-center">
              <div class="flex items-center justify-center gap-2">
                <Loader2 class="h-4 w-4 animate-spin" /> 加载中...
              </div>
            </TableCell>
          </TableRow>

          <!-- 空表格 -->
          <TableRow v-else-if="tableData.length === 0">
            <TableCell colspan="9" class="h-24 text-center text-muted-foreground">
              暂无数据
            </TableCell>
          </TableRow>

          <!-- Data -->
          <TableRow v-for="item in tableData" v-else :key="item.id">
            <TableCell class="font-medium">{{ item.id }}</TableCell>
            <TableCell>{{ item.userId }}</TableCell>
            <TableCell>{{ item.userRealName || '-' }}</TableCell>
            <TableCell>{{ item.name }}</TableCell>
            <TableCell>{{ relationshipMap[item.relationship] || item.relationship }}</TableCell>
            <TableCell>{{ genderMap[item.gender] || item.gender }}</TableCell>
            <TableCell>{{ item.phone }}</TableCell>
            <TableCell class="text-sm text-muted-foreground">
              {{ formatDate(item.createTime) }}
            </TableCell>

            <TableCell class="text-right">
              <div class="flex justify-end gap-2 items-center">
                <!-- 编辑按钮 -->
                <Button variant="ghost" size="sm" title="编辑" @click="handleEdit(item)">
                  <Pencil class="h-4 w-4 text-blue-600" />编辑
                </Button>

                <!-- 删除按钮 -->
                <Button
                  variant="ghost"
                  size="sm"
                  title="删除"
                  class="text-red-600 hover:text-red-700 hover:bg-red-50"
                  @click="handleDeleteClick(item)"
                >
                  <Trash2 class="h-4 w-4" />删除
                </Button>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <!-- 4. 分页控件 -->
    <PaginationBar
      v-model:page-num="queryParams.pageNum"
      v-model:page-size="queryParams.pageSize"
      :total="total"
      :is-loading="isLoading"
      @change="fetchData"
    />

    <!-- 删除确认弹窗 -->
    <AlertDialog :open="deleteDialogOpen" @update:open="(v) => (deleteDialogOpen = v)">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle class="flex items-center gap-2 text-red-600">
            <AlertTriangle class="h-5 w-5" />
            确认删除该家庭成员吗？
          </AlertDialogTitle>
          <AlertDialogDescription>
            您正在尝试删除家庭成员：<span class="font-bold text-foreground">{{
              memberToDelete?.name
            }}</span>
            （{{ relationshipMap[memberToDelete?.relationship || 'OTHER'] }}）。
            <br />
            <span class="text-red-500 text-xs mt-2 block">此操作不可撤销。</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel :disabled="isDeleting">取消</AlertDialogCancel>
          <AlertDialogAction
            :disabled="isDeleting"
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            @click.prevent="handleConfirmDelete"
          >
            {{ isDeleting ? '删除中...' : '确认删除' }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <!-- 编辑对话框 -->
    <FamilyMemberEditDialog ref="editDialogRef" @success="fetchData" />
  </div>
</template>
