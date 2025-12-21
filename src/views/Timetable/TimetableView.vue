<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import dayjs from 'dayjs'
import { Calendar, RefreshCw, MapPin, User, Clock } from 'lucide-vue-next'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useUserStore } from '@/stores/user'
import { useNotification } from '@/composables/useNotification'
import { formatDate } from '@/lib/date'
import type { ScheduleItemVO, SemesterVO, TimetableMeVO } from '@/types'
import {
  getCurrentSemester,
  getSemesterList,
  getStudentMeSchedule,
  getTeacherMeSchedule,
  getTimetableMe,
} from '@/lib/api'

const userStore = useUserStore()
const { error: notifyError } = useNotification()

const semesters = ref<SemesterVO[]>([])
const selectedSemesterId = ref<number | undefined>(undefined)
const currentSemester = ref<SemesterVO | null>(null)

const isLoading = ref(false)
const timetable = ref<TimetableMeVO | null>(null)
const scheduleItems = ref<ScheduleItemVO[]>([])
const errorMessage = ref<string | null>(null)

const selectedWeek = ref<number>(1)
const detailOpen = ref(false)
const activeItem = ref<ScheduleItemVO | null>(null)

const weekDayLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

const role = computed(() => userStore.me?.role || userStore.userInfo?.role || '')

const weekCount = computed(() => {
  return (
    timetable.value?.weekCount ||
    currentSemester.value?.weekCount ||
    (currentSemester.value?.startDate && currentSemester.value?.endDate
      ? Math.max(
          1,
          dayjs(currentSemester.value.endDate).diff(
            dayjs(currentSemester.value.startDate),
            'week'
          ) + 1
        )
      : 16)
  )
})

const weekOptions = computed(() => {
  return Array.from({ length: weekCount.value }, (_, i) => i + 1)
})

const currentWeekNumber = computed(() => {
  if (!currentSemester.value?.startDate) return 1
  const start = dayjs(currentSemester.value.startDate)
  const today = dayjs()
  if (today.isBefore(start, 'day')) return 1
  const diffDays = today.diff(start, 'day')
  const w = Math.floor(diffDays / 7) + 1
  return Math.min(Math.max(1, w), weekCount.value)
})

const visibleItems = computed(() => {
  return scheduleItems.value.filter(
    (i) => selectedWeek.value >= i.startWeek && selectedWeek.value <= i.endWeek
  )
})

const maxSection = computed(() => {
  const max = visibleItems.value.reduce((acc, item) => Math.max(acc, item.endSection), 0)
  return Math.max(12, max)
})

const gridStyle = computed(() => {
  return {
    gridTemplateColumns: '72px repeat(7, minmax(0, 1fr))',
    gridTemplateRows: `44px repeat(${maxSection.value}, 56px)`,
  }
})

