<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { createDepartment, getDepartmentList, updateDepartment } from '@/lib/api'
import type { CreateDepartmentPayload, DepartmentVO } from '@/types'
import { CornerDownRight, Loader2 } from 'lucide-vue-next'
import { useNotification } from '@/composables/useNotification'

// Shadcn UI 组件
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'

const { success } = useNotification()

const emit = defineEmits(['success'])

const open = ref(false)
const isLoading = ref(false)
const error = ref<string | null>(null)

// 模式标记
const isEditMode = ref(false)
const currentId = ref<number | null>(null)

// 初始数据
const initialState: CreateDepartmentPayload = {
  parentId: 0, // 0 表示顶级部门
  code: '',
  name: '',
  shortName: '',
  description: '',
}

const formData = reactive<CreateDepartmentPayload>({ ...initialState })

const departments = ref<DepartmentVO[]>([])
const isLoadingDepartments = ref(false)

const loadDepartments = async () => {
  if (isLoadingDepartments.value) return
  isLoadingDepartments.value = true
  try {
    const pageSize = 100
    const all: DepartmentVO[] = []

    const first = await getDepartmentList({ pageNum: 1, pageSize })
    if (!first?.data) return

    all.push(...first.data.records)

    const pages = first.data.pages ?? 1
    for (let pageNum = 2; pageNum <= pages; pageNum++) {
      const res = await getDepartmentList({ pageNum, pageSize })
      if (!res?.data) break
      all.push(...res.data.records)
      if (res.data.records.length < pageSize) break
    }

    departments.value = all
  } catch (err) {
    console.error('加载部门列表失败', err)
  } finally {
    isLoadingDepartments.value = false
  }
}

type DepartmentOption = {
  id: number
  depth: number
  name: string
  code: string
  status: DepartmentVO['status']
}

const departmentOptions = computed<DepartmentOption[]>(() => {
  const list = departments.value
  const byParentId = new Map<number, DepartmentVO[]>()
  for (const dept of list) {
    const parentId = dept.parentId ?? 0
    const children = byParentId.get(parentId)
    if (children) children.push(dept)
    else byParentId.set(parentId, [dept])
  }

  const collator = new Intl.Collator('zh-Hans-CN', { numeric: true, sensitivity: 'base' })
  for (const children of byParentId.values()) {
    children.sort((a, b) => collator.compare(a.name, b.name))
  }

  const excluded = new Set<number>()
  if (currentId.value != null) {
    const stack = [currentId.value]
    excluded.add(currentId.value)
    while (stack.length > 0) {
      const id = stack.pop()!
      const children = byParentId.get(id) ?? []
      for (const child of children) {
        if (excluded.has(child.id)) continue
        excluded.add(child.id)
        stack.push(child.id)
      }
    }
  }

  const options: DepartmentOption[] = []
  const visited = new Set<number>()

  const walk = (parentId: number, depth: number) => {
    const children = byParentId.get(parentId) ?? []
    for (const child of children) {
      if (excluded.has(child.id)) continue
      visited.add(child.id)
      options.push({
        id: child.id,
        depth,
        name: child.name,
        code: child.code,
        status: child.status,
      })
      walk(child.id, depth + 1)
    }
  }

  walk(0, 0)

  for (const dept of list) {
    if (visited.has(dept.id) || excluded.has(dept.id)) continue
    options.push({
      id: dept.id,
      depth: 0,
      name: dept.name,
      code: dept.code,
      status: dept.status,
    })
  }

  return options
})

const selectedParentLabel = computed(() => {
  const parentId = formData.parentId ?? 0
  if (parentId === 0) return '无（顶级部门）'
  const dept = departments.value.find((d) => d.id === parentId)
  if (!dept) return `ID: ${parentId}`
  const codeText = dept.code ? `（${dept.code}）` : ''
  const disabledText = dept.status === 'DISABLED' ? '（禁用）' : ''
  return `${dept.name}${codeText}${disabledText}`
})

// 打开弹窗方法
const openDialog = (dept?: DepartmentVO) => {
  void loadDepartments()
  open.value = true
  error.value = null

  if (dept) {
    // --- 编辑模式 ---
    isEditMode.value = true
    currentId.value = dept.id
    // 回显数据
    Object.assign(formData, {
      parentId: dept.parentId ?? 0,
      code: dept.code,
      name: dept.name,
      shortName: dept.shortName || '',
      description: dept.description || '',
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
    const payload = {
      ...formData,
      parentId: formData.parentId ?? 0, // 0 代表顶级
    }

    if (isEditMode.value && currentId.value) {
      await updateDepartment(currentId.value, payload)
      success('部门更新成功')
    } else {
      await createDepartment(payload)
      success('部门创建成功')
    }

    open.value = false
    emit('success')
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : isEditMode.value ? '更新失败' : '创建失败'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="(val) => (open = val)">
    <DialogContent class="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>{{ isEditMode ? '编辑部门' : '添加部门' }}</DialogTitle>
        <DialogDescription> 填写部门的基本信息。 </DialogDescription>
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
            <Input
              id="code"
              v-model="formData.code"
              placeholder="例如: CS001"
              :disabled="isEditMode"
            />
          </div>
        </div>

        <!-- 2. 简称 & 上级ID -->
        <div class="grid grid-cols-2 gap-4">
          <div class="grid gap-2">
            <Label for="shortName">部门简称</Label>
            <Input id="shortName" v-model="formData.shortName" placeholder="例如: 计科" />
          </div>
          <div class="grid gap-2">
            <Label>上级部门</Label>
            <Select
              :model-value="String(formData.parentId ?? 0)"
              @update:model-value="(v) => (formData.parentId = Number(v))"
            >
              <SelectTrigger :disabled="isLoadingDepartments">
                <span class="truncate">{{ selectedParentLabel }}</span>
              </SelectTrigger>
              <SelectContent class="max-h-[320px]">
                <SelectItem value="0">
                  <span class="flex w-full items-center gap-2">
                    <span class="text-muted-foreground">无（顶级部门）</span>
                  </span>
                </SelectItem>
                <SelectItem v-for="opt in departmentOptions" :key="opt.id" :value="String(opt.id)">
                  <span class="flex w-full items-center gap-2">
                    <span
                      class="shrink-0"
                      aria-hidden="true"
                      :style="{ width: `${opt.depth * 12}px` }"
                    ></span>
                    <CornerDownRight
                      v-if="opt.depth > 0"
                      class="size-4 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <span class="truncate">{{ opt.name }}</span>
                    <span v-if="opt.code" class="shrink-0 text-xs text-muted-foreground">
                      （{{ opt.code }}）
                    </span>
                    <Badge v-if="opt.status === 'DISABLED'" variant="secondary" class="ml-auto"
                      >禁用</Badge
                    >
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <!-- 3. 描述 -->
        <div class="grid gap-2">
          <Label for="desc">部门描述</Label>
          <Textarea id="desc" v-model="formData.description" placeholder="请输入部门职能描述..." />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" :disabled="isLoading" @click="open = false">取消</Button>
        <Button :disabled="isLoading" @click="handleSubmit">
          <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
          {{ isEditMode ? '保存修改' : '确认创建' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
