import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { t, detectLanguage, RTL_LANGUAGES, timeAgo } from "@/lib/i18n";
import Avatar from "@/components/social/Avatar";
import PostCard from "@/components/social/PostCard";
import { ArrowLeft, Grid, List, LogOut } from "lucide-react";
import { motion } from "framer-motion";

export default function ProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const lang = detectLanguage();
  const isRTL = RTL_LANGUAGES.includes(lang);

  const [currentUser, setCurrentUser] = useState(null);
  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followId, setFollowId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gridView, setGridView] = useState(true);

  useEffect(() => {
    document.documentElement.setAttribute("dir", isRTL ? "rtl" : "ltr");
    loadData();
  }, [userId]);

  const loadData = async () => {
    setLoading(true);
    const me = await base44.auth.me().catch(() => null);
    setCurrentUser(me);

    const targetId = userId || me?.id;
    if (!targetId) { setLoading(false); return; }

    const [userPosts] = await Promise.all([
      base44.entities.Post.filter({ user_id: targetId }, "-created_date", 30),
    ]);
    setPosts(userPosts);

    // Build profile from posts data or current user
    if (me && targetId === me.id) {
      setProfileUser(me);
    } else if (userPosts.length > 0) {
      setProfileUser({ id: targetId, full_name: userPosts[0].user_name, avatar_url: userPosts[0].user_avatar });
    }

    if (me && targetId !== me.id) {
      const follows = await base44.entities.Follow.filter({ follower_id: me.id, following_id: targetId });
      if (follows.length > 0) { setIsFollowing(true); setFollowId(follows[0].id); }
    }
    setLoading(false);
  };

  const handleFollow = async () => {
    if (!currentUser || !profileUser) return;
    if (isFollowing) {
      await base44.entities.Follow.delete(followId);
      setIsFollowing(false);
      setFollowId(null);
    } else {
      const f = await base44.entities.Follow.create({ follower_id: currentUser.id, following_id: profileUser.id });
      setIsFollowing(true);
      setFollowId(f.id);
    }
  };

  const isOwnProfile = currentUser?.id === (userId || currentUser?.id);

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
    </div>;
  }

  const photoPosts = posts.filter((p) => p.media_urls?.length > 0);
  const textPosts = posts.filter((p) => !p.media_urls?.length);

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="bg-gradient-to-b from-primary/20 to-background pt-14 pb-6 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-secondary transition-colors">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            {isOwnProfile && (
              <button onClick={() => base44.auth.logout("/")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            )}
          </div>
          <div className="flex items-end gap-5">
            <Avatar name={profileUser?.full_name || "?"} src={profileUser?.avatar_url} size={80} />
            <div className="flex-1 min-w-0 pb-1">
              <h1 className="text-2xl font-extrabold text-foreground">{profileUser?.full_name || "User"}</h1>
              {profileUser?.email && <p className="text-sm text-muted-foreground">{profileUser.email}</p>}
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-6 mt-5">
            {[
              { label: t(lang, "posts"), value: posts.length },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Follow button */}
          {!isOwnProfile && currentUser && (
            <button
              onClick={handleFollow}
              className={`mt-4 w-full py-2.5 rounded-xl font-bold text-sm transition-all ${
                isFollowing
                  ? "bg-secondary text-foreground border border-border hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
            >
              {isFollowing ? t(lang, "unfollow") : t(lang, "follow")}
            </button>
          )}
          {!currentUser && !isOwnProfile && (
            <button onClick={() => base44.auth.redirectToLogin()} className="mt-4 w-full py-2.5 rounded-xl font-bold text-sm bg-primary text-primary-foreground">
              Sign in to follow
            </button>
          )}
        </div>
      </div>

      {/* Posts */}
      <div className="max-w-2xl mx-auto px-4 pb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-foreground">{t(lang, "posts")}</h2>
          <div className="flex gap-1 bg-secondary rounded-lg p-1">
            <button onClick={() => setGridView(true)} className={`p-1.5 rounded-md transition-colors ${gridView ? "bg-card shadow-sm" : "text-muted-foreground"}`}>
              <Grid className="w-4 h-4" />
            </button>
            <button onClick={() => setGridView(false)} className={`p-1.5 rounded-md transition-colors ${!gridView ? "bg-card shadow-sm" : "text-muted-foreground"}`}>
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">{t(lang, "noPostsYet")}</div>
        ) : gridView && photoPosts.length > 0 ? (
          <>
            <div className="grid grid-cols-3 gap-1 mb-4 rounded-2xl overflow-hidden">
              {photoPosts.map((p) => (
                <div key={p.id} className="aspect-square bg-secondary">
                  <img src={p.media_urls[0]} className="w-full h-full object-cover" alt="" />
                </div>
              ))}
            </div>
            <div className="space-y-4">
              {textPosts.map((p) => (
                <PostCard key={p.id} post={p} lang={lang} currentUser={currentUser}
                  onDeleted={(id) => setPosts((prev) => prev.filter((x) => x.id !== id))}
                  onUpdated={(upd) => setPosts((prev) => prev.map((x) => x.id === upd.id ? upd : x))} />
              ))}
            </div>
          </>
        ) : (
          <div className="space-y-4">
            {posts.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <PostCard post={p} lang={lang} currentUser={currentUser}
                  onDeleted={(id) => setPosts((prev) => prev.filter((x) => x.id !== id))}
                  onUpdated={(upd) => setPosts((prev) => prev.map((x) => x.id === upd.id ? upd : x))} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}