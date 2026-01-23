import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth-utils'
import { getAdminDefaults, updateAdminDefaults } from '@/lib/widgets/defaults'
import { WIDGET_REGISTRY } from '@/lib/widgets/registry'
import type { DashboardLayout } from '@/types/dashboard'

/**
 * GET /api/admin/dashboard/layout
 * Returns the current default dashboard layout and available widgets
 * Admin only
 */
export async function GET() {
  const { session, error } = await requireAdmin()
  if (error) return error

  try {
    const defaults = await getAdminDefaults()

    const widgets = Object.values(WIDGET_REGISTRY).map((widget) => ({
      id: widget.id,
      title: widget.title,
      category: widget.category,
      defaultSize: widget.defaultSize,
    }))

    return NextResponse.json({
      dashboardLayout: defaults.dashboardLayout,
      widgets,
    })
  } catch (err) {
    console.error('[Admin Layout API] GET error:', err)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard layout' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/dashboard/layout
 * Updates the default dashboard layout
 * Admin only
 */
export async function PUT(request: NextRequest) {
  const { session, error } = await requireAdmin()
  if (error) return error

  try {
    const body = await request.json()
    const { dashboardLayout } = body as { dashboardLayout: DashboardLayout }

    // Validate that all widget IDs in layout exist in registry
    const invalidWidgets = dashboardLayout.widgets.filter(
      (widget) => !WIDGET_REGISTRY[widget.id]
    )

    if (invalidWidgets.length > 0) {
      return NextResponse.json(
        {
          error: 'Invalid widget IDs',
          invalidWidgets: invalidWidgets.map((w) => w.id),
        },
        { status: 400 }
      )
    }

    await updateAdminDefaults({ dashboardLayout })

    // Invalidate dashboard cache so all users see updated layout
    revalidatePath('/')

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[Admin Layout API] PUT error:', err)
    return NextResponse.json(
      { error: 'Failed to update dashboard layout' },
      { status: 500 }
    )
  }
}
