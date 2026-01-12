/* eslint-disable @typescript-eslint/no-explicit-any */
import { onUnmounted } from 'vue'

export function useDebouncedFn<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
) {
  let timeoutId: any = null

  const debouncedFn = (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId)

    timeoutId = setTimeout(() => {
      fn(...args)
    }, delay)
  }

  const cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  onUnmounted(cancel)

  return { debouncedFn, cancel }
}
