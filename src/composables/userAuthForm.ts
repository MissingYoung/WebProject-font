import { ref, type Ref } from 'vue'

/**
 * 一个类型安全的、用于处理认证表单提交逻辑的 Composable 函数。
 * @param apiCallFunction 一个接收表单数据并返回 Promise 的异步函数。
 * @returns 包含加载状态、错误信息和提交方法的对象。
 */
export function useAuthForm<T, U>(
  apiCallFunction: (formData: T) => Promise<U>
) {
  const isLoading: Ref<boolean> = ref(false)
  const error: Ref<string | null> = ref(null)

  const submit = async (formData: T): Promise<U | null> => {
    isLoading.value = true
    error.value = null
    try {
      const response = await apiCallFunction(formData)
      return response
    } catch (err: any) {
      console.error('提交出错：', err)
      error.value = err?.message || '发生未知错误'
      return null
    } finally {
      isLoading.value = false
    }
  }

  return {
    isLoading,
    error,
    submit,
  }
}