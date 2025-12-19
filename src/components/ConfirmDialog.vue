<script setup lang="ts">
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { useNotification } from '@/composables/useNotification'

const { dialogState, handleConfirm, handleCancel } = useNotification()
</script>

<template>
  <AlertDialog :open="dialogState.isOpen">
    <AlertDialogContent
      @escape-key-down="handleCancel"
      @pointer-down-outside="handleCancel"
      @interact-outside="handleCancel"
    >
      <AlertDialogHeader>
        <AlertDialogTitle>{{ dialogState.options.title }}</AlertDialogTitle>
        <AlertDialogDescription>
          {{ dialogState.options.description }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end mt-4">
        <Button variant="outline" @click="handleCancel">
          {{ dialogState.options.cancelText }}
        </Button>
        <Button
          :class="dialogState.options.destructive ? 'bg-red-600 hover:bg-red-700' : ''"
          @click="handleConfirm"
        >
          {{ dialogState.options.confirmText }}
        </Button>
      </div>
    </AlertDialogContent>
  </AlertDialog>
</template>
