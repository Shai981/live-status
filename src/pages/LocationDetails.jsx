import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { getCategoryConfig, getFreshnessLabel, isStale } from "@/lib/categoryConfig";
import { ArrowLeft, Star, MapPin, CheckCircle, ThumbsDown, Flag, Plus, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReportModal from "@/components/updates/ReportModal";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function LocationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [location, setLocation] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [user, setUser] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteId, setFavoriteId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportUpdateId, setReportUpdateId] = useState(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    const [loc, upds, me] = await Promise.all([
      base44.entities.Location.filter({ id }),
      base44.entities.StatusUpdate.filter({ location_id: id, status_visibility: "visible" }, "-created_date"),
      base44.auth.me().catch(() => null),
    ]);
    setLocation(loc[0]);
    setUpdates(upds);
    setUser(me);
    if (me) {
      const favs = await base44.entities.Favorite.filter({ user_id: me.id, location_id: id });
      if (favs.length > 0) { setIsFavorite(true); setFavoriteId(favs[0].id); }
    }
    setLoading(false);
  };

  const toggleFavorite = async () => {
    if (!user) return;
    if (isFavorite) {
      await base44.entities.Favorite.delete(favoriteId);
      setIsFavorite(false);
      setFavoriteId(null);
    } else {
      const fav = await base44.entities.Favorite.create({
        user_id: user.id,
        location_id: id,
        location_name: location?.name,
      });
      setIsFavorite(true);
      setFavoriteId(fav.id);
    }
  };

  const handleReact = async (updateId, reactionType) => {
    if (!user) return;
    await base44.entities.Reaction.create({ update_id: updateId, user_id: user.id, reaction_type: reactionType });
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
    if (reactionType === "accurate") {
      await base44.entities.StatusUpdate.update(updateId, {
        confirm_count: (updates.find(u => u.id === updateId)?.confirm_count || 0) + 1,
        accuracy_score: (updates.find(u => u.id === updateId)?.accuracy_score || 0) + 1,
      });
    } else {
      await base44.entities.StatusUpdate.update(updateId, {
        deny_count: (updates.find(u => u.id === updateId)?.deny_count || 0) + 1,
        accuracy_score: (updates.find(u => u.id === updateId)?.accuracy_score || 0) - 1,
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!location) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Location not found.</p>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  const cat = getCategoryConfig(location.category);
  const latestUpdate = updates[0];
  const trusted = [...updates].sort((a, b) => (b.accuracy_score || 0) - (a.accuracy_score || 0))[0];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className={cn("bg-category-" + cat.color, "pt-14 pb-6 px-4 text-white relative")}>
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="absolute top-14 left-4 p-2 bg-white/20 rounded-full backdrop-blur-sm"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="text-center pt-4">
            <div className="text-4xl mb-2">{cat.emoji}</div>
            <h1 className="text-2xl font-bold mb-1">{location.name}</h1>
            {location.city && (
              <p className="text-white/80 text-sm flex items-center justify-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> {location.city}
              </p>
            )}
          </div>
          <div className="flex justify-center gap-3 mt-4">
            <button
              onClick={toggleFavorite}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium backdrop-blur-sm transition-all",
                isFavorite ? "bg-amber-400 text-amber-900" : "bg-white/20 text-white hover:bg-white/30"
              )}
            >
              <Star className={cn("w-4 h-4", isFavorite && "fill-amber-900")} />
              {isFavorite ? "Saved" : "Save"}
            </button>
            <Link
              to={`/add?location=${id}`}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm transition-all"
            >
              <Plus className="w-4 h-4" /> Post Update
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
        {/* Live summary */}
        {latestUpdate && (
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse-dot" />
                Live Status
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" /> {getFreshnessLabel(latestUpdate.created_date)}
              </span>
            </div>
            <h3 className="font-semibold text-foreground mb-1">{latestUpdate.title}</h3>
            <p className="text-sm text-muted-foreground">{latestUpdate.description}</p>
          </div>
        )}

        {/* Most trusted update */}
        {trusted && trusted.id !== latestUpdate?.id && trusted.accuracy_score > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-semibold text-amber-700">Most Trusted</span>
            </div>
            <h3 className="font-semibold text-foreground mb-1">{trusted.title}</h3>
            <p className="text-sm text-muted-foreground">{trusted.description}</p>
            <p className="text-xs text-amber-600 mt-2">{trusted.confirm_count} confirmations</p>
          </div>
        )}

        {/* Updates list */}
        <div>
          <h2 className="text-base font-bold text-foreground mb-3">
            All Updates ({updates.length})
          </h2>
          {updates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No updates yet. Be the first!
            </div>
          ) : (
            <div className="space-y-3">
              {updates.map((update, i) => {
                const stale = isStale(update.created_date);
                return (
                  <motion.div
                    key={update.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={cn(
                      "bg-card border border-border rounded-2xl p-4",
                      stale && "opacity-60"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h4 className="font-semibold text-foreground">{update.title}</h4>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" /> {getFreshnessLabel(update.created_date)}
                          {stale && <span className="text-amber-500 ml-1">· may be outdated</span>}
                        </p>
                      </div>
                      <button
                        onClick={() => setReportUpdateId(update.id)}
                        className="p-1.5 rounded-full hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                      >
                        <Flag className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{update.description}</p>
                    {update.photo_url && (
                      <img src={update.photo_url} alt="" className="w-full h-36 object-cover rounded-xl mb-3" />
                    )}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleReact(update.id, "accurate")}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-green-600 transition-colors px-2 py-1 rounded-lg hover:bg-green-50"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Accurate {update.confirm_count > 0 && `(${update.confirm_count})`}
                      </button>
                      <button
                        onClick={() => handleReact(update.id, "not_accurate")}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                        Not accurate {update.deny_count > 0 && `(${update.deny_count})`}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <ReportModal
        updateId={reportUpdateId}
        open={!!reportUpdateId}
        onClose={() => setReportUpdateId(null)}
      />
    </div>
  );
}