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
import { navGroups, topLevelItems, settingsItem, isAlwaysVisible } from '@/lib/nav-config'
import type { NavItem } from '@/lib/nav-config'
import { PanelRight, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function SettingsPage() {
  const { mode, setMode, isLoading } = useDetailViewMode()
  const { hiddenItems, isLoading: navLoading, saveHiddenItems } = useNavVisibility()
  const [localHidden, setLocalHidden] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)

  // Sync local state when hook loads persisted state
  useEffect(() => {
    if (!navLoading) {
      setLocalHidden(hiddenItems)
    }
  }, [navLoading, hiddenItems])

  // Dirty detection: compare sorted arrays
  const isDirty = JSON.stringify([...localHidden].sort()) !==
                  JSON.stringify([...hiddenItems].sort())

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
        // Unhiding parent: just remove parent from hidden list
        // Children remain in whatever state they were
        return prev.filter((h) => h !== item.href)
      } else {
        // Hiding parent: also hide all children
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

  // Save handler
  const handleSave = async () => {
    setIsSaving(true)
    try {
      await saveHiddenItems(localHidden)
      toast.success('Settings saved')
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
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
                  Choose which items to show in the sidebar. Dashboard and Settings are always visible.
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
                  {/* Nav groups */}
                  {navGroups.map((group) => (
                    <div key={group.key}>
                      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        {group.label}
                      </h4>
                      <div className="space-y-1">
                        {group.items.map((item) => {
                          const alwaysOn = isAlwaysVisible(item.href)
                          const visible = alwaysOn || !localHidden.includes(item.href)
                          return (
                            <div key={item.href}>
                              {/* Parent item row */}
                              <div className="flex items-center justify-between py-2 px-1">
                                <div className="flex items-center gap-3">
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
                                      ? handleToggleWithCascade(item)
                                      : handleToggle(item.href)
                                  }
                                  disabled={alwaysOn}
                                />
                              </div>
                              {/* Nested children */}
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
                                          onCheckedChange={() => handleToggle(child.href)}
                                          disabled={!visible}
                                        />
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}

                  {/* Top-level items */}
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
                <div className="pt-4 border-t border-gray-200">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full"
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
