import { onMounted, onBeforeUnmount } from 'vue'

export function useResizableTh(selector = '.resizable-th') {
  let cleanups: Array<() => void> = []

  onMounted(() => {
    const ths = document.querySelectorAll<HTMLElement>(selector)

    ths.forEach((th) => {
      const handle = th.querySelector<HTMLElement>('.resize-handle')
      if (!handle) return

      let startX = 0
      let startWidth = 0

      const onMouseMove = (e: MouseEvent) => {
        const newWidth = startWidth + (e.pageX - startX)
        if (newWidth > 40) {
          th.style.width = `${newWidth}px`
        }
      }

      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
      }

      const onMouseDown = (e: MouseEvent) => {
        startX = e.pageX
        startWidth = th.offsetWidth

        document.addEventListener('mousemove', onMouseMove)
        document.addEventListener('mouseup', onMouseUp)
      }

      handle.addEventListener('mousedown', onMouseDown)

      // cleanup per TH
      cleanups.push(() => {
        handle.removeEventListener('mousedown', onMouseDown)
      })
    })
  })

  onBeforeUnmount(() => {
    cleanups.forEach((fn) => fn())
    cleanups = []
  })
}
