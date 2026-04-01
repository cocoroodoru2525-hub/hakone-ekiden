import { TwitterApi } from 'twitter-api-v2'

interface PostResult {
  success: boolean
  tweetId?: string
  error?: string
}

export async function postToX(text: string): Promise<PostResult> {
  const apiKey = process.env.X_API_KEY
  const apiKeySecret = process.env.X_API_KEY_SECRET
  const accessToken = process.env.X_ACCESS_TOKEN
  const accessTokenSecret = process.env.X_ACCESS_TOKEN_SECRET

  if (!apiKey || !apiKeySecret || !accessToken || !accessTokenSecret) {
    return { success: false, error: 'X API credentials not configured' }
  }

  // 280文字に切り詰め
  const truncated = text.length > 280 ? text.slice(0, 277) + '...' : text

  try {
    const client = new TwitterApi({
      appKey: apiKey,
      appSecret: apiKeySecret,
      accessToken: accessToken,
      accessSecret: accessTokenSecret,
    })

    const tweet = await client.v2.tweet(truncated)

    return {
      success: true,
      tweetId: tweet.data.id,
    }
  } catch (e: any) {
    console.error('[X Post Error]', e)
    const errMsg = e?.data?.detail || e?.data?.title || e?.message || String(e)
    return { success: false, error: errMsg }
  }
}
