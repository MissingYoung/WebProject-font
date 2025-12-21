<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useNotification } from '@/composables/useNotification'
import type {
  AutoSchedulePreferences,
  AutoScheduleRequest,
  AutoScheduleResultVO,
  SemesterVO,
  TeachingClassVO,
} from '@/types'
import {
  autoSchedule,
  deleteAllTeachingClassSchedules,
  getSemesterList,
  getTeachingClassList,
} from '@/lib/api'

const emit = defineEmits<{
  success: []
}>()

const { success, error: notifyError, confirm, extractErrorMessage } = useNotification()

const open = ref(false)
const isLoading = ref(false)
const error = ref<string | null>(null)
const result = ref<AutoScheduleResultVO | null>(null)

const semesters = ref<SemesterVO[]>([])
const teachingClasses = ref<TeachingClassVO[]>([])
const isLoadingOptions = ref(false)

const form = reactive({
  semesterId: undefined as number | undefined,
  teachingClassIds: [] as number[],
  classSearch: '',
  clearExisting: false,
  preferences: {
    weeklyHours: 2,
    sectionsPerClass: 2,
    preferredWeekDays: [] as number[],
    preferredSections: [] as number[],
    allowWeekend: false,
    allowEvening: false,
  } satisfies Required<AutoSchedulePreferences>,
})

const weekDayOptions = [
  { value: 1, label: '周一' },
  { value: 2, label: '周二' },
  { value: 3, label: '周三' },
  { value: 4, label: '周四' },
  { value: 5, label: '周五' },
  { value: 6, label: '周六' },
  { value: 7, label: '周日' },
]

const preferredSectionOptions = [1, 3, 5, 7, 9]

const weekDayMap: Record<number, string> = {
  1: '周一',
  2: '周二',
  3: '周三',
  4: '周四',
  5: '周五',
  6: '周六',
  7: '周日',
}

const loadSemesters = async () => {
  const res = await getSemesterList({ pageNum: 1, pageSize: 50 })
  semesters.value = res?.data?.records || []
}

const loadTeachingClasses = async () => {
  if (!form.semesterId) {
    teachingClasses.value = []
    return
  }
  const res = await getTeachingClassList({ pageNum: 1, pageSize: 100, semesterId: form.semesterId })
  teachingClasses.value = res?.data?.records || []
}

const loadOptions = async () => {
  isLoadingOptions.value = true
  try {
    await loadSemesters()
    const firstSemester = semesters.value[0]
    if (!form.semesterId && firstSemester) form.semesterId = firstSemester.id
    await loadTeachingClasses()
  } catch (err: unknown) {
    console.error('加载自动排课选项失败', err)
    notifyError(extractErrorMessage(err, '加载选项失败'))
  } finally {
    isLoadingOptions.value = false
  }
}

watch(
  () => form.semesterId,
  async () => {
    form.teachingClassIds = []
    await loadTeachingClasses()
  }
)

const filteredTeachingClasses = computed(() => {
  const keyword = form.classSearch.trim()
  if (!keyword) return teachingClasses.value
  const lower = keyword.toLowerCase()
  return teachingClasses.value.filter((tc) => {
    const name = (tc.name || '').toLowerCase()
    const courseName = (tc.courseName || '').toLowerCase()
    const code = (tc.code || '').toLowerCase()
    return name.includes(lower) || courseName.includes(lower) || code.includes(lower)
  })
})

const selectedCount = computed(() => form.teachingClassIds.length)

const isSelected = (id: number) => form.teachingClassIds.includes(id)

const setSelected = (id: number, selected: boolean) => {
  if (selected) {
    if (!form.teachingClassIds.includes(id)) form.teachingClassIds.push(id)
    return
  }
  form.teachingClassIds = form.teachingClassIds.filter((x) => x !== id)
}

const selectAllFiltered = () => {
  const ids = filteredTeachingClasses.value.map((x) => x.id)
  form.teachingClassIds = Array.from(new Set([...form.teachingClassIds, ...ids]))
}

const clearSelected = () => {
  form.teachingClassIds = []
}

const toggleArrayValue = (arr: number[], v: number) =>
  arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]

const togglePreferredWeekDay = (weekDay: number) => {
  form.preferences.preferredWeekDays = toggleArrayValue(form.preferences.preferredWeekDays, weekDay)
}

