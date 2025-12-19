import { ref, readonly } from 'vue'

interface ConfirmOptions {
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  destructive?: boolean
}

interface DialogState {
  isOpen: boolean
  options: ConfirmOptions
  resolve: ((value: boolean) => void) | null
  isConfirming: boolean
}

interface NotificationState {
  isOpen: boolean
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
}

const dialogState = ref<DialogState>({
  isOpen: false,
  options: {
    title: '',
    description: '',
    confirmText: '确认',
    cancelText: '取消',
    destructive: false,
  },
  resolve: null,
  isConfirming: false,
})

const notificationState = ref<NotificationState>({
  isOpen: false,
  type: 'info',
  message: '',
})

export function useNotification() {
  const showNotification = (type: NotificationState['type'], message: string) => {
    notificationState.value = {
      isOpen: true,
      type,
      message,
    }
  }

  const closeNotification = () => {
    notificationState.value.isOpen = false
  }

  const success = (message: string) => {
    showNotification('success', message)
  }

  const error = (message: string) => {
    showNotification('error', message)
  }

  const info = (message: string) => {
    showNotification('info', message)
  }

  const warning = (message: string) => {
    showNotification('warning', message)
  }

  const extractErrorMessage = (err: unknown, fallback: string): string => {
    if (err instanceof Error) {
      return err.message
    }
    if (typeof err === 'string') {
      return err
    }
    return fallback
  }

  const confirm = (options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      if (dialogState.value.isOpen) {
        console.warn('确认对话框已打开，拒绝新的确认请求')
        resolve(false)
        return
      }

      dialogState.value = {
        isOpen: true,
        options: {
          title: options.title,
          description: options.description,
          confirmText: options.confirmText || '确认',
          cancelText: options.cancelText || '取消',
          destructive: options.destructive || false,
        },
        resolve,
        isConfirming: false,
      }
    })
  }

  const handleConfirm = () => {
    console.log('[useNotification] handleConfirm 被调用')
    const resolveFunc = dialogState.value.resolve

    // 立即清理状态和 resolve，防止重复调用
    dialogState.value.resolve = null
    dialogState.value.isOpen = false
    dialogState.value.isConfirming = false

    // 最后才调用 resolve，确保状态已经清理完毕
    if (resolveFunc) {
      console.log('[useNotification] 调用 resolve(true)')
      resolveFunc(true)
    }
  }

  const handleCancel = () => {
    console.log('[useNotification] handleCancel 被调用')
    const resolveFunc = dialogState.value.resolve

    // 检查 resolve 是否还存在，如果不存在说明已经被 handleConfirm 处理过了
    if (!resolveFunc) {
      console.log('[useNotification] resolve 已被清理，跳过取消逻辑')
      return
    }

    // 清理状态
    dialogState.value.resolve = null
    dialogState.value.isOpen = false
    dialogState.value.isConfirming = false

    // 调用 resolve(false)
    console.log('[useNotification] 调用 resolve(false)')
    resolveFunc(false)
  }

  return {
    success,
    error,
    info,
    warning,
    confirm,
    extractErrorMessage,
    // 内部状态，供 ConfirmDialog 和 NotificationDialog 组件使用
    dialogState: readonly(dialogState),
    notificationState: readonly(notificationState),
    handleConfirm,
    handleCancel,
    closeNotification,
  }
}
