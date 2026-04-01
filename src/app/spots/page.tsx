'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const OFFICIAL_SPOTS = [
  { section: 1, name: '大手町・読売新聞社前（スタート/ゴール）', lat: 35.6867, lng: 139.7639, tip: '1区スタート地点。大手町ビル街を駆け抜ける選手を間近で応援！' },
  { section: 1, name: '日比谷交差点', lat: 35.6735, lng: 139.7601, tip: 'スタート直後の見どころ。皇居を背景に応援できる人気スポット。' },
  { section: 1, name: '品川駅前', lat: 35.6284, lng: 139.7387, tip: '1区の中盤。駅からすぐでアクセス抜群。' },
  { section: 2, name: '鶴見中継所', lat: 35.5048, lng: 139.6821, tip: '1区→2区のたすきリレー。花の2区のスタート地点。' },
  { section: 2, name: '横浜駅前', lat: 35.4660, lng: 139.6223, tip: '2区の見どころ。エースたちの走りを間近で観戦。' },
  { section: 2, name: '権太坂', lat: 35.4311, lng: 139.5863, tip: '2区の名所。急坂でのエースたちの攻防が見もの！' },
  { section: 3, name: '戸塚中継所', lat: 35.3953, lng: 139.5332, tip: '2区→3区のたすきリレー地点。' },
  { section: 3, name: '湘南海岸・茅ヶ崎', lat: 35.3264, lng: 139.4018, tip: '3区の海沿いコース。富士山をバックに応援できる絶景スポット。' },
  { section: 4, name: '平塚中継所', lat: 35.3290, lng: 139.3494, tip: '3区→4区のたすきリレー地点。' },
  { section: 4, name: '二宮・押切坂', lat: 35.3029, lng: 139.2572, tip: '4区の難所。起伏のあるコースで順位変動が起きやすい。' },
  { section: 5, name: '小田原中継所', lat: 35.2564, lng: 139.1556, tip: '4区→5区のたすきリレー。ここから山登りが始まる！' },
  { section: 5, name: '箱根湯本駅前', lat: 35.2321, lng: 139.1060, tip: '5区山登りの入り口。温泉街の雰囲気の中で応援。' },
  { section: 5, name: '箱根芦ノ湖ゴール', lat: 35.1966, lng: 139.0217, tip: '往路ゴール地点。芦ノ湖畔でフィニッシュを見届けよう！' },
  // 復路（6区〜10区）
  { section: 6, name: '箱根芦ノ湖スタート（復路）', lat: 35.1966, lng: 139.0217, tip: '復路スタート地点。山下りの6区が始まる！' },
  { section: 6, name: '箱根小涌園前', lat: 35.2370, lng: 139.0550, tip: '6区山下り。急カーブの連続で選手のテクニックが光る。' },
  { section: 6, name: '函嶺洞門', lat: 35.2400, lng: 139.0800, tip: '6区の名所。山下りのスピード区間。' },
  { section: 7, name: '小田原中継所（復路）', lat: 35.2564, lng: 139.1556, tip: '6区→7区のたすきリレー。ここから平地に戻る。' },
  { section: 7, name: '二宮駅前', lat: 35.3029, lng: 139.2572, tip: '7区のコース。朝の冷え込みが選手を苦しめることも。' },
  { section: 8, name: '平塚中継所（復路）', lat: 35.3290, lng: 139.3494, tip: '7区→8区のたすきリレー地点。' },
  { section: 8, name: '遊行寺坂', lat: 35.3520, lng: 139.4840, tip: '8区最大の難所。急坂を駆け上がる選手の力走に注目！' },
  { section: 9, name: '戸塚中継所（復路）', lat: 35.3953, lng: 139.5332, tip: '8区→9区のたすきリレー。松の9区が始まる。' },
  { section: 9, name: '横浜駅前（復路）', lat: 35.4660, lng: 139.6223, tip: '9区の中盤。復路のエース区間、逆転劇が起きることも。' },
  { section: 9, name: '生麦付近', lat: 35.4890, lng: 139.6660, tip: '9区終盤。鶴見中継所に向けてラストスパート。' },
  { section: 10, name: '鶴見中継所（復路）', lat: 35.5048, lng: 139.6821, tip: '9区→10区のたすきリレー。アンカー区間の始まり。' },
  { section: 10, name: '蒲田付近', lat: 35.5625, lng: 139.7158, tip: '10区の序盤。沿道の声援が選手を後押しする。' },
  { section: 10, name: '田町・三田付近', lat: 35.6460, lng: 139.7475, tip: '10区終盤。ゴールの大手町まであと少し！' },
  { section: 10, name: '大手町ゴール（復路）', lat: 35.6867, lng: 139.7639, tip: '総合ゴール地点！感動のフィニッシュを見届けよう！' },
]

type Spot = {
  id: number
  spot_name: string
  description: string | null
  section_number: number | null
  lat: number | null
  lng: number | null
  from_name: string | null
  is_official: boolean
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
        <p className="text-sm text-gray-400 mb-6">箱根駅伝のコース沿いで応援できるスポットを紹介。あなたのおすすめスポットも投稿できます！</p>

        {/* 地図 */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden mb-8">
          <iframe
            src={selectedSpot
              ? `https://maps.google.com/maps?q=${selectedSpot.lat},${selectedSpot.lng}&z=15&output=embed`
              : `https://maps.google.com/maps?q=35.35,139.35&z=10&output=embed`
            }
            width="100%"
            height="400"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          {selectedSpot && (
            <div className="p-4 border-t border-gray-800">
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded">{selectedSpot.section}区</span>
                <span className="font-medium text-sm">{selectedSpot.name}</span>
              </div>
              <p className="text-xs text-gray-400">{selectedSpot.tip}</p>
            </div>
          )}
        </div>

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
