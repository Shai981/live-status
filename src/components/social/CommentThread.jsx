import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { t, timeAgo, avatarColor } from "@/lib/i18n";
import Avatar from "./Avatar";
import { Send, Heart, Trash2 } from "lucide-react";

export default function CommentThread({ postId, postUserId, lang, currentUser }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    base44.entities.Comment.filter({ post_id: postId }, "created_date", 50).then(setComments);
  }, [postId]);

  const submit = async () => {
    if (!text.trim() || !currentUser) return;
    setSubmitting(true);
    const c = await base44.entities.Comment.create({
      post_id: postId,
      parent_comment_id: replyTo || null,
      user_id: currentUser.id,
      user_name: currentUser.full_name || "User",
      user_avatar: currentUser.avatar_url || "",
      text: text.trim(),
      like_count: 0,
    });
    setComments((prev) => [...prev, c]);
    setText("");
    setReplyTo(null);
    setSubmitting(false);
  };

  const deleteComment = async (id) => {
    await base44.entities.Comment.delete(id);
    setComments((prev) => prev.filter((c) => c.id !== id));
  };

  const likeComment = async (c) => {
    await base44.entities.Comment.update(c.id, { like_count: (c.like_count || 0) + 1 });
    setComments((prev) => prev.map((x) => x.id === c.id ? { ...x, like_count: (x.like_count || 0) + 1 } : x));
  };

  const roots = comments.filter((c) => !c.parent_comment_id);
  const replies = (parentId) => comments.filter((c) => c.parent_comment_id === parentId);

  const CommentItem = ({ c, isReply = false }) => (
    <div className={`flex gap-2.5 ${isReply ? "ms-10 mt-2" : "mt-3"}`}>
      <Avatar name={c.user_name} src={c.user_avatar} size={isReply ? 28 : 34} />
      <div className="flex-1 min-w-0">
        <div className="bg-secondary rounded-2xl px-3 py-2">
          <span className="text-xs font-bold text-foreground me-2">{c.user_name}</span>
          <span className="text-sm text-foreground">{c.text}</span>
        </div>
        <div className="flex items-center gap-3 mt-1 ps-2">
          <span className="text-[11px] text-muted-foreground">{timeAgo(lang, c.created_date)}</span>
          <button onClick={() => likeComment(c)} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-red-500 transition-colors">
            <Heart className="w-3 h-3" /> {c.like_count > 0 && c.like_count}
          </button>
          {!isReply && currentUser && (
            <button onClick={() => setReplyTo(c.id)} className="text-[11px] text-muted-foreground hover:text-primary transition-colors">
              {t(lang, "reply")}
            </button>
          )}
          {(currentUser?.id === c.user_id || currentUser?.id === postUserId) && (
            <button onClick={() => deleteComment(c.id)} className="text-[11px] text-muted-foreground hover:text-destructive transition-colors">
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
        {replies(c.id).map((r) => <CommentItem key={r.id} c={r} isReply />)}
      </div>
    </div>
  );

  return (
    <div className="mt-3 pt-3 border-t border-border">
      {roots.map((c) => <CommentItem key={c.id} c={c} />)}

      {currentUser && (
        <div className="flex gap-2 mt-3">
          <Avatar name={currentUser.full_name} src={currentUser.avatar_url} size={32} />
          <div className="flex-1 flex items-center gap-2 bg-secondary rounded-full px-4 py-2">
            {replyTo && (
              <span className="text-xs text-primary me-1">↩</span>
            )}
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && submit()}
              placeholder={t(lang, "writeComment")}
              className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            <button
              onClick={submit}
              disabled={!text.trim() || submitting}
              className="text-primary disabled:opacity-40 transition-opacity"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}