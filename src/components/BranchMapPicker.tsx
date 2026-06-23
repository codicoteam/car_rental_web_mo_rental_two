// components/BranchMapPicker.tsx
import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import { Search, Loader2, MapPin, Navigation, X, AlertCircle } from "lucide-react";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const branchIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16`,
      { headers: { "User-Agent": "MoRentalAdmin/1.0" } }
    );
    const d = await res.json();
    return d.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  } catch {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }
}

async function searchPlace(q: string) {
  if (!q.trim()) return [];
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5`,
      { headers: { "User-Agent": "MoRentalAdmin/1.0" } }
    );
    const d = await res.json();
    return d.map((i: any) => ({ lat: parseFloat(i.lat), lng: parseFloat(i.lon), label: i.display_name }));
  } catch {
    return [];
  }
}

function MapClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({ click(e) { onClick(e.latlng.lat, e.latlng.lng); } });
  return null;
}

function FlyTo({ pos }: { pos: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.flyTo(pos, 15, { duration: 1 }); }, [pos, map]);
  return null;
}

export interface BranchLocation {
  lat: number;
  lng: number;
  address?: string;
}

interface Props {
  value?: BranchLocation | null;
  onChange: (loc: BranchLocation) => void;
  readOnly?: boolean;
}

export const BranchMapPicker: React.FC<Props> = ({ value, onChange, readOnly = false }) => {
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<{ lat: number; lng: number; label: string }[]>([]);
  const [center, setCenter] = useState<[number, number]>(
    value?.lat && value?.lng ? [value.lat, value.lng] : [-17.8292, 31.0522]
  );
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);
  const [locating, setLocating] = useState(false);
  const [locErr, setLocErr] = useState<string | null>(null);
  const flyRef = useRef(0);

  const marker: [number, number] | null =
    value?.lat && value?.lng ? [value.lat, value.lng] : null;

  const handleClick = async (lat: number, lng: number) => {
    if (readOnly) return;
    const address = await reverseGeocode(lat, lng);
    onChange({ lat, lng, address });
  };

  const handleSearch = async () => {
    if (!search.trim()) return;
    setSearching(true);
    const r = await searchPlace(search);
    setResults(r);
    setSearching(false);
  };

  const pickResult = async (r: { lat: number; lng: number; label: string }) => {
    setResults([]);
    setSearch("");
    const k = ++flyRef.current;
    setFlyTarget([r.lat, r.lng]);
    setCenter([r.lat, r.lng]);
    if (!readOnly) onChange({ lat: r.lat, lng: r.lng, address: r.label });
    setTimeout(() => { if (flyRef.current === k) setFlyTarget(null); }, 1500);
  };

  const locate = () => {
    if (!navigator.geolocation) { setLocErr("Geolocation not supported"); return; }
    setLocating(true);
    setLocErr(null);
    navigator.geolocation.getCurrentPosition(
      async (p) => {
        const { latitude: lat, longitude: lng } = p.coords;
        const address = await reverseGeocode(lat, lng);
        setCenter([lat, lng]);
        setFlyTarget([lat, lng]);
        if (!readOnly) onChange({ lat, lng, address });
        setLocating(false);
      },
      () => { setLocErr("Could not get location"); setLocating(false); }
    );
  };

  return (
    <div className="space-y-3">
      {!readOnly && (
        <>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                placeholder="Search location..."
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF]/30 focus:border-[#00AEEF]"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={searching}
              className="px-3.5 py-2 bg-[#00AEEF] text-white rounded-xl hover:bg-[#0099D6] transition-colors disabled:opacity-50 flex items-center gap-1.5 text-sm font-medium"
            >
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </button>
            <button
              onClick={locate}
              disabled={locating}
              title="Use current location"
              className="px-3.5 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center gap-1.5 text-sm"
            >
              {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
            </button>
          </div>

          {results.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto z-50">
              {results.map((r, i) => (
                <button
                  key={i}
                  onClick={() => pickResult(r)}
                  className="w-full px-4 py-2.5 text-left hover:bg-gray-50 border-b last:border-0 transition-colors"
                >
                  <p className="text-sm text-gray-700 truncate">{r.label}</p>
                </button>
              ))}
            </div>
          )}

          {locErr && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{locErr}</span>
              <button onClick={() => setLocErr(null)} className="ml-auto"><X className="w-3.5 h-3.5" /></button>
            </div>
          )}
        </>
      )}

      {marker && (
        <div className="flex items-center gap-2 text-sm text-[#00AEEF] bg-blue-50 px-3 py-2 rounded-xl">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1 truncate">{value?.address || `${marker[0].toFixed(5)}, ${marker[1].toFixed(5)}`}</span>
          {!readOnly && (
            <button onClick={() => onChange({ lat: 0, lng: 0, address: "" })} className="text-gray-400 hover:text-red-500">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      <div className={`rounded-xl overflow-hidden border border-gray-200 ${readOnly ? "h-64" : "h-72"}`}>
        <MapContainer
          center={center}
          zoom={marker ? 15 : 12}
          style={{ height: "100%", width: "100%" }}
          zoomControl
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {!readOnly && <MapClickHandler onClick={handleClick} />}
          {flyTarget && <FlyTo pos={flyTarget} />}
          {marker && <Marker position={marker} icon={branchIcon} />}
        </MapContainer>
      </div>

      {!readOnly && (
        <p className="text-xs text-gray-400 text-center">
          Click anywhere on the map to pin the branch location
        </p>
      )}
    </div>
  );
};

export default BranchMapPicker;
