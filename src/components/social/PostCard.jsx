import { useState } from "react";
import { t, timeAgo, getCategoryEmoji } from "@/lib/i18n";
import { base44 } from "@/api/base44Client";
import Avatar from "./Avatar";
import MediaGallery from "./MediaGallery";
import CommentThread from "./CommentThread";
import { ThumbsUp, CheckCircle, Clock, Star, MessageCircle, Share2, MoreHorizontal, Trash2, Edit3, Flag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const STATUS_COLORS = {
  Good: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
  Moderate: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400",
  Bad: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
};
const STATUS_STRIPE = { Good: "bg-green-500", Moderate: "bg-orange-400", Bad: "bg-red-500" };

const REACTIONS = [
  { key: "like", IconComp: ThumbsUp, label: "like", countKey: "like_count", color: "hover:text-blue-500" },
  { key: "accurate", IconComp: CheckCircle, label: "accurate", countKey: "accurate_count", color: "hover:text-green-600" },
  { key: "outdated", IconComp: Clock, label: "outdated", countKey: "outdated_count", color: "hover:text-amber-500" },
  { key: "wow", IconComp: Star, label: "wow", countKey: "wow_count", color: "hover:text-purple-500" },
];

export default function PostCard({ post, lang, currentUser, onDeleted, onUpdated, userReactions = {} }) {
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [localPost, setLocalPost] = useState(post);
  const [localReactions, setLocalReactions] = useState(userReactions);
  const [shared, setShared] = useState(false);

  const isOwn = currentUser?.id === localPost.user_id;
  const ageHours = (Date.now() - new Date(localPost.created_date).getTime()) / 3600000;
  const isOld = ageHours > 3;
  const isVerified = localPost.accurate_count >= 5;
  const isLikelyOutdated = localPost.outdated_count - localPost.accurate_count >= 3;
  const desc = localPost.description || "";
  const isLong = desc.length > 200;
  const displayDesc = isLong && !expanded ? desc.slice(0, 200) + "…" : desc;

  const handleReact = async (reactionKey, countKey) => {
    if (!currentUser) return;
    const alreadyReacted = localReactions[reactionKey];
    const delta = alreadyReacted ? -1 : 1;
    const newReaction = alreadyReacted ? null : reactionKey;

    setLocalReactions((prev) => ({ ...prev, [reactionKey]: !alreadyReacted }));
    setLocalPost((prev) => ({ ...prev, [countKey]: Math.max(0, (prev[countKey] || 0) + delta) }));

    if (alreadyReacted) {
      const reactions = await base44.entities.Reaction.filter({ post_id: localPost.id, user_id: currentUser.id, reaction_type: reactionKey });
      if (reactions[0]) await base44.entities.Reaction.delete(reactions[0].id);
    } else {
      await base44.entities.Reaction.create({ post_id: localPost.id, user_id: currentUser.id, reaction_type: reactionKey });
    }
    await base44.entities.Post.update(localPost.id, { [countKey]: Math.max(0, (localPost[countKey] || 0) + delta) });
    onUpdated?.({ ...localPost, [countKey]: Math.max(0, (localPost[countKey] || 0) + delta) });
  };

  const handleDelete = async () => {
    await base44.entities.Post.delete(localPost.id);
    onDeleted?.(localPost.id);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/?post=${localPost.id}`;
    if (navigator.share) {
      navigator.share({ title: localPost.location_name, url });
    } else {
      navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  const handleReport = async () => {
    await base44.entities.Post.update(localPost.id, { report_count: (localPost.report_count || 0) + 1 });
    setShowMenu(false);
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {localPost.status_level && (
        <div className={`h-1 w-full ${STATUS_STRIPE[localPost.status_level] || "bg-muted"}`} />
      )}
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-start gap-3 min-w-0">
            <Avatar name={localPost.user_name || "?"} src={localPost.user_avatar} size={42} />
            <div className="min-w-0">
              <p className="font-semibold text-foreground text-sm leading-tight">{localPost.user_name || "User"}</p>
              {(localPost.city || localPost.country) && (
                <p className="text-xs text-muted-foreground">{[localPost.city, localPost.country].filter(Boolean).join(", ")}</p>
              )}
              <p className="text-xs text-muted-foreground">{timeAgo(lang, localPost.created_date)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {localPost.category && (
              <span className="text-xl" title={localPost.category}>{getCategoryEmoji(localPost.category)}</span>
            )}
            {localPost.status_level && (
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_COLORS[localPost.status_level]}`}>
                {t(lang, localPost.status_level.toLowerCase())}
              </span>
            )}
            <div className="relative">
              <button onClick={() => setShowMenu((o) => !o)} className="p-1.5 rounded-full hover:bg-secondary transition-colors">
                <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
              </button>
              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute end-0 top-8 bg-card border border-border rounded-xl shadow-xl z-20 min-w-[140px] overflow-hidden"
                  >
                    {isOwn ? (
                      <>
                        <button onClick={handleDelete} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-destructive hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                          <Trash2 className="w-4 h-4" /> {t(lang, "delete")}
                        </button>
                      </>
                    ) : (
                      <button onClick={handleReport} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-muted-foreground hover:bg-secondary transition-colors">
                        <Flag className="w-4 h-4" /> {t(lang, "report")}
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* LOCATION HEADER — mandatory, always dominant */}
        <h2 className="text-xl font-extrabold text-foreground leading-snug mb-2">{localPost.location_name}</h2>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          {isVerified && (
            <span className="text-xs font-semibold text-green-700 bg-green-100 dark:bg-green-900/40 dark:text-green-400 px-2.5 py-0.5 rounded-full">
              {t(lang, "verified")}
            </span>
          )}
          {isLikelyOutdated && (
            <span className="text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-900/30 px-2.5 py-0.5 rounded-full">
              {t(lang, "likelyOutdated")}
            </span>
          )}
          {!isLikelyOutdated && isOld && localPost.accurate_count < 5 && (
            <span className="text-xs font-semibold text-amber-600 bg-amber-50 dark:bg-amber-900/30 px-2.5 py-0.5 rounded-full">
              {t(lang, "possiblyOutdated")}
            </span>
          )}
        </div>

        {/* Media */}
        <MediaGallery urls={localPost.media_urls || []} types={localPost.media_types || []} />

        {/* Description */}
        {desc && (
          <div className="mt-3">
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{displayDesc}</p>
            {isLong && (
              <button onClick={() => setExpanded((e) => !e)} className="text-xs text-primary font-medium mt-1">
                {expanded ? t(lang, "readLess") : t(lang, "readMore")}
              </button>
            )}
          </div>
        )}

        {/* Reaction bar */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
          <div className="flex items-center gap-1 flex-wrap">
            {REACTIONS.map(({ key, IconComp, label, countKey, color }) => {
              const active = localReactions[key];
              return (
                <button
                  key={key}
                  onClick={() => handleReact(key, countKey)}
                  className={`flex items-center gap-1 text-xs px-2 py-1.5 rounded-xl transition-all ${
                    active
                      ? "bg-primary/10 text-primary font-semibold"
                      : `text-muted-foreground hover:bg-secondary ${color}`
                  }`}
                >
                  <IconComp className="w-3.5 h-3.5" strokeWidth={active ? 2.5 : 1.5} />
                  <span>{t(lang, label)}</span>
                  {localPost[countKey] > 0 && <span className="font-bold">{localPost[countKey]}</span>}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowComments((o) => !o)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary px-2 py-1.5 rounded-xl hover:bg-secondary transition-all"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              {localPost.comment_count > 0 && <span>{localPost.comment_count}</span>}
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary px-2 py-1.5 rounded-xl hover:bg-secondary transition-all"
            >
              <Share2 className="w-3.5 h-3.5" />
              {shared && <span className="text-green-600 text-[10px]">✓</span>}
            </button>
          </div>
        </div>

        {/* Comments */}
        <AnimatePresence>
          {showComments && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <CommentThread postId={localPost.id} postUserId={localPost.user_id} lang={lang} currentUser={currentUser} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}