const palette = [
  { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-900' },
  { bg: 'bg-violet-500/10', border: 'border-violet-500/30', text: 'text-violet-900' },
  { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-900' },
  { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-900' },
  { bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-900' },
  { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-900' },
  { bg: 'bg-fuchsia-500/10', border: 'border-fuchsia-500/30', text: 'text-fuchsia-900' },
] as const

type PaletteItem = (typeof palette)[number]

const colorFor = (courseId?: number): PaletteItem => {
  const idx = typeof courseId === 'number' ? Math.abs(courseId) % palette.length : 0
  return palette[idx] ?? palette[0]
}

const openDetail = (item: ScheduleItemVO) => {
  activeItem.value = item
  detailOpen.value = true
}

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

const loadTimetable = async () => {
  if (!selectedSemesterId.value) return
  isLoading.value = true
  errorMessage.value = null
  timetable.value = null
  scheduleItems.value = []

  try {
    const res = await getTimetableMe({ semesterId: selectedSemesterId.value })
    timetable.value = res.data
    scheduleItems.value = res.data.items || []
  } catch (_err: unknown) {
    try {
      if (role.value === 'teacher') {
        const res = await getTeacherMeSchedule({ semesterId: selectedSemesterId.value })
        scheduleItems.value = res.data || []
      } else {
        const res = await getStudentMeSchedule({ semesterId: selectedSemesterId.value })
        scheduleItems.value = res.data || []
      }
    } catch (err2: unknown) {
      const message = err2 instanceof Error ? err2.message : '加载课程表失败'
      errorMessage.value = message
      notifyError(message)
    }
  } finally {
    isLoading.value = false
  }
}

watch(
  () => selectedSemesterId.value,
  () => {
    if (currentSemester.value?.id === selectedSemesterId.value) {
      selectedWeek.value = currentWeekNumber.value
    } else {
      selectedWeek.value = 1
    }
    loadTimetable()
  }
)

onMounted(async () => {
  await Promise.all([loadCurrentSemester(), loadSemesters()])
  selectedWeek.value = currentWeekNumber.value
  loadTimetable()
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Calendar class="h-6 w-6" />
          课程表
        </h2>
        <p class="text-muted-foreground">按周查看你的课程安排（学生/教师通用）</p>
      </div>
      <Button variant="outline" :disabled="isLoading" @click="loadTimetable">
        <RefreshCw class="mr-2 h-4 w-4" />
        刷新
      </Button>
    </div>

    <Card>
      <CardHeader class="space-y-2">
        <CardTitle class="text-base">筛选</CardTitle>
        <CardDescription>
          <span v-if="currentSemester">
            当前学期：{{ currentSemester.name }}（{{ currentSemester.academicYear }}）
          </span>
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
          <Select v-model="selectedWeek">
            <SelectTrigger>
              <SelectValue placeholder="选择周次" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="w in weekOptions" :key="w" :value="w">
                第 {{ w }} 周
                <span v-if="w === currentWeekNumber" class="ml-2 text-muted-foreground"
                  >(本周)</span
                >
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="text-sm text-muted-foreground">
          <span>共 {{ weekCount }} 周</span>
          <span v-if="currentSemester?.startDate" class="ml-2">
            {{ formatDate(currentSemester.startDate, 'YYYY-MM-DD') }} 起
          </span>
        </div>
      </CardContent>
    </Card>

    <Alert v-if="errorMessage" variant="destructive">
      <AlertTitle>加载失败</AlertTitle>
      <AlertDescription>{{ errorMessage }}</AlertDescription>
    </Alert>

    <Alert v-else-if="!isLoading && visibleItems.length === 0" class="bg-card">
      <AlertTitle>本周暂无课程</AlertTitle>
      <AlertDescription>你可以切换到其它周次或其它学期查看。</AlertDescription>
    </Alert>

    <!-- 周视图（桌面） -->
    <div class="hidden md:block">
      <div class="border rounded-lg bg-card overflow-hidden">
        <div class="grid" :style="gridStyle">
          <!-- Header left -->
          <div class="border-b bg-muted/40"></div>
          <div
            v-for="(label, idx) in weekDayLabels"
            :key="label"
            class="border-b border-l px-3 py-2 text-sm font-medium bg-muted/40"
          >
            {{ label }}
            <span class="text-muted-foreground ml-1">({{ idx + 1 }})</span>
          </div>

          <!-- Time column -->
          <template v-for="section in maxSection" :key="section">
            <div class="border-t px-3 py-2 text-sm text-muted-foreground bg-muted/10">
              第 {{ section }} 节
            </div>
            <div v-for="d in 7" :key="`${section}-${d}`" class="border-t border-l bg-card"></div>
          </template>

          <!-- Items -->
          <button
            v-for="(item, idx) in visibleItems"
            :key="`${item.teachingClassId}-${idx}`"
            type="button"
            class="m-1 rounded-md border p-2 text-left shadow-sm hover:shadow transition overflow-hidden"
            :class="[colorFor(item.courseId).bg, colorFor(item.courseId).border]"
            :style="{
              gridColumnStart: item.weekDay + 1,
              gridRowStart: item.startSection + 1,
              gridRowEnd: item.endSection + 2,
            }"
            @click="openDetail(item)"
          >
            <div class="text-sm font-semibold truncate" :class="colorFor(item.courseId).text">
              {{ item.courseName || item.teachingClassName || '课程' }}
            </div>
            <div class="text-xs text-muted-foreground mt-1 space-y-1">
              <div class="flex items-center gap-1 truncate">
                <User class="h-3.5 w-3.5" />
                <span>{{ item.teacherName || '-' }}</span>
              </div>
              <div class="flex items-center gap-1 truncate">
                <MapPin class="h-3.5 w-3.5" />
                <span>{{ item.classroom || '-' }}</span>
              </div>
              <div class="flex items-center gap-1">
                <Clock class="h-3.5 w-3.5" />
                <span>第 {{ item.startSection }}-{{ item.endSection }} 节</span>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>

    <!-- 列表视图（移动端） -->
    <div class="md:hidden space-y-3">
      <Card v-for="day in weekDayLabels" :key="day">
        <CardHeader class="py-3">
          <CardTitle class="text-base">{{ day }}</CardTitle>
        </CardHeader>
        <CardContent class="space-y-2">
          <div
            v-for="(item, idx) in visibleItems.filter((i) => weekDayLabels[i.weekDay - 1] === day)"
            :key="`${item.teachingClassId}-${idx}`"
            class="border rounded-md p-3 bg-card"
            @click="openDetail(item)"
          >
            <div class="font-semibold">{{ item.courseName || item.teachingClassName }}</div>
            <div class="text-sm text-muted-foreground mt-1">
              第 {{ item.startSection }}-{{ item.endSection }} 节 · {{ item.classroom || '-' }}
            </div>
          </div>
          <div
            v-if="visibleItems.filter((i) => weekDayLabels[i.weekDay - 1] === day).length === 0"
            class="text-sm text-muted-foreground"
          >
            无课程
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- 详情弹窗 -->
    <Dialog :open="detailOpen" @update:open="(v) => (detailOpen = v)">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{
            activeItem?.courseName || activeItem?.teachingClassName || '课程详情'
          }}</DialogTitle>
          <DialogDescription>
            <div class="flex flex-wrap gap-2 mt-2">
              <Badge variant="outline">第 {{ selectedWeek }} 周</Badge>
              <Badge variant="outline">
                {{ weekDayLabels[(activeItem?.weekDay || 1) - 1] }} 第
                {{ activeItem?.startSection }}-{{ activeItem?.endSection }} 节
              </Badge>
              <Badge v-if="activeItem?.startWeek && activeItem?.endWeek" variant="outline">
                第 {{ activeItem.startWeek }}-{{ activeItem.endWeek }} 周
              </Badge>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-2 text-sm">
          <div class="flex items-center justify-between">
            <span class="text-muted-foreground">教师</span>
            <span>{{ activeItem?.teacherName || '-' }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-muted-foreground">地点</span>
            <span>{{ activeItem?.classroom || '-' }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-muted-foreground">课程编号</span>
            <span>{{ activeItem?.courseCode || '-' }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-muted-foreground">教学班</span>
            <span>{{ activeItem?.teachingClassCode || '-' }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-muted-foreground">学分</span>
            <span>{{ activeItem?.credit ?? '-' }}</span>
          </div>
          <div v-if="activeItem?.remark" class="pt-2 border-t">
            <div class="text-muted-foreground mb-1">备注</div>
            <div>{{ activeItem.remark }}</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
