import { NextRequest } from 'next/server'
import { postToX } from '@/lib/x-poster'

export async function POST(request: NextRequest) {
  const adminKey = request.headers.get('x-admin-key')
  if (adminKey !== process.env.ADMIN_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { text } = (await request.json()) as { text?: string }

    if (!text || text.trim().length === 0) {
      return Response.json({ error: 'text is required' }, { status: 400 })
    }

    const result = await postToX(text)

    if (!result.success) {
      return Response.json(
        { error: result.error ?? 'Failed to post to X' },
        { status: 502 }
      )
    }

    return Response.json({
      success: true,
      tweetId: result.tweetId,
    })
  } catch (e: any) {
    console.error('[post-x route error]', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}
