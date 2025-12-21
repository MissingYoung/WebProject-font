<script setup lang="ts">
import { computed } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from 'echarts/components'
import VChart from 'vue-echarts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import type { EnrollmentProgress } from '@/types'
import { Skeleton } from '@/components/ui/skeleton'
import { BarChart3 } from 'lucide-vue-next'

const props = defineProps<{
  data: EnrollmentProgress[]
  loading?: boolean
  error?: string | null
  title?: string
  description?: string
}>()

use([CanvasRenderer, BarChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent])

const option = computed(() => {
  const topCourses = props.data.slice(0, 10)

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
      data: ['容量', '已选', '候补'],
      top: 8,
      left: 'center',
    },
    grid: {
      top: 56,
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      name: '人数',
    },
    yAxis: {
      type: 'category',
      data: topCourses.map((d) => d.courseName),
    },
    series: [
      {
        name: '容量',
        type: 'bar',
        data: topCourses.map((d) => d.totalCapacity),
        itemStyle: {
          color: '#a5b4fc',
        },
        barGap: '-100%',
        label: {
          show: true,
          position: 'right',
          formatter: '{c}',
          color: '#6b7280',
        },
      },
      {
        name: '已选',
        type: 'bar',
        stack: 'demand',
        data: topCourses.map((d) => d.enrolled),
        itemStyle: {
          color: '#3b82f6',
        },
        label: {
          show: true,
          position: 'inside',
          formatter: (params: { value: number }) => (params.value > 0 ? params.value : ''),
          color: '#ffffff',
        },
      },
      {
        name: '候补',
        type: 'bar',
        stack: 'demand',
        data: topCourses.map((d) => d.waitlisted),
        itemStyle: {
          color: '#f59e0b',
        },
        label: {
          show: true,
          position: 'inside',
          formatter: (params: { value: number }) => (params.value > 0 ? params.value : ''),
          color: '#ffffff',
        },
      },
    ],
  }
})
</script>

<template>
  <Card>
    <CardHeader>
      <div class="flex items-center gap-2">
        <BarChart3 class="h-5 w-5" aria-hidden="true" />
        <CardTitle>{{ title || '选课进度' }}</CardTitle>
      </div>
      <CardDescription>
        {{ description || '各课程的容量、已选和候补情况（Top 10）' }}
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div v-if="loading" class="space-y-4">
        <Skeleton class="h-[400px] w-full" />
      </div>
      <div
        v-else-if="error"
        class="flex flex-col h-[400px] items-center justify-center text-destructive"
      >
        <p>图表加载失败</p>
        <p class="text-sm text-muted-foreground">{{ error }}</p>
      </div>
      <div v-else-if="data.length === 0" class="flex h-[400px] items-center justify-center">
        <p class="text-muted-foreground">暂无数据</p>
      </div>
      <div v-else class="h-[400px] w-full">
        <VChart
          class="h-full w-full"
          :option="option"
          autoresize
          aria-label="选课进度横向柱状图，显示各课程的容量、已选人数和候补人数"
        />
      </div>
    </CardContent>
  </Card>
</template>
