'use client';

import { useMemo } from 'react';
import { Plus } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { WIDGET_REGISTRY, WidgetDefinition } from '@/lib/widgets/registry';

interface WidgetBankProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentWidgetIds: string[];  // Widget type IDs currently on dashboard
  visibleWidgetIds: string[];  // Widget IDs user is allowed to see (role-filtered)
  onAddWidget: (widgetId: string) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  kri: 'Key Result Initiatives',
  crm: 'Sales & CRM',
  financials: 'Financials',
  operations: 'Operations',
};

function WidgetBankItem({
  widget,
  count,
  onAdd
}: {
  widget: WidgetDefinition;
  count: number;
  onAdd: () => void;
}) {
  return (
    <Card
      className="cursor-pointer hover:bg-accent transition-colors"
      onClick={onAdd}
    >
      <CardContent className="p-3 flex items-center justify-between">
        <div>
          <div className="font-medium text-sm">{widget.title}</div>
          <div className="text-xs text-muted-foreground">
            {widget.description}
          </div>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xs text-muted-foreground">Size:</span>
            <span className="text-xs font-mono bg-muted px-1 rounded">
              {widget.defaultSize.w} x {widget.defaultSize.h}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {count > 0 && (
            <Badge variant="secondary" className="text-xs">
              {count} added
            </Badge>
          )}
          <Button size="icon" variant="ghost" className="h-8 w-8">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function WidgetBank({
  open,
  onOpenChange,
  currentWidgetIds,
  visibleWidgetIds,
  onAddWidget
}: WidgetBankProps) {
  // Group widgets by category, only including those the user can see
  const widgetsByCategory = useMemo(() => {
    const grouped: Record<string, WidgetDefinition[]> = {};

    Object.values(WIDGET_REGISTRY)
      .filter(widget => visibleWidgetIds.includes(widget.id))
      .forEach(widget => {
        if (!grouped[widget.category]) {
          grouped[widget.category] = [];
        }
        grouped[widget.category].push(widget);
      });

    return grouped;
  }, [visibleWidgetIds]);

  // Count instances per widget type
  const getWidgetCount = (widgetId: string) => {
    return currentWidgetIds.filter(id => id === widgetId).length;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Add Widgets</SheetTitle>
          <SheetDescription>
            Click to add widgets to your dashboard
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-1 mt-4 -mx-6 px-6">
          {Object.entries(widgetsByCategory).map(([category, widgets]) => (
            <div key={category} className="mb-6">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
                {CATEGORY_LABELS[category] || category}
              </h3>
              <div className="space-y-2">
                {widgets.map(widget => (
                  <WidgetBankItem
                    key={widget.id}
                    widget={widget}
                    count={getWidgetCount(widget.id)}
                    onAdd={() => onAddWidget(widget.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
