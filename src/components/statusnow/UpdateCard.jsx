import { useState } from "react";
import { t, timeAgo, getCategoryEmoji, avatarColor } from "@/lib/i18n";
import { base44 } from "@/api/base44Client";
import { Trash2, Flag, Link as LinkIcon, CheckCircle, ThumbsDown } from "lucide-react";

const STATUS_BADGE = {
  Good: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
  Moderate: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400",
  Bad: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
};

const STATUS_STRIPE = {
  Good: "bg-green-500",
  Moderate: "bg-orange-400",
  Bad: "bg-red-500",
};

export default function UpdateCard({ update, lang, nickname, onDeleted, onUpdated }) {
  const [copied, setCopied] = useState(false);
  const [acting, setActing] = useState(false);

  const isOwn = update.nickname === nickname;
  const ageHours = (Date.now() - new Date(update.created_date).getTime()) / 3600000;
  const isOld = ageHours > 3;
  const isVerified = update.confirm_count >= 5;
  const isLikelyOutdated = update.downvote_count - update.confirm_count >= 3;

  const handleConfirm = async () => {
    if (acting) return;
    setActing(true);
    const updated = await base44.entities.StatusUpdate.update(update.id, {
      confirm_count: (update.confirm_count || 0) + 1,
    });
    onUpdated({ ...update, confirm_count: (update.confirm_count || 0) + 1 });
    setActing(false);
  };

  const handleDownvote = async () => {
    if (acting) return;
    setActing(true);
    await base44.entities.StatusUpdate.update(update.id, {
      downvote_count: (update.downvote_count || 0) + 1,
    });
    onUpdated({ ...update, downvote_count: (update.downvote_count || 0) + 1 });
    setActing(false);
  };

  const handleDelete = async () => {
    await base44.entities.StatusUpdate.delete(update.id);
    onDeleted(update.id);
  };

  const handleReport = async () => {
    const localKey = `reports_${update.id}`;
    const count = parseInt(localStorage.getItem(localKey) || "0") + 1;
    localStorage.setItem(localKey, count);
    if (count >= 3) {
      onDeleted(update.id);
      return;
    }
    await base44.entities.StatusUpdate.update(update.id, {
      report_count: (update.report_count || 0) + 1,
    });
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?id=${update.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const color = avatarColor(update.nickname || "?");

  return (
    <div className={`bg-card border border-border rounded-2xl overflow-hidden shadow-sm transition-all hover:shadow-md ${isLikelyOutdated ? "opacity-60" : ""}`}>
      <div className={`h-1 w-full ${STATUS_STRIPE[update.status_level] || "bg-muted"}`} />
      <div className="p-4">
        {/* Top row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-2xl">{getCategoryEmoji(update.category)}</span>
            <div className="min-w-0">
              <p className="font-bold text-foreground truncate leading-tight">{update.location_name}</p>
              {(update.city || update.country) && (
                <p className="text-xs text-muted-foreground truncate">
                  {[update.city, update.country].filter(Boolean).join(", ")}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_BADGE[update.status_level]}`}>
              {t(lang, (update.status_level || "").toLowerCase())}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-foreground leading-relaxed mb-3">{update.description}</p>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {isVerified && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 px-2.5 py-0.5 rounded-full">
              <CheckCircle className="w-3 h-3" /> {t(lang, "verified")}
            </span>
          )}
          {isLikelyOutdated && (
            <span className="text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-900/30 px-2.5 py-0.5 rounded-full">
              ❌ {t(lang, "likelyOutdated")}
            </span>
          )}
          {!isLikelyOutdated && isOld && (
            <span className="text-xs font-semibold text-amber-600 bg-amber-50 dark:bg-amber-900/30 px-2.5 py-0.5 rounded-full">
              ⏰ {t(lang, "possiblyOutdated")}
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
          {/* Author + time */}
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ backgroundColor: color }}
            >
              {(update.nickname || "?")[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-semibold text-foreground truncate block">{update.nickname}</span>
              <span className="text-xs text-muted-foreground">{timeAgo(lang, update.created_date)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleConfirm}
              disabled={acting}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-green-600 transition-colors px-2 py-1 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>{update.confirm_count > 0 ? update.confirm_count : ""} {t(lang, "confirmAccurate")}</span>
            </button>
            <button
              onClick={handleDownvote}
              disabled={acting}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <ThumbsDown className="w-3.5 h-3.5" />
              {update.downvote_count > 0 && <span>{update.downvote_count}</span>}
            </button>
            <button
              onClick={handleCopyLink}
              title={t(lang, "copyLink")}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-secondary transition-colors"
            >
              {copied ? <span className="text-xs text-green-600">✓</span> : <LinkIcon className="w-3.5 h-3.5" />}
            </button>
            {isOwn ? (
              <button
                onClick={handleDelete}
                title={t(lang, "deletePost")}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleReport}
                title={t(lang, "reportSpam")}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
              >
                <Flag className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}