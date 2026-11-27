import { Button, Text, TextInput } from '@mantine/core'
import { useEffect, useRef, useState } from 'react'
import type { Map as LeafletMap, Marker } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIconRetina from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { mapSearchResults, reserveSearchTime, type LocationPoint, type PlaceResult } from './locationSearch'
import styles from './ShopLocationPicker.module.css'

let lastSearchTime = 0
const GEOLOCATION_TIMEOUT_MS = 10_000

export default function ShopLocationPicker({ value, onChange }: { value: LocationPoint; onChange: (point: LocationPoint) => void }) {
  const container = useRef<HTMLDivElement>(null)
  const map = useRef<LeafletMap | null>(null)
  const marker = useRef<Marker | null>(null)
  const change = useRef(onChange)
  const currentValue = useRef(value)
  const requestId = useRef(0)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PlaceResult[]>([])
  const [error, setError] = useState('')
  const [mapError, setMapError] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  useEffect(() => {
    change.current = onChange
    currentValue.current = value
  }, [onChange, value])

  useEffect(() => {
    let active = true
    void import('leaflet').then((leaflet) => {
      if (!active || !container.current) return
      const point = currentValue.current
      const instance = leaflet.map(container.current).setView([point.lat, point.lng], 15)
      map.current = instance
      const icon = leaflet.icon({ iconUrl: markerIcon, iconRetinaUrl: markerIconRetina, shadowUrl: markerShadow, iconSize: [25, 41], iconAnchor: [12, 41], shadowSize: [41, 41] })
      const pin = leaflet.marker([point.lat, point.lng], { icon, draggable: true }).addTo(instance)
      marker.current = pin
      instance.on('click', (event) => { const point = event.latlng.wrap(); change.current({ lat: point.lat, lng: point.lng }) })
      pin.on('dragend', () => { const point = pin.getLatLng().wrap(); change.current({ lat: point.lat, lng: point.lng }) })
      leaflet.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' })
        .on('tileerror', () => setMapError('تعذر تحميل الخريطة. تحقق من اتصالك ثم أعد فتح الصفحة.'))
        .addTo(instance)
    }).catch(() => { if (active) setMapError('تعذر تحميل الخريطة. تحقق من اتصالك ثم أعد فتح الصفحة.') })
    return () => { active = false; requestId.current += 1; map.current?.remove(); map.current = null; marker.current = null }
  }, [])

  useEffect(() => {
    marker.current?.setLatLng([value.lat, value.lng])
    map.current?.panTo([value.lat, value.lng])
  }, [value.lat, value.lng])

  function locate() {
    setError('')
    if (!navigator.geolocation) { setError('خدمة الموقع غير متاحة. ابحث عن الموقع أو اختره على الخريطة.'); return }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => onChange({ lat: coords.latitude, lng: coords.longitude }),
      (failure) => setError(failure.code === 1 ? 'اسمح بالوصول إلى موقعك في إعدادات المتصفح ثم حاول مرة أخرى.' : failure.code === 3 ? 'استغرق تحديد موقعك وقتًا طويلًا. حاول مرة أخرى.' : 'تعذر تحديد موقعك. تحقق من خدمة الموقع ثم حاول مرة أخرى.'),
      { timeout: GEOLOCATION_TIMEOUT_MS },
    )
  }

  async function search() {
    if (!query.trim() || isSearching) return
    const id = ++requestId.current
    setIsSearching(true)
    setError('')
    setResults([])
    try {
      let reservation = reserveSearchTime(Date.now(), lastSearchTime)
      while (reservation.delayMs) {
        await new Promise((resolve) => setTimeout(resolve, reservation.delayMs))
        if (id !== requestId.current) return
        reservation = reserveSearchTime(Date.now(), lastSearchTime)
      }
      if (id !== requestId.current) return
      lastSearchTime = Date.now()
      const parameters = new URLSearchParams({ q: query.trim(), format: 'json', countrycodes: 'eg', 'accept-language': 'ar', limit: '5' })
      const response = await fetch(`https://nominatim.openstreetmap.org/search?${parameters}`)
      if (!response.ok) throw new Error(`Place search returned ${response.status}`)
      const places = mapSearchResults(await response.json())
      if (id !== requestId.current) return
      setResults(places)
      if (!places.length) setError('لم نجد أماكن مطابقة. جرّب اسمًا آخر.')
    } catch {
      if (id === requestId.current) setError('تعذر البحث عن المكان. تحقق من اتصالك ثم حاول مرة أخرى.')
    } finally {
      if (id === requestId.current) setIsSearching(false)
    }
  }

  return <div className={styles.picker}>
    <Text fw={600}>موقع المتجر</Text>
    <div className={styles.search}><TextInput label="ابحث عن مكان" value={query} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); void search() } }} onChange={(event) => { requestId.current += 1; setQuery(event.currentTarget.value); setResults([]); setIsSearching(false); setError('') }} /><Button type="button" onClick={() => void search()} loading={isSearching}>بحث</Button></div>
    {results.length > 0 && <ul className={styles.results}>{results.map((place, index) => <li key={`${place.lat}-${place.lng}-${index}`}><Button type="button" variant="subtle" fullWidth onClick={() => { onChange(place); setResults([]) }}>{place.name}</Button></li>)}</ul>}
    <Button type="button" variant="default" onClick={locate}>موقعي الحالي</Button>
    {error && <Text c="red" role="alert">{error}</Text>}
    {mapError && <Text c="red" role="alert">{mapError}</Text>}
    <div className={styles.map} ref={container} aria-label="خريطة موقع المتجر" />
  </div>
}
