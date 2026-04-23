import { useState } from "react";
import { t, CATEGORIES, getCategoryEmoji } from "@/lib/i18n";
import { base44 } from "@/api/base44Client";
import { MapPin, Locate, X } from "lucide-react";

const STATUS_LEVELS = ["Good", "Moderate", "Bad"];
const STATUS_COLORS = {
  Good: "border-green-500 bg-green-500 text-white",
  Moderate: "border-orange-400 bg-orange-400 text-white",
  Bad: "border-red-500 bg-red-500 text-white",
};
const STATUS_IDLE = "border-border bg-card text-foreground hover:border-primary/50";

export default function PostForm({ lang, nickname, onClose, onPosted }) {
  const [locationName, setLocationName] = useState("");
  const [category, setCategory] = useState("");
  const [statusLevel, setStatusLevel] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const handleGeolocate = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`
        );
        const data = await res.json();
        const addr = data.address || {};
        setLocationName(addr.road || addr.suburb || addr.neighbourhood || addr.city || "");
        setCity(addr.city || addr.town || addr.village || "");
        setCountry(addr.country || "");
      } catch (_) {}
      setLocating(false);
    }, () => setLocating(false));
  };

  const validate = () => {
    const e = {};
    if (!locationName.trim()) e.locationName = t(lang, "errorLocation");
    if (!statusLevel) e.statusLevel = t(lang, "errorStatus");
    if (!description.trim()) e.description = t(lang, "errorDescription");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    await base44.entities.StatusUpdate.create({
      nickname,
      location_name: locationName.trim(),
      city: city.trim(),
      country: country.trim(),
      category: category || "other",
      status_level: statusLevel,
      description: description.trim(),
      confirm_count: 0,
      downvote_count: 0,
      report_count: 0,
      language_code: lang,
    });
    setSubmitting(false);
    onPosted();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-card border border-border rounded-t-3xl sm:rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="text-lg font-bold text-foreground">{t(lang, "postUpdate")}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Location */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">{t(lang, "locationName")}</label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  maxLength={80}
                  value={locationName}
                  onChange={(e) => { setLocationName(e.target.value); setErrors((p) => ({ ...p, locationName: "" })); }}
                  placeholder={t(lang, "locationPlaceholder")}
                  className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-sm bg-background text-foreground outline-none transition-colors ${
                    errors.locationName ? "border-red-500" : "border-border focus:border-primary"
                  }`}
                />
              </div>
              <button
                onClick={handleGeolocate}
                disabled={locating}
                title={t(lang, "useMyLocation")}
                className="px-3 py-2.5 rounded-xl border border-border bg-secondary hover:bg-secondary/80 transition-colors"
              >
                <Locate className={`w-4 h-4 text-primary ${locating ? "animate-spin" : ""}`} />
              </button>
            </div>
            {errors.locationName && <p className="text-xs text-red-500 mt-1">{errors.locationName}</p>}
          </div>

          {/* City / Country */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-muted-foreground mb-1">{t(lang, "city")}</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground outline-none focus:border-primary transition-colors"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-muted-foreground mb-1">{t(lang, "country")}</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">{t(lang, "category")}</label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    category === cat.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-foreground hover:border-primary/40"
                  }`}
                >
                  <span className="text-lg">{cat.emoji}</span>
                  <span className="truncate text-xs">{t(lang, `cat_${cat.id}`)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Status Level */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">{t(lang, "statusLevel")}</label>
            <div className="grid grid-cols-3 gap-3">
              {STATUS_LEVELS.map((s) => (
                <button
                  key={s}
                  onClick={() => { setStatusLevel(s); setErrors((p) => ({ ...p, statusLevel: "" })); }}
                  className={`py-4 rounded-xl border-2 font-bold text-base transition-all ${
                    statusLevel === s ? STATUS_COLORS[s] : STATUS_IDLE
                  }`}
                >
                  {s === "Good" ? "✅" : s === "Moderate" ? "⚠️" : "🔴"}{" "}
                  {t(lang, s.toLowerCase())}
                </button>
              ))}
            </div>
            {errors.statusLevel && <p className="text-xs text-red-500 mt-1">{errors.statusLevel}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">{t(lang, "description")}</label>
            <textarea
              maxLength={150}
              rows={3}
              value={description}
              onChange={(e) => { setDescription(e.target.value); setErrors((p) => ({ ...p, description: "" })); }}
              placeholder={t(lang, "descriptionPlaceholder")}
              className={`w-full px-3 py-2.5 rounded-xl border text-sm bg-background text-foreground outline-none resize-none transition-colors ${
                errors.description ? "border-red-500" : "border-border focus:border-primary"
              }`}
            />
            <div className="flex justify-between mt-0.5">
              {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
              <p className="text-xs text-muted-foreground ms-auto">{150 - description.length} {t(lang, "charsLeft")}</p>
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-base hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {submitting ? t(lang, "submitting") : t(lang, "submit")}
          </button>
        </div>
      </div>
    </div>
  );
}