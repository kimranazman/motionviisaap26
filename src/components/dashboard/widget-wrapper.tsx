'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface WidgetWrapperProps {
  title: string;
  instanceId: string;
  isEditMode: boolean;
  onRemove?: (instanceId: string) => void;
  children: React.ReactNode;
  className?: string;
}

/**
 * Common wrapper for all dashboard widgets
 * Provides drag handle (header) and remove button in edit mode
 */
export function WidgetWrapper({
  title,
  instanceId,
  isEditMode,
  onRemove,
  children,
  className,
}: WidgetWrapperProps) {
  return (
    <Card className={cn('h-full flex flex-col relative', className)}>
      <CardHeader
        className={cn(
          'pb-2 react-grid-layout-drag-handle',
          isEditMode && 'cursor-move'
        )}
      >
        <CardTitle className="text-lg font-medium">{title}</CardTitle>

        {/* Remove button - only visible in edit mode */}
        {isEditMode && onRemove && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(instanceId);
            }}
            aria-label={`Remove ${title} widget`}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">{children}</CardContent>
    </Card>
  );
}
