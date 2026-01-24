'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Building, Plus } from 'lucide-react'
import { DepartmentCard } from './department-card'
import { DepartmentForm } from './department-form'

interface Department {
  id: string
  name: string
  description: string | null
  _count: {
    contacts: number
    deals: number
    potentials: number
  }
}

interface DepartmentSectionProps {
  companyId: string
  departments: Department[]
  onDepartmentChange: () => void
}

export function DepartmentSection({
  companyId,
  departments,
  onDepartmentChange,
}: DepartmentSectionProps) {
  const [showAddForm, setShowAddForm] = useState(false)

  const handleDepartmentAdded = () => {
    setShowAddForm(false)
    onDepartmentChange()
  }

  const handleDepartmentUpdated = () => {
    onDepartmentChange()
  }

  const handleDepartmentDeleted = () => {
    onDepartmentChange()
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900">
          Departments
          {departments.length > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({departments.length})
            </span>
          )}
        </h3>
        {departments.length > 0 && !showAddForm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="mr-1 h-4 w-4" />
            Add Department
          </Button>
        )}
      </div>

      {/* Add Department Form */}
      {showAddForm && (
        <DepartmentForm
          companyId={companyId}
          onSuccess={handleDepartmentAdded}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* Department Cards or Empty State */}
      {departments.length === 0 && !showAddForm ? (
        <Card className="p-6 text-center">
          <Building className="mx-auto h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500 mb-3">No departments yet</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="mr-1 h-4 w-4" />
            Add your first department
          </Button>
        </Card>
      ) : (
        <div className="space-y-2">
          {departments.map((dept) => (
            <DepartmentCard
              key={dept.id}
              department={dept}
              companyId={companyId}
              onUpdate={handleDepartmentUpdated}
              onDelete={handleDepartmentDeleted}
            />
          ))}
        </div>
      )}
    </div>
  )
}
