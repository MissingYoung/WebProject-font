<script setup lang="ts">
import { ref } from 'vue'
import { getCourseDetail } from '@/lib/api'
import type { CourseVO } from '@/types'
import { Loader2, Calendar, Clock, BookOpen, Hash } from 'lucide-vue-next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator' 
import { formatDate } from '@/lib/date'
const open = ref(false)
const isLoading = ref(false)
const course = ref<CourseVO | null>(null)

// 状态字典
const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  'DRAFT': { label: '草稿', variant: 'secondary' },
  'ACTIVE': { label: '已发布', variant: 'default' },
  'INACTIVE': { label: '停用', variant: 'destructive' },
  'ARCHIVED': { label: '归档', variant: 'outline' }
}

const typeMap: Record<string, string> = {
  'REQUIRED': '必修',
  'LIMITED_ELECTIVE': '限选',
  'OPEN_ELECTIVE': '任选'
}

// 暴露给父组件的方法
const openDialog = async (id: number) => {
  open.value = true
  isLoading.value = true
  course.value = null
  try {
    const res = await getCourseDetail(id)
    if (res.data) course.value = res.data
  } catch (err) {
    console.error(err)
  } finally {
    isLoading.value = false
  }
}

defineExpose({ openDialog })
</script>

<template>
  <Dialog v-model:open="open" >
    <DialogContent class="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>课程详情</DialogTitle>
        <DialogDescription>查看课程的完整档案信息。</DialogDescription>
      </DialogHeader>

      <div v-if="isLoading" class="flex justify-center py-10">
        <Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
      </div>

      <div v-else-if="course" class="space-y-6">
        <!-- 1. 头部基本信息 -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <h3 class="text-xl font-bold">{{ course.name }}</h3>
            <Badge :variant="statusMap[course.status]?.variant || 'outline'">
              {{ statusMap[course.status]?.label || course.status }}
            </Badge>
          </div>
          <div class="flex items-center gap-2 text-muted-foreground text-sm">
            <Hash class="h-4 w-4" /> 编号：{{ course.code }}
          </div>
        </div>

        <Separator />

        <!-- 2. 核心属性 -->
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1">
            <span class="text-sm text-muted-foreground">开课学院</span>
            <p class="font-medium">{{ course.departmentName || course.departmentId }}</p>
          </div>
          <div class="space-y-1">
            <span class="text-sm text-muted-foreground">课程类型</span>
            <p class="font-medium">{{ typeMap[course.defaultCourseType] || course.defaultCourseType }}</p>
          </div>
          <div class="space-y-1">
            <span class="text-sm text-muted-foreground">学分</span>
            <p class="font-medium">{{ course.credit }} 分</p>
          </div>
          <div class="space-y-1">
            <span class="text-sm text-muted-foreground">重复修读</span>
            <p class="font-medium">{{ course.repeatable ? '允许' : '禁止' }}</p>
          </div>
        </div>

        <Separator />

        <!-- 3. 学时详情 -->
        <div>
          <h4 class="mb-3 text-sm font-semibold flex items-center gap-2">
            <Clock class="h-4 w-4" /> 学时分配
          </h4>
          <div class="grid grid-cols-3 gap-4 bg-muted/50 p-3 rounded-lg text-center">
            <div>
              <div class="text-2xl font-bold">{{ course.totalHours }}</div>
              <div class="text-xs text-muted-foreground">总学时</div>
            </div>
            <div>
              <div class="text-xl font-semibold">{{ course.lectureHours }}</div>
              <div class="text-xs text-muted-foreground">理论</div>
            </div>
            <div>
              <div class="text-xl font-semibold">{{ course.labHours }}</div>
              <div class="text-xs text-muted-foreground">实验</div>
            </div>
          </div>
        </div>

        <Separator />

        <!-- 4. 课程简介 -->
        <div>
          <h4 class="mb-2 text-sm font-semibold flex items-center gap-2">
            <BookOpen class="h-4 w-4" /> 课程简介
          </h4>
          <div class="rounded-md bg-muted/30 p-4 text-sm leading-relaxed whitespace-pre-wrap">
            {{ course.description || '暂无简介' }}
          </div>
        </div>

        <Separator />

        <!-- 5. 时间信息 -->
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div class="space-y-1">
            <span class="text-muted-foreground flex items-center gap-1">
              <Calendar class="h-3 w-3" /> 创建时间
            </span>
            <p>{{ formatDate(course.createTime) }}</p>
          </div>
          <div class="space-y-1">
            <span class="text-muted-foreground flex items-center gap-1">
              <Calendar class="h-3 w-3" /> 最后更新
            </span>
            <p>{{ formatDate(course.updateTime) }}</p>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>