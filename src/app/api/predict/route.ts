import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { name, sectionList } = await request.json()

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 400,
      messages: [{
        role: 'user',
        content: `あなたは箱根駅伝の専門アナリストです。
以下の選手の過去の区間成績を分析して、2027年第103回箱根駅伝での起用区間を予測してください。

選手名：${name}
過去の区間成績：
${sectionList}

以下の形式で回答してください（200字以内）：
・最も可能性の高い区間とその理由
・区間適性の根拠（タイムや経験から）
・ファン向けに分かりやすく`
      }]
    })
  })

  const data = await response.json()
  const prediction = data.content?.[0]?.text ?? '予測できませんでした。'

  return NextResponse.json({ prediction })
}
