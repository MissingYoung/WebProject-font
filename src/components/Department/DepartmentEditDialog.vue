<script setup lang="ts">
import { reactive, ref } from 'vue'
import { createDepartment, updateDepartment } from '@/lib/api'
import type { CreateDepartmentPayload, DepartmentVO } from '@/types'
import { Loader2 } from 'lucide-vue-next'

// Shadcn UI 组件
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'

const emit = defineEmits(['success'])

const open = ref(false)
const isLoading = ref(false)
const error = ref<string | null>(null)

// 模式标记
const isEditMode = ref(false)
const currentId = ref<number | null>(null)

// 初始数据
const initialState: CreateDepartmentPayload = {
    parentId: undefined, // 默认为顶级部门
    code: '',
    name: '',
    shortName: '',
    description: ''
}

const formData = reactive<CreateDepartmentPayload>({ ...initialState })

// 打开弹窗方法
const openDialog = (dept?: DepartmentVO) => {
    open.value = true
    error.value = null

    if (dept) {
        // --- 编辑模式 ---
        isEditMode.value = true
        currentId.value = dept.id
        // 回显数据
        Object.assign(formData, {
            parentId: dept.parentId,
            code: dept.code,
            name: dept.name,
            shortName: dept.shortName || '',
            description: dept.description || ''
        })
    } else {
        // --- 新增模式 ---
        isEditMode.value = false
        currentId.value = null
        Object.assign(formData, initialState)
    }
}

defineExpose({ openDialog })

// 提交逻辑
const handleSubmit = async () => {
    // 基础校验
    if (!formData.code || !formData.name) {
        error.value = '部门编码和名称为必填项'
        return
    }

    isLoading.value = true
    error.value = null

    try {
        // 数据处理：确保 parentId如果是空字符串则转为 undefined 或 0
        const payload = {
            ...formData,
            parentId: formData.parentId ? Number(formData.parentId) : 0 // API 示例中 0 可能代表顶级
        }

        if (isEditMode.value && currentId.value) {
            await updateDepartment(currentId.value, payload)
            console.log('部门更新成功')
            alert('部门更新成功');
        } else {
            // 创建逻辑
            await createDepartment(payload)
            console.log('部门创建成功')
            alert('部门创建成功');
        }

        console.log('部门操作成功')
        open.value = false
        emit('success') // 通知父组件刷新列表

    } catch (err: any) {
        error.value = err.message ||  (isEditMode.value ? '更新失败' : '创建失败')
    } finally {
        isLoading.value = false
    }
}
</script>

<template>
    <Dialog :open="open" @update:open="(val) => open = val">
        <DialogContent class="sm:max-w-[500px]">
            <DialogHeader>
                <DialogTitle>{{ isEditMode ? '编辑部门' : '添加部门' }}</DialogTitle>
                <DialogDescription>
                    填写部门的基本信息。
                </DialogDescription>
            </DialogHeader>

            <Alert v-if="error" variant="destructive" class="mb-4">
                <AlertDescription>{{ error }}</AlertDescription>
            </Alert>

            <div class="grid gap-4 py-4">
                <!-- 1. 部门名称 & 编码 -->
                <div class="grid grid-cols-2 gap-4">
                    <div class="grid gap-2">
                        <Label for="name" class="text-red-500">部门名称 *</Label>
                        <Input id="name" v-model="formData.name" placeholder="例如: 计算机学院" />
                    </div>
                    <div class="grid gap-2">
                        <Label for="code" class="text-red-500">部门编码 *</Label>
                        <Input id="code" v-model="formData.code" placeholder="例如: CS001" :disabled="isEditMode" />
                    </div>
                </div>

                <!-- 2. 简称 & 上级ID -->
                <div class="grid grid-cols-2 gap-4">
                    <div class="grid gap-2">
                        <Label for="shortName">部门简称</Label>
                        <Input id="shortName" v-model="formData.shortName" placeholder="例如: 计科" />
                    </div>
                    <div class="grid gap-2">
                        <Label for="parentId">上级部门ID</Label>
                        <!-- 暂时用数字输入框，0或空表示顶级 -->
                        <Input id="parentId" type="number" v-model="formData.parentId" placeholder="0 或空为顶级" />
                    </div>
                </div>

                <!-- 3. 描述 -->
                <div class="grid gap-2">
                    <Label for="desc">部门描述</Label>
                    <Textarea id="desc" v-model="formData.description" placeholder="请输入部门职能描述..." />
                </div>
            </div>

            <DialogFooter>
                <Button variant="outline" @click="open = false" :disabled="isLoading">取消</Button>
                <Button @click="handleSubmit" :disabled="isLoading">
                    <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
                    {{ isEditMode ? '保存修改' : '确认创建' }}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>