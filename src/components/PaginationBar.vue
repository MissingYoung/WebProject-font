<script setup lang="ts">
import { computed } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const props = withDefaults(
  defineProps<{
    total: number
    pageNum: number
    pageSize: number
    isLoading?: boolean
    pageSizeOptions?: number[]
  }>(),
  {
    isLoading: false,
    pageSizeOptions: () => [10, 20, 50, 100],
  }
)

const MAX_PAGE_SIZE = 100

const emit = defineEmits<{
  (e: 'update:pageNum', value: number): void
  (e: 'update:pageSize', value: number): void
  (e: 'change'): void
}>()

const maxPage = computed(() => Math.max(1, Math.ceil((props.total || 0) / props.pageSize) || 1))

const prevPage = () => {
  if (props.isLoading) return
  if (props.pageNum <= 1) return
  emit('update:pageNum', props.pageNum - 1)
  emit('change')
}

const nextPage = () => {
  if (props.isLoading) return
  if (props.pageNum >= maxPage.value) return
  emit('update:pageNum', props.pageNum + 1)
  emit('change')
}

const updatePageSize = (value: unknown) => {
  if (value === null || value === undefined || value === '') return
  const nextSize = Math.min(Number(value), MAX_PAGE_SIZE)
  if (!Number.isFinite(nextSize) || nextSize <= 0) return

  emit('update:pageSize', nextSize)
  emit('update:pageNum', 1)
  emit('change')
}
</script>

<template>
  <div class="flex flex-wrap items-center justify-end gap-2 py-4">
    <div class="text-sm text-muted-foreground mr-2">共 {{ total }} 条记录</div>

    <div class="flex items-center gap-2 mr-2">
      <span class="text-sm text-muted-foreground">每页</span>
      <Select :model-value="String(pageSize)" @update:model-value="updatePageSize">
        <SelectTrigger class="h-8 w-[92px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="s in pageSizeOptions" :key="s" :value="String(s)">{{ s }}</SelectItem>
        </SelectContent>
      </Select>
      <span class="text-sm text-muted-foreground">条</span>
    </div>

    <Button variant="outline" size="sm" :disabled="pageNum <= 1 || isLoading" @click="prevPage">
      <ChevronLeft class="h-4 w-4" /> 上一页
    </Button>

    <div class="text-sm font-medium">第 {{ pageNum }} / {{ maxPage }} 页</div>

    <Button
      variant="outline"
      size="sm"
      :disabled="pageNum >= maxPage || isLoading"
      @click="nextPage"
    >
      下一页
      <ChevronRight class="h-4 w-4" />
    </Button>
  </div>
</template>
