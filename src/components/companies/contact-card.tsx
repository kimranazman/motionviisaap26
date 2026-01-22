'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
} from '@/components/ui/alert-dialog'
import { Star, Trash2, Mail, Phone, Briefcase, Loader2 } from 'lucide-react'
import { CompanyInlineField } from './company-inline-field'
import { cn } from '@/lib/utils'

interface Contact {
  id: string
  name: string
  email: string | null
  phone: string | null
  role: string | null
  isPrimary: boolean
}

interface ContactCardProps {
  contact: Contact
  companyId: string
  onUpdate: () => void
  onDelete: () => void
}

export function ContactCard({
  contact,
  companyId,
  onUpdate,
  onDelete,
}: ContactCardProps) {
  const [isSettingPrimary, setIsSettingPrimary] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleFieldSave = async (field: string, value: string) => {
    const response = await fetch(
      `/api/companies/${companyId}/contacts/${contact.id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      }
    )

    if (!response.ok) {
      throw new Error('Failed to update contact')
    }

    onUpdate()
  }

  const handleSetPrimary = async () => {
    if (contact.isPrimary) return

    setIsSettingPrimary(true)
    try {
      const response = await fetch(
        `/api/companies/${companyId}/contacts/${contact.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isPrimary: true }),
        }
      )

      if (response.ok) {
        onUpdate()
      }
    } catch (error) {
      console.error('Failed to set primary:', error)
    } finally {
      setIsSettingPrimary(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(
        `/api/companies/${companyId}/contacts/${contact.id}`,
        {
          method: 'DELETE',
        }
      )

      if (response.ok) {
        onDelete()
      }
    } catch (error) {
      console.error('Failed to delete contact:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card
      className={cn(
        'p-4 relative',
        contact.isPrimary && 'border-primary/50 bg-primary/5'
      )}
    >
      {/* Primary Star Button */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          'absolute top-2 right-10 h-8 w-8',
          contact.isPrimary
            ? 'text-yellow-500 hover:text-yellow-600'
            : 'text-gray-300 hover:text-yellow-500'
        )}
        onClick={handleSetPrimary}
        disabled={isSettingPrimary || contact.isPrimary}
        title={contact.isPrimary ? 'Primary contact' : 'Set as primary'}
      >
        {isSettingPrimary ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Star
            className={cn('h-4 w-4', contact.isPrimary && 'fill-current')}
          />
        )}
      </Button>

      {/* Delete Button */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{contact.name}&quot;? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Contact Info */}
      <div className="space-y-3 pr-16">
        {/* Name with Primary Badge */}
        <div className="flex items-center gap-2">
          <CompanyInlineField
            value={contact.name}
            onSave={(value) => handleFieldSave('name', value)}
            placeholder="Contact name"
            className="font-medium text-base"
          />
          {contact.isPrimary && (
            <Badge variant="secondary" className="text-xs">
              Primary
            </Badge>
          )}
        </div>

        {/* Role */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Briefcase className="h-4 w-4 shrink-0" />
          <CompanyInlineField
            value={contact.role || ''}
            onSave={(value) => handleFieldSave('role', value)}
            placeholder="Role"
            className="text-sm"
          />
        </div>

        {/* Email */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Mail className="h-4 w-4 shrink-0" />
          <CompanyInlineField
            value={contact.email || ''}
            onSave={(value) => handleFieldSave('email', value)}
            placeholder="Email"
            className="text-sm"
          />
        </div>

        {/* Phone */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Phone className="h-4 w-4 shrink-0" />
          <CompanyInlineField
            value={contact.phone || ''}
            onSave={(value) => handleFieldSave('phone', value)}
            placeholder="Phone"
            className="text-sm"
          />
        </div>
      </div>
    </Card>
  )
}
