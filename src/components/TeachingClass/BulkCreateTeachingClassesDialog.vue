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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useNotification } from '@/composables/useNotification'
import type { AdministrativeClassVO, CourseOfferingVO } from '@/types'
import {
  createTeachingClassesByAdminClasses,
  createTeachingClassesRandomSplit,
  getAdministrativeClassList,
  getCourseOfferingList,
} from '@/lib/api'

type Mode = 'BY_ADMIN_CLASSES' | 'RANDOM_SPLIT'

const { success, error: notifyError } = useNotification()

const emit = defineEmits<{
  (e: 'success'): void
}>()

const open = ref(false)
const error = ref<string | null>(null)
const isLoading = ref(false)
const isSubmitting = ref(false)

const courseOfferings = ref<CourseOfferingVO[]>([])
const administrativeClasses = ref<AdministrativeClassVO[]>([])

const selectedAdminClassIds = ref<Set<number>>(new Set())

const state = reactive({
  mode: 'BY_ADMIN_CLASSES' as Mode,
  courseOfferingId: undefined as number | undefined,
  keyword: '',
  autoEnroll: false,
  classCount: 2,
  capacity: undefined as number | undefined,
})

const filteredAdminClasses = computed(() => {
  const keyword = state.keyword.trim()
  if (!keyword) return administrativeClasses.value
  return administrativeClasses.value.filter(
    (c) =>
      c.code.includes(keyword) || c.name.includes(keyword) || (c.majorName || '').includes(keyword)
  )
})

const selectedCount = computed(() => selectedAdminClassIds.value.size)

const loadData = async () => {
  isLoading.value = true
  try {
    const [offeringRes, adminClassRes] = await Promise.all([
      getCourseOfferingList({ pageNum: 1, pageSize: 100 }),
      getAdministrativeClassList({ pageNum: 1, pageSize: 100, status: 'ACTIVE' }),
    ])
    courseOfferings.value = offeringRes?.data?.records || []
    administrativeClasses.value = adminClassRes?.data?.records || []
  } catch (err: unknown) {
    console.error('加载批量创建数据失败', err)
    notifyError('加载数据失败')
    courseOfferings.value = []
    administrativeClasses.value = []
  } finally {
    isLoading.value = false
  }
}

const reset = () => {
  error.value = null
  selectedAdminClassIds.value = new Set()
  state.mode = 'BY_ADMIN_CLASSES'
  state.courseOfferingId = undefined
  state.keyword = ''
  state.autoEnroll = false
  state.classCount = 2
  state.capacity = undefined
}

const openDialog = async (defaultCourseOfferingId?: number) => {
  open.value = true
  error.value = null
  await loadData()
  state.courseOfferingId = defaultCourseOfferingId
}

defineExpose({ openDialog })

const toggleAdminClass = (id: number, checked: boolean) => {
  const next = new Set(selectedAdminClassIds.value)
  if (checked) next.add(id)
  else next.delete(id)
  selectedAdminClassIds.value = next
}

const handleSubmit = async () => {
  if (!state.courseOfferingId) {
    error.value = '请选择开课'
    return
  }
  isSubmitting.value = true
  error.value = null
  try {
    if (state.mode === 'BY_ADMIN_CLASSES') {
      if (selectedAdminClassIds.value.size === 0) {
        error.value = '请至少选择一个行政班'
        return
      }
      const res = await createTeachingClassesByAdminClasses(
        state.courseOfferingId,
        Array.from(selectedAdminClassIds.value),
        state.autoEnroll
      )
      success(`创建成功：生成 ${res.data.length} 个教学班`)
    } else {
      if (!state.classCount || state.classCount <= 0) {
        error.value = '请输入正确的班级数量（需大于0）'
        return
      }
      const res = await createTeachingClassesRandomSplit(
        state.courseOfferingId,
        state.classCount,
        state.capacity || undefined
      )
      success(`创建成功：生成 ${res.data.length} 个教学班`)
    }

    open.value = false
    emit('success')
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '批量创建失败'
    error.value = message
    notifyError(message)
  } finally {
    isSubmitting.value = false
  }
}

