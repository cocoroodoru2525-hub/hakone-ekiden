'use client'

import { useEffect, useRef, useState } from 'react'
import { OUTBOUND_ROUTE, RELAY_POINTS, OFFICIAL_SPOTS } from './course-data'

type SelectedSpot = typeof OFFICIAL_SPOTS[number] | null

export default function CourseMap({ selectedSpot, onSelectSpot }: {
  selectedSpot: SelectedSpot
  onSelectSpot: (spot: typeof OFFICIAL_SPOTS[number]) => void
}) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    import('leaflet').then((L) => {
      // Leaflet CSS
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        document.head.appendChild(link)
      }

      // 少し待ってからマップ初期化（CSS読み込み待ち）
      setTimeout(() => {
        if (!mapRef.current) return

        const map = L.map(mapRef.current, {
          center: [35.40, 139.35],
          zoom: 10,
          scrollWheelZoom: true,
        })

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 18,
        }).addTo(map)

        // コースライン（往路: 赤）
        L.polyline(OUTBOUND_ROUTE, {
          color: '#DC2626',
          weight: 4,
          opacity: 0.8,
        }).addTo(map)

        // 中継所マーカー
        RELAY_POINTS.forEach(point => {
          const icon = L.divIcon({
            className: 'relay-marker',
            html: `<div style="background:#DC2626;color:white;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:bold;white-space:nowrap;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.5)">${point.name}</div>`,
            iconSize: [0, 0],
            iconAnchor: [0, 0],
          })
          L.marker([point.lat, point.lng], { icon }).addTo(map)
        })

        // 応援スポットマーカー
        OFFICIAL_SPOTS.forEach(spot => {
          const color = spot.section <= 5 ? '#DC2626' : '#2563EB'
          const icon = L.divIcon({
            className: 'spot-marker',
            html: `<div style="width:12px;height:12px;background:${color};border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.5);cursor:pointer"></div>`,
            iconSize: [12, 12],
            iconAnchor: [6, 6],
          })
          const marker = L.marker([spot.lat, spot.lng], { icon }).addTo(map)
          marker.bindPopup(`<b>${spot.section}区 ${spot.name}</b><br><span style="font-size:12px">${spot.tip}</span>`)
          marker.on('click', () => onSelectSpot(spot))
        })

        mapInstanceRef.current = map
        setLoaded(true)
      }, 300)
    })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // 選択されたスポットに移動
  useEffect(() => {
    if (selectedSpot && mapInstanceRef.current) {
      mapInstanceRef.current.setView([selectedSpot.lat, selectedSpot.lng], 14, { animate: true })
    }
  }, [selectedSpot])

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden mb-8">
      <div ref={mapRef} style={{ height: '450px', width: '100%' }} />
      {selectedSpot && (
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-2 mb-1">
            <span className={`${selectedSpot.section <= 5 ? 'bg-red-600' : 'bg-blue-600'} text-white text-xs px-2 py-0.5 rounded`}>
              {selectedSpot.section}区
            </span>
            <span className="font-medium text-sm">{selectedSpot.name}</span>
          </div>
          <p className="text-xs text-gray-400">{selectedSpot.tip}</p>
        </div>
      )}
      <div className="px-4 py-2 border-t border-gray-800 flex gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-red-600 inline-block"></span> コースライン
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 bg-red-600 rounded-full inline-block"></span> 往路スポット
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 bg-blue-600 rounded-full inline-block"></span> 復路スポット
        </span>
      </div>
    </div>
  )
}
