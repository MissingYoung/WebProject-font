<script setup lang="ts">
import { reactive, ref } from 'vue'
import { createCourse } from '@/lib/api'
import type { CreateCoursePayload, CourseType  } from '@/types'
import { Loader2, Plus } from 'lucide-vue-next'

// 引入 Shadcn UI 组件 (根据你的项目结构路径可能不同)
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'

// 定义事件，添加成功后通知父组件刷新列表
const emit = defineEmits(['success'])

const open = ref(false) // 控制弹窗开关
const isLoading = ref(false)
const error = ref<string | null>(null)

// 初始表单数据
const initialState: CreateCoursePayload = {
  code: '',
  name: '',
  departmentId: undefined, // 这里先手动输入数字，以后可以改成下拉选择部门
  defaultCourseType: 'REQUIRED',
  credit: 0,
  totalHours: 0,
  lectureHours: 0,
  labHours: 0,
  repeatable: false,
  description: ''
}

const formData = reactive<CreateCoursePayload>({ ...initialState })

// 打开弹窗时的重置逻辑
const handleOpenChange = (val: boolean) => {
  open.value = val
  if (!val) {
    // 关闭时清空错误，保留数据或清空数据取决于需求，这里不清空数据方便修改
    error.value = null
  }
}

// 提交表单
const handleSubmit = async () => {
  // 1. 基础验证
  if (!formData.code || !formData.name) {
    error.value = '课程编号和课程名称为必填项'
    return
  }
  
  // 2. 数据格式转换 
  
  const payload: CreateCoursePayload = {
    ...formData,
    departmentId: formData.departmentId ? Number(formData.departmentId) : undefined,
    credit: Number(formData.credit),
    totalHours: Number(formData.totalHours),
    lectureHours: Number(formData.lectureHours),
    labHours: Number(formData.labHours),
  }

  isLoading.value = true
  error.value = null

  try {
    const res = await createCourse(payload)
    // 根据拦截器逻辑，这里没报错就是成功
    console.log('创建成功', res)
    
    // 关闭弹窗
    open.value = false
    // 重置表单
    Object.assign(formData, initialState)
    // 通知父组件刷新
    emit('success')
    
  } catch (err: any) {
    error.value = err.message || '创建课程失败'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="handleOpenChange">
    <!-- 触发按钮 -->
    <DialogTrigger as-child>
      <Button>
        <Plus class="mr-2 h-4 w-4" />
        添加课程
      </Button>
    </DialogTrigger>

    <DialogContent class="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>添加新课程</DialogTitle>
        <DialogDescription>
          请填写课程的基本信息，点击保存提交。
        </DialogDescription>
      </DialogHeader>

      <!-- 错误提示 -->
      <Alert v-if="error" variant="destructive" class="mb-4">
        <AlertDescription>{{ error }}</AlertDescription>
      </Alert>

      <div class="grid gap-4 py-4">
        <!-- 第一行：编号 & 名称 -->
        <div class="grid grid-cols-2 gap-4">
          <div class="grid gap-2">
            <Label for="code" class="text-red-500">课程编号 *</Label>
            <Input id="code" v-model="formData.code" placeholder="例如: sdu001" />
          </div>
          <div class="grid gap-2">
            <Label for="name" class="text-red-500">课程名称 *</Label>
            <Input id="name" v-model="formData.name" placeholder="例如: 高等数学" />
          </div>
        </div>

        <!-- 第二行：类型 & 学院ID -->
        <div class="grid grid-cols-2 gap-4">
          <div class="grid gap-2">
            <Label>课程类型</Label>
            <Select v-model="formData.defaultCourseType">
              <SelectTrigger>
                <SelectValue placeholder="选择类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="REQUIRED">必修 (REQUIRED)</SelectItem>
                <SelectItem value="LIMITED_ELECTIVE">限选 (LIMITED)</SelectItem>
                <SelectItem value="OPEN_ELECTIVE">任选 (OPEN)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="grid gap-2">
            <Label for="deptId">学院ID</Label>
            <Input id="deptId" type="number" v-model="formData.departmentId" placeholder="输入数字ID" />
          </div>
        </div>

        <!-- 第三行：学分 & 总学时 -->
        <div class="grid grid-cols-4 gap-4">
          <div class="grid gap-2">
            <Label for="credit">学分</Label>
            <Input id="credit" type="number" step="0.5" v-model.number="formData.credit" />
          </div>
          <div class="grid gap-2">
            <Label for="total">总学时</Label>
            <Input id="total" type="number" v-model.number="formData.totalHours" />
          </div>
          <div class="grid gap-2">
            <Label for="lecture">理论学时</Label>
            <Input id="lecture" type="number" v-model.number="formData.lectureHours" />
          </div>
          <div class="grid gap-2">
            <Label for="lab">实验学时</Label>
            <Input id="lab" type="number" v-model.number="formData.labHours" />
          </div>
        </div>

        <!-- 第四行：是否可重复修读 -->
        <div class="flex items-center justify-between border p-3 rounded-md">
          <Label for="repeatable" class="cursor-pointer">是否允许重复修读</Label>
          <!-- Switch 组件处理 boolean -->
          <Switch 
            id="repeatable" 
            :checked="formData.repeatable"
            @update:checked="(checked:boolean) => formData.repeatable = checked"
          />
        </div>

        <!-- 第五行：简介 -->
        <div class="grid gap-2">
          <Label for="desc">课程简介</Label>
          <Textarea id="desc" v-model="formData.description" placeholder="请输入课程描述..." />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="open = false" :disabled="isLoading">取消</Button>
        <Button type="submit" @click="handleSubmit" :disabled="isLoading">
          <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
          {{ isLoading ? '提交中' : '保存课程' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>