const togglePreferredSection = (startSection: number) => {
  form.preferences.preferredSections = toggleArrayValue(
    form.preferences.preferredSections,
    startSection
  )
}

const formatPeriod = (start: number, end: number) => `${start}-${end}节`

const formatWeeks = (start?: number, end?: number) => {
  if (!start && !end) return '全部'
  if (start && end) return `${start}-${end}周`
  if (start) return `${start}周起`
  if (end) return `至${end}周`
  return '-'
}

const formatScheduleLine = (s: {
  weekDay: number
  startSection: number
  endSection: number
  startWeek?: number
  endWeek?: number
  classroom?: string
}) => {
  const day = weekDayMap[s.weekDay] || `周${s.weekDay}`
  const period = formatPeriod(s.startSection, s.endSection)
  const weeks = formatWeeks(s.startWeek, s.endWeek)
  const classroom = s.classroom ? `，${s.classroom}` : ''
  return `${day} ${period}（${weeks}）${classroom}`
}

const resetState = () => {
  error.value = null
  result.value = null
  form.classSearch = ''
  form.teachingClassIds = []
  form.clearExisting = false
  form.preferences.weeklyHours = 2
  form.preferences.sectionsPerClass = 2
  form.preferences.preferredWeekDays = []
  form.preferences.preferredSections = []
  form.preferences.allowWeekend = false
  form.preferences.allowEvening = false
}

const openDialog = async (defaultSemesterId?: number) => {
  open.value = true
  resetState()
  if (defaultSemesterId) form.semesterId = defaultSemesterId
  await loadOptions()
}

const closeDialog = () => {
  open.value = false
}

defineExpose({ openDialog })

const buildPayload = (): AutoScheduleRequest => {
  const preferences: AutoSchedulePreferences = {
    weeklyHours: Number(form.preferences.weeklyHours) || 2,
    sectionsPerClass: Number(form.preferences.sectionsPerClass) || 2,
    preferredWeekDays: form.preferences.preferredWeekDays.length
      ? [...form.preferences.preferredWeekDays].sort((a, b) => a - b)
      : undefined,
    preferredSections: form.preferences.preferredSections.length
      ? [...form.preferences.preferredSections].sort((a, b) => a - b)
      : undefined,
    allowWeekend: !!form.preferences.allowWeekend,
    allowEvening: !!form.preferences.allowEvening,
  }

  return {
    semesterId: Number(form.semesterId),
    teachingClassIds: form.teachingClassIds,
    preferences,
  }
}

const validate = (): string | null => {
  if (!form.semesterId) return '请选择学期'
  if (form.teachingClassIds.length === 0) return '请选择至少一个教学班'
  if (!form.preferences.weeklyHours || form.preferences.weeklyHours < 1) return '每周课时数需 ≥ 1'
  if (!form.preferences.sectionsPerClass || form.preferences.sectionsPerClass < 1)
    return '每次课节次数需 ≥ 1'
  return null
}

