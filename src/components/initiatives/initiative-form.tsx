'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { format } from 'date-fns'
import { CalendarIcon, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  STATUS_OPTIONS,
  DEPARTMENT_OPTIONS,
  OBJECTIVE_OPTIONS,
  TEAM_MEMBER_OPTIONS,
} from '@/lib/utils'

interface Initiative {
  id?: string
  objective: string
  keyResult: string
  department: string
  title: string
  monthlyObjective?: string | null
  weeklyTasks?: string | null
  startDate: string
  endDate: string
  resourcesFinancial?: number | null
  resourcesNonFinancial?: string | null
  personInCharge?: string | null
  accountable?: string | null
  status: string
  remarks?: string | null
}

interface InitiativeFormProps {
  initiative?: Initiative
  onSuccess: () => void
}

export function InitiativeForm({ initiative, onSuccess }: InitiativeFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<Initiative>({
    objective: initiative?.objective || 'OBJ1_SCALE_EVENTS',
    keyResult: initiative?.keyResult || '',
    department: initiative?.department || 'BIZ_DEV',
    title: initiative?.title || '',
    monthlyObjective: initiative?.monthlyObjective || '',
    weeklyTasks: initiative?.weeklyTasks || '',
    startDate: initiative?.startDate || new Date().toISOString(),
    endDate: initiative?.endDate || new Date().toISOString(),
    resourcesFinancial: initiative?.resourcesFinancial || null,
    resourcesNonFinancial: initiative?.resourcesNonFinancial || '',
    personInCharge: initiative?.personInCharge || null,
    accountable: initiative?.accountable || null,
    status: initiative?.status || 'NOT_STARTED',
    remarks: initiative?.remarks || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const url = initiative?.id
        ? `/api/initiatives/${initiative.id}`
        : '/api/initiatives'
      const method = initiative?.id ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to save initiative')
      }

      onSuccess()
    } catch (error) {
      console.error('Error saving initiative:', error)
      alert('Failed to save initiative')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Row 1: Objective & Key Result */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Objective</label>
          <Select
            value={formData.objective}
            onValueChange={(value) =>
              setFormData({ ...formData, objective: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OBJECTIVE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Key Result</label>
          <Input
            value={formData.keyResult}
            onChange={(e) =>
              setFormData({ ...formData, keyResult: e.target.value })
            }
            placeholder="e.g., KR1.1"
            required
          />
        </div>
      </div>

      {/* Row 2: Department & Status */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Department</label>
          <Select
            value={formData.department}
            onValueChange={(value) =>
              setFormData({ ...formData, department: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DEPARTMENT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Status</label>
          <Select
            value={formData.status}
            onValueChange={(value) =>
              setFormData({ ...formData, status: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Row 3: Title */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Initiative Title
        </label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Enter initiative title"
          required
        />
      </div>

      {/* Row 4: Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Start Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !formData.startDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.startDate
                  ? format(new Date(formData.startDate), 'PPP')
                  : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={new Date(formData.startDate)}
                onSelect={(date) =>
                  date &&
                  setFormData({ ...formData, startDate: date.toISOString() })
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">End Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !formData.endDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.endDate
                  ? format(new Date(formData.endDate), 'PPP')
                  : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={new Date(formData.endDate)}
                onSelect={(date) =>
                  date &&
                  setFormData({ ...formData, endDate: date.toISOString() })
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Row 5: Person In Charge & Accountable */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Person In Charge
          </label>
          <Select
            value={formData.personInCharge || ''}
            onValueChange={(value) =>
              setFormData({ ...formData, personInCharge: value || null })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select person" />
            </SelectTrigger>
            <SelectContent>
              {TEAM_MEMBER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Accountable</label>
          <Select
            value={formData.accountable || ''}
            onValueChange={(value) =>
              setFormData({ ...formData, accountable: value || null })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select person" />
            </SelectTrigger>
            <SelectContent>
              {TEAM_MEMBER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Row 6: Monthly Objective */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Monthly Objective
        </label>
        <Textarea
          value={formData.monthlyObjective || ''}
          onChange={(e) =>
            setFormData({ ...formData, monthlyObjective: e.target.value })
          }
          placeholder="Enter monthly objective"
          rows={2}
        />
      </div>

      {/* Row 7: Weekly Tasks */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Weekly Tasks</label>
        <Textarea
          value={formData.weeklyTasks || ''}
          onChange={(e) =>
            setFormData({ ...formData, weeklyTasks: e.target.value })
          }
          placeholder="Enter weekly tasks"
          rows={2}
        />
      </div>

      {/* Row 8: Resources */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Resources (Financial)
          </label>
          <Input
            type="number"
            value={formData.resourcesFinancial || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                resourcesFinancial: e.target.value
                  ? Number(e.target.value)
                  : null,
              })
            }
            placeholder="Amount in RM"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Resources (Non-Financial)
          </label>
          <Input
            value={formData.resourcesNonFinancial || ''}
            onChange={(e) =>
              setFormData({ ...formData, resourcesNonFinancial: e.target.value })
            }
            placeholder="e.g., Tools, software"
          />
        </div>
      </div>

      {/* Row 9: Remarks */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Remarks</label>
        <Textarea
          value={formData.remarks || ''}
          onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
          placeholder="Additional notes"
          rows={2}
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initiative?.id ? 'Update Initiative' : 'Create Initiative'}
        </Button>
      </div>
    </form>
  )
}
