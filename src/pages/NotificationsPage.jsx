import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { t, detectLanguage, RTL_LANGUAGES, timeAgo } from "@/lib/i18n";
import Avatar from "@/components/social/Avatar";
import { ArrowLeft, Bell, Heart, MessageCircle, UserPlus, AtSign, CheckCircle } from "lucide-react";

const NOTIF_ICONS = {
  like: { icon: Heart, color: "text-red-500 bg-red-50 dark:bg-red-900/20" },
  accurate: { icon: CheckCircle, color: "text-green-600 bg-green-50 dark:bg-green-900/20" },
  comment: { icon: MessageCircle, color: "text-blue-500 bg-blue-50 dark:bg-blue-900/20" },
  follow: { icon: UserPlus, color: "text-purple-500 bg-purple-50 dark:bg-purple-900/20" },
  mention: { icon: AtSign, color: "text-amber-500 bg-amber-50 dark:bg-amber-900/20" },
  new_update: { icon: Bell, color: "text-primary bg-primary/10" },
  wow: { icon: Heart, color: "text-purple-500 bg-purple-50" },
  outdated: { icon: Bell, color: "text-amber-500 bg-amber-50" },
};

export default function NotificationsPage() {
  const lang = detectLanguage();
  const isRTL = RTL_LANGUAGES.includes(lang);
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    document.documentElement.setAttribute("dir", isRTL ? "rtl" : "ltr");
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    const me = await base44.auth.me().catch(() => null);
    setCurrentUser(me);
    if (!me) { setLoading(false); return; }
    const notifs = await base44.entities.Notification.filter({ user_id: me.id }, "-created_date", 50);
    setNotifications(notifs);
    // Mark all as read
    const unread = notifs.filter((n) => !n.read);
    await Promise.all(unread.map((n) => base44.entities.Notification.update(n.id, { read: true })));
    setLoading(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
    </div>
  );

  if (!currentUser) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-6 text-center">
      <Bell className="w-12 h-12 text-muted-foreground" />
      <p className="font-semibold text-foreground">Sign in to see notifications</p>
      <button onClick={() => base44.auth.redirectToLogin()} className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm">Sign In</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? "rtl" : "ltr"}>
      <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-secondary transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-xl font-bold text-foreground">{t(lang, "notifications")}</h1>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {notifications.length === 0 ? (
          <div className="text-center py-20">
            <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">{t(lang, "noNotifications")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => {
              const cfg = NOTIF_ICONS[n.type] || NOTIF_ICONS.like;
              const Icon = cfg.icon;
              return (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 p-4 rounded-2xl border border-border transition-colors ${
                    !n.read ? "bg-primary/5 border-primary/20" : "bg-card"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${cfg.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground leading-snug">
                      <span className="font-semibold">{n.actor_name}</span>{" "}
                      {n.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{timeAgo(lang, n.created_date)}</p>
                  </div>
                  {!n.read && <div className="w-2 h-2 bg-primary rounded-full shrink-0 mt-1.5" />}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}