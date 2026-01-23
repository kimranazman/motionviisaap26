import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import { streamFile, getContentType } from '@/lib/file-utils';
import fsPromises from 'fs/promises';
import path from 'path';

const UPLOADS_DIR = process.env.UPLOADS_DIR || '/app/uploads';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; filename: string }> }
) {
  // Require authentication
  const { error } = await requireAuth();
  if (error) return error;

  const { projectId, filename } = await params;

  // SECURITY: Validate path components to prevent directory traversal
  if (projectId.includes('..') || filename.includes('..') ||
      projectId.includes('/') || filename.includes('/')) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  const filePath = path.join(UPLOADS_DIR, 'projects', projectId, filename);

  try {
    // Check file exists and get stats
    const stats = await fsPromises.stat(filePath);

    // Stream the file
    const stream = streamFile(filePath);
    const contentType = getContentType(filename);

    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Disposition': `inline; filename="${filename}"`,
        'Content-Type': contentType,
        'Content-Length': stats.size.toString(),
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    console.error('[FILES API] Error serving file:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
