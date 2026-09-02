import { useEffect, useState, type FormEvent } from 'react';
import { Check, Search, X } from 'lucide-react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { GeoPoint } from '@/domain';
import { Button } from '@/design-system';

const SEARCHABLE_LOCATIONS = [
  { name: 'Mumbai', point: { latitude: 19.076, longitude: 72.8777 } },
  { name: 'Nagpur', point: { latitude: 21.1458, longitude: 79.0882 } },
  { name: 'Delhi', point: { latitude: 28.6139, longitude: 77.209 } },
  { name: 'Pune', point: { latitude: 18.5204, longitude: 73.8567 } },
  { name: 'Nashik', point: { latitude: 19.9975, longitude: 73.7898 } },
];

export function LocationMapOverlay({
  centre,
  value,
  onChange,
  onClose,
  onSave,
}: {
  centre: GeoPoint;
  value: GeoPoint | null;
  onChange: (point: GeoPoint) => void;
  onClose: () => void;
  onSave: (point: GeoPoint) => void;
}) {
  const [search, setSearch] = useState('');
  const [mapCentre, setMapCentre] = useState(value ?? centre);
  const point = value ?? mapCentre;

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const match = SEARCHABLE_LOCATIONS.find((location) =>
      search.trim().toLowerCase().includes(location.name.toLowerCase()),
    );
    if (match) {
      setMapCentre(match.point);
      onChange(match.point);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-canvas">
      <div className="flex shrink-0 items-center gap-3 border-b border-line bg-surface px-4 py-3">
        <button type="button" aria-label="Close map" onClick={onClose} className="flex size-9 items-center justify-center rounded-full text-ink-muted hover:bg-neutral-100">
          <X size={20} aria-hidden />
        </button>
        <div>
          <h2 className="text-title text-ink">Choose site location</h2>
          <p className="text-caption text-ink-muted">Search or tap the map to place the pin</p>
        </div>
      </div>
      <div className="relative min-h-0 flex-1">
        <MapContainer center={[mapCentre.latitude, mapCentre.longitude]} zoom={10} zoomControl={false} className="absolute inset-0 h-full w-full">
          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Recenter point={mapCentre} />
          <ClickToPlace onChange={onChange} />
          <Marker
            position={[point.latitude, point.longitude]}
            icon={L.divIcon({
              className: 'excavation-location-pin',
              html: '<div style="width:26px;height:26px;border-radius:9999px 9999px 9999px 0;background:#dc2626;border:3px solid white;transform:rotate(-45deg);box-shadow:0 3px 10px rgba(15,23,42,.3)"></div>',
              iconSize: [26, 26],
              iconAnchor: [5, 24],
            })}
          />
        </MapContainer>
        <form onSubmit={submitSearch} className="absolute inset-x-3 top-3 z-[1000]">
          <div className="flex items-center gap-2 rounded-xl border border-line bg-surface px-3 shadow-e3">
            <Search size={17} className="shrink-0 text-ink-muted" aria-hidden />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search city or area" className="h-12 min-w-0 flex-1 bg-transparent text-body text-ink outline-none" />
            <button type="submit" className="rounded-md px-2 py-1.5 text-label font-medium text-primary-700 hover:bg-primary-50">Search</button>
          </div>
        </form>
      </div>
      <div className="shrink-0 border-t border-line bg-surface p-4">
        <p className="text-caption text-ink-muted">
          {value ? `Pinned site location (${value.latitude.toFixed(5)}, ${value.longitude.toFixed(5)})` : 'Tap the map to mark the excavation site'}
        </p>
        <Button size="lg" fullWidth className="mt-3" disabled={!value} leftIcon={<Check size={17} />} onClick={() => value && onSave(value)}>
          Save location
        </Button>
      </div>
    </div>
  );
}

function Recenter({ point }: { point: GeoPoint }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([point.latitude, point.longitude], 12, { animate: true, duration: 0.8 });
  }, [map, point]);
  return null;
}

function ClickToPlace({ onChange }: { onChange: (point: GeoPoint) => void }) {
  useMapEvents({
    click: (event) =>
      onChange({
        latitude: Number(event.latlng.lat.toFixed(5)),
        longitude: Number(event.latlng.lng.toFixed(5)),
      }),
  });
  return null;
}
