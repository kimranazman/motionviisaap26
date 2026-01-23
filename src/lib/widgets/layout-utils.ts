/**
 * Layout Utility Functions
 * Helpers for manipulating dashboard widget layouts
 */

import type { LayoutWidgetConfig } from '@/types/dashboard'
import type { Layout, LayoutItem } from 'react-grid-layout'

/**
 * Generate a unique instance ID for widget placement
 * Uses built-in crypto.randomUUID()
 */
export function generateLayoutId(): string {
  return crypto.randomUUID()
}

/**
 * Add a widget to the layout
 * Places new widget at the bottom of the layout (y = max existing y + h)
 */
export function addWidgetToLayout(
  layout: LayoutWidgetConfig[],
  widgetId: string,
  defaultSize: { w: number; h: number }
): LayoutWidgetConfig[] {
  // Generate unique instance ID
  const instanceId = generateLayoutId()

  // Calculate y position: max y of existing widgets + their height, or 0 if empty
  let maxYPlusH = 0
  for (const widget of layout) {
    const bottom = widget.y + widget.h
    if (bottom > maxYPlusH) {
      maxYPlusH = bottom
    }
  }

  const newWidget: LayoutWidgetConfig = {
    i: instanceId,
    id: widgetId,
    x: 0,
    y: maxYPlusH,
    w: defaultSize.w,
    h: defaultSize.h,
  }

  return [...layout, newWidget]
}

/**
 * Remove a widget from the layout by instance ID
 */
export function removeWidgetFromLayout(
  layout: LayoutWidgetConfig[],
  instanceId: string
): LayoutWidgetConfig[] {
  return layout.filter(widget => widget.i !== instanceId)
}

/**
 * Convert our layout format to react-grid-layout format
 * Extracts only the position/size fields needed by react-grid-layout
 * Returns Layout (readonly LayoutItem[])
 */
export function convertToGridLayout(layout: LayoutWidgetConfig[]): Layout {
  return layout.map(widget => ({
    i: widget.i,
    x: widget.x,
    y: widget.y,
    w: widget.w,
    h: widget.h,
  }))
}

/**
 * Convert react-grid-layout format back to our format
 * Merges position updates from react-grid-layout with original widget data
 * Layout is readonly LayoutItem[], so we iterate over LayoutItem
 */
export function convertFromGridLayout(
  gridLayout: Layout,
  originalLayout: LayoutWidgetConfig[]
): LayoutWidgetConfig[] {
  return gridLayout.map((item: LayoutItem) => {
    // Find original widget by instance ID to preserve widget type (id)
    const original = originalLayout.find(w => w.i === item.i)

    return {
      i: item.i,
      id: original?.id ?? '', // Preserve widget type ID
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h,
    }
  })
}
