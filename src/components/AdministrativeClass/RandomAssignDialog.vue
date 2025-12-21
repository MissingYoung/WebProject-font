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
import type { AdministrativeClassVO, MajorVO } from '@/types'
import { getAdministrativeClassList, getMajorList, randomAssignStudents } from '@/lib/api'

const { success, error: notifyError } = useNotification()

const emit = defineEmits<{
  (e: 'success'): void
}>()

const open = ref(false)
const error = ref<string | null>(null)
const isSubmitting = ref(false)

const administrativeClasses = ref<AdministrativeClassVO[]>([])
const majors = ref<MajorVO[]>([])

const selectedClassIds = ref<Set<number>>(new Set())

const state = reactive({
  majorId: undefined as number | undefined,
  entryYear: undefined as number | undefined,
  gradeLevel: undefined as number | undefined,
})

const selectedCount = computed(() => selectedClassIds.value.size)

const loadAdministrativeClasses = async () => {
  try {
    const res = await getAdministrativeClassList({ pageNum: 1, pageSize: 100, status: 'ACTIVE' })
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
    majors.value = []
  }
}

const reset = () => {
  error.value = null
  selectedClassIds.value = new Set()
  state.majorId = undefined
  state.entryYear = undefined
  state.gradeLevel = undefined
}

const openDialog = async () => {
  open.value = true
  error.value = null
  await Promise.all([loadAdministrativeClasses(), loadMajors()])
}

defineExpose({ openDialog })

const toggleClassSelection = (id: number, checked: boolean) => {
  const next = new Set(selectedClassIds.value)
  if (checked) next.add(id)
  else next.delete(id)
  selectedClassIds.value = next
}

const handleSubmit = async () => {
  if (selectedClassIds.value.size === 0) {
    error.value = '请至少选择一个目标行政班'
    return
  }
  isSubmitting.value = true
  error.value = null
  try {
    const res = await randomAssignStudents({
      administrativeClassIds: Array.from(selectedClassIds.value),
      majorId: state.majorId || undefined,
      entryYear: state.entryYear || undefined,
      gradeLevel: state.gradeLevel || undefined,
    })
    success(`随机分班完成：成功 ${res.data.successCount}，失败 ${res.data.failureCount}`)
    open.value = false
    emit('success')
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '随机分班失败'
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
    <DialogContent class="sm:max-w-[850px]">
      <DialogHeader>
        <DialogTitle>随机分班</DialogTitle>
        <DialogDescription>
          将满足筛选条件的学生随机分配到所选行政班（具体分配规则以服务端实现为准）。
        </DialogDescription>
      </DialogHeader>

      <Alert v-if="error" variant="destructive" class="mb-4">
        <AlertDescription>{{ error }}</AlertDescription>
      </Alert>

      <div class="grid gap-4">
        <div class="grid grid-cols-4 items-center gap-4">
          <Label class="text-right">专业</Label>
          <div class="col-span-3">
            <Select v-model="state.majorId">
              <SelectTrigger>
                <SelectValue placeholder="可选：仅筛选该专业学生" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="m in majors" :key="m.id" :value="m.id">
                  {{ m.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div class="grid grid-cols-4 items-center gap-4">
          <Label class="text-right">入学年份</Label>
          <Input
            v-model.number="state.entryYear"
            type="number"
            class="col-span-3"
            placeholder="可选"
          />
        </div>

        <div class="grid grid-cols-4 items-center gap-4">
          <Label class="text-right">年级</Label>
          <Input
            v-model.number="state.gradeLevel"
            type="number"
            class="col-span-3"
            placeholder="可选"
          />
        </div>

        <div class="flex items-center justify-between">
          <div class="text-sm text-muted-foreground">已选择 {{ selectedCount }} 个行政班</div>
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
              <TableRow v-if="administrativeClasses.length === 0">
                <TableCell colspan="5" class="text-center py-8 text-muted-foreground">
                  暂无可用行政班
                </TableCell>
              </TableRow>
              <TableRow v-for="c in administrativeClasses" :key="c.id">
                <TableCell>
                  <Switch
                    :checked="selectedClassIds.has(c.id)"
                    @update:checked="(v: boolean) => toggleClassSelection(c.id, v)"
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

      <DialogFooter>
        <Button variant="outline" :disabled="isSubmitting" @click="open = false">取消</Button>
        <Button :disabled="isSubmitting" @click="handleSubmit">
          {{ isSubmitting ? '提交中...' : '开始随机分班' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
