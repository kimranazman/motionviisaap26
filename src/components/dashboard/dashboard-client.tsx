'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { toast } from 'sonner';
import { DashboardHeader } from './dashboard-header';
import { DashboardGrid } from './dashboard-grid';
import { WidgetBank } from './widget-bank';
import { useDashboardLayout } from '@/lib/hooks/use-dashboard-layout';
import { useDebounce } from '@/lib/hooks/use-debounce';
import { KPICards } from './kpi-cards';
import { StatusChart } from './status-chart';
import { DepartmentChart } from './department-chart';
import { TeamWorkload } from './team-workload';
import { RecentInitiatives } from './recent-initiatives';
import { CRMKPICards } from './crm-kpi-cards';
import { PipelineStageChart } from './pipeline-stage-chart';
import type { LayoutWidgetConfig, DateFilter } from '@/types/dashboard';
import { createDateFilter } from '@/lib/date-utils';

interface DashboardClientProps {
  initialLayout: LayoutWidgetConfig[];
  initialDateFilter: DateFilter | null;
  defaultLayout: LayoutWidgetConfig[];
  visibleWidgetIds: string[];
  dashboardData: {
    stats: {
      totalInitiatives: number;
      completedCount: number;
      completionRate: number;
      revenueProgress: number;
      revenueTarget: number;
      upcomingDeadlines: number;
      atRiskCount: number;
    };
    byStatus: Array<{ status: string; count: number }>;
    byDepartment: Array<{ department: string; count: number }>;
    byPerson: Array<{ person: string | null; count: number }>;
    recentInitiatives: Array<{
      id: string;
      title: string;
      status: string;
      department: string;
      startDate: string;
      endDate: string;
    }>;
  };
  crmData: {
    stageData: Array<{
      id: string;
      name: string;
      count: number;
      value: number;
      color: string;
    }>;
    openPipeline: number;
    weightedForecast: number;
    winRate: number;
    dealCount: number;
    totalRevenue: number;
    profit: number;
  } | null;
}

export function DashboardClient({
  initialLayout,
  initialDateFilter,
  defaultLayout,
  visibleWidgetIds,
  dashboardData,
  crmData,
}: DashboardClientProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [widgetBankOpen, setWidgetBankOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilter>(
    initialDateFilter || createDateFilter('last30days')
  );

  // Track if this is the first render (skip initial save)
  const isInitialRender = useRef(true);

  // Layout management with undo
  const {
    layout,
    updateLayout,
    addWidget,
    removeWidget,
    undo,
    canUndo,
    isDirty,
  } = useDashboardLayout(initialLayout);

  // Debounced layout for auto-save (1 second)
  const debouncedLayout = useDebounce(layout, 1000);

  // Auto-save layout effect
  useEffect(() => {
    // Skip saving on initial render
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    if (!isDirty) return;

    // Save layout
    fetch('/api/user/preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dashboardLayout: { widgets: debouncedLayout } }),
    }).then(() => {
      toast('Layout saved', {
        action: {
          label: 'Undo',
          onClick: undo,
        },
        duration: 5000,
      });
    });
  }, [debouncedLayout, isDirty, undo]);

  // Debounced date filter for auto-save (500ms)
  const debouncedDateFilter = useDebounce(dateFilter, 500);
  const initialDateFilterRef = useRef(JSON.stringify(initialDateFilter));

  // Auto-save date filter effect
  useEffect(() => {
    // Skip if date filter hasn't changed from initial
    if (JSON.stringify(debouncedDateFilter) === initialDateFilterRef.current) {
      return;
    }

    fetch('/api/user/preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dateFilter: debouncedDateFilter }),
    });
  }, [debouncedDateFilter]);

  // Reset handler
  const handleReset = useCallback(() => {
    updateLayout(defaultLayout);
    toast('Layout reset to default');
  }, [defaultLayout, updateLayout]);

  // Toggle edit mode
  const handleToggleEditMode = useCallback(() => {
    setIsEditMode((prev) => {
      if (!prev) {
        // Opening edit mode - also open widget bank
        setWidgetBankOpen(true);
      }
      return !prev;
    });
  }, []);

  // Widget renderer
  const renderWidget = useCallback(
    (widgetId: string, instanceId: string) => {
      switch (widgetId) {
        case 'kpi-cards':
          return <KPICards stats={dashboardData.stats} />;
        case 'status-chart':
          return <StatusChart data={dashboardData.byStatus} />;
        case 'department-chart':
          return <DepartmentChart data={dashboardData.byDepartment} />;
        case 'team-workload':
          return (
            <TeamWorkload
              data={dashboardData.byPerson}
              total={dashboardData.stats.totalInitiatives}
            />
          );
        case 'recent-initiatives':
          return <RecentInitiatives initiatives={dashboardData.recentInitiatives} />;
        case 'crm-kpi-cards':
          return crmData ? (
            <CRMKPICards
              openPipeline={crmData.openPipeline}
              weightedForecast={crmData.weightedForecast}
              winRate={crmData.winRate}
              dealCount={crmData.dealCount}
              totalRevenue={crmData.totalRevenue}
              profit={crmData.profit}
            />
          ) : null;
        case 'pipeline-stage-chart':
          return crmData ? <PipelineStageChart data={crmData.stageData} /> : null;
        default:
          return <div>Unknown widget: {widgetId}</div>;
      }
    },
    [dashboardData, crmData]
  );

  // Get current widget IDs for widget bank (for count display)
  const currentWidgetIds = useMemo(() => layout.map((w) => w.id), [layout]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 md:p-6">
        <DashboardHeader
          isEditMode={isEditMode}
          onToggleEditMode={handleToggleEditMode}
          canUndo={canUndo}
          onUndo={undo}
          onReset={handleReset}
          dateFilter={dateFilter}
          onDateFilterChange={setDateFilter}
        />

        <DashboardGrid
          layout={layout}
          onLayoutChange={updateLayout}
          onRemoveWidget={removeWidget}
          isEditMode={isEditMode}
          renderWidget={renderWidget}
        />

        <WidgetBank
          open={widgetBankOpen}
          onOpenChange={setWidgetBankOpen}
          currentWidgetIds={currentWidgetIds}
          visibleWidgetIds={visibleWidgetIds}
          onAddWidget={addWidget}
        />
      </div>
    </div>
  );
}
