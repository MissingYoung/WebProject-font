<script setup lang="ts">
import { computed } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart } from 'echarts/charts'
import type { BarSeriesOption } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from 'echarts/components'
import VChart from 'vue-echarts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import type { OrgDistribution } from '@/types'
import { Skeleton } from '@/components/ui/skeleton'
import { Users } from 'lucide-vue-next'

const props = defineProps<{
  data: OrgDistribution[]
  loading?: boolean
  error?: string | null
  title?: string
  description?: string
  showTeachers?: boolean
}>()

use([CanvasRenderer, BarChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent])

const option = computed(() => {
  const hasTeacherData = props.data.some(
    (d) => d.teacherCount !== undefined && d.teacherCount !== null
  )

  const series: BarSeriesOption[] = [
    {
      name: '学生数',
      type: 'bar',
      data: props.data.map((d) => d.studentCount),
      itemStyle: {
        color: '#3b82f6',
      },
      label: {
        show: true,
        position: 'top',
        formatter: '{c}',
      },
    },
  ]

  if (props.showTeachers && hasTeacherData) {
    series.push({
      name: '教师数',
      type: 'bar',
      data: props.data.map((d) => d.teacherCount || 0),
      itemStyle: {
        color: '#10b981',
      },
      label: {
        show: true,
        position: 'top',
        formatter: '{c}',
      },
    })
  }

  return {
    aria: {
      enabled: true,
      decal: {
        show: true,
      },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
    },
    legend: {
      data: props.showTeachers && hasTeacherData ? ['学生数', '教师数'] : ['学生数'],
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: props.data.map((d) => d.label),
      axisLabel: {
        interval: 0,
        rotate: props.data.length > 8 ? 45 : 0,
        formatter: (value: string) => {
          return value.length > 8 ? value.substring(0, 8) + '...' : value
        },
      },
    },
    yAxis: {
      type: 'value',
      name: '人数',
    },
    series,
  }
})
</script>

<template>
  <Card>
    <CardHeader>
      <div class="flex items-center gap-2">
        <Users class="h-5 w-5" aria-hidden="true" />
        <CardTitle>{{ title || '学生分布' }}</CardTitle>
      </div>
      <CardDescription>
        {{ description || '按组织机构统计的学生和教师人数' }}
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div v-if="loading" class="space-y-4">
        <Skeleton class="h-[350px] w-full" />
      </div>
      <div
        v-else-if="error"
        class="flex flex-col h-[350px] items-center justify-center text-destructive"
      >
        <p>图表加载失败</p>
        <p class="text-sm text-muted-foreground">{{ error }}</p>
      </div>
      <div v-else-if="data.length === 0" class="flex h-[350px] items-center justify-center">
        <p class="text-muted-foreground">暂无数据</p>
      </div>
      <div v-else class="h-[350px] w-full">
        <VChart
          class="h-full w-full"
          :option="option"
          autoresize
          aria-label="学生分布柱状图，显示各部门的学生和教师人数"
        />
      </div>
    </CardContent>
  </Card>
</template>
