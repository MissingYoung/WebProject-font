<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { BookOpen, RefreshCw, Users, School, AlertTriangle, Loader2 } from 'lucide-vue-next'
import { useUserStore } from '@/stores/user'
import { useNotification } from '@/composables/useNotification'
import type {
  SemesterVO,
  TeacherDashboardVO,
  TeachingClassStatus,
  AdministrativeClassStatus,
} from '@/types'
import { getCurrentSemester, getSemesterList, getTeacherMeDashboard } from '@/lib/api'
import KPICard from '@/components/Dashboard/KPICard.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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

const userStore = useUserStore()
const router = useRouter()
const { error: notifyError } = useNotification()

const role = computed(() => userStore.me?.role || userStore.userInfo?.role || '')
const isTeacher = computed(() => role.value === 'teacher')

const semesters = ref<SemesterVO[]>([])
const currentSemester = ref<SemesterVO | null>(null)
const selectedSemesterId = ref<number | undefined>(undefined)

const dashboard = ref<TeacherDashboardVO | null>(null)
const isLoading = ref(false)
const errorMessage = ref<string | null>(null)

const teachingClassStatusMap: Record<
  TeachingClassStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  DRAFT: { label: '草稿', variant: 'secondary' },
  PUBLISHED: { label: '已发布', variant: 'default' },
  FULL: { label: '已满', variant: 'outline' },
  CLOSED: { label: '已关闭', variant: 'destructive' },
}

const adminClassStatusMap: Record<
  AdministrativeClassStatus,
  { label: string; variant: 'default' | 'destructive' }
> = {
  ACTIVE: { label: '正常', variant: 'default' },
  DISABLED: { label: '禁用', variant: 'destructive' },
}

const loadSemesters = async () => {
  try {
    const res = await getSemesterList({ pageNum: 1, pageSize: 100 })
    semesters.value = res.data.records || []
  } catch (err: unknown) {
    notifyError(err instanceof Error ? err.message : '加载学期列表失败')
    semesters.value = []
  }
}

const loadCurrent = async () => {
  try {
    const res = await getCurrentSemester()
    currentSemester.value = res.data || null
    if (!selectedSemesterId.value && res.data?.id) selectedSemesterId.value = res.data.id
  } catch {
    currentSemester.value = null
  }
}

const fetchDashboard = async () => {
  if (!isTeacher.value) return
  isLoading.value = true
  errorMessage.value = null
  try {
    const res = await getTeacherMeDashboard({
      semesterId: selectedSemesterId.value,
    })
    dashboard.value = res.data
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '加载概览失败'
    errorMessage.value = msg
    notifyError(msg)
    dashboard.value = null
  } finally {
    isLoading.value = false
  }
}

const handleSemesterChange = (v: unknown) => {
  selectedSemesterId.value = typeof v === 'number' ? v : undefined
  fetchDashboard()
}

const goDashboard = () => router.push({ name: 'Dashboard' })

onMounted(async () => {
  await Promise.all([loadSemesters(), loadCurrent()])
  await fetchDashboard()
})
</script>

