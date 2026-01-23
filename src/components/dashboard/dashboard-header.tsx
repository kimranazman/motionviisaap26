'use client';

import { Settings2, Undo2, RotateCcw, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { DateRangeFilter } from './date-range-filter';
import type { DateFilter } from '@/types/dashboard';

interface DashboardHeaderProps {
  isEditMode: boolean;
  onToggleEditMode: () => void;
  canUndo: boolean;
  onUndo: () => void;
  onReset: () => void;
  dateFilter: DateFilter;
  onDateFilterChange: (filter: DateFilter) => void;
  isSaving?: boolean;
}

export function DashboardHeader({
  isEditMode,
  onToggleEditMode,
  canUndo,
  onUndo,
  onReset,
  dateFilter,
  onDateFilterChange,
}: DashboardHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Strategic Annual Action Plan 2026</p>
      </div>

      <div className="flex items-center gap-2">
        {/* Date Filter */}
        <DateRangeFilter
          value={dateFilter}
          onChange={onDateFilterChange}
        />

        {/* Edit Mode Controls - only show when in edit mode */}
        {isEditMode && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={onUndo}
              disabled={!canUndo}
            >
              <Undo2 className="h-4 w-4 mr-1" />
              Undo
            </Button>

            {/* Reset with confirmation */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Reset
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset to Default Layout?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will replace your current dashboard with the default layout.
                    Your customizations will be lost.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onReset}>
                    Reset Layout
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}

        {/* Customize Button */}
        <Button
          variant={isEditMode ? 'default' : 'outline'}
          size="sm"
          onClick={onToggleEditMode}
        >
          {isEditMode ? (
            <>
              <Check className="h-4 w-4 mr-1" />
              Done
            </>
          ) : (
            <>
              <Settings2 className="h-4 w-4 mr-1" />
              Customize
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