const handleSubmit = async () => {
  const errMsg = validate()
  if (errMsg) {
    error.value = errMsg
    return
  }

  if (form.clearExisting) {
    const ok = await confirm({
      title: '确认清空旧排课？',
      description: `将清空所选 ${form.teachingClassIds.length} 个教学班的全部排课记录，然后再自动排课。此操作不可撤销。`,
      confirmText: '继续',
      cancelText: '取消',
      destructive: true,
    })
    if (!ok) return
  }

  isLoading.value = true
  error.value = null
  result.value = null

  try {
    if (form.clearExisting) {
      await Promise.all(form.teachingClassIds.map((id) => deleteAllTeachingClassSchedules(id)))
    }

    const payload = buildPayload()
    const res = await autoSchedule(payload)
    result.value = res.data
    emit('success')
    success(`自动排课完成：成功 ${res.data.successCount}，失败 ${res.data.failureCount}`)
  } catch (err: unknown) {
    const message = extractErrorMessage(err, '自动排课失败')
    error.value = message
    notifyError(message)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="closeDialog">
    <DialogContent class="sm:max-w-[820px] max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>自动排课</DialogTitle>
        <DialogDescription>为多个教学班自动生成本学期排课（默认不会清空旧排课）</DialogDescription>
      </DialogHeader>

      <Alert v-if="error" variant="destructive" class="mb-4">
        <AlertDescription>{{ error }}</AlertDescription>
      </Alert>

      <div class="grid gap-6">
        <!-- 基本信息 -->
        <div class="grid gap-4">
          <div class="grid grid-cols-4 items-center gap-4">
            <Label class="text-right text-red-500">学期 *</Label>
            <div class="col-span-3">
              <Select v-model="form.semesterId" :disabled="isLoadingOptions || isLoading">
                <SelectTrigger>
                  <SelectValue placeholder="选择学期" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="s in semesters" :key="s.id" :value="s.id">
                    {{ s.name }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div class="grid grid-cols-4 items-center gap-4">
            <Label class="text-right">先清空旧排课</Label>
            <div class="col-span-3 flex items-center justify-between gap-4">
              <div class="text-sm text-muted-foreground">
                开启后将先调用“删除全部排课”接口，再执行自动排课
              </div>
              <Switch v-model="form.clearExisting" :disabled="isLoading" />
            </div>
          </div>
        </div>

        <Separator />

        <!-- 教学班选择 -->
        <div class="grid gap-3">
          <div class="flex items-center justify-between gap-3">
            <div class="font-medium">选择教学班（已选 {{ selectedCount }} 个）</div>
            <div class="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                :disabled="filteredTeachingClasses.length === 0 || isLoading"
                @click="selectAllFiltered"
              >
                全选当前列表
              </Button>
              <Button
                variant="outline"
                size="sm"
                :disabled="selectedCount === 0 || isLoading"
                @click="clearSelected"
              >
                清空
              </Button>
            </div>
          </div>

          <div class="flex gap-2">
            <Input
              v-model="form.classSearch"
              placeholder="搜索：教学班名称 / 课程名 / 编号"
              :disabled="isLoading"
            />
          </div>

          <div class="border rounded-md p-3 bg-card max-h-[220px] overflow-auto">
            <div v-if="isLoadingOptions" class="text-sm text-muted-foreground">加载中...</div>
            <div
              v-else-if="filteredTeachingClasses.length === 0"
              class="text-sm text-muted-foreground"
            >
              暂无可选教学班
            </div>
            <div v-else class="grid gap-2">
              <div
                v-for="tc in filteredTeachingClasses"
                :key="tc.id"
                class="flex items-center justify-between gap-3 rounded-md border p-2"
              >
                <div class="min-w-0">
                  <div class="font-medium truncate">
                    {{ tc.name }}
                    <span class="text-xs text-muted-foreground ml-2">#{{ tc.id }}</span>
                  </div>
                  <div class="text-xs text-muted-foreground truncate">
                    {{ tc.courseName || '-' }} · {{ tc.code || '-' }} · {{ tc.teacherName || '-' }}
                  </div>
                </div>
                <Switch
                  :model-value="isSelected(tc.id)"
                  :disabled="isLoading"
                  @update:model-value="(v) => setSelected(tc.id, v)"
                />
              </div>
            </div>
          </div>
        </div>

        <Separator />

        <!-- 偏好设置 -->
        <div class="grid gap-4">
          <div class="font-medium">排课偏好（不填则使用默认）</div>

          <div class="grid grid-cols-2 gap-4">
            <div class="grid gap-2">
              <Label>每周课时数</Label>
              <Input
                v-model.number="form.preferences.weeklyHours"
                type="number"
                min="1"
                :disabled="isLoading"
              />
            </div>
            <div class="grid gap-2">
              <Label>每次课节次数</Label>
              <Input
                v-model.number="form.preferences.sectionsPerClass"
                type="number"
                min="1"
                :disabled="isLoading"
              />
            </div>
          </div>

          <div class="grid gap-2">
            <div class="flex items-center justify-between gap-3">
              <Label>优先星期（可选）</Label>
              <div class="flex items-center gap-2">
                <div class="text-xs text-muted-foreground">允许周末</div>
                <Switch v-model="form.preferences.allowWeekend" :disabled="isLoading" />
              </div>
            </div>
            <div class="flex flex-wrap gap-2">
              <Button
                v-for="d in weekDayOptions"
                :key="d.value"
                type="button"
                size="sm"
                variant="outline"
                :disabled="isLoading"
                :class="
                  form.preferences.preferredWeekDays.includes(d.value)
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : ''
                "
                @click="togglePreferredWeekDay(d.value)"
              >
                {{ d.label }}
              </Button>
            </div>
            <div class="text-xs text-muted-foreground">
              不选择表示不限；如关闭“允许周末”，后台会避开周六/周日
            </div>
          </div>

          <div class="grid gap-2">
            <div class="flex items-center justify-between gap-3">
              <Label>优先起始节次（可选）</Label>
              <div class="flex items-center gap-2">
                <div class="text-xs text-muted-foreground">允许晚上</div>
                <Switch v-model="form.preferences.allowEvening" :disabled="isLoading" />
              </div>
            </div>
            <div class="flex flex-wrap gap-2">
              <Button
                v-for="sec in preferredSectionOptions"
                :key="sec"
                type="button"
                size="sm"
                variant="outline"
                :disabled="isLoading"
                :class="
                  form.preferences.preferredSections.includes(sec)
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : ''
                "
                @click="togglePreferredSection(sec)"
              >
                {{ sec }}
              </Button>
            </div>
            <div class="text-xs text-muted-foreground">不选择表示不限；起始节次示例：1/3/5/7/9</div>
          </div>
        </div>

        <Separator v-if="result" />

        <!-- 结果展示 -->
        <div v-if="result" class="grid gap-4">
          <div class="flex items-center justify-between gap-3">
            <div class="font-medium">执行结果</div>
            <div class="flex items-center gap-2">
              <Badge variant="secondary">成功 {{ result.successCount }}</Badge>
              <Badge :variant="result.failureCount ? 'destructive' : 'secondary'">
                失败 {{ result.failureCount }}
              </Badge>
            </div>
          </div>

          <div v-if="result.scheduledClasses?.length" class="grid gap-3">
            <div class="text-sm font-medium">已排课教学班</div>
            <div class="grid gap-3">
              <div
                v-for="item in result.scheduledClasses"
                :key="item.teachingClassId"
                class="border rounded-md p-3 bg-card"
              >
                <div class="font-medium">
                  {{ item.teachingClassName || item.teachingClassId }}
                  <span class="text-xs text-muted-foreground ml-2">{{
                    item.courseName || '-'
                  }}</span>
                  <span class="text-xs text-muted-foreground ml-2">{{
                    item.teacherName || '-'
                  }}</span>
                </div>
                <div v-if="item.schedules?.length" class="mt-2 grid gap-1 text-sm">
                  <div v-for="s in item.schedules" :key="s.id">
                    {{ formatScheduleLine(s) }}
                  </div>
                </div>
                <div v-else class="mt-2 text-sm text-muted-foreground">未返回具体排课明细</div>
              </div>
            </div>
          </div>

          <div v-if="result.failures?.length" class="grid gap-3">
            <div class="text-sm font-medium text-destructive">失败列表</div>
            <div class="grid gap-2">
              <div
                v-for="item in result.failures"
                :key="item.teachingClassId"
                class="border rounded-md p-3 bg-card"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <div class="font-medium truncate">
                      {{ item.teachingClassName || item.teachingClassId }}
                      <span class="text-xs text-muted-foreground ml-2">{{
                        item.courseName || '-'
                      }}</span>
                      <span class="text-xs text-muted-foreground ml-2">{{
                        item.teacherName || '-'
                      }}</span>
                    </div>
                    <div class="text-sm text-muted-foreground mt-1">
                      原因：{{ item.reason || '未知原因' }}
                    </div>
                  </div>
                  <Badge variant="destructive">失败</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter class="mt-6">
        <div class="flex w-full items-center justify-between gap-2">
          <div class="text-xs text-muted-foreground">
            提示：自动排课不会自动清空旧排课；如需“重新排课”，建议勾选“先清空旧排课”
          </div>
          <div class="flex items-center gap-2">
            <Button variant="outline" :disabled="isLoading" @click="closeDialog">关闭</Button>
            <Button :disabled="isLoading" @click="handleSubmit">
              {{ isLoading ? '执行中...' : '开始自动排课' }}
            </Button>
          </div>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
