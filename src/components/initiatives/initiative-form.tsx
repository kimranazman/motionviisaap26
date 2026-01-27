'use client'

import { useState, useEffect } from 'react'
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
  keyResultId: string | null
  department: string
  title: string
  startDate: string
  endDate: string
  budget: string | null
  resources: string | null
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
  const [keyResults, setKeyResults] = useState<Array<{ id: string; krId: string; description: string }>>([])
  const [formData, setFormData] = useState<Initiative>({
    objective: initiative?.objective || 'OBJ1_SCALE_EVENTS',
    keyResultId: initiative?.keyResultId || '',
    department: initiative?.department || 'BIZ_DEV',
    title: initiative?.title || '',
    startDate: initiative?.startDate || new Date().toISOString(),
    endDate: initiative?.endDate || new Date().toISOString(),
    budget: initiative?.budget || '',
    resources: initiative?.resources || '',
    personInCharge: initiative?.personInCharge || null,
    accountable: initiative?.accountable || null,
    status: initiative?.status || 'NOT_STARTED',
    remarks: initiative?.remarks || '',
  })

  // Fetch KR options on mount
  useEffect(() => {
    fetch('/api/key-results')
      .then(res => res.json())
      .then(data => setKeyResults(data))
      .catch(console.error)
  }, [])

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
        body: JSON.stringify({
          objective: formData.objective,
          keyResultId: formData.keyResultId || null,
          department: formData.department,
          title: formData.title,
          startDate: formData.startDate,
          endDate: formData.endDate,
          budget: formData.budget || null,
          resources: formData.resources || null,
          personInCharge: formData.personInCharge || null,
          accountable: formData.accountable || null,
          status: formData.status,
          remarks: formData.remarks || null,
        }),
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
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
          <Select
            value={formData.keyResultId || ''}
            onValueChange={(value) =>
              setFormData({ ...formData, keyResultId: value || null })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Key Result" />
            </SelectTrigger>
            <SelectContent>
              {keyResults.map((kr) => (
                <SelectItem key={kr.id} value={kr.id}>
                  {kr.krId} - {kr.description}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Row 2: Department & Status */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Start Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal h-11 md:h-10',
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
                  'w-full justify-start text-left font-normal h-11 md:h-10',
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
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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

      {/* Row 6: Budget & Resources */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Budget</label>
          <Input
            value={formData.budget || ''}
            onChange={(e) =>
              setFormData({ ...formData, budget: e.target.value })
            }
            placeholder="e.g., 1400"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Resources</label>
          <Input
            value={formData.resources || ''}
            onChange={(e) =>
              setFormData({ ...formData, resources: e.target.value })
            }
            placeholder="e.g., Design team, Canva Pro"
          />
        </div>
      </div>

      {/* Row 7: Remarks */}
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
