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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useNotification } from '@/composables/useNotification'
import type { AdministrativeClassVO, MajorVO, StudentVO } from '@/types'
import {
  assignStudentsToClass,
  getAdministrativeClassList,
  getMajorList,
  getStudentList,
} from '@/lib/api'

const { success, error: notifyError } = useNotification()

const emit = defineEmits<{
  (e: 'success'): void
}>()

const open = ref(false)
const error = ref<string | null>(null)
const isSubmitting = ref(false)

const administrativeClasses = ref<AdministrativeClassVO[]>([])
const majors = ref<MajorVO[]>([])

const students = ref<StudentVO[]>([])
const total = ref(0)
const isLoadingStudents = ref(false)

const selectedStudentIds = ref<Set<number>>(new Set())

const state = reactive({
  administrativeClassId: undefined as number | undefined,
  studentQuery: {
    pageNum: 1,
    pageSize: 10,
    sduId: '',
    realName: '',
    majorId: undefined as number | undefined,
    entryYear: undefined as number | undefined,
    gradeLevel: undefined as number | undefined,
  },
})

const isAllSelectedOnPage = computed(() => {
  if (students.value.length === 0) return false
  return students.value.every((s) => selectedStudentIds.value.has(s.studentId))
})

const selectedCount = computed(() => selectedStudentIds.value.size)

const loadAdministrativeClasses = async () => {
  try {
    const res = await getAdministrativeClassList({ pageNum: 1, pageSize: 100 })
    administrativeClasses.value = res?.data?.records || []
  } catch (err: unknown) {
    console.error('加载行政班列表失败', err)
    notifyError('加载行政班列表失败')
    administrativeClasses.value = []
  }
}

const loadMajors = async () => {
  try {
    const res = await getMajorList({ pageNum: 1, pageSize: 100, status: 'ACTIVE' })
    majors.value = res?.data?.records || []
  } catch (err: unknown) {
    console.error('加载专业列表失败', err)
    majors.value = []
  }
}

const fetchStudents = async () => {
  isLoadingStudents.value = true
  try {
    const res = await getStudentList({
      pageNum: state.studentQuery.pageNum,
      pageSize: state.studentQuery.pageSize,
      sduId: state.studentQuery.sduId || undefined,
      realName: state.studentQuery.realName || undefined,
      majorId: state.studentQuery.majorId || undefined,
      entryYear: state.studentQuery.entryYear || undefined,
      gradeLevel: state.studentQuery.gradeLevel || undefined,
    })
    students.value = res?.data?.records || []
    total.value = res?.data?.total || 0
  } catch (err: unknown) {
    console.error('加载学生列表失败', err)
    notifyError('加载学生列表失败')
    students.value = []
    total.value = 0
  } finally {
    isLoadingStudents.value = false
  }
}

const toggleStudentSelection = (studentId: number, checked: boolean) => {
  const next = new Set(selectedStudentIds.value)
  if (checked) next.add(studentId)
  else next.delete(studentId)
  selectedStudentIds.value = next
}

const toggleSelectAllOnPage = (checked: boolean) => {
  const next = new Set(selectedStudentIds.value)
  for (const s of students.value) {
    if (checked) next.add(s.studentId)
    else next.delete(s.studentId)
  }
  selectedStudentIds.value = next
}

const reset = () => {
  error.value = null
  selectedStudentIds.value = new Set()
  state.studentQuery.pageNum = 1
  state.studentQuery.sduId = ''
  state.studentQuery.realName = ''
  state.studentQuery.majorId = undefined
  state.studentQuery.entryYear = undefined
  state.studentQuery.gradeLevel = undefined
}

const openDialog = async (adminClass?: AdministrativeClassVO) => {
  open.value = true
  error.value = null
  selectedStudentIds.value = new Set()

  await Promise.all([loadAdministrativeClasses(), loadMajors()])
  state.administrativeClassId = adminClass?.id
  fetchStudents()
}

defineExpose({ openDialog })

const handleSearch = () => {
  state.studentQuery.pageNum = 1
  fetchStudents()
}

const handleReset = () => {
  reset()
  fetchStudents()
}

const prevPage = () => {
  if (state.studentQuery.pageNum <= 1) return
  state.studentQuery.pageNum--
  fetchStudents()
}

const nextPage = () => {
  const maxPage = Math.ceil(total.value / state.studentQuery.pageSize) || 1
  if (state.studentQuery.pageNum >= maxPage) return
  state.studentQuery.pageNum++
  fetchStudents()
}

