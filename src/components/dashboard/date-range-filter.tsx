'use client';

import { useState } from 'react';
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import {
  DATE_PRESETS,
  formatDateRange,
  createDateFilter,
} from '@/lib/date-utils';
import type { DateFilter, DatePreset } from '@/types/dashboard';
import type { DateRange } from 'react-day-picker';

interface DateRangeFilterProps {
  value: DateFilter;
  onChange: (filter: DateFilter) => void;
  className?: string;
}

export function DateRangeFilter({ value, onChange, className }: DateRangeFilterProps) {
  const [open, setOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(value.preset === 'custom');

  // Handle preset selection
  const handlePresetSelect = (preset: DatePreset) => {
    if (preset === 'custom') {
      setShowCustom(true);
      return;
    }

    onChange(createDateFilter(preset));
    setOpen(false);
    setShowCustom(false);
  };

  // Handle custom date range selection
  const handleDateRangeSelect = (range: DateRange | undefined) => {
    if (!range) return;

    if (range.from && range.to) {
      onChange(createDateFilter('custom', range.from, range.to));
    } else if (range.from) {
      // Only start date selected - update filter but keep popover open
      onChange({
        startDate: range.from.toISOString(),
        endDate: null,
        preset: 'custom',
      });
    }
  };

  // Get current selected range for calendar
  const getSelectedRange = (): DateRange | undefined => {
    if (value.startDate && value.endDate) {
      return {
        from: new Date(value.startDate),
        to: new Date(value.endDate),
      };
    }
    if (value.startDate) {
      return { from: new Date(value.startDate), to: undefined };
    }
    return undefined;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'justify-start text-left font-normal min-w-[200px]',
            !value.startDate && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          <span className="flex-1 truncate">{formatDateRange(value)}</span>
          <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3">
          {/* Preset buttons */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            {DATE_PRESETS.filter(p => p.id !== 'custom').map((preset) => (
              <Button
                key={preset.id}
                variant={value.preset === preset.id ? 'default' : 'outline'}
                size="sm"
                className="justify-start text-xs"
                onClick={() => handlePresetSelect(preset.id)}
              >
                {preset.label}
              </Button>
            ))}
          </div>

          {/* Custom range trigger */}
          <Button
            variant={showCustom ? 'default' : 'outline'}
            size="sm"
            className="w-full justify-start text-xs mb-3"
            onClick={() => setShowCustom(!showCustom)}
          >
            Custom range
          </Button>

          {/* Calendar for custom range */}
          {showCustom && (
            <div className="border-t pt-3">
              <Calendar
                mode="range"
                selected={getSelectedRange()}
                onSelect={handleDateRangeSelect}
                numberOfMonths={2}
                defaultMonth={value.startDate ? new Date(value.startDate) : undefined}
              />
              {value.preset === 'custom' && value.startDate && value.endDate && (
                <div className="flex justify-end pt-2 border-t mt-2">
                  <Button
                    size="sm"
                    onClick={() => setOpen(false)}
                  >
                    Apply
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
