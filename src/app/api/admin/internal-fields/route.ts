import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAdmin } from '@/lib/auth-utils'
import { getAdminDefaults, updateAdminDefaults } from '@/lib/widgets/defaults'
import { INTERNAL_FIELD_KEYS, type InternalFieldConfig, type InternalFieldKey } from '@/types/internal-fields'

/**
 * GET /api/admin/internal-fields
 * Returns the current internal project field config
 * Any authenticated user can read (needed for field hiding in project views)
 */
export async function GET() {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const defaults = await getAdminDefaults()
    return NextResponse.json({
      internalFieldConfig: defaults.internalFieldConfig,
      fields: INTERNAL_FIELD_KEYS,
    })
  } catch (err) {
    console.error('[Admin Internal Fields API] GET error:', err)
    return NextResponse.json(
      { error: 'Failed to fetch internal field config' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/internal-fields
 * Updates internal project field visibility config
 * Admin only
 */
export async function PUT(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const body = await request.json()
    const { internalFieldConfig } = body as { internalFieldConfig: InternalFieldConfig }

    // Validate hiddenFields are valid keys
    const validKeys = INTERNAL_FIELD_KEYS.map(f => f.key)
    const invalidKeys = internalFieldConfig.hiddenFields.filter(
      (key) => !validKeys.includes(key as InternalFieldKey)
    )
    if (invalidKeys.length > 0) {
      return NextResponse.json(
        { error: 'Invalid field keys', invalidKeys },
        { status: 400 }
      )
    }

    await updateAdminDefaults({ internalFieldConfig })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[Admin Internal Fields API] PUT error:', err)
    return NextResponse.json(
      { error: 'Failed to update internal field config' },
      { status: 500 }
    )
  }
}