const handleSubmit = async () => {
  if (!state.administrativeClassId) {
    error.value = '请选择目标行政班'
    return
  }
  if (selectedStudentIds.value.size === 0) {
    error.value = '请先选择要分配的学生'
    return
  }

  isSubmitting.value = true
  error.value = null
  try {
    const payload = {
      administrativeClassId: state.administrativeClassId,
      studentIds: Array.from(selectedStudentIds.value),
    }
    const res = await assignStudentsToClass(payload)
    success(`分配完成：成功 ${res.data.successCount}，失败 ${res.data.failureCount}`)
    open.value = false
    emit('success')
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '分配失败'
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
    <DialogContent class="sm:max-w-[900px]">
      <DialogHeader>
        <DialogTitle>分配学生到行政班</DialogTitle>
        <DialogDescription>从学生列表选择若干学生，批量分配到目标行政班。</DialogDescription>
      </DialogHeader>

      <Alert v-if="error" variant="destructive" class="mb-4">
        <AlertDescription>{{ error }}</AlertDescription>
      </Alert>

      <div class="grid gap-4">
        <div class="grid grid-cols-4 items-center gap-4">
          <Label class="text-right text-red-500">目标行政班 *</Label>
          <div class="col-span-3">
            <Select v-model="state.administrativeClassId">
              <SelectTrigger>
                <SelectValue placeholder="选择行政班" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="c in administrativeClasses" :key="c.id" :value="c.id">
                  {{ c.code }} - {{ c.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div class="flex flex-wrap gap-4 items-end">
          <div class="flex-1 min-w-[180px] max-w-[220px]">
            <Input
              v-model="state.studentQuery.sduId"
              placeholder="学工号"
              @keyup.enter="handleSearch"
            />
          </div>
          <div class="flex-1 min-w-[180px] max-w-[220px]">
            <Input
              v-model="state.studentQuery.realName"
              placeholder="姓名"
              @keyup.enter="handleSearch"
            />
          </div>
          <div class="flex-1 min-w-[200px] max-w-[260px]">
            <Select v-model="state.studentQuery.majorId">
              <SelectTrigger>
                <SelectValue placeholder="专业（可选）" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="m in majors" :key="m.id" :value="m.id">
                  {{ m.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="flex-1 min-w-[140px] max-w-[160px]">
            <Input
              v-model.number="state.studentQuery.entryYear"
              type="number"
              placeholder="入学年份"
              @keyup.enter="handleSearch"
            />
          </div>
          <div class="flex-1 min-w-[140px] max-w-[160px]">
            <Input
              v-model.number="state.studentQuery.gradeLevel"
              type="number"
              placeholder="年级"
              @keyup.enter="handleSearch"
            />
          </div>
          <div class="flex gap-2">
            <Button :disabled="isLoadingStudents" @click="handleSearch">搜索</Button>
            <Button variant="outline" :disabled="isLoadingStudents" @click="handleReset"
              >重置</Button
            >
          </div>
        </div>

        <div class="flex items-center justify-between">
          <div class="text-sm text-muted-foreground">已选择 {{ selectedCount }} 人</div>
          <div class="flex items-center gap-2">
            <span class="text-sm text-muted-foreground">全选本页</span>
            <Switch :checked="isAllSelectedOnPage" @update:checked="toggleSelectAllOnPage" />
          </div>
        </div>

        <div class="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead class="w-28">选择</TableHead>
                <TableHead>学工号</TableHead>
                <TableHead>姓名</TableHead>
                <TableHead>专业ID</TableHead>
                <TableHead>行政班ID</TableHead>
                <TableHead>入学年份</TableHead>
                <TableHead>年级</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-if="isLoadingStudents">
                <TableCell colspan="7" class="text-center py-8 text-muted-foreground">
                  加载中...
                </TableCell>
              </TableRow>
              <TableRow v-else-if="students.length === 0">
                <TableCell colspan="7" class="text-center py-8 text-muted-foreground">
                  暂无学生
                </TableCell>
              </TableRow>
              <TableRow v-for="s in students" :key="s.studentId">
                <TableCell>
                  <Switch
                    :checked="selectedStudentIds.has(s.studentId)"
                    @update:checked="(v: boolean) => toggleStudentSelection(s.studentId, v)"
                  />
                </TableCell>
                <TableCell>{{ s.sduId || '-' }}</TableCell>
                <TableCell>{{ s.realName || '-' }}</TableCell>
                <TableCell>{{ s.majorId || '-' }}</TableCell>
                <TableCell>{{ s.administrativeClassId || '-' }}</TableCell>
                <TableCell>{{ s.entryYear || '-' }}</TableCell>
                <TableCell>{{ s.gradeLevel || '-' }}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <div class="flex items-center justify-between">
          <div class="text-sm text-muted-foreground">
            共 {{ total }} 条记录，当前第 {{ state.studentQuery.pageNum }} /
            {{ Math.ceil(total / state.studentQuery.pageSize) || 1 }} 页
          </div>
          <div class="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              :disabled="state.studentQuery.pageNum <= 1"
              @click="prevPage"
            >
              上一页
            </Button>
            <Button
              variant="outline"
              size="sm"
              :disabled="
                state.studentQuery.pageNum >= Math.ceil(total / state.studentQuery.pageSize)
              "
              @click="nextPage"
            >
              下一页
            </Button>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" :disabled="isSubmitting" @click="open = false">取消</Button>
        <Button :disabled="isSubmitting" @click="handleSubmit">
          {{ isSubmitting ? '提交中...' : '确认分配' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
