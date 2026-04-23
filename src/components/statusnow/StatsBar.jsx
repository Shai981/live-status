import { t, getCategoryEmoji } from "@/lib/i18n";

export default function StatsBar({ lang, updates }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayUpdates = updates.filter((u) => new Date(u.created_date) >= today);

  // Most active city
  const cityCounts = {};
  updates.forEach((u) => { if (u.city) cityCounts[u.city] = (cityCounts[u.city] || 0) + 1; });
  const topCity = Object.entries(cityCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

  // Most reported category
  const catCounts = {};
  updates.forEach((u) => { if (u.category) catCounts[u.category] = (catCounts[u.category] || 0) + 1; });
  const topCat = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

  if (updates.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      <div className="shrink-0 flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2">
        <span className="text-lg">📊</span>
        <div>
          <p className="text-xs font-bold text-foreground">{todayUpdates.length}</p>
          <p className="text-[10px] text-muted-foreground">{t(lang, "statsToday")}</p>
        </div>
      </div>
      {topCity && (
        <div className="shrink-0 flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2">
          <span className="text-lg">📍</span>
          <div>
            <p className="text-xs font-bold text-foreground truncate max-w-[80px]">{topCity}</p>
            <p className="text-[10px] text-muted-foreground">{t(lang, "statsTopCity")}</p>
          </div>
        </div>
      )}
      {topCat && (
        <div className="shrink-0 flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2">
          <span className="text-lg">{getCategoryEmoji(topCat)}</span>
          <div>
            <p className="text-xs font-bold text-foreground">{t(lang, `cat_${topCat}`)}</p>
            <p className="text-[10px] text-muted-foreground">{t(lang, "statsTopCat")}</p>
          </div>
        </div>
      )}
    </div>
  );
}