import { onMounted, onBeforeUnmount, type Ref } from 'vue'

export function usePreventRefresh(shouldPrevent: Ref<boolean>) {
  const handleKeydown = (e: KeyboardEvent) => {
    if (!shouldPrevent.value) return

    const isR = e.key === 'r' || e.key === 'R'
    const isCmdOrCtrl = e.ctrlKey || e.metaKey
    const isF5 = e.key === 'F5'

    if ((isCmdOrCtrl && isR) || isF5) {
      e.preventDefault()
      window.location.reload()
    }
  }

  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (shouldPrevent.value) {
      e.preventDefault()
      e.returnValue = ''
      return ''
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeydown)
    window.addEventListener('beforeunload', handleBeforeUnload)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleKeydown)
    window.removeEventListener('beforeunload', handleBeforeUnload)
  })
}
