<script setup lang="ts">
import type { LucideIcon } from 'lucide-vue-next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

defineProps<{
  title: string
  value: number
  subtitle?: string
  trendContext?: string
  trend?: {
    direction: 'up' | 'down'
    value: string
  }
  icon: LucideIcon
}>()
</script>

<template>
  <Card>
    <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle class="text-sm font-medium">
        {{ title }}
      </CardTitle>
      <component :is="icon" class="h-4 w-4 text-muted-foreground" aria-hidden="true" />
    </CardHeader>
    <CardContent>
      <div class="text-2xl font-bold">
        {{ value.toLocaleString() }}
      </div>
      <p v-if="subtitle" class="text-xs text-muted-foreground">
        {{ subtitle }}
      </p>
      <div v-if="trend" class="mt-1 flex items-center gap-1 text-xs">
        <span
          :class="cn('font-semibold', trend.direction === 'up' ? 'text-green-500' : 'text-red-500')"
        >
          {{ trend.direction === 'up' ? '↑' : '↓' }} {{ trend.value }}
        </span>
        <span class="text-muted-foreground">{{ trendContext || '较上月' }}</span>
      </div>
    </CardContent>
  </Card>
</template>
