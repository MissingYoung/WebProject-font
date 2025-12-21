<script setup lang="ts">
import { computed } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import type { EnrollmentProgress } from '@/types'
import { Skeleton } from '@/components/ui/skeleton'
import { PieChart as PieChartIcon } from 'lucide-vue-next'

const props = defineProps<{
  data: EnrollmentProgress[]
  loading?: boolean
  error?: string | null
  title?: string
  description?: string
}>()

use([CanvasRenderer, PieChart, TitleComponent, TooltipComponent, LegendComponent])

const option = computed(() => {
  const categories = {
    low: 0,
    medium: 0,
    high: 0,
  }

  props.data.forEach((item) => {
    const rate = Number.isFinite(item.fillRate) ? Math.max(0, Math.min(1, item.fillRate)) : 0
    if (rate < 0.5) {
      categories.low++
    } else if (rate < 0.8) {
      categories.medium++
    } else {
      categories.high++
    }
  })

  return {
    aria: {
      enabled: true,
      decal: {
        show: true,
      },
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'horizontal',
      bottom: 0,
      left: 'center',
    },
    series: [
      {
        name: '填充率分布',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: true,
          formatter: '{b}: {c}门\n({d}%)',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold',
          },
        },
        data: [
          {
            value: categories.low,
            name: '低填充率 (<50%)',
            itemStyle: {
              color: '#ef4444',
              decal: {
                symbol: 'rect',
                symbolSize: 0.8,
              },
            },
          },
          {
            value: categories.medium,
            name: '中填充率 (50-80%)',
            itemStyle: {
              color: '#f59e0b',
              decal: {
                symbol: 'circle',
                symbolSize: 0.8,
              },
            },
          },
          {
            value: categories.high,
            name: '高填充率 (>80%)',
            itemStyle: {
              color: '#10b981',
              decal: {
                symbol: 'diamond',
                symbolSize: 0.8,
              },
            },
          },
        ],
      },
    ],
  }
})
</script>

<template>
  <Card>
    <CardHeader>
      <div class="flex items-center gap-2">
        <PieChartIcon class="h-5 w-5" aria-hidden="true" />
        <CardTitle>{{ title || '填充率分布' }}</CardTitle>
      </div>
      <CardDescription>
        {{ description || '各课程按填充率分类统计' }}
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
          aria-label="填充率分布饼图，显示低、中、高填充率的课程数量"
        />
      </div>
    </CardContent>
  </Card>
</template>
