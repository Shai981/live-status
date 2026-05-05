import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { detectLanguage, t, RTL_LANGUAGES, CATEGORIES } from "@/lib/i18n";
import PostCard from "@/components/social/PostCard";
import PostComposer from "@/components/social/PostComposer";
import StatusRequestComposer from "@/components/social/StatusRequestComposer";
import Avatar from "@/components/social/Avatar";
import LanguageSelector from "@/components/social/LanguageSelector";
import { Plus, Search, Bell, Zap, SlidersHorizontal, TrendingUp, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function FeedPage() {
  const [lang, setLang] = useState(detectLanguage());
  const [currentUser, setCurrentUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showComposer, setShowComposer] = useState(false);
  const [showRequestComposer, setShowRequestComposer] = useState(false);
  const [feedTab, setFeedTab] = useState("all"); // all | following
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);
  const [sort, setSort] = useState("newest");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [follows, setFollows] = useState([]);
  const [userReactions, setUserReactions] = useState({});
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  const isRTL = RTL_LANGUAGES.includes(lang);

  const handleLangChange = (code) => {
    localStorage.setItem("statusnow_lang", code);
    setLang(code);
  };

  useEffect(() => {
    document.documentElement.setAttribute("dir", isRTL ? "rtl" : "ltr");
  }, [isRTL]);

  useEffect(() => {
    loadData();
    const unsub = base44.entities.Post.subscribe((event) => {
      if (event.type === "create") setPosts((prev) => [event.data, ...prev]);
      else if (event.type === "update") setPosts((prev) => prev.map((p) => p.id === event.id ? event.data : p));
      else if (event.type === "delete") setPosts((prev) => prev.filter((p) => p.id !== event.id));
    });
    return unsub;
  }, []);

  const loadData = async () => {
    setLoading(true);
    const me = await base44.auth.me().catch(() => null);
    setCurrentUser(me);
    const [fetchedPosts] = await Promise.all([
      base44.entities.Post.filter({ is_hidden: false }, "-created_date", 80),
    ]);
    setPosts(fetchedPosts.filter((p) => !p.is_hidden));
    if (me) {
      const [followList, notifs] = await Promise.all([
        base44.entities.Follow.filter({ follower_id: me.id }),
        base44.entities.Notification.filter({ user_id: me.id, read: false }),
      ]);
      setFollows(followList.map((f) => f.following_id));
      setUnreadNotifs(notifs.length);
      const myReactions = await base44.entities.Reaction.filter({ user_id: me.id });
      const reactionMap = {};
      myReactions.forEach((r) => {
        if (!reactionMap[r.post_id]) reactionMap[r.post_id] = {};
        reactionMap[r.post_id][r.reaction_type] = true;
      });
      setUserReactions(reactionMap);
    }
    setLoading(false);
  };

  const filtered = useMemo(() => {
    let list = [...posts];
    if (feedTab === "following" && follows.length > 0) {
      list = list.filter((p) => follows.includes(p.user_id));
    }
    if (filterCategory) list = list.filter((p) => p.category === filterCategory);
    if (filterStatus) list = list.filter((p) => p.status_level === filterStatus);
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter((p) =>
        p.location_name?.toLowerCase().includes(s) ||
        p.city?.toLowerCase().includes(s) ||
        p.country?.toLowerCase().includes(s) ||
        p.user_name?.toLowerCase().includes(s)
      );
    }
    if (sort === "newest") list.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    else if (sort === "reactions") list.sort((a, b) => ((b.like_count || 0) + (b.accurate_count || 0) + (b.wow_count || 0)) - ((a.like_count || 0) + (a.accurate_count || 0) + (a.wow_count || 0)));
    else if (sort === "worst") {
      const order = { Bad: 0, Moderate: 1, Good: 2 };
      list.sort((a, b) => (order[a.status_level] ?? 3) - (order[b.status_level] ?? 3));
    }
    return list;
  }, [posts, feedTab, filterCategory, filterStatus, search, sort, follows]);

  // Trending locations (last 24h)
  const trending = useMemo(() => {
    const since = Date.now() - 86400000;
    const counts = {};
    posts.filter((p) => new Date(p.created_date).getTime() > since).forEach((p) => {
      counts[p.location_name] = (counts[p.location_name] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [posts]);

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? "rtl" : "ltr"}>
      {/* Composer */}
      <AnimatePresence>
        {showComposer && (
          <PostComposer
            lang={lang}
            currentUser={currentUser}
            onPosted={loadData}
            onClose={() => setShowComposer(false)}
          />
        )}
        {showRequestComposer && (
          <StatusRequestComposer
            lang={lang}
            currentUser={currentUser}
            onPosted={loadData}
            onClose={() => setShowRequestComposer(false)}
          />
        )}
      </AnimatePresence>

      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Zap className="w-6 h-6 text-primary fill-primary shrink-0" />
              <span className="text-xl font-extrabold text-foreground">{t(lang, "appName")}</span>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSelector lang={lang} onChange={handleLangChange} />
              {currentUser && (
                <>
                  <Link to="/notifications" className="relative p-2 rounded-full hover:bg-secondary transition-colors">
                    <Bell className="w-5 h-5 text-foreground" />
                    {unreadNotifs > 0 && (
                      <span className="absolute top-1 end-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {unreadNotifs > 9 ? "9+" : unreadNotifs}
                      </span>
                    )}
                  </Link>
                  <Link to="/profile">
                    <Avatar name={currentUser.full_name} src={currentUser.avatar_url} size={34} />
                  </Link>
                </>
              )}
              {!currentUser && (
                <button onClick={() => base44.auth.redirectToLogin()} className="text-sm font-semibold text-primary">
                  Sign in
                </button>
              )}
            </div>
          </div>

          {/* Feed tabs */}
          <div className="flex gap-1 mt-3 bg-secondary rounded-xl p-1">
            {["all", "following"].map((tab) => (
              <button
                key={tab}
                onClick={() => setFeedTab(tab)}
                className={cn(
                  "flex-1 py-2 text-sm font-semibold rounded-lg transition-all",
                  feedTab === tab ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                )}
              >
                {tab === "all" ? t(lang, "all") : t(lang, "following")}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Search + Sort */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t(lang, "search")}
              className="w-full ps-9 pe-4 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground outline-none focus:border-primary transition-colors"
            />
          </div>
          <div className="relative">
            <button
              onClick={() => setShowSortMenu((o) => !o)}
              className="flex items-center gap-1 px-3 py-2.5 rounded-xl border border-border bg-card hover:bg-secondary text-sm font-medium text-foreground transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
            </button>
            <AnimatePresence>
              {showSortMenu && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute end-0 top-full mt-1 bg-card border border-border rounded-xl shadow-xl z-30 min-w-[180px] overflow-hidden">
                  {[["newest", "sortNewest"], ["reactions", "sortReactions"], ["worst", "sortWorst"]].map(([val, key]) => (
                    <button key={val} onClick={() => { setSort(val); setShowSortMenu(false); }}
                      className={cn("w-full text-start px-4 py-2.5 text-sm hover:bg-secondary transition-colors", sort === val ? "font-semibold text-primary" : "text-foreground")}>
                      {t(lang, key)}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Category filter pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button onClick={() => setFilterCategory(null)}
            className={cn("shrink-0 px-3 py-1.5 rounded-full text-sm font-medium border transition-all",
              !filterCategory ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/40")}>
            {t(lang, "filterAll")}
          </button>
          {CATEGORIES.map((cat) => (
            <button key={cat.id} onClick={() => setFilterCategory(filterCategory === cat.id ? null : cat.id)}
              className={cn("shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all",
                filterCategory === cat.id ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/40")}>
              <span>{cat.emoji}</span><span>{t(lang, `cat_${cat.id}`)}</span>
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex gap-2">
          {[null, "Good", "Moderate", "Bad"].map((s) => (
            <button key={s ?? "all"} onClick={() => setFilterStatus(s)}
              className={cn("px-3 py-1.5 rounded-full text-xs font-bold border transition-all",
                filterStatus === s
                  ? s === "Good" ? "bg-green-500 text-white border-green-500"
                    : s === "Moderate" ? "bg-orange-400 text-white border-orange-400"
                    : s === "Bad" ? "bg-red-500 text-white border-red-500"
                    : "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:border-primary/40")}>
              {s ? t(lang, s.toLowerCase()) : t(lang, "filterAll")}
            </button>
          ))}
        </div>

        {/* Trending */}
        {trending.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-foreground">{t(lang, "trending")}</span>
            </div>
            <div className="space-y-2">
              {trending.map(([loc, count], i) => (
                <div key={loc} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground">{i + 1}</span>
                    <button onClick={() => setSearch(loc)} className="text-sm font-medium text-foreground hover:text-primary transition-colors text-start">{loc}</button>
                  </div>
                  <span className="text-xs text-muted-foreground">{count} posts</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feed */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-48 bg-card border border-border rounded-2xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-3">🌍</div>
            <p className="font-semibold text-foreground mb-1">{search || filterCategory ? t(lang, "noResults") : t(lang, "noUpdates")}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {filtered.map((post) => (
                <motion.div key={post.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <PostCard
                    post={post}
                    lang={lang}
                    currentUser={currentUser}
                    userReactions={userReactions[post.id] || {}}
                    onDeleted={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))}
                    onUpdated={(updated) => setPosts((prev) => prev.map((p) => p.id === updated.id ? updated : p))}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* FABs */}
      <div className="fixed bottom-6 end-6 flex flex-col items-end gap-3 z-40">
        <button
          onClick={() => setShowRequestComposer(true)}
          className="flex items-center gap-2 px-4 h-12 rounded-full bg-amber-400 text-white shadow-xl hover:scale-105 active:scale-95 transition-transform"
        >
          <HelpCircle className="w-5 h-5" strokeWidth={2.5} />
          <span className="text-sm font-bold">Ask</span>
        </button>
        <button
          onClick={() => setShowComposer(true)}
          className="w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
        >
          <Plus className="w-7 h-7" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}