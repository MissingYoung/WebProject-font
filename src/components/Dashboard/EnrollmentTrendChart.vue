<script setup lang="ts">
import { computed } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from 'echarts/components'
import VChart from 'vue-echarts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import type { EnrollmentTrendPoint } from '@/types'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp } from 'lucide-vue-next'

const props = defineProps<{
  data: EnrollmentTrendPoint[]
  loading?: boolean
  error?: string | null
  title?: string
  description?: string
}>()

use([CanvasRenderer, LineChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent])

const option = computed(() => ({
  aria: {
    enabled: true,
    decal: {
      show: true,
    },
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'cross',
    },
  },
  legend: {
    data: ['选课人数', '退课人数'],
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
    type: 'category',
    boundaryGap: false,
    data: props.data.map((d) => d.date),
  },
  yAxis: {
    type: 'value',
    name: '人数',
  },
  series: [
    {
      name: '选课人数',
      type: 'line',
      data: props.data.map((d) => d.enrollCount),
      smooth: true,
      itemStyle: {
        color: '#3b82f6',
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
            { offset: 1, color: 'rgba(59, 130, 246, 0.05)' },
          ],
        },
      },
    },
    {
      name: '退课人数',
      type: 'line',
      data: props.data.map((d) => d.dropCount),
      smooth: true,
      itemStyle: {
        color: '#ef4444',
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(239, 68, 68, 0.3)' },
            { offset: 1, color: 'rgba(239, 68, 68, 0.05)' },
          ],
        },
      },
    },
  ],
}))
</script>

<template>
  <Card>
    <CardHeader v-if="title || description">
      <div class="flex items-center gap-2">
        <TrendingUp class="h-5 w-5" />
        <CardTitle v-if="title">{{ title }}</CardTitle>
      </div>
      <CardDescription v-if="description">
        {{ description }}
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
        <p class="text-muted-foreground">暂无趋势数据</p>
      </div>
      <div v-else class="h-[350px] w-full">
        <VChart
          class="h-full w-full"
          :option="option"
          autoresize
          aria-label="选课趋势折线图，显示最近一段时间的选课人数与退课人数"
        />
      </div>
    </CardContent>
  </Card>
</template>
