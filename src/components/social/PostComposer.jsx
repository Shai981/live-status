import { useState, useRef } from "react";
import { t, CATEGORIES } from "@/lib/i18n";
import { base44 } from "@/api/base44Client";
import Avatar from "./Avatar";
import MediaGallery from "./MediaGallery";
import { X, Camera, Video, MapPin, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const STATUS_LEVELS = ["Good", "Moderate", "Bad"];
const STATUS_STYLES = {
  Good: "border-green-500 bg-green-500 text-white",
  Moderate: "border-orange-400 bg-orange-400 text-white",
  Bad: "border-red-500 bg-red-500 text-white",
};
const STATUS_OUTLINE = {
  Good: "border-green-500 text-green-600",
  Moderate: "border-orange-400 text-orange-500",
  Bad: "border-red-500 text-red-600",
};

export default function PostComposer({ lang, currentUser, onPosted, onClose }) {
  const [locationName, setLocationName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [statusLevel, setStatusLevel] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [mediaUrls, setMediaUrls] = useState([]);
  const [mediaTypes, setMediaTypes] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showCategory, setShowCategory] = useState(false);
  const photoRef = useRef();
  const videoRef = useRef();

  const canPost = locationName.trim().length >= 2;

  const uploadMedia = async (file, type) => {
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setMediaUrls((prev) => [...prev, file_url]);
    setMediaTypes((prev) => [...prev, type]);
    setUploading(false);
  };

  const removeMedia = (idx) => {
    setMediaUrls((prev) => prev.filter((_, i) => i !== idx));
    setMediaTypes((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!canPost || submitting) return;
    setSubmitting(true);
    await base44.entities.Post.create({
      user_id: currentUser?.id || "guest",
      user_name: currentUser?.full_name || "Anonymous",
      user_avatar: currentUser?.avatar_url || "",
      location_name: locationName.trim(),
      description: description.trim(),
      category: category || null,
      status_level: statusLevel || null,
      city: city.trim() || null,
      country: country.trim() || null,
      media_urls: mediaUrls,
      media_types: mediaTypes,
      like_count: 0, accurate_count: 0, outdated_count: 0, wow_count: 0,
      comment_count: 0, view_count: 0, report_count: 0,
      language_code: lang,
    });
    setSubmitting(false);
    onPosted?.();
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        className="relative w-full max-w-lg bg-card rounded-t-3xl sm:rounded-3xl shadow-2xl z-10 max-h-[90vh] flex flex-col"
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-border rounded-full mx-auto mt-3 mb-1 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <button onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground">{t(lang, "cancel")}</button>
          <h2 className="font-bold text-foreground">Status @</h2>
          <button
            onClick={handleSubmit}
            disabled={!canPost || submitting || uploading}
            className="text-sm font-bold text-primary disabled:opacity-40"
          >
            {submitting ? "..." : t(lang, "postBtn")}
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* User + Location header */}
          <div className="flex gap-3">
            <Avatar name={currentUser?.full_name || "Anonymous"} src={currentUser?.avatar_url} size={44} />
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground mb-2">{currentUser?.full_name || "Anonymous"}</p>
              <div className="relative">
                <MapPin className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                <input
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value.slice(0, 80))}
                  placeholder={t(lang, "locationPlaceholder")}
                  className="w-full ps-9 pe-14 py-2.5 text-base font-bold border-2 border-primary rounded-xl bg-transparent text-foreground placeholder:text-muted-foreground outline-none"
                />
                <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  {locationName.length}/80
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t(lang, "descriptionPlaceholder")}
            rows={3}
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-secondary/30 text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none focus:border-primary transition-colors"
          />

          {/* Media preview */}
          {mediaUrls.length > 0 && (
            <MediaGallery urls={mediaUrls} types={mediaTypes} removable onRemove={removeMedia} />
          )}

          {/* City / Country */}
          <div className="flex gap-2">
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City"
              className="flex-1 px-3 py-2 rounded-xl border border-border bg-secondary/30 text-sm text-foreground outline-none focus:border-primary transition-colors"
            />
            <input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="Country"
              className="flex-1 px-3 py-2 rounded-xl border border-border bg-secondary/30 text-sm text-foreground outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* Category */}
          <div>
            <button
              onClick={() => setShowCategory((o) => !o)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-xl px-3 py-2 w-full justify-between"
            >
              <span>{category ? `${CATEGORIES.find((c) => c.id === category)?.emoji} ${t(lang, `cat_${category}`)}` : t(lang, "category")}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            <AnimatePresence>
              {showCategory && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="grid grid-cols-5 gap-1.5 mt-2">
                    {CATEGORIES.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => { setCategory(c.id === category ? "" : c.id); setShowCategory(false); }}
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${
                          category === c.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"
                        }`}
                      >
                        <span className="text-xl">{c.emoji}</span>
                        <span className="text-[9px] font-medium text-foreground leading-tight text-center">{t(lang, `cat_${c.id}`)}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Status level */}
          <div className="flex gap-2">
            {STATUS_LEVELS.map((s) => (
              <button
                key={s}
                onClick={() => setStatusLevel(statusLevel === s ? "" : s)}
                className={`flex-1 py-2 text-sm font-bold rounded-xl border-2 transition-all ${
                  statusLevel === s ? STATUS_STYLES[s] : `border-border text-muted-foreground ${STATUS_OUTLINE[s]} hover:border-opacity-60`
                }`}
              >
                {t(lang, s.toLowerCase())}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom media bar */}
        <div className="flex items-center gap-3 px-5 py-4 border-t border-border">
          <input ref={photoRef} type="file" accept="image/*" multiple className="hidden"
            onChange={(e) => [...e.target.files].slice(0, 5 - mediaUrls.length).forEach((f) => uploadMedia(f, "image"))} />
          <input ref={videoRef} type="file" accept="video/*" className="hidden"
            onChange={(e) => e.target.files[0] && uploadMedia(e.target.files[0], "video")} />
          <button
            onClick={() => photoRef.current?.click()}
            disabled={uploading || mediaUrls.length >= 5}
            className="flex items-center gap-1.5 text-sm text-primary font-medium hover:bg-primary/10 px-3 py-2 rounded-xl transition-colors disabled:opacity-40"
          >
            <Camera className="w-5 h-5" /> {t(lang, "addPhoto")}
          </button>
          <button
            onClick={() => videoRef.current?.click()}
            disabled={uploading || mediaTypes.includes("video")}
            className="flex items-center gap-1.5 text-sm text-primary font-medium hover:bg-primary/10 px-3 py-2 rounded-xl transition-colors disabled:opacity-40"
          >
            <Video className="w-5 h-5" /> {t(lang, "addVideo")}
          </button>
          {uploading && <span className="text-xs text-muted-foreground ms-auto">Uploading…</span>}
        </div>
      </motion.div>
    </div>
  );
}