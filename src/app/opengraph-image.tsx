import { ImageResponse } from 'next/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  // Google FontsからNoto Sans JP（日本語対応フォント）を取得
  let fontData: ArrayBuffer | null = null
  try {
    const cssRes = await fetch(
      'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700&display=swap',
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    )
    const css = await cssRes.text()
    const match = css.match(/src: url\(([^)]+)\) format\('woff2'\)/)
    if (match) {
      fontData = await fetch(match[1]).then(r => r.arrayBuffer())
    }
  } catch {
    // フォント取得失敗時はデフォルトフォントにフォールバック
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
          fontFamily: fontData ? 'NotoSansJP' : 'sans-serif',
          position: 'relative',
        }}
      >
        {/* 背景の装飾ライン */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            width: '900px',
            height: '2px',
            background: 'linear-gradient(90deg, transparent, #ef4444, transparent)',
            opacity: 0.5,
          }} />
        </div>

        {/* メインコンテンツ */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '24px',
          padding: '60px',
          textAlign: 'center',
        }}>
          {/* アイコン + タイトル */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
          }}>
            <span style={{ fontSize: '80px' }}>🏃</span>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
            }}>
              <span style={{
                fontSize: '72px',
                fontWeight: 700,
                color: '#ffffff',
                letterSpacing: '-1px',
                lineHeight: 1.1,
              }}>
                箱根駅伝家族！
              </span>
            </div>
          </div>

          {/* サブタイトル */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginTop: '8px',
          }}>
            <div style={{ width: '60px', height: '2px', background: '#ef4444' }} />
            <span style={{
              fontSize: '28px',
              color: '#94a3b8',
              letterSpacing: '2px',
            }}>
              選手PB記録・ランキング情報
            </span>
            <div style={{ width: '60px', height: '2px', background: '#ef4444' }} />
          </div>

          {/* URL */}
          <span style={{
            fontSize: '22px',
            color: '#64748b',
            marginTop: '16px',
          }}>
            hakone-fan.com
          </span>
        </div>
      </div>
    ),
    {
      ...size,
      ...(fontData
        ? {
            fonts: [{
              name: 'NotoSansJP',
              data: fontData,
              style: 'normal',
              weight: 700,
            }],
          }
        : {}),
    }
  )
}
