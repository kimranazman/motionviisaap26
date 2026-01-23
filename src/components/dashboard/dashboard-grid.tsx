'use client';

import { useState, useEffect, useMemo } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout/legacy';
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
  onLayoutChange: (layout: LayoutWidgetConfig[]) => void;
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

  // Handle layout change from react-grid-layout
  const handleLayoutChange = (newGridLayout: Layout) => {
    // Only update if there are actual changes (prevent unnecessary re-renders)
    const updatedLayout = convertFromGridLayout(newGridLayout, layout);

    // Compare serialized layouts to detect real changes
    const currentStr = JSON.stringify(layout);
    const updatedStr = JSON.stringify(updatedLayout);

    if (currentStr !== updatedStr) {
      onLayoutChange(updatedLayout);
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
      layouts={{
        lg: gridLayout,
        md: gridLayout,
        sm: gridLayout,
        xs: gridLayout,
        xxs: gridLayout,
      }}
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
