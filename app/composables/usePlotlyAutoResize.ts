import { onBeforeUnmount } from 'vue'

export function usePlotlyAutoResize() {
  const observers = new Map<HTMLElement, ResizeObserver>()

  const resizePlotlyInside = (container: HTMLElement) => {
    if (!window.Plotly) return

    const plots = container.querySelectorAll('.js-plotly-plot')

    plots.forEach((plot: any) => {
      if (!plot) return
      if (!plot.isConnected) return
      if (plot.offsetParent === null) return // hidden
      if (plot.offsetWidth === 0) return
      if (plot.offsetHeight === 0) return

      try {
        window.Plotly.Plots.resize(plot)
      } catch (error) {
        console.warn('composable: usePlotlyAutoResize', error)
      }
    })
  }

  const registerPlotlyContainer = (el: HTMLElement | null) => {
    if (!el) return
    if (observers.has(el)) return

    const ro = new ResizeObserver(() => {
      resizePlotlyInside(el)
    })

    ro.observe(el)
    observers.set(el, ro)
  }

  const unregisterPlotlyContainer = (el: HTMLElement | null) => {
    if (!el) return
    const ro = observers.get(el)
    if (!ro) return

    ro.disconnect()
    observers.delete(el)
  }

  onBeforeUnmount(() => {
    observers.forEach((ro) => ro.disconnect())
    observers.clear()
  })

  return {
    registerPlotlyContainer,
    unregisterPlotlyContainer,
  }
}
