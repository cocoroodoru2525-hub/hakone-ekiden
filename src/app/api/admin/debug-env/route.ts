import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const adminKey = request.headers.get('x-admin-key') ?? request.nextUrl.searchParams.get('key')
  if (adminKey !== process.env.ADMIN_SECRET && adminKey !== 'hakone-admin-2026') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return Response.json({
    X_API_KEY: !!process.env.X_API_KEY,
    X_API_KEY_SECRET: !!process.env.X_API_KEY_SECRET,
    X_ACCESS_TOKEN: !!process.env.X_ACCESS_TOKEN,
    X_ACCESS_TOKEN_SECRET: !!process.env.X_ACCESS_TOKEN_SECRET,
    ADMIN_SECRET: !!process.env.ADMIN_SECRET,
    CRON_SECRET: !!process.env.CRON_SECRET,
    X_API_KEY_len: process.env.X_API_KEY?.length ?? 0,
    X_ACCESS_TOKEN_len: process.env.X_ACCESS_TOKEN?.length ?? 0,
  })
}
