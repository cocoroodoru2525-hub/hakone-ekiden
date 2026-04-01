'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { supabase } from '@/lib/supabase'
import { OFFICIAL_SPOTS } from './course-data'

// Leafletはサーバーサイドで動かないのでdynamic import
const CourseMap = dynamic(() => import('./course-map'), { ssr: false, loading: () => <div className="h-[450px] bg-gray-900 rounded-lg flex items-center justify-center text-gray-500">地図を読み込み中...</div> })

type Spot = {
  id: number
  spot_name: string
  description: string | null
  section_number: number | null
  from_name: string | null
  created_at: string
}

export default function SpotsPage() {
  const [spots, setSpots] = useState<Spot[]>([])
  const [selectedSpot, setSelectedSpot] = useState<typeof OFFICIAL_SPOTS[0] | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState({ spot_name: '', description: '', section_number: '', from_name: '' })
  const [msg, setMsg] = useState('')
  const [sent, setSent] = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('hk_spots')
        .select('*')
        .eq('is_approved', true)
        .order('created_at', { ascending: false })
        .limit(50)
      if (data) setSpots(data)
    }
    load()
  }, [])

  async function submitSpot() {
    if (!form.spot_name || !form.from_name) {
      setMsg('スポット名とお名前は必須です')
      return
    }
    const { error } = await supabase.from('hk_spots').insert({
      spot_name: form.spot_name,
      description: form.description || null,
      section_number: form.section_number ? Number(form.section_number) : null,
      from_name: form.from_name,
      is_official: false,
      is_approved: true,
    })
    if (error) { setMsg('送信に失敗しました'); return }
    setSent(true)
    setMsg('')
  }

  const inputClass = "w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500"

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="bg-black border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <a href="/" className="text-lg font-medium tracking-wide">箱根駅伝家族！</a>
        <nav className="flex gap-6 text-sm text-gray-400">
          <a href="/" className="hover:text-white">トップ</a>
          <a href="/teams" className="hover:text-white">出場校</a>
          <a href="/athletes" className="hover:text-white">選手一覧</a>
          <a href="/spots" className="text-white">応援スポット</a>
          <a href="/admin" className="hover:text-white">管理</a>
        </nav>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <p className="text-red-500 text-xs tracking-widest mb-2 font-medium">CHEERING SPOTS</p>
        <h1 className="text-2xl font-medium mb-2">応援スポットマップ</h1>
        <p className="text-sm text-gray-400 mb-6">箱根駅伝のコース全区間を地図上に表示。応援スポットをクリックして詳細を確認できます。</p>

        {/* 地図 */}
        <CourseMap selectedSpot={selectedSpot} onSelectSpot={setSelectedSpot} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 公式スポット */}
          <div>
            <h2 className="text-sm font-medium mb-4 pb-2 border-b border-gray-800">
              <span className="text-red-400">公式</span> 応援おすすめスポット
            </h2>

            <h3 className="text-xs text-yellow-400 font-medium mt-3 mb-2">▶ 往路（1区〜5区）</h3>
            <div className="flex flex-col gap-1 mb-4">
              {OFFICIAL_SPOTS.filter(s => s.section <= 5).map((spot, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedSpot(spot)}
                  className={`flex items-center gap-3 px-3 py-2 rounded text-left hover:bg-gray-900 transition text-sm ${
                    selectedSpot === spot ? 'bg-gray-900 border border-gray-700' : ''
                  }`}
                >
                  <span className="bg-red-600 text-white text-xs px-1.5 py-0.5 rounded w-8 text-center flex-shrink-0">
                    {spot.section}区
                  </span>
                  <span className="flex-1">{spot.name}</span>
                </button>
              ))}
            </div>

            <h3 className="text-xs text-blue-400 font-medium mt-3 mb-2">◀ 復路（6区〜10区）</h3>
            <div className="flex flex-col gap-1">
              {OFFICIAL_SPOTS.filter(s => s.section >= 6).map((spot, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedSpot(spot)}
                  className={`flex items-center gap-3 px-3 py-2 rounded text-left hover:bg-gray-900 transition text-sm ${
                    selectedSpot === spot ? 'bg-gray-900 border border-gray-700' : ''
                  }`}
                >
                  <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded w-8 text-center flex-shrink-0">
                    {spot.section}区
                  </span>
                  <span className="flex-1">{spot.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ユーザー投稿 */}
          <div>
            <h2 className="text-sm font-medium mb-4 pb-2 border-b border-gray-800">
              <span className="text-yellow-400">みんなの</span> 応援スポット
            </h2>

            {spots.length > 0 ? (
              <div className="flex flex-col gap-2 mb-4 max-h-64 overflow-y-auto">
                {spots.map(spot => (
                  <div key={spot.id} className="bg-gray-900 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      {spot.section_number && (
                        <span className="bg-yellow-600 text-white text-xs px-1.5 py-0.5 rounded">{spot.section_number}区</span>
                      )}
                      <span className="text-sm font-medium">{spot.spot_name}</span>
                    </div>
                    {spot.description && <p className="text-xs text-gray-400 mt-1">{spot.description}</p>}
                    <p className="text-xs text-gray-600 mt-1">{spot.from_name}さんより</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 mb-4">まだ投稿がありません。最初の投稿者になろう！</p>
            )}

            {!formOpen && !sent && (
              <button
                onClick={() => setFormOpen(true)}
                className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded text-sm font-medium w-full"
              >
                応援スポットを投稿する
              </button>
            )}

            {formOpen && !sent && (
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex flex-col gap-3">
                <h3 className="text-sm font-medium">あなたのおすすめスポットを教えてください</h3>
                {msg && <p className="text-yellow-400 text-xs">{msg}</p>}
                <div>
                  <label className="block text-xs text-gray-400 mb-1">スポット名 *</label>
                  <input className={inputClass} placeholder="例: 鎌倉街道沿い歩道橋" value={form.spot_name}
                    onChange={e => setForm({...form, spot_name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">区間（わかれば）</label>
                  <select className={inputClass} value={form.section_number}
                    onChange={e => setForm({...form, section_number: e.target.value})}>
                    <option value="">選択してください</option>
                    {[1,2,3,4,5,6,7,8,9,10].map(n => (
                      <option key={n} value={n}>{n}区</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">おすすめポイント</label>
                  <textarea className={inputClass + ' h-16 resize-none'} placeholder="ここがおすすめの理由..."
                    value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">お名前 *</label>
                  <input className={inputClass} placeholder="ニックネーム" value={form.from_name}
                    onChange={e => setForm({...form, from_name: e.target.value})} />
                </div>
                <button onClick={submitSpot}
                  className="bg-red-600 hover:bg-red-500 text-white py-2 rounded text-sm font-medium">
                  投稿する
                </button>
              </div>
            )}

            {sent && (
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center">
                <div className="text-green-400 text-sm font-medium mb-2">応援スポットを投稿しました！</div>
                <p className="text-xs text-gray-500">ありがとうございます！</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
