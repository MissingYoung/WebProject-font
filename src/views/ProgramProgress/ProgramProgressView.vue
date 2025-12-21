<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { BookOpenCheck, RefreshCw } from 'lucide-vue-next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import type { ProgramRequirementProgressVO, SemesterVO } from '@/types'
import { getCurrentSemester, getProgramRequirementProgressMe, getSemesterList } from '@/lib/api'

const semesters = ref<SemesterVO[]>([])
const selectedSemesterId = ref<number | undefined>(undefined)
const currentSemester = ref<SemesterVO | null>(null)

const isLoading = ref(false)
const errorMessage = ref<string | null>(null)
const progress = ref<ProgramRequirementProgressVO | null>(null)

const filter = reactive({
  mode: 'ALL' as 'ALL' | 'MANDATORY' | 'RECOMMENDED',
})

const loadSemesters = async () => {
  try {
    const res = await getSemesterList({ pageNum: 1, pageSize: 50 })
    semesters.value = res?.data?.records || []
  } catch (err: unknown) {
    semesters.value = []
  }
}

const loadCurrentSemester = async () => {
  try {
    const res = await getCurrentSemester()
    if (res?.data) {
      currentSemester.value = res.data
      if (!selectedSemesterId.value) selectedSemesterId.value = res.data.id
    }
  } catch (err: unknown) {
    currentSemester.value = null
  }
}

const loadProgress = async () => {
  if (!selectedSemesterId.value) return
  isLoading.value = true
  errorMessage.value = null
  try {
    const res = await getProgramRequirementProgressMe({ semesterId: selectedSemesterId.value })
    progress.value = res.data
  } catch (err: unknown) {
    errorMessage.value = err instanceof Error ? err.message : '加载进度失败'
    progress.value = null
  } finally {
    isLoading.value = false
  }
}

const percent = computed(() => {
  const total = progress.value?.mandatoryTotal || 0
  if (total <= 0) return 0
  const completed = progress.value?.mandatoryCompleted || 0
  return Math.min(100, Math.round((completed / total) * 100))
})

const filteredItems = computed(() => {
  const items = progress.value?.items || []
  if (filter.mode === 'MANDATORY') return items.filter((i) => i.isMandatory)
  if (filter.mode === 'RECOMMENDED') return items.filter((i) => i.isRecommended)
  return items
})

onMounted(async () => {
  await Promise.all([loadCurrentSemester(), loadSemesters()])
  loadProgress()
})

watch(
  () => selectedSemesterId.value,
  () => {
    loadProgress()
  }
)
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold tracking-tight flex items-center gap-2">
          <BookOpenCheck class="h-6 w-6" />
          培养计划进度
        </h2>
        <p class="text-muted-foreground">查看必修完成情况与推荐课程清单</p>
      </div>
      <Button variant="outline" :disabled="isLoading" @click="loadProgress">
        <RefreshCw class="mr-2 h-4 w-4" />
        刷新
      </Button>
    </div>

    <Card>
      <CardHeader>
        <CardTitle class="text-base">学期</CardTitle>
        <CardDescription>
          <span v-if="currentSemester">当前学期：{{ currentSemester.name }}</span>
        </CardDescription>
      </CardHeader>
      <CardContent class="flex flex-wrap items-end gap-4">
        <div class="flex-1 min-w-[220px] max-w-[320px]">
          <Select v-model="selectedSemesterId">
            <SelectTrigger>
              <SelectValue placeholder="选择学期" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="s in semesters" :key="s.id" :value="s.id">
                {{ s.name }}（{{ s.academicYear }}）
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="flex-1 min-w-[180px] max-w-[240px]">
          <Select v-model="filter.mode">
            <SelectTrigger>
              <SelectValue placeholder="筛选" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">全部</SelectItem>
              <SelectItem value="MANDATORY">仅必修</SelectItem>
              <SelectItem value="RECOMMENDED">仅推荐</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>

    <Alert v-if="errorMessage" variant="destructive">
      <AlertTitle>加载失败</AlertTitle>
      <AlertDescription>{{ errorMessage }}</AlertDescription>
    </Alert>

    <Card v-else>
      <CardHeader>
        <CardTitle class="text-base">必修进度</CardTitle>
        <CardDescription>
          必修总数 {{ progress?.mandatoryTotal || 0 }} · 已选
          {{ progress?.mandatorySelected || 0 }} · 已完成
          {{ progress?.mandatoryCompleted || 0 }}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div class="w-full h-3 rounded-full bg-muted overflow-hidden">
          <div class="h-3 bg-primary" :style="{ width: `${percent}%` }"></div>
        </div>
        <div class="text-sm text-muted-foreground mt-2">完成度 {{ percent }}%</div>
      </CardContent>
    </Card>

    <div class="border rounded-lg bg-white overflow-hidden">
      <div class="px-4 py-3 border-b flex items-center justify-between">
        <div class="font-medium">课程列表</div>
        <div class="text-sm text-muted-foreground">共 {{ filteredItems.length }} 门</div>
      </div>
      <div class="divide-y">
        <div v-if="isLoading" class="px-4 py-8 text-center text-muted-foreground">加载中...</div>
        <div
          v-else-if="filteredItems.length === 0"
          class="px-4 py-8 text-center text-muted-foreground"
        >
          暂无数据
        </div>
        <div
          v-for="item in filteredItems"
          :key="item.courseId"
          class="px-4 py-3 flex items-center justify-between"
        >
          <div class="min-w-0">
            <div class="font-medium truncate">
              {{ item.courseName || `课程ID ${item.courseId}` }}
            </div>
            <div class="text-sm text-muted-foreground truncate">
              {{ item.courseCode || '-' }} · {{ item.planSource || '-' }}
            </div>
          </div>
          <div class="flex items-center gap-2">
            <Badge v-if="item.isMandatory" variant="destructive">必修</Badge>
            <Badge v-else-if="item.isRecommended" variant="secondary">推荐</Badge>
            <Badge v-if="item.enrollmentStatus" variant="outline">{{
              item.enrollmentStatus
            }}</Badge>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
