<script setup lang="ts">
import { computed } from 'vue'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import {
  CircleCheckIcon,
  InfoIcon,
  OctagonXIcon,
  TriangleAlertIcon,
} from 'lucide-vue-next'

interface NotificationState {
  isOpen: boolean
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
}

const props = defineProps<{
  state: NotificationState
}>()

const emit = defineEmits<{
  close: []
}>()

const modelValue = computed({
  get: () => props.state.isOpen,
  set: (value: boolean) => {
    if (!value) {
      emit('close')
    }
  },
})

const icon = computed(() => {
  switch (props.state.type) {
    case 'success':
      return CircleCheckIcon
    case 'error':
      return OctagonXIcon
    case 'info':
      return InfoIcon
    case 'warning':
      return TriangleAlertIcon
  }
})

const iconColor = computed(() => {
  switch (props.state.type) {
    case 'success':
      return 'text-green-600'
    case 'error':
      return 'text-red-600'
    case 'info':
      return 'text-blue-600'
    case 'warning':
      return 'text-yellow-600'
  }
})

const title = computed(() => {
  switch (props.state.type) {
    case 'success':
      return '成功'
    case 'error':
      return '错误'
    case 'info':
      return '提示'
    case 'warning':
      return '警告'
  }
})
</script>

<template>
  <AlertDialog v-model:open="modelValue">
    <AlertDialogContent>
      <div class="flex items-start gap-4">
        <component :is="icon" :class="['h-6 w-6 mt-0.5', iconColor]" />
        <div class="flex-1">
          <AlertDialogTitle>{{ title }}</AlertDialogTitle>
          <AlertDialogDescription class="mt-2">
            {{ state.message }}
          </AlertDialogDescription>
        </div>
      </div>
      <div class="flex justify-end mt-4">
        <AlertDialogAction @click="emit('close')">确定</AlertDialogAction>
      </div>
    </AlertDialogContent>
  </AlertDialog>
</template>
