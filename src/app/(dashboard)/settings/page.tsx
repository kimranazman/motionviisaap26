'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/header'
import { Card } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { useDetailViewMode } from '@/lib/hooks/use-detail-view-mode'
import type { DetailViewMode } from '@/lib/hooks/use-detail-view-mode'
import { useNavVisibility } from '@/lib/hooks/use-nav-visibility'
import { navGroups, topLevelItems, settingsItem, isAlwaysVisible, getDefaultNavOrder } from '@/lib/nav-config'
import type { NavItem } from '@/lib/nav-config'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { PanelRight, Layers, GripVertical, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

/** Sortable nav item row with drag handle */
function SortableNavItem({
  id,
  item,
  visible,
  alwaysOn,
  localHidden,
  onToggle,
  onToggleWithCascade,
}: {
  id: string
  item: NavItem
  visible: boolean
  alwaysOn: boolean
  localHidden: string[]
  onToggle: (href: string) => void
  onToggleWithCascade: (item: NavItem) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition: sortTransition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: sortTransition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
    position: 'relative' as const,
  }

  return (
    <div ref={setNodeRef} style={style}>
      {/* Parent item row */}
      <div className="flex items-center justify-between py-2 px-1">
        <div className="flex items-center gap-2">
          {/* Drag handle */}
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-0.5 text-gray-300 hover:text-gray-500 touch-none"
            aria-label={`Drag to reorder ${item.name}`}
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <item.icon className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-700">{item.name}</span>
          {alwaysOn && (
            <span className="text-xs text-gray-400">(always visible)</span>
          )}
        </div>
        <Switch
          checked={visible}
          onCheckedChange={() =>
            item.children
              ? onToggleWithCascade(item)
              : onToggle(item.href)
          }
          disabled={alwaysOn}
        />
      </div>
      {/* Nested children (move with parent, not individually sortable) */}
      {item.children && (
        <div className="ml-7 border-l-2 border-gray-100 pl-3 space-y-0.5">
          {item.children.map((child) => {
            const childVisible = !localHidden.includes(child.href) && visible
            return (
              <div
                key={child.href}
                className="flex items-center justify-between py-1.5 px-1"
              >
                <div className="flex items-center gap-3">
                  <child.icon className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-sm text-gray-600">{child.name}</span>
                </div>
                <Switch
                  checked={childVisible}
                  onCheckedChange={() => onToggle(child.href)}
                  disabled={!visible}
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function SettingsPage() {
  const { mode, setMode, isLoading } = useDetailViewMode()
  const { hiddenItems, navItemOrder, isLoading: navLoading, saveHiddenItems, saveNavOrder } = useNavVisibility()
  const [localHidden, setLocalHidden] = useState<string[]>([])
  const [localOrder, setLocalOrder] = useState<Record<string, string[]>>({})
  const [isSaving, setIsSaving] = useState(false)

  // DnD sensors with activation distance to prevent accidental drags
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // Sync local state when hook loads persisted state
  useEffect(() => {
    if (!navLoading) {
      setLocalHidden(hiddenItems)
      setLocalOrder(navItemOrder ?? getDefaultNavOrder())
    }
  }, [navLoading, hiddenItems, navItemOrder])

  // Dirty detection for visibility
  const isHiddenDirty = JSON.stringify([...localHidden].sort()) !==
                        JSON.stringify([...hiddenItems].sort())

  // Dirty detection for order
  const defaultOrder = getDefaultNavOrder()
  const isOrderDirty = JSON.stringify(localOrder) !==
                       JSON.stringify(navItemOrder ?? defaultOrder)

  const isDirty = isHiddenDirty || isOrderDirty

  // Local toggle (no persist)
  const handleToggle = (href: string) => {
    if (isAlwaysVisible(href)) return
    setLocalHidden((prev) =>
      prev.includes(href)
        ? prev.filter((h) => h !== href)
        : [...prev, href]
    )
  }

  // Toggle with cascade: hiding parent also hides all children
  const handleToggleWithCascade = (item: NavItem) => {
    if (isAlwaysVisible(item.href)) return
    setLocalHidden((prev) => {
      const isCurrentlyHidden = prev.includes(item.href)
      if (isCurrentlyHidden) {
        return prev.filter((h) => h !== item.href)
      } else {
        const childHrefs = item.children?.map((c) => c.href) ?? []
        const newHidden = [...prev, item.href]
        for (const childHref of childHrefs) {
          if (!newHidden.includes(childHref)) {
            newHidden.push(childHref)
          }
        }
        return newHidden
      }
    })
  }

  // Drag end handler - reorders items within a group
  const handleDragEnd = (groupKey: string) => (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setLocalOrder((prev) => {
      const items = prev[groupKey] || []
      const oldIndex = items.indexOf(active.id as string)
      const newIndex = items.indexOf(over.id as string)
      if (oldIndex === -1 || newIndex === -1) return prev
      return { ...prev, [groupKey]: arrayMove(items, oldIndex, newIndex) }
    })
  }

  // Reset order to default
  const handleResetOrder = () => {
    setLocalOrder(getDefaultNavOrder())
  }

  // Save handler - persists both visibility and order
  const handleSave = async () => {
    setIsSaving(true)
    try {
      await saveHiddenItems(localHidden)
      if (isOrderDirty) {
        await saveNavOrder(localOrder)
      }
      toast.success('Settings saved')
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  /** Build ordered items for a group from localOrder, appending any new items */
  const getOrderedGroupItems = (group: typeof navGroups[number]): NavItem[] => {
    const orderedHrefs = localOrder[group.key] || group.items.map((i) => i.href)
    const orderedItems = orderedHrefs
      .map((href) => group.items.find((i) => i.href === href))
      .filter(Boolean) as NavItem[]
    // Append any items not in orderedHrefs (new items from future deploys)
    for (const item of group.items) {
      if (!orderedHrefs.includes(item.href)) {
        orderedItems.push(item)
      }
    }
    return orderedItems
  }

  return (
    <>
      <Header title="Settings" description="Customise your workspace preferences" />
      <div className="p-4 md:p-6 max-w-2xl">
        <div className="space-y-6">
          {/* Detail View Mode */}
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Detail View Mode</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Choose how detail panels open when you click on items across the app.
                </p>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-32 rounded-lg bg-gray-100 animate-pulse" />
                  <div className="h-32 rounded-lg bg-gray-100 animate-pulse" />
                </div>
              ) : (
                <RadioGroup
                  value={mode}
                  onValueChange={(value) => setMode(value as DetailViewMode)}
                  className="grid grid-cols-2 gap-4"
                >
                  <label
                    htmlFor="mode-dialog"
                    className={cn(
                      'flex flex-col items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors',
                      mode === 'dialog'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <Layers className={cn(
                      'h-8 w-8',
                      mode === 'dialog' ? 'text-blue-600' : 'text-gray-400'
                    )} />
                    <div className="text-center">
                      <div className="font-medium text-sm">Dialog</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Opens as a centered popup overlay
                      </div>
                    </div>
                    <RadioGroupItem value="dialog" id="mode-dialog" className="sr-only" />
                  </label>

                  <label
                    htmlFor="mode-drawer"
                    className={cn(
                      'flex flex-col items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors',
                      mode === 'drawer'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <PanelRight className={cn(
                      'h-8 w-8',
                      mode === 'drawer' ? 'text-blue-600' : 'text-gray-400'
                    )} />
                    <div className="text-center">
                      <div className="font-medium text-sm">Drawer</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Slides in from the right side
                      </div>
                    </div>
                    <RadioGroupItem value="drawer" id="mode-drawer" className="sr-only" />
                  </label>
                </RadioGroup>
              )}
            </div>
          </Card>

          {/* Sidebar Navigation */}
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Sidebar Navigation</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Choose which items to show in the sidebar and drag to reorder. Dashboard and Settings are always visible.
                </p>
              </div>

              {navLoading ? (
                <div className="space-y-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-8 rounded bg-gray-100 animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Nav groups with DnD */}
                  {navGroups.map((group) => {
                    const orderedItems = getOrderedGroupItems(group)

                    return (
                      <div key={group.key}>
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                          {group.label}
                        </h4>
                        <DndContext
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={handleDragEnd(group.key)}
                        >
                          <SortableContext
                            items={orderedItems.map((i) => i.href)}
                            strategy={verticalListSortingStrategy}
                          >
                            <div className="space-y-1">
                              {orderedItems.map((item) => {
                                const alwaysOn = isAlwaysVisible(item.href)
                                const visible = alwaysOn || !localHidden.includes(item.href)
                                return (
                                  <SortableNavItem
                                    key={item.href}
                                    id={item.href}
                                    item={item}
                                    visible={visible}
                                    alwaysOn={alwaysOn}
                                    localHidden={localHidden}
                                    onToggle={handleToggle}
                                    onToggleWithCascade={handleToggleWithCascade}
                                  />
                                )
                              })}
                            </div>
                          </SortableContext>
                        </DndContext>
                      </div>
                    )
                  })}

                  {/* Top-level items (not reorderable, only 2 items) */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      General
                    </h4>
                    <div className="space-y-1">
                      {topLevelItems.map((item) => {
                        const alwaysOn = isAlwaysVisible(item.href)
                        const visible = alwaysOn || !localHidden.includes(item.href)
                        return (
                          <div
                            key={item.href}
                            className="flex items-center justify-between py-2 px-1"
                          >
                            <div className="flex items-center gap-3">
                              <item.icon className="h-4 w-4 text-gray-500" />
                              <span className="text-sm text-gray-700">{item.name}</span>
                              {alwaysOn && (
                                <span className="text-xs text-gray-400">(always visible)</span>
                              )}
                            </div>
                            <Switch
                              checked={visible}
                              onCheckedChange={() => handleToggle(item.href)}
                              disabled={alwaysOn}
                            />
                          </div>
                        )
                      })}

                      {/* Settings item */}
                      <div className="flex items-center justify-between py-2 px-1">
                        <div className="flex items-center gap-3">
                          <settingsItem.icon className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-700">{settingsItem.name}</span>
                          <span className="text-xs text-gray-400">(always visible)</span>
                        </div>
                        <Switch checked={true} disabled />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {isDirty && (
                <div className="pt-4 border-t border-gray-200 flex gap-2">
                  {isOrderDirty && (
                    <Button
                      variant="outline"
                      onClick={handleResetOrder}
                      className="flex items-center gap-2"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Reset Order
                    </Button>
                  )}
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}
