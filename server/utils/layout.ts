import { WidgetData } from "~~/types/dashboard"

interface ColumnLayout {
    x: number
    w: number
    items: any[]
}

interface UnfinishedColState {
    first: boolean
    i: number
    x: number
    w: number
    w_acc: number
    h: number
    h_minus: boolean
    items: any[]
}

export const buildColumnLayout = (widgets: any[]): ColumnLayout[] => {
    const resultCols: ColumnLayout[] = []

    const unfinishCols: UnfinishedColState = {
        first: true,
        i: 0,
        x: 0,
        w: 0,
        w_acc: 0,
        h: 0,
        h_minus: false,
        items: [],
    }

    let iResult = -1
    let tempH = 0
    let tempItems: any[] = []

    // Sort widgets by Y then X
    const sortedWidgets = [...widgets].sort((a, b) => {
        const ay = Number(a.y || 0)
        const by = Number(b.y || 0)
        if (ay !== by) return ay - by
        const ax = Number(a.x || 0)
        const bx = Number(b.x || 0)
        return ax - bx
    })

    for (const widget of sortedWidgets) {
        widget.loading = true

        const x = Number(widget.x || 0)
        const w = Number(widget.w || 1)
        const h = Number(widget.h || 1)

        if (w === 12) {
            resultCols.push({ x, w, items: [widget] })
            iResult += 1
        } else if (unfinishCols.first) {
            unfinishCols.first = false
            unfinishCols.i = iResult // Tracks index for potential future appending
            unfinishCols.x = x
            unfinishCols.w = w
            unfinishCols.w_acc = w
            unfinishCols.h = h
            unfinishCols.h_minus = false
            unfinishCols.items = [widget]
            tempH = 0
            tempItems = []
        } else if (unfinishCols.w_acc + w === 12 && unfinishCols.h < h) {
            tempH = h
            // Push previous unfinished columns
            resultCols.push({ x: unfinishCols.x, w: unfinishCols.w, items: unfinishCols.items })
            iResult += 1
            
            unfinishCols.i = iResult // Update index to point to the next item
            
            // Push current column
            resultCols.push({ x, w, items: [widget] })
            iResult += 1
            
            unfinishCols.h_minus = true
        } else if (unfinishCols.h_minus && tempH === unfinishCols.h + h && unfinishCols.x === x) {
            // Append to the specific column index stored in state
            if (resultCols[unfinishCols.i]) {
                resultCols[unfinishCols.i]!.items.push(widget)
            }
            unfinishCols.first = true
        } else if (unfinishCols.w_acc + w === 12 && unfinishCols.h > h) {
            if ((tempH + h) === unfinishCols.h) {
                // Height matches accumulated height
                tempItems.push(widget)
                resultCols.push({ x: unfinishCols.x, w: unfinishCols.w, items: unfinishCols.items })
                resultCols.push({ x, w, items: tempItems })
                iResult += 2
                unfinishCols.first = true
            } else {
                // Accumulate height in tempItems
                tempItems.push(widget)
                tempH += h
            }
            } 
            
            // 3. Total col is 12 and height is same
            else if (unfinishCols.w_acc + w === 12 && unfinishCols.h === h) {
            resultCols.push({ x: unfinishCols.x, w: unfinishCols.w, items: unfinishCols.items })
            resultCols.push({ x, w, items: [widget] })
            iResult += 2
            unfinishCols.first = true
        } else if (unfinishCols.h === h) {
            resultCols.push({ x: unfinishCols.x, w: unfinishCols.w, items: unfinishCols.items })
            iResult += 1
            
            unfinishCols.i = iResult
            unfinishCols.x = x
            unfinishCols.w = w
            unfinishCols.w_acc += w
            unfinishCols.h = h
            unfinishCols.items = [widget]
        }
    }

    return resultCols
}