watch(
  () => open.value,
  (v) => {
    if (!v) reset()
  }
)
</script>

<template>
  <Dialog :open="open" @update:open="(v) => (open = v)">
    <DialogContent class="sm:max-w-[950px]">
      <DialogHeader>
        <DialogTitle>批量创建教学班</DialogTitle>
        <DialogDescription>按行政班拆分或按人数随机拆分，批量生成教学班。</DialogDescription>
      </DialogHeader>

      <Alert v-if="error" variant="destructive" class="mb-4">
        <AlertDescription>{{ error }}</AlertDescription>
      </Alert>

      <div class="grid gap-4">
        <div class="grid grid-cols-4 items-center gap-4">
          <Label class="text-right text-red-500">开课 *</Label>
          <div class="col-span-3">
            <Select v-model="state.courseOfferingId" :disabled="isLoading">
              <SelectTrigger>
                <SelectValue placeholder="选择开课" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="o in courseOfferings" :key="o.id" :value="o.id">
                  {{ o.courseCode }} - {{ o.courseName }}（{{ o.semesterName }}）
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div class="grid grid-cols-4 items-center gap-4">
          <Label class="text-right text-red-500">创建方式 *</Label>
          <div class="col-span-3">
            <Select v-model="state.mode">
              <SelectTrigger>
                <SelectValue placeholder="选择创建方式" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BY_ADMIN_CLASSES">按行政班拆分</SelectItem>
                <SelectItem value="RANDOM_SPLIT">按人数随机拆分</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div v-if="state.mode === 'BY_ADMIN_CLASSES'" class="grid gap-3">
          <div class="flex flex-wrap gap-4 items-end">
            <div class="flex-1 min-w-[240px] max-w-[360px]">
              <Label class="text-xs text-muted-foreground">搜索行政班</Label>
              <Input v-model="state.keyword" placeholder="班级编码/名称/专业" />
            </div>
            <div class="flex items-center gap-2">
              <Switch v-model:checked="state.autoEnroll" />
              <span class="text-sm text-muted-foreground">关联后自动选课</span>
            </div>
            <div class="ml-auto text-sm text-muted-foreground">
              已选择 {{ selectedCount }} 个行政班
            </div>
          </div>

          <div class="border rounded-lg max-h-[360px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead class="w-28">选择</TableHead>
                  <TableHead>班级编码</TableHead>
                  <TableHead>班级名称</TableHead>
                  <TableHead>专业</TableHead>
                  <TableHead>入学年份</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-if="isLoading">
                  <TableCell colspan="5" class="text-center py-8 text-muted-foreground"
                    >加载中...</TableCell
                  >
                </TableRow>
                <TableRow v-else-if="filteredAdminClasses.length === 0">
                  <TableCell colspan="5" class="text-center py-8 text-muted-foreground"
                    >暂无行政班</TableCell
                  >
                </TableRow>
                <TableRow v-for="c in filteredAdminClasses" :key="c.id">
                  <TableCell>
                    <Switch
                      :checked="selectedAdminClassIds.has(c.id)"
                      @update:checked="(v: boolean) => toggleAdminClass(c.id, v)"
                    />
                  </TableCell>
                  <TableCell class="font-medium">{{ c.code }}</TableCell>
                  <TableCell>{{ c.name }}</TableCell>
                  <TableCell>{{ c.majorName || '-' }}</TableCell>
                  <TableCell>{{ c.entryYear || '-' }}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>

        <div v-else class="grid gap-3">
          <div class="grid grid-cols-4 items-center gap-4">
            <Label class="text-right text-red-500">班级数量 *</Label>
            <Input
              v-model.number="state.classCount"
              type="number"
              class="col-span-3"
              placeholder="例如：3"
            />
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <Label class="text-right">每班容量</Label>
            <Input
              v-model.number="state.capacity"
              type="number"
              class="col-span-3"
              placeholder="可选：为空则后端默认"
            />
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" :disabled="isSubmitting" @click="open = false">取消</Button>
        <Button :disabled="isSubmitting" @click="handleSubmit">
          {{ isSubmitting ? '提交中...' : '开始创建' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
