import { useEffect, useState } from 'react';
import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet';
import type { Measurement, Station } from './types';

type ApiMeta = { count?: number; provider?: string; retrievedAt?: string };
type ApiResponse<T> = { data: T[]; meta?: ApiMeta; message?: string };

export default function App() {
  const [stations, setStations] = useState<Station[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [status, setStatus] = useState('loading');
  const [providerMessage, setProviderMessage] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch('/api/v1/stations').then(async (r) => { const j = await r.json(); if (!r.ok) throw new Error(j.message || 'Станцын мэдээлэл татаж чадсангүй'); return j as ApiResponse<Station>; }),
      fetch('/api/v1/measurements/latest').then(async (r) => { const j = await r.json(); if (!r.ok) throw new Error(j.message || 'Хэмжилт татаж чадсангүй'); return j as ApiResponse<Measurement>; })
    ]).then(([s, m]) => {
      if (!active) return;
      setStations(s.data ?? []);
      setMeasurements(m.data ?? []);
      setStatus('ready');
      setProviderMessage('Эх сурвалж: OpenAQ · 5 минутын cache');
    }).catch((error: Error) => {
      if (!active) return;
      setStatus('error');
      setProviderMessage(error.message);
    });
    return () => { active = false; };
  }, []);

  const metrics = [
    ['PM2.5', 'Нарийн ширхэгт тоосонцор', 'µg/m³'],
    ['PM10', 'Тоосонцор', 'µg/m³'],
    ['NO2', 'Азотын давхар исэл', 'µg/m³'],
    ['SO2', 'Хүхрийн давхар исэл', 'µg/m³']
  ];
  const latestFor = (key: string) => measurements
    .filter((m) => m.parameter.toUpperCase().replace('.', '') === key.toUpperCase().replace('.', ''))
    .sort((a, b) => new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime())[0];

  return <main className="shell">
    <header><a className="brand" href="#"><b className="mark">A</b> AirWatch <em>Mongolia</em></a><span className="live">● АГААРЫН ЧАНАРЫН МОНИТОРИНГ</span></header>
    <section className="hero">
      <p className="eyebrow">МОНГОЛ УЛС · АГААРЫН ЧАНАР</p>
      <h1>Амьсгалж буй агаараа<br/><em>мэдээллээр хяная.</em></h1>
      <p className="intro">Агаарын чанарын хэмжилт, станцын байршил болон өөрчлөлтийг нэг дороос хянах нээлттэй платформ.</p>
      <p className="connection">{status === 'loading' ? 'Мэдээлэл татаж байна' : status === 'error' ? 'Өгөгдлийн эх үүсвэртэй холболт шаардлагатай' : 'OpenAQ өгөгдөл холбогдлоо'}</p>
      {providerMessage && <p className="provider-message">{providerMessage}</p>}
    </section>
    <div className="section-title"><div><small>LIVE INDICATORS</small><h2>Агаарын чанарын үзүүлэлт</h2></div><span>Хамгийн сүүлийн олдсон хэмжилт</span></div>
    <section className="metrics">{metrics.map(([key, label, unit]) => {
      const m = latestFor(key);
      return <article className="metric" key={key}><div>{key}<b>↗</b></div><strong>{m ? m.value : '—'}</strong><small>{m?.unit ?? unit}</small><p>{label}</p><footer>{m ? `${m.stationName} · ${m.source} · ${new Date(m.measuredAt).toLocaleString('mn-MN')}` : 'Баталгаажсан хэмжилт олдоогүй'}</footer></article>;
    })}</section>
    <div className="section-title map-title"><div><small>MONITORING NETWORK</small><h2>Хэмжилтийн станцууд</h2></div><span>{stations.length} станц · OpenAQ</span></div>
    <section className="map"><MapContainer center={[47.9184,106.9177]} zoom={11} scrollWheelZoom><TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>{stations.map((s) => <CircleMarker key={s.id} center={[s.latitude,s.longitude]} radius={8}><Popup><b>{s.name}</b><br/>{s.city}<br/>{s.source}</Popup></CircleMarker>)}</MapContainer>{stations.length === 0 && <div className="map-note">API холбогдсоны дараа баталгаажсан станцууд энд харагдана.</div>}</section>
    <footer className="site-footer">© 2026 AirWatch Mongolia <span>Өгөгдөл: OpenAQ · Газрын зураг: OpenStreetMap</span></footer>
  </main>;
}
