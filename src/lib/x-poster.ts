import crypto from 'crypto'

interface PostResult {
  success: boolean
  tweetId?: string
  error?: string
}

/**
 * OAuth 1.0a で X (Twitter) API v2 にツイートを投稿する
 * twitter-api-v2 パッケージ不要。crypto モジュールのみ使用。
 */
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

  const url = 'https://api.x.com/2/tweets'
  const method = 'POST'

  // OAuth パラメータ
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: apiKey,
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: accessToken,
    oauth_version: '1.0',
  }

  // Signature Base String の生成
  // POST /2/tweets は JSON body なので、OAuth パラメータのみで署名
  const paramString = Object.keys(oauthParams)
    .sort()
    .map(k => `${percentEncode(k)}=${percentEncode(oauthParams[k])}`)
    .join('&')

  const signatureBaseString = [
    method.toUpperCase(),
    percentEncode(url),
    percentEncode(paramString),
  ].join('&')

  // HMAC-SHA1 署名
  const signingKey = `${percentEncode(apiKeySecret)}&${percentEncode(accessTokenSecret)}`
  const signature = crypto
    .createHmac('sha1', signingKey)
    .update(signatureBaseString)
    .digest('base64')

  oauthParams.oauth_signature = signature

  // Authorization ヘッダー生成
  const authHeader =
    'OAuth ' +
    Object.keys(oauthParams)
      .sort()
      .map(k => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`)
      .join(', ')

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: truncated }),
    })

    const data = await res.json()

    if (!res.ok) {
      const errMsg = data?.detail || data?.title || JSON.stringify(data)
      console.error('[X API Error]', res.status, errMsg)
      return { success: false, error: `X API ${res.status}: ${errMsg}` }
    }

    return {
      success: true,
      tweetId: data?.data?.id,
    }
  } catch (e: any) {
    console.error('[X Post Error]', e)
    return { success: false, error: e.message }
  }
}

/** RFC 3986 パーセントエンコーディング */
function percentEncode(str: string): string {
  return encodeURIComponent(str).replace(
    /[!'()*]/g,
    c => '%' + c.charCodeAt(0).toString(16).toUpperCase()
  )
}
