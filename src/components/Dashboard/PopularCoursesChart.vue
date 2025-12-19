<script setup lang="ts">
import { computed } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
} from 'echarts/components'
import VChart from 'vue-echarts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import type { PopularCourse } from '@/types'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp } from 'lucide-vue-next'

const props = defineProps<{
  data: PopularCourse[]
  loading?: boolean
  error?: string | null
  title?: string
  description?: string
  limit?: number
}>()

use([CanvasRenderer, BarChart, TitleComponent, TooltipComponent, GridComponent])

const option = computed(() => {
  const topCourses = props.data.slice(0, props.limit || 10)

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
      formatter: (params: { name: string; value: number }[]) => {
        const data = params[0]
        return `${data.name}<br/>选课人数: ${data.value}`
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      name: '选课人数',
    },
    yAxis: {
      type: 'category',
      data: topCourses.map((d) => d.courseName),
      axisLabel: {
        interval: 0,
        formatter: (value: string) => {
          return value.length > 10 ? value.substring(0, 10) + '...' : value
        },
      },
    },
    series: [
      {
        name: '选课人数',
        type: 'bar',
        data: topCourses.map((d) => d.enrollmentCount),
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 1,
            y2: 0,
            colorStops: [
              { offset: 0, color: '#3b82f6' },
              { offset: 1, color: '#8b5cf6' },
            ],
          },
        },
        label: {
          show: true,
          position: 'right',
          formatter: '{c}',
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
        <TrendingUp class="h-5 w-5" aria-hidden="true" />
        <CardTitle>{{ title || '热门课程 Top 10' }}</CardTitle>
      </div>
      <CardDescription>
        {{ description || '按选课人数排名的热门课程' }}
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
          aria-label="热门课程横向柱状图，显示选课人数最多的课程"
        />
      </div>
    </CardContent>
  </Card>
</template>
