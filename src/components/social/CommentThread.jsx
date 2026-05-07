import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { t, timeAgo } from "@/lib/i18n";
import Avatar from "./Avatar";
import { Send, Heart, Trash2, Camera, Video, X, Play } from "lucide-react";

export default function CommentThread({ postId, postUserId, lang, currentUser }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [mediaUrls, setMediaUrls] = useState([]);
  const [mediaTypes, setMediaTypes] = useState([]);
  const [uploading, setUploading] = useState(false);
  const photoRef = useRef();
  const videoRef = useRef();

  useEffect(() => {
    base44.entities.Comment.filter({ post_id: postId }, "created_date", 50).then(setComments);
  }, [postId]);

  const uploadMedia = async (file, type) => {
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setMediaUrls((prev) => [...prev, file_url]);
    setMediaTypes((prev) => [...prev, type]);
    setUploading(false);
  };

  const removeMedia = (idx) => {
    setMediaUrls((prev) => prev.filter((_, i) => i !== idx));
    setMediaTypes((prev) => prev.filter((_, i) => i !== idx));
  };

  const submit = async () => {
    if ((!text.trim() && mediaUrls.length === 0) || !currentUser) return;
    setSubmitting(true);
    const c = await base44.entities.Comment.create({
      post_id: postId,
      parent_comment_id: replyTo || null,
      user_id: currentUser.id,
      user_name: currentUser.full_name || "User",
      user_avatar: currentUser.avatar_url || "",
      text: text.trim(),
      media_urls: mediaUrls,
      media_types: mediaTypes,
      like_count: 0,
    });
    setComments((prev) => [...prev, c]);
    setText("");
    setMediaUrls([]);
    setMediaTypes([]);
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

  const CommentMedia = ({ urls = [], types = [] }) => {
    if (!urls.length) return null;
    return (
      <div className="mt-2 flex flex-wrap gap-2">
        {urls.map((url, i) => (
          <div key={i} className="relative rounded-xl overflow-hidden">
            {types[i] === "video" ? (
              <video src={url} controls className="rounded-xl max-h-40" style={{ maxWidth: 200 }} />
            ) : (
              <img src={url} alt="media" className="rounded-xl object-cover max-h-40" style={{ maxWidth: 200 }} />
            )}
          </div>
        ))}
      </div>
    );
  };

  const CommentItem = ({ c, isReply = false }) => (
    <div className={`flex gap-2.5 ${isReply ? "ms-10 mt-2" : "mt-3"}`}>
      <Avatar name={c.user_name} src={c.user_avatar} size={isReply ? 28 : 34} />
      <div className="flex-1 min-w-0">
        <div className="bg-secondary rounded-2xl px-3 py-2">
          <span className="text-xs font-bold text-foreground me-2">{c.user_name}</span>
          {c.text && <span className="text-sm text-foreground">{c.text}</span>}
          <CommentMedia urls={c.media_urls || []} types={c.media_types || []} />
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

  const canSubmit = (text.trim() || mediaUrls.length > 0) && !submitting && !uploading;

  return (
    <div className="mt-3 pt-3 border-t border-border">
      {roots.map((c) => <CommentItem key={c.id} c={c} />)}

      {currentUser && (
        <div className="mt-3 space-y-2">
          {mediaUrls.length > 0 && (
            <div className="flex flex-wrap gap-2 ps-10">
              {mediaUrls.map((url, i) => (
                <div key={i} className="relative rounded-xl overflow-hidden">
                  {mediaTypes[i] === "video" ? (
                    <div className="w-20 h-16 bg-black rounded-xl flex items-center justify-center">
                      <Play className="w-6 h-6 text-white" />
                    </div>
                  ) : (
                    <img src={url} alt="preview" className="w-20 h-16 object-cover rounded-xl" />
                  )}
                  <button onClick={() => removeMedia(i)} className="absolute top-0.5 end-0.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 items-end">
            <Avatar name={currentUser.full_name} src={currentUser.avatar_url} size={32} />
            <div className="flex-1 bg-secondary rounded-2xl px-3 py-2 space-y-1.5">
              {replyTo && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-primary">↩ Replying</span>
                  <button onClick={() => setReplyTo(null)} className="text-xs text-muted-foreground hover:text-destructive">×</button>
                </div>
              )}
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && submit()}
                placeholder={t(lang, "writeComment")}
                className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
              <div className="flex items-center justify-between pt-1 border-t border-border/50">
                <div className="flex items-center gap-2">
                  <input ref={photoRef} type="file" accept="image/*" multiple className="hidden"
                    onChange={(e) => [...e.target.files].slice(0, 4 - mediaUrls.length).forEach((f) => uploadMedia(f, "image"))} />
                  <input ref={videoRef} type="file" accept="video/*" className="hidden"
                    onChange={(e) => e.target.files[0] && uploadMedia(e.target.files[0], "video")} />
                  <button onClick={() => photoRef.current?.click()} disabled={uploading || mediaUrls.length >= 4}
                    className="text-muted-foreground hover:text-primary transition-colors disabled:opacity-40" title="Add photo">
                    <Camera className="w-4 h-4" />
                  </button>
                  <button onClick={() => videoRef.current?.click()} disabled={uploading || mediaTypes.includes("video")}
                    className="text-muted-foreground hover:text-primary transition-colors disabled:opacity-40" title="Add video">
                    <Video className="w-4 h-4" />
                  </button>
                  {uploading && <span className="text-[10px] text-muted-foreground">Uploading…</span>}
                </div>
                <button onClick={submit} disabled={!canSubmit} className="text-primary disabled:opacity-40 transition-opacity">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}