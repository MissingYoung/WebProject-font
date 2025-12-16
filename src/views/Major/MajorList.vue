<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { getMajorList, getDepartmentList, getMajorById, deleteMajor, enableMajor, disableMajor } from '@/lib/api'
import type { MajorVO, MajorQueryParams, DepartmentVO } from '@/types'
import { formatDate } from '@/lib/date'
import MajorEditDialog from '@/components/Major/MajorEditDialog.vue'

// UI 组件
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Loader2, Plus, Search, RotateCcw, Pencil, BookMarked,
    ChevronLeft, ChevronRight, Trash2, AlertTriangle, Play, PauseCircle
} from 'lucide-vue-next'
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

//  状态管理
const isLoading = ref(false)
const tableData = ref<MajorVO[]>([])
const total = ref(0)
const editDialogRef = ref<InstanceType<typeof MajorEditDialog> | null>(null)
//  删除相关的状态
const deleteDialogOpen = ref(false)
const majorToDelete = ref<MajorVO | null>(null)
const isDeleting = ref(false)
// 部门下拉选项 (用于筛选)
const departmentOptions = ref<DepartmentVO[]>([])

// 查询参数
const queryParams = reactive({
    pageNum: 1,
    pageSize: 10,
    id: '',
    code: '',
    name: '',
    departmentId: undefined as number | undefined,
    degreeLevel: undefined as string | undefined,
    status: undefined as string | undefined,
})

// 字典映射 
const degreeMap: Record<string, string> = {
    'ASSOCIATE': '专科',
    'BACHELOR': '本科',
    'MASTER': '硕士',
    'DOCTOR': '博士'
}

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
    'ACTIVE': { label: '正常', variant: 'default' },
    'DISABLED': { label: '禁用', variant: 'destructive' }
}

// 方法 

// 加载部门列表 
const fetchDepartments = async () => {
    try {
        const res = await getDepartmentList({ pageNum: 1, pageSize: 100, status: 'ACTIVE' })
        if (res?.data) {
            departmentOptions.value = res.data.records
        }
    } catch (e) {
        console.error('加载部门选项失败', e)
    }
}

