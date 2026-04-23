import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { detectLanguage, t, RTL_LANGUAGES, avatarColor } from "@/lib/i18n";
import NicknameModal from "@/components/statusnow/NicknameModal";
import PostForm from "@/components/statusnow/PostForm";
import UpdateCard from "@/components/statusnow/UpdateCard";
import FilterBar from "@/components/statusnow/FilterBar";
import StatsBar from "@/components/statusnow/StatsBar";
import LanguageSelector from "@/components/statusnow/LanguageSelector";
import { Plus, Search, SlidersHorizontal, Settings, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const SORT_OPTIONS = ["newest", "confirmed", "worst"];

export default function StatusNow() {
  const [lang, setLang] = useState(detectLanguage());
  const [nickname, setNickname] = useState(localStorage.getItem("statusnow_nick") || "");
  const [showNicknameModal, setShowNicknameModal] = useState(!localStorage.getItem("statusnow_nick"));
  const [showPostForm, setShowPostForm] = useState(false);
  const [showChangeNick, setShowChangeNick] = useState(false);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [showSortMenu, setShowSortMenu] = useState(false);

  const isRTL = RTL_LANGUAGES.includes(lang);

  const handleLangChange = (code) => {
    localStorage.setItem("statusnow_lang", code);
    setLang(code);
  };

  useEffect(() => {
    document.documentElement.setAttribute("dir", isRTL ? "rtl" : "ltr");
  }, [isRTL]);

  const loadUpdates = async () => {
    setLoading(true);
    const data = await base44.entities.StatusUpdate.list("-created_date", 100);
    setUpdates(data);
    setLoading(false);
  };

  useEffect(() => {
    loadUpdates();
    // Subscribe to real-time updates
    const unsub = base44.entities.StatusUpdate.subscribe((event) => {
      if (event.type === "create") {
        setUpdates((prev) => [event.data, ...prev]);
      } else if (event.type === "update") {
        setUpdates((prev) => prev.map((u) => u.id === event.id ? event.data : u));
      } else if (event.type === "delete") {
        setUpdates((prev) => prev.filter((u) => u.id !== event.id));
      }
    });
    return unsub;
  }, []);

  const handlePosted = () => loadUpdates();
  const handleDeleted = (id) => setUpdates((prev) => prev.filter((u) => u.id !== id));
  const handleUpdated = (updated) => setUpdates((prev) => prev.map((u) => u.id === updated.id ? updated : u));

  const filtered = useMemo(() => {
    let list = [...updates];
    if (category) list = list.filter((u) => u.category === category);
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter((u) =>
        u.location_name?.toLowerCase().includes(s) ||
        u.city?.toLowerCase().includes(s) ||
        u.country?.toLowerCase().includes(s)
      );
    }
    if (sort === "newest") list.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    else if (sort === "confirmed") list.sort((a, b) => (b.confirm_count || 0) - (a.confirm_count || 0));
    else if (sort === "worst") list.sort((a, b) => {
      const order = { Bad: 0, Moderate: 1, Good: 2 };
      return (order[a.status_level] ?? 3) - (order[b.status_level] ?? 3);
    });
    return list;
  }, [updates, category, search, sort]);

  const avatarBg = nickname ? avatarColor(nickname) : "#6b7280";

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? "rtl" : "ltr"}>
      {/* Nickname modal */}
      {(showNicknameModal || showChangeNick) && (
        <NicknameModal
          lang={lang}
          onSave={(nick) => {
            setNickname(nick);
            setShowNicknameModal(false);
            setShowChangeNick(false);
          }}
        />
      )}

      {/* Post form */}
      {showPostForm && (
        <PostForm
          lang={lang}
          nickname={nickname}
          onClose={() => setShowPostForm(false)}
          onPosted={handlePosted}
        />
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-primary fill-primary shrink-0" />
            <div>
              <h1 className="text-lg font-extrabold text-foreground leading-tight">{t(lang, "appName")}</h1>
              <p className="text-[10px] text-muted-foreground hidden sm:block">{t(lang, "tagline")}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LanguageSelector lang={lang} onChange={handleLangChange} />
            {/* Avatar + nickname change */}
            {nickname && (
              <button
                onClick={() => setShowChangeNick(true)}
                className="flex items-center gap-1.5 group"
                title={t(lang, "changeNickname")}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                  style={{ backgroundColor: avatarBg }}
                >
                  {nickname[0].toUpperCase()}
                </div>
                <Settings className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pb-24">
        {/* Stats bar */}
        <div className="py-3">
          <StatsBar lang={lang} updates={updates} />
        </div>

        {/* Search + Sort */}
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t(lang, "search")}
              className="w-full ps-9 pe-4 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground outline-none focus:border-primary transition-colors"
            />
          </div>
          <div className="relative">
            <button
              onClick={() => setShowSortMenu((o) => !o)}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-border bg-card hover:bg-secondary transition-colors text-sm font-medium text-foreground"
            >
              <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
              <span className="hidden sm:inline">{t(lang, sort === "newest" ? "sortNewest" : sort === "confirmed" ? "sortMostConfirmed" : "sortWorst")}</span>
            </button>
            {showSortMenu && (
              <div className="absolute end-0 top-full mt-1.5 bg-card border border-border rounded-xl shadow-xl z-30 min-w-[180px] overflow-hidden">
                {SORT_OPTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => { setSort(s); setShowSortMenu(false); }}
                    className={`w-full text-start px-4 py-2.5 text-sm hover:bg-secondary transition-colors ${sort === s ? "font-semibold text-primary" : "text-foreground"}`}
                  >
                    {t(lang, s === "newest" ? "sortNewest" : s === "confirmed" ? "sortMostConfirmed" : "sortWorst")}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Category filter */}
        <div className="mb-4">
          <FilterBar lang={lang} selected={category} onChange={setCategory} />
        </div>

        {/* Feed */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-card border border-border rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-3">🌍</div>
            <p className="font-semibold text-foreground mb-1">
              {search || category ? t(lang, "noResults") : t(lang, "noUpdates")}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filtered.map((update) => (
                <motion.div
                  key={update.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <UpdateCard
                    update={update}
                    lang={lang}
                    nickname={nickname}
                    onDeleted={handleDeleted}
                    onUpdated={handleUpdated}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* FAB */}
      <button
        onClick={() => nickname ? setShowPostForm(true) : setShowNicknameModal(true)}
        className="fixed bottom-6 end-6 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform z-40"
      >
        <Plus className="w-7 h-7" strokeWidth={2.5} />
      </button>
    </div>
  );
}