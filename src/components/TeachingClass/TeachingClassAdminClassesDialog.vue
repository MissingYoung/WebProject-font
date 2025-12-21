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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useNotification } from '@/composables/useNotification'
import type { AdministrativeClassVO, TeachingClassVO } from '@/types'
import {
  assignTeachingClassAdminClasses,
  getAdministrativeClassList,
  getTeachingClassAdminClasses,
} from '@/lib/api'

type TeachingClassAdminClassRel = {
  administrativeClassId: number
  administrativeClassName?: string
  autoEnroll?: boolean
}

const { success, error: notifyError } = useNotification()

const emit = defineEmits<{
  (e: 'success'): void
}>()

const open = ref(false)
const error = ref<string | null>(null)
const isLoading = ref(false)
const isSubmitting = ref(false)

const teachingClass = ref<TeachingClassVO | null>(null)
const administrativeClasses = ref<AdministrativeClassVO[]>([])
const currentRels = ref<TeachingClassAdminClassRel[]>([])

const state = reactive({
  keyword: '',
  defaultAutoEnroll: false,
  map: {} as Record<number, { selected: boolean; autoEnroll: boolean }>,
})

const filteredClasses = computed(() => {
  const keyword = state.keyword.trim()
  if (!keyword) return administrativeClasses.value
  return administrativeClasses.value.filter(
    (c) =>
      c.code.includes(keyword) || c.name.includes(keyword) || (c.majorName || '').includes(keyword)
  )
})

const selectedCount = computed(() => {
  let count = 0
  for (const c of administrativeClasses.value) {
    if (state.map[c.id]?.selected) count++
  }
  return count
})

const loadAdministrativeClasses = async () => {
  const res = await getAdministrativeClassList({ pageNum: 1, pageSize: 100, status: 'ACTIVE' })
  administrativeClasses.value = res?.data?.records || []
}

const loadCurrentRels = async (teachingClassId: number) => {
  const res = await getTeachingClassAdminClasses(teachingClassId)
  currentRels.value = res?.data || []
}

const initMap = () => {
  const map: Record<number, { selected: boolean; autoEnroll: boolean }> = {}
  for (const c of administrativeClasses.value) {
    map[c.id] = { selected: false, autoEnroll: false }
  }
  for (const rel of currentRels.value) {
    if (!map[rel.administrativeClassId]) {
      map[rel.administrativeClassId] = { selected: true, autoEnroll: !!rel.autoEnroll }
    } else {
      map[rel.administrativeClassId]!.selected = true
      map[rel.administrativeClassId]!.autoEnroll = !!rel.autoEnroll
    }
  }
  state.map = map
}

const reset = () => {
  error.value = null
  state.keyword = ''
  state.defaultAutoEnroll = false
  state.map = {}
  teachingClass.value = null
  administrativeClasses.value = []
  currentRels.value = []
}

const openDialog = async (row: TeachingClassVO) => {
  open.value = true
  error.value = null
  teachingClass.value = row
  isLoading.value = true
  try {
    await Promise.all([loadAdministrativeClasses(), loadCurrentRels(row.id)])
    initMap()
  } catch (err: unknown) {
    console.error('加载教学班行政班限制失败', err)
    notifyError('加载教学班行政班限制失败')
  } finally {
    isLoading.value = false
  }
}

defineExpose({ openDialog })

const toggleSelected = (id: number, checked: boolean) => {
  if (!state.map[id]) state.map[id] = { selected: false, autoEnroll: false }
  state.map[id].selected = checked
  if (checked && state.map[id].autoEnroll === false && state.defaultAutoEnroll) {
    state.map[id].autoEnroll = true
  }
}

const toggleAutoEnroll = (id: number, checked: boolean) => {
  if (!state.map[id]) state.map[id] = { selected: false, autoEnroll: false }
  state.map[id].autoEnroll = checked
  if (checked) state.map[id].selected = true
}

const handleSubmit = async () => {
  if (!teachingClass.value) return
  isSubmitting.value = true
  error.value = null
  try {
    const selected = administrativeClasses.value
      .filter((c) => state.map[c.id]?.selected)
      .map((c) => ({
        administrativeClassId: c.id,
        autoEnroll: state.map[c.id]?.autoEnroll || false,
      }))

    await assignTeachingClassAdminClasses(teachingClass.value.id, selected)
    success('保存成功')
    open.value = false
    emit('success')
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '保存失败'
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
        <DialogTitle>行政班限制</DialogTitle>
        <DialogDescription>
          仅允许所选行政班的学生选该教学班；不选表示不限制（全体可选）。可选：开启“自动选课”用于新生必修等场景。
        </DialogDescription>
      </DialogHeader>

      <Alert v-if="error" variant="destructive" class="mb-4">
        <AlertDescription>{{ error }}</AlertDescription>
      </Alert>

      <div v-if="teachingClass" class="text-sm text-muted-foreground mb-2">
        当前教学班：<span class="text-foreground font-medium">{{ teachingClass.name }}</span> （{{
          teachingClass.courseName || '-'
        }}
        / {{ teachingClass.semesterName || '-' }}）
      </div>

      <div class="flex flex-wrap gap-4 items-end mb-3">
        <div class="flex-1 min-w-[220px] max-w-[320px]">
          <Label class="text-xs text-muted-foreground">搜索</Label>
          <Input v-model="state.keyword" placeholder="班级编码/名称/专业" />
        </div>
        <div class="flex items-center gap-2">
          <Switch v-model:checked="state.defaultAutoEnroll" />
          <span class="text-sm text-muted-foreground">新选中默认自动选课</span>
        </div>
        <div class="ml-auto text-sm text-muted-foreground">已限制 {{ selectedCount }} 个行政班</div>
      </div>

      <div class="border rounded-lg max-h-[420px] overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead class="w-28">限制</TableHead>
              <TableHead>班级编码</TableHead>
              <TableHead>班级名称</TableHead>
              <TableHead>专业</TableHead>
              <TableHead class="w-40">自动选课</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-if="isLoading">
              <TableCell colspan="5" class="text-center py-8 text-muted-foreground"
                >加载中...</TableCell
              >
            </TableRow>
            <TableRow v-else-if="filteredClasses.length === 0">
              <TableCell colspan="5" class="text-center py-8 text-muted-foreground"
                >暂无行政班</TableCell
              >
            </TableRow>
            <TableRow v-for="c in filteredClasses" :key="c.id">
              <TableCell>
                <Switch
                  :checked="state.map[c.id]?.selected || false"
                  @update:checked="(v: boolean) => toggleSelected(c.id, v)"
                />
              </TableCell>
              <TableCell class="font-medium">{{ c.code }}</TableCell>
              <TableCell>{{ c.name }}</TableCell>
              <TableCell>{{ c.majorName || '-' }}</TableCell>
              <TableCell>
                <Switch
                  :checked="state.map[c.id]?.autoEnroll || false"
                  :disabled="!(state.map[c.id]?.selected || false)"
                  @update:checked="(v: boolean) => toggleAutoEnroll(c.id, v)"
                />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <DialogFooter>
        <Button variant="outline" :disabled="isSubmitting" @click="open = false">取消</Button>
        <Button :disabled="isSubmitting" @click="handleSubmit">
          {{ isSubmitting ? '保存中...' : '保存' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
