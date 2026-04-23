import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { CATEGORIES, getCategoryConfig } from "@/lib/categoryConfig";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Camera, MapPin, ChevronDown, CheckCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CROWD_LEVELS = ["empty", "light", "moderate", "busy", "packed"];
const CONGESTION = ["clear", "light", "moderate", "heavy", "standstill"];
const WATER_QUALITY = ["excellent", "good", "fair", "poor"];
const WIND_LEVELS = ["calm", "light", "moderate", "strong", "dangerous"];
const PARKING = ["available", "limited", "full"];

export default function AddUpdate() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [locations, setLocations] = useState([]);
  const [locationSearch, setLocationSearch] = useState("");
  const [showLocations, setShowLocations] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState(null);
  const [photoUrl, setPhotoUrl] = useState("");
  const [structured, setStructured] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => null);
    base44.entities.Location.list().then(setLocations);
  }, []);

  const filteredLocations = locations.filter(
    (l) => l.name?.toLowerCase().includes(locationSearch.toLowerCase())
  );

  const setS = (key, value) => setStructured((prev) => ({ ...prev, [key]: value }));

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingPhoto(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setPhotoUrl(file_url);
    setUploadingPhoto(false);
  };

  const handleSubmit = async () => {
    if (!selectedLocation || !category || !title || !description) return;
    setSubmitting(true);

    const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();

    await base44.entities.StatusUpdate.create({
      user_id: user?.id || "guest",
      user_name: user?.full_name || "Anonymous",
      location_id: selectedLocation.id,
      location_name: selectedLocation.name,
      category,
      title,
      description,
      structured_data: structured,
      photo_url: photoUrl,
      accuracy_score: 0,
      confirm_count: 0,
      deny_count: 0,
      report_count: 0,
      status_visibility: "visible",
      expires_at: expiresAt,
    });

    setDone(true);
    setTimeout(() => navigate("/"), 1500);
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground">Update Posted!</h2>
          <p className="text-muted-foreground text-sm mt-1">Taking you back…</p>
        </motion.div>
      </div>
    );
  }

  const catConfig = category ? getCategoryConfig(category) : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card/95 backdrop-blur-xl border-b border-border sticky top-0 z-40 px-4 pt-12 pb-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Post Update</h1>
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-secondary transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-5">
        {/* Location picker */}
        <div>
          <label className="text-sm font-semibold text-foreground mb-2 block flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-primary" /> Location
          </label>
          <div className="relative">
            <Input
              placeholder="Search for a place…"
              value={selectedLocation ? selectedLocation.name : locationSearch}
              onChange={(e) => {
                setLocationSearch(e.target.value);
                setSelectedLocation(null);
                setShowLocations(true);
              }}
              onFocus={() => setShowLocations(true)}
              className="rounded-xl"
            />
            {selectedLocation && (
              <button
                onClick={() => { setSelectedLocation(null); setLocationSearch(""); }}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
            <AnimatePresence>
              {showLocations && !selectedLocation && filteredLocations.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto"
                >
                  {filteredLocations.map((loc) => {
                    const c = getCategoryConfig(loc.category);
                    return (
                      <button
                        key={loc.id}
                        onClick={() => {
                          setSelectedLocation(loc);
                          setLocationSearch(loc.name);
                          setShowLocations(false);
                          if (!category) setCategory(loc.category);
                        }}
                        className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-secondary transition-colors border-b border-border last:border-none"
                      >
                        <span>{c.emoji}</span>
                        <div>
                          <p className="text-sm font-medium">{loc.name}</p>
                          <p className="text-xs text-muted-foreground">{loc.city}</p>
                        </div>
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="text-sm font-semibold text-foreground mb-2 block">Category</label>
          <div className="grid grid-cols-4 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-center ${
                  category === cat.id
                    ? `border-category-${cat.color} bg-category-${cat.color}/10`
                    : "border-border bg-card hover:border-primary/30"
                }`}
              >
                <span className="text-xl">{cat.emoji}</span>
                <span className="text-[10px] font-medium leading-tight text-foreground">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="text-sm font-semibold text-foreground mb-2 block">
            {catConfig ? `${catConfig.emoji} What's happening?` : "What's happening?"}
          </label>
          <Input
            placeholder="Short summary…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
            className="rounded-xl"
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-sm font-semibold text-foreground mb-2 block">Details</label>
          <Textarea
            placeholder="Give people more context about the situation…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={300}
            rows={3}
            className="rounded-xl resize-none"
          />
        </div>

        {/* Structured fields by category */}
        <AnimatePresence>
          {category && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-secondary/50 rounded-2xl p-4 space-y-4">
                <p className="text-sm font-semibold text-foreground">Extra Details</p>

                {(category === "supermarket" || category === "restaurant" || category === "clinic" || category === "public_place") && (
                  <>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-2 block">Crowd Level</label>
                      <div className="flex gap-1.5 flex-wrap">
                        {CROWD_LEVELS.map((l) => (
                          <button key={l} onClick={() => setS("crowd_level", l)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all capitalize ${structured.crowd_level === l ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                            {l}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Wait Time (minutes)</label>
                      <Input type="number" placeholder="0" min={0} max={300}
                        value={structured.wait_minutes || ""}
                        onChange={(e) => setS("wait_minutes", parseInt(e.target.value))}
                        className="rounded-xl w-32" />
                    </div>
                  </>
                )}

                {category === "traffic" && (
                  <>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-2 block">Congestion Level</label>
                      <div className="flex gap-1.5 flex-wrap">
                        {CONGESTION.map((l) => (
                          <button key={l} onClick={() => setS("congestion_level", l)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all capitalize ${structured.congestion_level === l ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                            {l}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="text-xs font-medium text-muted-foreground">Accident?</label>
                      <button
                        onClick={() => setS("has_accident", !structured.has_accident)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${structured.has_accident ? "border-red-500 bg-red-50 text-red-600" : "border-border text-muted-foreground"}`}>
                        {structured.has_accident ? "Yes ⚠️" : "No"}
                      </button>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Road Speed (km/h)</label>
                      <Input type="number" placeholder="60" min={0} max={200}
                        value={structured.road_speed_kmh || ""}
                        onChange={(e) => setS("road_speed_kmh", parseInt(e.target.value))}
                        className="rounded-xl w-32" />
                    </div>
                  </>
                )}

                {category === "beach" && (
                  <>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-2 block">Water Quality</label>
                      <div className="flex gap-1.5 flex-wrap">
                        {WATER_QUALITY.map((l) => (
                          <button key={l} onClick={() => setS("water_quality", l)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all capitalize ${structured.water_quality === l ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                            {l}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-2 block">Wind Level</label>
                      <div className="flex gap-1.5 flex-wrap">
                        {WIND_LEVELS.map((l) => (
                          <button key={l} onClick={() => setS("wind_level", l)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all capitalize ${structured.wind_level === l ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                            {l}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Wave Height (meters)</label>
                      <Input type="number" placeholder="1.5" min={0} max={20} step={0.5}
                        value={structured.wave_height_m || ""}
                        onChange={(e) => setS("wave_height_m", parseFloat(e.target.value))}
                        className="rounded-xl w-32" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-2 block">Crowd Level</label>
                      <div className="flex gap-1.5 flex-wrap">
                        {CROWD_LEVELS.map((l) => (
                          <button key={l} onClick={() => setS("crowd_level", l)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all capitalize ${structured.crowd_level === l ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                            {l}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {category === "parking" && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-2 block">Parking Availability</label>
                    <div className="flex gap-1.5 flex-wrap">
                      {PARKING.map((l) => (
                        <button key={l} onClick={() => setS("parking_availability", l)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all capitalize ${structured.parking_availability === l ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Photo */}
        <div>
          <label className="text-sm font-semibold text-foreground mb-2 block flex items-center gap-1.5">
            <Camera className="w-4 h-4 text-primary" /> Photo (optional)
          </label>
          {photoUrl ? (
            <div className="relative">
              <img src={photoUrl} alt="" className="w-full h-44 object-cover rounded-xl" />
              <button
                onClick={() => setPhotoUrl("")}
                className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/40 transition-colors bg-secondary/30 ${uploadingPhoto ? "opacity-60" : ""}`}>
              <Camera className="w-7 h-7 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground">{uploadingPhoto ? "Uploading…" : "Tap to add photo"}</span>
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
            </label>
          )}
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={!selectedLocation || !category || !title || !description || submitting}
          className="w-full rounded-xl h-12 text-base font-semibold"
        >
          {submitting ? "Posting…" : "Post Update"}
        </Button>
      </div>
    </div>
  );
}