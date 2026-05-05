import { useState } from "react";
import { t, CATEGORIES } from "@/lib/i18n";
import { base44 } from "@/api/base44Client";
import Avatar from "./Avatar";
import { X, MapPin, ChevronDown, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function StatusRequestComposer({ lang, currentUser, onPosted, onClose }) {
  const [locationName, setLocationName] = useState("");
  const [question, setQuestion] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [showCategory, setShowCategory] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canPost = locationName.trim().length >= 2;

  const handleSubmit = async () => {
    if (!canPost || submitting) return;
    setSubmitting(true);
    await base44.entities.Post.create({
      user_id: currentUser?.id || "guest",
      user_name: currentUser?.full_name || "Anonymous",
      user_avatar: currentUser?.avatar_url || "",
      location_name: locationName.trim(),
      description: question.trim() || null,
      category: category || null,
      status_level: null,
      city: city.trim() || null,
      country: country.trim() || null,
      media_urls: [],
      media_types: [],
      like_count: 0, accurate_count: 0, outdated_count: 0, wow_count: 0,
      comment_count: 0, view_count: 0, report_count: 0,
      is_request: true,
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
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-amber-500" />
            <h2 className="font-bold text-foreground">Status Request</h2>
          </div>
          <button
            onClick={handleSubmit}
            disabled={!canPost || submitting}
            className="text-sm font-bold text-amber-500 disabled:opacity-40"
          >
            {submitting ? "..." : "Ask"}
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* Banner */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl px-4 py-3 text-sm text-amber-700 dark:text-amber-400 flex items-start gap-2">
            <HelpCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Ask the community about the current status of a place. Others can reply in the comments.</span>
          </div>

          {/* User + Location header */}
          <div className="flex gap-3">
            <Avatar name={currentUser?.full_name || "Anonymous"} src={currentUser?.avatar_url} size={44} />
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground mb-2">{currentUser?.full_name || "Anonymous"}</p>
              <div className="relative">
                <MapPin className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                <input
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value.slice(0, 80))}
                  placeholder="Which place do you want to know about?"
                  className="w-full ps-9 pe-14 py-2.5 text-base font-bold border-2 border-amber-400 rounded-xl bg-transparent text-foreground placeholder:text-muted-foreground outline-none"
                />
                <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  {locationName.length}/80
                </span>
              </div>
            </div>
          </div>

          {/* Question */}
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Add more context… (optional). E.g. 'Is the beach crowded today?'"
            rows={3}
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-secondary/30 text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none focus:border-amber-400 transition-colors"
          />

          {/* City / Country */}
          <div className="flex gap-2">
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City"
              className="flex-1 px-3 py-2 rounded-xl border border-border bg-secondary/30 text-sm text-foreground outline-none focus:border-amber-400 transition-colors"
            />
            <input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="Country"
              className="flex-1 px-3 py-2 rounded-xl border border-border bg-secondary/30 text-sm text-foreground outline-none focus:border-amber-400 transition-colors"
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
                          category === c.id ? "border-amber-400 bg-amber-50 dark:bg-amber-900/20" : "border-border hover:border-amber-300"
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
        </div>
      </motion.div>
    </div>
  );
}