<template>
  <div class="space-y-6 p-6">
    <div class="flex items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold tracking-tight flex items-center gap-2">
          <School class="h-6 w-6" />
          我的班级与课程情况
        </h2>
        <p class="text-muted-foreground">
          <span v-if="dashboard?.teacherName">{{ dashboard.teacherName }}</span>
          <span v-else-if="userStore.userInfo?.realName">{{ userStore.userInfo.realName }}</span>
          <span v-else>教师端</span>
          <span class="mx-2">·</span>
          <span v-if="dashboard?.semester">
            {{ dashboard.semester.name }}（{{ dashboard.semester.academicYear }}）
          </span>
          <span v-else-if="currentSemester">
            {{ currentSemester.name }}（{{ currentSemester.academicYear }}）
          </span>
          <span v-else>学期信息未设置</span>
        </p>
      </div>
      <Button variant="outline" :disabled="isLoading" @click="fetchDashboard">
        <RefreshCw class="h-4 w-4 mr-2" />
        刷新
      </Button>
    </div>

    <Alert v-if="!isTeacher" variant="destructive">
      <AlertTriangle class="h-4 w-4" />
      <AlertTitle>无权限</AlertTitle>
      <AlertDescription class="flex items-center justify-between gap-4">
        <span>该页面仅教师账号可访问。</span>
        <Button variant="secondary" size="sm" @click="goDashboard">返回桌面</Button>
      </AlertDescription>
    </Alert>

    <Alert v-else-if="errorMessage" variant="destructive">
      <AlertTriangle class="h-4 w-4" />
      <AlertTitle>加载失败</AlertTitle>
      <AlertDescription>{{ errorMessage }}</AlertDescription>
    </Alert>

    <Card v-if="isTeacher">
      <CardHeader class="space-y-2">
        <CardTitle class="text-base">学期筛选</CardTitle>
        <CardDescription>
          不选或未设置当前学期时，后端可能返回跨学期汇总（semester 为 null）。
        </CardDescription>
      </CardHeader>
      <CardContent class="flex flex-wrap items-end gap-4">
        <div class="flex-1 min-w-[220px] max-w-[360px]">
          <Select v-model="selectedSemesterId" @update:model-value="handleSemesterChange">
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
      </CardContent>
    </Card>

    <div v-if="isTeacher" class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <KPICard
        title="教学班数量"
        :value="dashboard?.stats?.teachingClassCount || 0"
        :icon="Users"
      />
      <KPICard title="课程数量" :value="dashboard?.stats?.courseCount || 0" :icon="BookOpen" />
      <KPICard
        title="行政班数量"
        :value="dashboard?.stats?.administrativeClassCount || 0"
        :icon="School"
      />
      <KPICard
        title="已选人数合计"
        :value="dashboard?.stats?.totalEnrolledCount || 0"
        :icon="Users"
      />
    </div>

    <Card v-if="isTeacher">
      <CardHeader class="flex flex-row items-center justify-between">
        <div class="space-y-1">
          <CardTitle class="text-base">教学班列表</CardTitle>
          <CardDescription>按学期筛选的教学班明细</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div class="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>课程</TableHead>
                <TableHead>教学班</TableHead>
                <TableHead>地点</TableHead>
                <TableHead>已选/容量</TableHead>
                <TableHead>状态</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-if="isLoading">
                <TableCell colspan="5" class="h-24 text-center">
                  <div class="flex items-center justify-center gap-2">
                    <Loader2 class="h-4 w-4 animate-spin" /> 加载中...
                  </div>
                </TableCell>
              </TableRow>
              <TableRow v-else-if="(dashboard?.teachingClasses || []).length === 0">
                <TableCell colspan="5" class="h-24 text-center text-muted-foreground"
                  >暂无教学班</TableCell
                >
              </TableRow>
              <TableRow v-for="row in dashboard?.teachingClasses || []" :key="row.id">
                <TableCell class="font-medium">
                  {{ row.courseName || '-' }}
                  <span v-if="row.courseCode" class="text-muted-foreground"
                    >（{{ row.courseCode }}）</span
                  >
                </TableCell>
                <TableCell>
                  {{ row.name }}
                  <span v-if="row.code" class="text-muted-foreground">（{{ row.code }}）</span>
                </TableCell>
                <TableCell>{{ row.location || '-' }}</TableCell>
                <TableCell> {{ row.enrolledCount ?? 0 }} / {{ row.capacity ?? '-' }} </TableCell>
                <TableCell>
                  <Badge :variant="teachingClassStatusMap[row.status]?.variant || 'default'">
                    {{ teachingClassStatusMap[row.status]?.label || row.status }}
                  </Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>

    <div v-if="isTeacher" class="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader class="space-y-1">
          <CardTitle class="text-base">课程汇总</CardTitle>
          <CardDescription>由教学班按课程聚合</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>课程</TableHead>
                  <TableHead>学分</TableHead>
                  <TableHead>教学班数</TableHead>
                  <TableHead>已选人数</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-if="isLoading">
                  <TableCell colspan="4" class="h-24 text-center">
                    <div class="flex items-center justify-center gap-2">
                      <Loader2 class="h-4 w-4 animate-spin" /> 加载中...
                    </div>
                  </TableCell>
                </TableRow>
                <TableRow v-else-if="(dashboard?.courses || []).length === 0">
                  <TableCell colspan="4" class="h-24 text-center text-muted-foreground"
                    >暂无课程</TableCell
                  >
                </TableRow>
                <TableRow v-for="row in dashboard?.courses || []" :key="row.courseId">
                  <TableCell class="font-medium">
                    {{ row.courseName }}
                    <span class="text-muted-foreground">（{{ row.courseCode }}）</span>
                  </TableCell>
                  <TableCell>{{ row.credit }}</TableCell>
                  <TableCell>{{ row.teachingClassCount }}</TableCell>
                  <TableCell>{{ row.enrolledCount }}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="space-y-1">
          <CardTitle class="text-base">行政班列表</CardTitle>
          <CardDescription>我担任班主任/辅导员的行政班</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>行政班</TableHead>
                  <TableHead>专业</TableHead>
                  <TableHead>人数</TableHead>
                  <TableHead>状态</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-if="isLoading">
                  <TableCell colspan="4" class="h-24 text-center">
                    <div class="flex items-center justify-center gap-2">
                      <Loader2 class="h-4 w-4 animate-spin" /> 加载中...
                    </div>
                  </TableCell>
                </TableRow>
                <TableRow v-else-if="(dashboard?.administrativeClasses || []).length === 0">
                  <TableCell colspan="4" class="h-24 text-center text-muted-foreground"
                    >暂无行政班</TableCell
                  >
                </TableRow>
                <TableRow v-for="row in dashboard?.administrativeClasses || []" :key="row.id">
                  <TableCell class="font-medium">
                    {{ row.name }}
                    <span class="text-muted-foreground">（{{ row.code }}）</span>
                  </TableCell>
                  <TableCell>{{ row.majorName || '-' }}</TableCell>
                  <TableCell>{{ row.studentCount ?? '-' }}</TableCell>
                  <TableCell>
                    <Badge :variant="adminClassStatusMap[row.status]?.variant || 'default'">
                      {{ adminClassStatusMap[row.status]?.label || row.status }}
                    </Badge>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
