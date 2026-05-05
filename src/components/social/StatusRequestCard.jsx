import { useState } from "react";
import { t, timeAgo, getCategoryEmoji } from "@/lib/i18n";
import { base44 } from "@/api/base44Client";
import Avatar from "./Avatar";
import { HelpCircle, MessageCircle, CheckCircle, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function StatusRequestCard({ request, lang, currentUser, onReply }) {
  const [replyText, setReplyText] = useState("");
  const [showReply, setShowReply] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localRequest, setLocalRequest] = useState(request);

  const handleReply = async () => {
    if (!replyText.trim() || submitting) return;
    setSubmitting(true);

    // Create a post as reply to this request
    await base44.entities.Post.create({
      user_id: currentUser?.id || "guest",
      user_name: currentUser?.full_name || "Anonymous",
      user_avatar: currentUser?.avatar_url || "",
      location_name: localRequest.location_name,
      description: replyText.trim(),
      category: localRequest.category || null,
      city: localRequest.city || null,
      country: localRequest.country || null,
      like_count: 0, accurate_count: 0, outdated_count: 0, wow_count: 0,
      comment_count: 0, view_count: 0, report_count: 0,
      language_code: lang,
    });

    const newCount = (localRequest.reply_count || 0) + 1;
    await base44.entities.StatusRequest.update(localRequest.id, { reply_count: newCount });
    setLocalRequest((prev) => ({ ...prev, reply_count: newCount }));

    setReplyText("");
    setShowReply(false);
    setSubmitting(false);
    onReply?.();
  };

  const handleResolve = async () => {
    await base44.entities.StatusRequest.update(localRequest.id, { is_resolved: true });
    setLocalRequest((prev) => ({ ...prev, is_resolved: true }));
  };

  return (
    <div className={`bg-card border rounded-2xl overflow-hidden shadow-sm transition-all ${localRequest.is_resolved ? "border-green-300 dark:border-green-700 opacity-75" : "border-amber-200 dark:border-amber-800"}`}>
      {/* Top stripe */}
      <div className={`h-1 w-full ${localRequest.is_resolved ? "bg-green-500" : "bg-amber-400"}`} />
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-start gap-3 min-w-0">
            <Avatar name={localRequest.user_name || "?"} src={localRequest.user_avatar} size={40} />
            <div className="min-w-0">
              <p className="font-semibold text-foreground text-sm">{localRequest.user_name || "Anonymous"}</p>
              {(localRequest.city || localRequest.country) && (
                <p className="text-xs text-muted-foreground">{[localRequest.city, localRequest.country].filter(Boolean).join(", ")}</p>
              )}
              <p className="text-xs text-muted-foreground">{timeAgo(lang, localRequest.created_date)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {localRequest.category && (
              <span className="text-xl">{getCategoryEmoji(localRequest.category)}</span>
            )}
            {localRequest.is_resolved ? (
              <span className="text-xs font-bold text-green-600 bg-green-100 dark:bg-green-900/30 px-2.5 py-1 rounded-full flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> {t(lang, "resolved") || "Resolved"}
              </span>
            ) : (
              <span className="text-xs font-bold text-amber-600 bg-amber-100 dark:bg-amber-900/30 px-2.5 py-1 rounded-full flex items-center gap-1">
                <HelpCircle className="w-3 h-3" /> {t(lang, "open") || "Open"}
              </span>
            )}
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1.5 mb-2">
          <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
          <h2 className="text-lg font-extrabold text-foreground leading-snug">{localRequest.location_name}</h2>
        </div>

        {/* Note */}
        {localRequest.note && (
          <p className="text-sm text-muted-foreground mb-3 italic">"{localRequest.note}"</p>
        )}

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MessageCircle className="w-3.5 h-3.5" />
            <span>{localRequest.reply_count || 0} {t(lang, "replies") || "replies"}</span>
          </div>
          <div className="flex items-center gap-2">
            {!localRequest.is_resolved && currentUser?.id === localRequest.user_id && (
              <button
                onClick={handleResolve}
                className="text-xs text-green-600 font-semibold hover:bg-green-50 dark:hover:bg-green-900/20 px-2.5 py-1.5 rounded-xl transition-colors"
              >
                <CheckCircle className="w-3.5 h-3.5 inline me-1" />{t(lang, "markResolved") || "Mark resolved"}
              </button>
            )}
            {!localRequest.is_resolved && (
              <button
                onClick={() => setShowReply((o) => !o)}
                className="text-xs text-amber-600 font-semibold bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 px-2.5 py-1.5 rounded-xl transition-colors"
              >
                {t(lang, "replyWithStatus") || "Reply with status"}
              </button>
            )}
          </div>
        </div>

        {/* Reply input */}
        <AnimatePresence>
          {showReply && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="mt-3 flex gap-2">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={t(lang, "replyPlaceholder") || "Share what you know about this place…"}
                  rows={2}
                  className="flex-1 px-3 py-2 rounded-xl border border-amber-300 bg-secondary/30 text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none focus:border-amber-400 transition-colors"
                />
                <button
                  onClick={handleReply}
                  disabled={!replyText.trim() || submitting}
                  className="px-4 py-2 bg-amber-400 text-white font-bold text-sm rounded-xl hover:bg-amber-500 disabled:opacity-40 transition-colors self-end"
                >
                  {submitting ? "…" : t(lang, "send") || "Send"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}