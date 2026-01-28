'use client';

import { useState, useEffect, useMemo } from 'react';
import { Responsive, WidthProvider, Layout, ResponsiveLayouts } from 'react-grid-layout/legacy';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

import { WIDGET_REGISTRY } from '@/lib/widgets/registry';
import { WidgetWrapper } from './widget-wrapper';
import { convertToGridLayout, convertFromGridLayout } from '@/lib/widgets/layout-utils';
import type { LayoutWidgetConfig } from '@/types/dashboard';
import { Skeleton } from '@/components/ui/skeleton';

// Wrap Responsive with WidthProvider to auto-detect container width
const ResponsiveGridLayout = WidthProvider(Responsive);

// Breakpoints for responsive grid
const BREAKPOINTS = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
const COLS = { lg: 12, md: 12, sm: 6, xs: 4, xxs: 2 };
const ROW_HEIGHT = 100;

interface DashboardGridProps {
  layout: LayoutWidgetConfig[];
  responsiveLayouts?: Record<string, LayoutWidgetConfig[]>;
  onLayoutChange: (layout: LayoutWidgetConfig[], allLayouts: Record<string, LayoutWidgetConfig[]>) => void;
  onRemoveWidget: (instanceId: string) => void;
  isEditMode: boolean;
  renderWidget: (widgetId: string, instanceId: string) => React.ReactNode;
}

/**
 * Loading skeleton for SSR/hydration
 */
function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-12 gap-4">
      {/* KPI row - full width */}
      <div className="col-span-12">
        <Skeleton className="h-[200px] w-full rounded-lg" />
      </div>
      {/* Two charts side by side */}
      <div className="col-span-12 md:col-span-6">
        <Skeleton className="h-[300px] w-full rounded-lg" />
      </div>
      <div className="col-span-12 md:col-span-6">
        <Skeleton className="h-[300px] w-full rounded-lg" />
      </div>
      {/* Two more charts */}
      <div className="col-span-12 md:col-span-6">
        <Skeleton className="h-[300px] w-full rounded-lg" />
      </div>
      <div className="col-span-12 md:col-span-6">
        <Skeleton className="h-[300px] w-full rounded-lg" />
      </div>
    </div>
  );
}

/**
 * Dashboard grid component with drag-drop and resize
 * Uses react-grid-layout with responsive breakpoints
 */
export function DashboardGrid({
  layout,
  responsiveLayouts,
  onLayoutChange,
  onRemoveWidget,
  isEditMode,
  renderWidget,
}: DashboardGridProps) {
  // SSR guard - only render grid after mounting on client
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Track current breakpoint for mobile detection
  const [currentBreakpoint, setCurrentBreakpoint] = useState<string>('lg');
  const isMobile = ['xs', 'xxs'].includes(currentBreakpoint);

  // Convert our layout format to react-grid-layout format
  const gridLayout = useMemo(() => convertToGridLayout(layout), [layout]);

  // Build per-breakpoint grid layouts for ResponsiveGridLayout
  const gridLayouts = useMemo(() => {
    if (responsiveLayouts && Object.keys(responsiveLayouts).length > 0) {
      // Use stored per-breakpoint layouts
      const result: Record<string, Layout> = {};
      for (const [bp, bpLayout] of Object.entries(responsiveLayouts)) {
        result[bp] = convertToGridLayout(bpLayout);
      }
      // Fill missing breakpoints with the default layout
      for (const bp of Object.keys(BREAKPOINTS)) {
        if (!result[bp]) {
          result[bp] = gridLayout;
        }
      }
      return result;
    }
    // Fallback: same layout for all breakpoints
    return {
      lg: gridLayout,
      md: gridLayout,
      sm: gridLayout,
      xs: gridLayout,
      xxs: gridLayout,
    };
  }, [responsiveLayouts, gridLayout]);

  // Handle layout change from react-grid-layout (two-argument form for responsive)
  const handleLayoutChange = (_currentLayout: Layout, allLayouts: ResponsiveLayouts) => {
    // Convert all breakpoint layouts from grid format to our format
    const convertedAll: Record<string, LayoutWidgetConfig[]> = {};
    for (const [bp, bpGridLayout] of Object.entries(allLayouts)) {
      convertedAll[bp] = convertFromGridLayout(bpGridLayout as Layout, layout);
    }

    // Use the current breakpoint's layout as the "current" layout
    const currentConverted = convertedAll[currentBreakpoint] || convertFromGridLayout(_currentLayout, layout);

    // Compare to detect real changes
    const currentStr = JSON.stringify(layout);
    const updatedStr = JSON.stringify(currentConverted);

    if (currentStr !== updatedStr) {
      onLayoutChange(currentConverted, convertedAll);
    }
  };

  // Show skeleton during SSR/initial hydration
  if (!mounted) {
    return <DashboardSkeleton />;
  }

  // Empty state
  if (layout.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] border-2 border-dashed border-muted-foreground/25 rounded-lg">
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium">No widgets</p>
          <p className="text-sm">
            {isEditMode
              ? 'Click "Add Widget" to customize your dashboard'
              : 'Enable edit mode to add widgets'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveGridLayout
      layouts={gridLayouts}
      breakpoints={BREAKPOINTS}
      cols={COLS}
      rowHeight={ROW_HEIGHT}
      onLayoutChange={handleLayoutChange}
      onBreakpointChange={(bp: string) => setCurrentBreakpoint(bp)}
      isDraggable={isEditMode && !isMobile}
      isResizable={isEditMode && !isMobile}
      compactType="vertical"
      preventCollision={false}
      margin={[16, 16]}
      containerPadding={[0, 0]}
      draggableHandle=".react-grid-layout-drag-handle"
    >
      {layout.map((widget) => {
        const def = WIDGET_REGISTRY[widget.id];
        return (
          <div key={widget.i}>
            <WidgetWrapper
              title={def?.title || widget.id}
              instanceId={widget.i}
              isEditMode={isEditMode}
              onRemove={onRemoveWidget}
            >
              {renderWidget(widget.id, widget.i)}
            </WidgetWrapper>
          </div>
        );
      })}
    </ResponsiveGridLayout>
  );
}