// 获取专业列表
const fetchData = async () => {
    isLoading.value = true
    tableData.value = [] // 清空旧数据防止混淆
    try {
        // 如果输入了 ID，走精确查询
        if (queryParams.id) {
            const id = Number(queryParams.id)
            if (isNaN(id)) {
                // 非数字直接置空
                tableData.value = []
                total.value = 0
                isLoading.value = false
                return
            }

            // 调用详情接口
            const res = await getMajorById(id)

            // 适配：将单对象包装成数组，以便复用 Table
            if (res.data) {
                tableData.value = [res.data]
                total.value = 1
            } else {
                tableData.value = []
                total.value = 0
            }
        }
        // 普通列表查询
        else {
            // 排除 id 字段，只传其他参数给列表接口
            const { id, ...apiParams } = queryParams
            const res = await getMajorList(apiParams)

            if (res?.data) {
                tableData.value = res.data.records
                total.value = res.data.total
            }
        }
    } catch (error) {
        console.error('获取专业列表失败', error)
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
    queryParams.id = ''
    queryParams.code = ''
    queryParams.name = ''
    queryParams.departmentId = undefined
    queryParams.degreeLevel = undefined
    queryParams.status = undefined
    handleSearch()
}

// 分页
const prevPage = () => {
    if (queryParams.pageNum > 1) {
        queryParams.pageNum--
        fetchData()
    }
}
const nextPage = () => {
    const maxPage = Math.ceil(total.value / queryParams.pageSize)
    if (queryParams.pageNum < maxPage) {
        queryParams.pageNum++
        fetchData()
    }
}

// 操作：添加
const handleCreate = () => {
    editDialogRef.value?.openDialog()
}

// 操作：编辑
const handleEdit = (row: MajorVO) => {
    editDialogRef.value?.openDialog(row)
}

// 点击删除按钮
const handleDeleteClick = (row: MajorVO) => {
    majorToDelete.value = row
    deleteDialogOpen.value = true
}

// 确认删除
const handleConfirmDelete = async () => {
    if (!majorToDelete.value) return

    isDeleting.value = true
    try {
        await deleteMajor(majorToDelete.value.id)
        console.log('删除成功')
        deleteDialogOpen.value = false

        // 刷新列表
        fetchData()
    } catch (err: any) {
        console.error('删除失败', err)
        alert(err.message || '删除失败，可能该专业下还有班级或学生')
    } finally {
        isDeleting.value = false
    }
}

//  启用专业逻辑
const handleEnable = async (row: MajorVO) => {
    try {
        await enableMajor(row.id)
        console.log('专业启用成功')

        // 刷新列表，状态应变为 ACTIVE
        fetchData()
    } catch (err: any) {
        console.error('启用失败', err)
        alert(err.message || '启用失败')
    }
}
//  禁用专业逻辑
const handleDisable = async (row: MajorVO) => {
    try {
        await disableMajor(row.id)
        console.log('专业禁用成功')

        // 刷新列表，状态应变为 DISABLED
        fetchData()
    } catch (err: any) {
        console.error('禁用失败', err)
        alert(err.message || '禁用失败')
    }
}

// 初始化
onMounted(() => {
    fetchDepartments() // 先加载筛选用的部门
    fetchData()        // 再加载列表
})
</script>

<template>
    <div class="space-y-6 p-6">
        <!-- 1. 顶部标题 -->
        <div class="flex items-center justify-between">
            <div>
                <h2 class="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <BookMarked class="h-6 w-6" /> 专业管理
                </h2>
                <p class="text-muted-foreground">管理学校的专业设置信息</p>
            </div>

            <Button @click="handleCreate">
                <Plus class="mr-2 h-4 w-4" />
                添加专业
            </Button>
        </div>

        <!--  筛选区域 -->
        <div class="flex flex-wrap gap-4 items-end border p-4 rounded-lg bg-card">
            <!-- 专业 ID 搜索-->
            <div class="grid gap-2 w-[120px]">
                <label class="text-sm font-medium">专业 ID</label>
                <Input v-model="queryParams.id" placeholder="精确查找" type="number" @keyup.enter="handleSearch" />
            </div>

            <!-- 搜索输入框 -->
            <div class="grid gap-2 w-[160px]">
                <label class="text-sm font-medium">专业编码</label>
                <Input v-model="queryParams.code" placeholder="输入编码" :disabled="!!queryParams.id"
                    @keyup.enter="handleSearch" />
            </div>
            <div class="grid gap-2 w-[160px]">
                <label class="text-sm font-medium">专业名称</label>
                <Input v-model="queryParams.name" placeholder="输入名称" :disabled="!!queryParams.id"
                    @keyup.enter="handleSearch" />
            </div>

            <!-- 学院筛选 (下拉) -->
            <div class="grid gap-2 w-[180px]">
                <label class="text-sm font-medium">所属学院</label>
                <Select :model-value="queryParams.departmentId?.toString()"
                    @update:model-value="(v) => queryParams.departmentId = v ? Number(v) : undefined"
                    :disabled="!!queryParams.id">
                    <SelectTrigger>
                        <SelectValue placeholder="全部学院" />
                    </SelectTrigger>
                    <SelectContent class="max-h-[200px]">
                        <SelectItem value="0">全部</SelectItem> <!-- 这里value给特定值或清空 -->
                        <SelectItem v-for="dept in departmentOptions" :key="dept.id" :value="dept.id.toString()">
                            {{ dept.name }}
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <!-- 学位筛选 -->
            <div class="grid gap-2 w-[140px]">
                <label class="text-sm font-medium">学位层次</label>
                <Select :model-value="queryParams.degreeLevel"
                    @update:model-value="(v) => queryParams.degreeLevel = v as string" :disabled="!!queryParams.id">
                    <SelectTrigger>
                        <SelectValue placeholder="全部" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ASSOCIATE">专科</SelectItem>
                        <SelectItem value="BACHELOR">本科</SelectItem>
                        <SelectItem value="MASTER">硕士</SelectItem>
                        <SelectItem value="DOCTOR">博士</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <!-- 状态筛选 -->
            <div class="grid gap-2 w-[120px]">
                <label class="text-sm font-medium">状态</label>
                <Select :model-value="queryParams.status" @update:model-value="(v) => queryParams.status = v as string">
                    <SelectTrigger>
                        <SelectValue placeholder="全部" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ACTIVE">正常</SelectItem>
                        <SelectItem value="DISABLED">禁用</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div class="flex gap-2 pb-0.5">
                <Button @click="handleSearch">
                    <Search class="mr-2 h-4 w-4" /> 搜索
                </Button>
                <Button variant="outline" @click="handleReset">
                    <RotateCcw class="mr-2 h-4 w-4" /> 重置
                </Button>
            </div>
        </div>

        <!-- 表格区域 -->
        <div class="border rounded-md bg-white min-h-[400px]">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead class="w-[100px]">编码</TableHead>
                        <TableHead>专业名称</TableHead>
                        <TableHead>所属学院</TableHead>
                        <TableHead>学位层次</TableHead>
                        <TableHead>学制</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead>创建时间</TableHead>
                        <TableHead class="text-right min-w-[150px]">操作</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow v-if="isLoading">
                        <TableCell colspan="8" class="h-24 text-center">
                            <div class="flex items-center justify-center gap-2">
                                <Loader2 class="h-4 w-4 animate-spin" /> 加载中...
                            </div>
                        </TableCell>
                    </TableRow>

                    <TableRow v-else-if="tableData.length === 0">
                        <TableCell colspan="8" class="h-24 text-center text-muted-foreground">
                            暂无数据
                        </TableCell>
                    </TableRow>

                    <TableRow v-else v-for="item in tableData" :key="item.id">
                        <TableCell class="font-medium">{{ item.code }}</TableCell>
                        <TableCell>{{ item.name }}</TableCell>
                        <TableCell>{{ item.departmentName || item.departmentId }}</TableCell>
                        <TableCell>{{ degreeMap[item.degreeLevel] || item.degreeLevel }}</TableCell>
                        <TableCell>{{ item.durationYears }} 年</TableCell>
                        <TableCell>
                            <Badge v-if="statusMap[item.status]" :variant="statusMap[item.status]?.variant">
                                {{ statusMap[item.status]?.label }}
                            </Badge>
                            <span v-else>{{ item.status }}</span>
                        </TableCell>
                        <TableCell class="text-sm text-muted-foreground">
                            {{ formatDate(item.createTime, 'YYYY-MM-DD') }}
                        </TableCell>

                        <TableCell class="text-right">
                            <div class="flex items-center justify-end gap-2 flex-nowrap">
                                <!--  启用按钮 -->
                                <Button v-if="item.status === 'DISABLED'" variant="ghost" size="sm" title="启用专业"
                                    class="text-green-600 hover:text-green-700 hover:bg-green-50"
                                    @click="handleEnable(item)">
                                    <Play class="h-4 w-4" />启用
                                </Button>
                                <!--  禁用按钮 (状态为 ACTIVE 时显示) -->
                                <Button v-else variant="ghost" size="sm" title="禁用专业"
                                    class="text-orange-500 hover:text-orange-600 hover:bg-orange-50"
                                    @click="handleDisable(item)">
                                    <PauseCircle class="h-4 w-4" />禁用
                                </Button>


                                <Button variant="ghost" size="sm" title="编辑" class="text-blue-600"
                                    @click="handleEdit(item)">
                                    <Pencil class="h-4 w-4" />编辑
                                </Button>

                                <!-- 删除按钮 -->
                                <Button variant="ghost" size="sm" title="删除" class="text-red-600 hover:bg-red-50"
                                    @click="handleDeleteClick(item)">
                                    <Trash2 class="h-4 w-4" />删除
                                </Button>
                            </div>
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </div>

        <!-- 4. 分页控件 -->
        <div class="flex items-center justify-end space-x-2 py-4">
            <div class="text-sm text-muted-foreground mr-4">
                共 {{ total }} 条记录
            </div>
            <Button variant="outline" size="sm" :disabled="queryParams.pageNum <= 1 || isLoading" @click="prevPage">
                <ChevronLeft class="h-4 w-4" /> 上一页
            </Button>
            <div class="text-sm font-medium">
                第 {{ queryParams.pageNum }} 页
            </div>
            <Button variant="outline" size="sm" :disabled="tableData.length < queryParams.pageSize || isLoading"
                @click="nextPage">
                下一页
                <ChevronRight class="h-4 w-4" />
            </Button>
        </div>
        <!--删除确认弹窗 -->
        <AlertDialog :open="deleteDialogOpen" @update:open="(v) => deleteDialogOpen = v">
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle class="flex items-center gap-2 text-red-600">
                        <AlertTriangle class="h-5 w-5" />
                        确认删除该专业吗？
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        您正在尝试删除专业：<span class="font-bold text-black">{{ majorToDelete?.name }}</span> ({{
                            majorToDelete?.code }})。
                        <br>
                        此操作无法撤销。如果该专业下已经关联了班级或课程，删除可能会失败。
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel :disabled="isDeleting">取消</AlertDialogCancel>
                    <AlertDialogAction @click.prevent="handleConfirmDelete" :disabled="isDeleting"
                        class="bg-red-600 hover:bg-red-700 text-white">
                        {{ isDeleting ? '删除中...' : '确认删除' }}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        <!-- 挂载弹窗 -->
        <MajorEditDialog ref="editDialogRef" @success="fetchData" />
    </div>
</template>