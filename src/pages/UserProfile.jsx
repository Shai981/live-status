import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { getCategoryConfig, getFreshnessLabel } from "@/lib/categoryConfig";
import { User, Star, Award, MapPin, Clock, Zap, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const BADGES = {
  newcomer: { label: "Newcomer", emoji: "🌱", color: "text-green-600 bg-green-50" },
  contributor: { label: "Contributor", emoji: "⭐", color: "text-amber-600 bg-amber-50" },
  local_reporter: { label: "Local Reporter", emoji: "📍", color: "text-blue-600 bg-blue-50" },
  top_contributor: { label: "Top Contributor", emoji: "🏆", color: "text-purple-600 bg-purple-50" },
};

export default function UserProfile() {
  const [user, setUser] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const me = await base44.auth.me().catch(() => null);
    setUser(me);
    if (me) {
      const [upds, favs] = await Promise.all([
        base44.entities.StatusUpdate.filter({ user_id: me.id }, "-created_date", 20),
        base44.entities.Favorite.filter({ user_id: me.id }),
      ]);
      setUpdates(upds);
      setFavorites(favs);
    }
    setLoading(false);
  };

  const getBadge = (trustScore, updateCount) => {
    if (updateCount >= 50 || trustScore >= 100) return "top_contributor";
    if (updateCount >= 20 || trustScore >= 40) return "local_reporter";
    if (updateCount >= 5 || trustScore >= 10) return "contributor";
    return "newcomer";
  };

  const handleLogout = () => {
    base44.auth.logout("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-6">
        <div className="text-5xl mb-2">👤</div>
        <h2 className="text-xl font-bold text-foreground">Sign in to see your profile</h2>
        <p className="text-muted-foreground text-sm text-center">Create updates, save favorites, and build your community reputation.</p>
        <Button onClick={() => base44.auth.redirectToLogin()} className="w-full max-w-xs rounded-xl">
          Sign In
        </Button>
      </div>
    );
  }

  const badgeId = getBadge(user.trust_score || 0, updates.length);
  const badge = BADGES[badgeId];

  const stats = [
    { label: "Updates", value: updates.length, icon: "📍" },
    { label: "Trust Score", value: user.trust_score || 0, icon: "⭐" },
    { label: "Saved Places", value: favorites.length, icon: "❤️" },
    { label: "Helpful Votes", value: updates.reduce((acc, u) => acc + (u.confirm_count || 0), 0), icon: "✅" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary to-primary/80 pt-14 pb-8 px-4 text-white">
        <div className="max-w-lg mx-auto">
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-xl font-bold">Profile</h1>
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-white/80 hover:text-white transition-colors">
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
              {user.profile_photo ? (
                <img src={user.profile_photo} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-8 h-8 text-white/80" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold">{user.full_name || "Anonymous"}</h2>
              <p className="text-white/70 text-sm">{user.email}</p>
              <span className={`mt-1 inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full ${badge.color}`}>
                {badge.emoji} {badge.label}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2 mt-5">
            {stats.map((s) => (
              <div key={s.label} className="bg-white/15 rounded-xl p-2.5 text-center backdrop-blur-sm">
                <div className="text-xl mb-0.5">{s.icon}</div>
                <div className="text-lg font-bold">{s.value}</div>
                <div className="text-[10px] text-white/70">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-5">
        {/* Saved places */}
        {favorites.length > 0 && (
          <div>
            <h2 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> Saved Places
            </h2>
            <div className="space-y-2">
              {favorites.map((fav) => (
                <a
                  key={fav.id}
                  href={`/location/${fav.location_id}`}
                  className="flex items-center gap-3 bg-card border border-border rounded-xl p-3 hover:border-primary/40 transition-all"
                >
                  <MapPin className="w-4 h-4 text-primary shrink-0" />
                  <span className="font-medium text-sm text-foreground">{fav.location_name}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* My updates */}
        <div>
          <h2 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" /> My Updates
          </h2>
          {updates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm bg-card border border-border rounded-2xl">
              You haven't posted any updates yet.
            </div>
          ) : (
            <div className="space-y-3">
              {updates.map((u, i) => {
                const cat = getCategoryConfig(u.category);
                return (
                  <motion.div
                    key={u.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="bg-card border border-border rounded-2xl p-4"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl">{cat.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-semibold text-category-${cat.color}`}>{cat.label}</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {getFreshnessLabel(u.created_date)}
                          </span>
                        </div>
                        <p className="font-medium text-sm text-foreground truncate">{u.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{u.location_name}</p>
                        {u.confirm_count > 0 && (
                          <p className="text-xs text-green-600 mt-1">✅ {u.confirm_count} confirmed accurate</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}