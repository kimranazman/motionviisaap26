import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, requireEditor } from '@/lib/auth-utils'
import { isValidHexColor, DEFAULT_TAG_COLOR } from '@/lib/tag-utils'

// GET /api/tags - List all tags (global)
export async function GET() {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const tags = await prisma.tag.findMany({
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(tags)
  } catch (error) {
    console.error('Error fetching tags:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tags' },
      { status: 500 }
    )
  }
}

// POST /api/tags - Create tag
export async function POST(request: NextRequest) {
  const { error } = await requireEditor()
  if (error) return error

  try {
    const body = await request.json()

    // Validate required name
    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    const name = body.name.trim()

    // Check for duplicate name (MySQL varchar is case-insensitive by default)
    const existing = await prisma.tag.findUnique({
      where: { name },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Tag already exists' },
        { status: 409 }
      )
    }

    // Validate color if provided
    const color = body.color || DEFAULT_TAG_COLOR
    if (!isValidHexColor(color)) {
      return NextResponse.json(
        { error: 'Invalid color format. Use #RRGGBB format.' },
        { status: 400 }
      )
    }

    const tag = await prisma.tag.create({
      data: {
        name,
        color,
      },
    })

    return NextResponse.json(tag, { status: 201 })
  } catch (error) {
    console.error('Error creating tag:', error)
    return NextResponse.json(
      { error: 'Failed to create tag' },
      { status: 500 }
    )
  }
}
