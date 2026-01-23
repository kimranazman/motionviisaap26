import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth-utils'
import { getAdminDefaults, updateAdminDefaults } from '@/lib/widgets/defaults'
import { WIDGET_REGISTRY } from '@/lib/widgets/registry'
import type { WidgetRoleRestrictions } from '@/types/dashboard'

/**
 * GET /api/admin/dashboard/roles
 * Returns the current widget role restrictions and available widgets with their default roles
 * Admin only
 */
export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const defaults = await getAdminDefaults()

    const widgets = Object.values(WIDGET_REGISTRY).map((widget) => ({
      id: widget.id,
      title: widget.title,
      category: widget.category,
      defaultMinRole: widget.minRole,
    }))

    return NextResponse.json({
      widgetRoles: defaults.widgetRoles,
      widgets,
    })
  } catch (err) {
    console.error('[Admin Roles API] GET error:', err)
    return NextResponse.json(
      { error: 'Failed to fetch widget role restrictions' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/dashboard/roles
 * Updates the widget role restrictions
 * Admin only
 */
export async function PUT(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const body = await request.json()
    const { widgetRoles } = body as { widgetRoles: WidgetRoleRestrictions }

    // Validate that all widget IDs in widgetRoles exist in registry
    const invalidWidgetIds = Object.keys(widgetRoles).filter(
      (widgetId) => !WIDGET_REGISTRY[widgetId]
    )

    if (invalidWidgetIds.length > 0) {
      return NextResponse.json(
        {
          error: 'Invalid widget IDs',
          invalidWidgetIds,
        },
        { status: 400 }
      )
    }

    await updateAdminDefaults({ widgetRoles })

    // Invalidate dashboard cache so all users see updated role restrictions
    revalidatePath('/')

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[Admin Roles API] PUT error:', err)
    return NextResponse.json(
      { error: 'Failed to update widget role restrictions' },
      { status: 500 }
    )
  }
}
