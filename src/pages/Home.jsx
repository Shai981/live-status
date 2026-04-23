import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Search, Bell, Zap, Star, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import CategoryFilter from "@/components/updates/CategoryFilter";
import UpdateCard from "@/components/updates/UpdateCard";
import { getCategoryConfig } from "@/lib/categoryConfig";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

export default function Home() {
  const [updates, setUpdates] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(null);
  const [search, setSearch] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [upds, me] = await Promise.all([
      base44.entities.StatusUpdate.filter({ status_visibility: "visible" }, "-created_date", 50),
      base44.auth.me().catch(() => null),
    ]);
    setUpdates(upds);
    setUser(me);
    if (me) {
      const favs = await base44.entities.Favorite.filter({ user_id: me.id });
      setFavorites(favs);
    }
    setLoading(false);
  };

  const handleReact = async (updateId, reactionType) => {
    if (!user) return;
    await base44.entities.Reaction.create({
      update_id: updateId,
      user_id: user.id,
      reaction_type: reactionType,
    });
    const update = updates.find((u) => u.id === updateId);
    if (reactionType === "accurate") {
      await base44.entities.StatusUpdate.update(updateId, {
        confirm_count: (update.confirm_count || 0) + 1,
        accuracy_score: (update.accuracy_score || 0) + 1,
      });
    } else if (reactionType === "not_accurate") {
      await base44.entities.StatusUpdate.update(updateId, {
        deny_count: (update.deny_count || 0) + 1,
        accuracy_score: (update.accuracy_score || 0) - 1,
      });
    }
    setUpdates((prev) =>
      prev.map((u) =>
        u.id === updateId
          ? {
              ...u,
              confirm_count: reactionType === "accurate" ? (u.confirm_count || 0) + 1 : u.confirm_count,
              deny_count: reactionType === "not_accurate" ? (u.deny_count || 0) + 1 : u.deny_count,
            }
          : u
      )
    );
  };

  const favoriteLocationIds = favorites.map((f) => f.location_id);

  const filtered = updates.filter((u) => {
    if (category && u.category !== category) return false;
    if (search && !u.title?.toLowerCase().includes(search.toLowerCase()) &&
        !u.location_name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const favUpdates = filtered.filter((u) => favoriteLocationIds.includes(u.location_id));
  const otherUpdates = filtered.filter((u) => !favoriteLocationIds.includes(u.location_id));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-40 backdrop-blur-xl bg-card/95">
        <div className="max-w-lg mx-auto px-4 pt-12 pb-3">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Zap className="w-6 h-6 text-primary fill-primary" />
                Live Status
              </h1>
              <p className="text-xs text-muted-foreground">Real-time community updates</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadData}
                className="p-2 rounded-full hover:bg-secondary transition-colors"
              >
                <RefreshCw className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>
          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search places or updates…"
              className="pl-9 rounded-xl bg-secondary border-none text-sm h-10"
            />
          </div>
          {/* Category filter */}
          <CategoryFilter selected={category} onChange={setCategory} />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-36 bg-card rounded-2xl animate-pulse border border-border" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">🌍</div>
            <h3 className="font-semibold text-foreground mb-1">No updates yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Be the first to share what's happening around you.</p>
            <Link
              to="/add"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-medium text-sm"
            >
              Post an Update
            </Link>
          </div>
        ) : (
          <>
            {favUpdates.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                  <span className="text-sm font-semibold text-foreground">Favorite Places</span>
                </div>
                <div className="space-y-3">
                  <AnimatePresence>
                    {favUpdates.map((u) => (
                      <motion.div
                        key={u.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                      >
                        <UpdateCard update={u} onReact={handleReact} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {otherUpdates.length > 0 && (
              <div>
                {favUpdates.length > 0 && (
                  <p className="text-sm font-semibold text-foreground mb-2">Latest Updates</p>
                )}
                <div className="space-y-3">
                  <AnimatePresence>
                    {otherUpdates.map((u) => (
                      <motion.div
                        key={u.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                      >
                        <UpdateCard update={u} onReact={handleReact} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}