import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { List, MapIcon, Navigation } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getCategoryConfig, getFreshnessLabel } from "@/lib/categoryConfig";
import { Link } from "react-router-dom";
import UpdateCard from "@/components/updates/UpdateCard";
import CategoryFilter from "@/components/updates/CategoryFilter";

// Fix leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const createCategoryIcon = (cat) => {
  return L.divIcon({
    html: `<div style="
      width:36px;height:36px;border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);display:flex;align-items:center;
      justify-content:center;background:white;
      box-shadow:0 2px 8px rgba(0,0,0,0.2);
      border:2px solid #3b82f6;
    "><span style="transform:rotate(45deg);font-size:16px">${cat.emoji}</span></div>`,
    className: "",
    iconSize: [36, 36],
    iconAnchor: [18, 36],
  });
};

export default function MapPage() {
  const [locations, setLocations] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [category, setCategory] = useState(null);
  const [view, setView] = useState("map"); // "map" | "list"
  const [userPos, setUserPos] = useState([32.08, 34.78]); // default TLV

  useEffect(() => {
    loadData();
    navigator.geolocation?.getCurrentPosition((pos) => {
      setUserPos([pos.coords.latitude, pos.coords.longitude]);
    });
  }, []);

  const loadData = async () => {
    const [locs, upds] = await Promise.all([
      base44.entities.Location.list(),
      base44.entities.StatusUpdate.filter({ status_visibility: "visible" }, "-created_date", 100),
    ]);
    setLocations(locs);
    setUpdates(upds);
  };

  const filteredUpdates = category ? updates.filter((u) => u.category === category) : updates;
  const locationsWithUpdates = locations.filter((loc) =>
    filteredUpdates.some((u) => u.location_id === loc.id)
  );

  const getLatestUpdateForLocation = (locationId) =>
    filteredUpdates.find((u) => u.location_id === locationId);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="bg-card/95 backdrop-blur-xl border-b border-border z-40 pt-12 pb-3 px-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <MapIcon className="w-5 h-5 text-primary" /> Map View
            </h1>
            <div className="flex bg-secondary rounded-xl p-1">
              <button
                onClick={() => setView("map")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  view === "map" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                <MapIcon className="w-3.5 h-3.5" /> Map
              </button>
              <button
                onClick={() => setView("list")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  view === "list" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                <List className="w-3.5 h-3.5" /> List
              </button>
            </div>
          </div>
          <CategoryFilter selected={category} onChange={setCategory} />
        </div>
      </div>

      {view === "map" ? (
        <div className="flex-1 relative">
          <MapContainer
            center={userPos}
            zoom={13}
            className="w-full h-full z-0"
            style={{ height: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {/* User location marker */}
            <Marker position={userPos} icon={L.divIcon({
              html: `<div style="width:14px;height:14px;border-radius:50%;background:#3b82f6;border:3px solid white;box-shadow:0 0 0 3px rgba(59,130,246,0.3)"></div>`,
              className: "",
              iconSize: [14, 14],
              iconAnchor: [7, 7],
            })}>
              <Popup>You are here</Popup>
            </Marker>

            {locationsWithUpdates.map((loc) => {
              if (!loc.latitude || !loc.longitude) return null;
              const latestUpdate = getLatestUpdateForLocation(loc.id);
              const cat = getCategoryConfig(latestUpdate?.category);
              return (
                <Marker
                  key={loc.id}
                  position={[loc.latitude, loc.longitude]}
                  icon={createCategoryIcon(cat)}
                >
                  <Popup className="rounded-2xl" minWidth={220}>
                    <div className="p-1">
                      <div className="font-semibold text-sm mb-1">{loc.name}</div>
                      <div className="text-xs text-gray-500 mb-2">
                        {cat.emoji} {cat.label} · {getFreshnessLabel(latestUpdate?.created_date)}
                      </div>
                      <div className="text-sm font-medium mb-2">{latestUpdate?.title}</div>
                      <Link
                        to={`/location/${loc.id}`}
                        className="block text-center text-xs bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        View All Updates →
                      </Link>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 py-4 max-w-lg mx-auto w-full">
          <div className="space-y-3">
            {filteredUpdates.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No updates found.</div>
            ) : (
              filteredUpdates.map((u) => <UpdateCard key={u.id} update={u} />)
            )}
          </div>
        </div>
      )}
    </div>
  );
}