'use client';

import { useState, useCallback, useRef } from 'react';
import type { LayoutWidgetConfig } from '@/types/dashboard';
import { addWidgetToLayout, removeWidgetFromLayout } from '@/lib/widgets/layout-utils';
import { WIDGET_REGISTRY } from '@/lib/widgets/registry';

interface LayoutState {
  current: LayoutWidgetConfig[];
  responsiveLayouts: Record<string, LayoutWidgetConfig[]>;
  history: LayoutWidgetConfig[][];
  historyIndex: number;
}

interface UseDashboardLayoutReturn {
  layout: LayoutWidgetConfig[];
  responsiveLayouts: Record<string, LayoutWidgetConfig[]>;
  updateLayout: (newLayout: LayoutWidgetConfig[]) => void;
  updateResponsiveLayouts: (currentLayout: LayoutWidgetConfig[], allLayouts: Record<string, LayoutWidgetConfig[]>) => void;
  addWidget: (widgetId: string) => void;
  removeWidget: (instanceId: string) => void;
  undo: () => void;
  canUndo: boolean;
  isDirty: boolean;
}

const MAX_HISTORY = 20;

/**
 * Dashboard layout hook with undo history and per-breakpoint persistence
 * Manages widget positions and provides undo capability
 */
export function useDashboardLayout(
  initialLayout: LayoutWidgetConfig[],
  initialResponsiveLayouts?: Record<string, LayoutWidgetConfig[]>
): UseDashboardLayoutReturn {
  // Store initial layout for dirty comparison
  const initialRef = useRef(JSON.stringify(initialLayout));

  const [state, setState] = useState<LayoutState>({
    current: initialLayout,
    responsiveLayouts: initialResponsiveLayouts || {},
    history: [],
    historyIndex: -1,
  });

  /**
   * Update layout and add current state to history
   */
  const updateLayout = useCallback((newLayout: LayoutWidgetConfig[]) => {
    setState((prev) => {
      // Add current state to history before updating
      const newHistory = [...prev.history, prev.current];

      // Trim history to max entries
      if (newHistory.length > MAX_HISTORY) {
        newHistory.shift();
      }

      return {
        current: newLayout,
        responsiveLayouts: prev.responsiveLayouts,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  }, []);

  /**
   * Update both current layout and all responsive breakpoint layouts
   */
  const updateResponsiveLayouts = useCallback((
    currentLayout: LayoutWidgetConfig[],
    allLayouts: Record<string, LayoutWidgetConfig[]>
  ) => {
    setState((prev) => {
      // Add current state to history before updating
      const newHistory = [...prev.history, prev.current];
      if (newHistory.length > MAX_HISTORY) {
        newHistory.shift();
      }

      return {
        current: currentLayout,
        responsiveLayouts: allLayouts,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  }, []);

  /**
   * Add a widget to the layout using its default size from registry
   */
  const addWidget = useCallback((widgetId: string) => {
    const widgetDef = WIDGET_REGISTRY[widgetId];
    if (!widgetDef) {
      console.warn(`Widget ${widgetId} not found in registry`);
      return;
    }

    setState((prev) => {
      const newLayout = addWidgetToLayout(prev.current, widgetId, widgetDef.defaultSize);

      // Also add to all breakpoint layouts
      const newResponsiveLayouts = { ...prev.responsiveLayouts };
      for (const [bp, bpLayout] of Object.entries(newResponsiveLayouts)) {
        newResponsiveLayouts[bp] = addWidgetToLayout(bpLayout, widgetId, widgetDef.defaultSize);
      }

      // Add current state to history
      const newHistory = [...prev.history, prev.current];
      if (newHistory.length > MAX_HISTORY) {
        newHistory.shift();
      }

      return {
        current: newLayout,
        responsiveLayouts: newResponsiveLayouts,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  }, []);

  /**
   * Remove a widget from the layout by instance ID
   */
  const removeWidget = useCallback((instanceId: string) => {
    setState((prev) => {
      const newLayout = removeWidgetFromLayout(prev.current, instanceId);

      // Also remove from all breakpoint layouts
      const newResponsiveLayouts = { ...prev.responsiveLayouts };
      for (const [bp, bpLayout] of Object.entries(newResponsiveLayouts)) {
        newResponsiveLayouts[bp] = removeWidgetFromLayout(bpLayout, instanceId);
      }

      // Add current state to history
      const newHistory = [...prev.history, prev.current];
      if (newHistory.length > MAX_HISTORY) {
        newHistory.shift();
      }

      return {
        current: newLayout,
        responsiveLayouts: newResponsiveLayouts,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  }, []);

  /**
   * Undo last layout change
   */
  const undo = useCallback(() => {
    setState((prev) => {
      if (prev.history.length === 0) {
        return prev;
      }

      // Pop last history entry and set as current
      const newHistory = [...prev.history];
      const previousLayout = newHistory.pop()!;

      return {
        current: previousLayout,
        responsiveLayouts: prev.responsiveLayouts,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  }, []);

  const canUndo = state.history.length > 0;
  const isDirty = JSON.stringify(state.current) !== initialRef.current;

  return {
    layout: state.current,
    responsiveLayouts: state.responsiveLayouts,
    updateLayout,
    updateResponsiveLayouts,
    addWidget,
    removeWidget,
    undo,
    canUndo,
    isDirty,
  };
}
