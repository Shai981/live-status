import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Shield, Flag, Eye, EyeOff, Trash2, CheckCircle, BarChart3, Users, MapPin, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCategoryConfig, getFreshnessLabel } from "@/lib/categoryConfig";
import { motion } from "framer-motion";

const TABS = [
  { id: "reports", label: "Reports", icon: Flag },
  { id: "updates", label: "All Updates", icon: Eye },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
];

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("reports");
  const [reports, setReports] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const me = await base44.auth.me().catch(() => null);
    setUser(me);
    if (me?.role === "admin") {
      const [reps, upds, locs] = await Promise.all([
        base44.entities.Report.filter({ status: "pending" }, "-created_date", 50),
        base44.entities.StatusUpdate.list("-created_date", 100),
        base44.entities.Location.list(),
      ]);
      setReports(reps);
      setUpdates(upds);
      setLocations(locs);
    }
    setLoading(false);
  };

  const hideUpdate = async (updateId) => {
    await base44.entities.StatusUpdate.update(updateId, { status_visibility: "hidden" });
    setUpdates((prev) => prev.map((u) => u.id === updateId ? { ...u, status_visibility: "hidden" } : u));
  };

  const showUpdate = async (updateId) => {
    await base44.entities.StatusUpdate.update(updateId, { status_visibility: "visible" });
    setUpdates((prev) => prev.map((u) => u.id === updateId ? { ...u, status_visibility: "visible" } : u));
  };

  const dismissReport = async (reportId) => {
    await base44.entities.Report.update(reportId, { status: "dismissed" });
    setReports((prev) => prev.filter((r) => r.id !== reportId));
  };

  const actionReport = async (reportId, updateId) => {
    await Promise.all([
      base44.entities.Report.update(reportId, { status: "actioned" }),
      base44.entities.StatusUpdate.update(updateId, { status_visibility: "hidden" }),
    ]);
    setReports((prev) => prev.filter((r) => r.id !== reportId));
    setUpdates((prev) => prev.map((u) => u.id === updateId ? { ...u, status_visibility: "hidden" } : u));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3 px-6">
        <Shield className="w-12 h-12 text-muted-foreground" />
        <h2 className="text-xl font-bold text-foreground">Admin Only</h2>
        <p className="text-sm text-muted-foreground text-center">This area is restricted to administrators.</p>
      </div>
    );
  }

  // Analytics data
  const catCounts = {};
  updates.forEach((u) => { catCounts[u.category] = (catCounts[u.category] || 0) + 1; });
  const topCats = Object.entries(catCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const locCounts = {};
  updates.forEach((u) => { locCounts[u.location_name || "Unknown"] = (locCounts[u.location_name || "Unknown"] || 0) + 1; });
  const topLocs = Object.entries(locCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const visibleCount = updates.filter((u) => u.status_visibility === "visible").length;
  const hiddenCount = updates.filter((u) => u.status_visibility === "hidden").length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-700 pt-14 pb-5 px-4 text-white">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6" />
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Total Updates", value: updates.length, icon: "📍" },
              { label: "Pending Reports", value: reports.length, icon: "🚨" },
              { label: "Locations", value: locations.length, icon: "🗺️" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 rounded-xl p-3 text-center backdrop-blur-sm">
                <div className="text-xl mb-0.5">{stat.icon}</div>
                <div className="text-xl font-bold">{stat.value}</div>
                <div className="text-[10px] text-white/70">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-card border-b border-border sticky top-0 z-30">
        <div className="max-w-lg mx-auto flex">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 text-sm font-medium border-b-2 transition-all ${
                  tab === t.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
                {t.id === "reports" && reports.length > 0 && (
                  <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {reports.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-3">
        {/* Reports tab */}
        {tab === "reports" && (
          <>
            {reports.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle className="w-10 h-10 mx-auto mb-3 text-green-500" />
                <p className="font-medium text-foreground">All clear!</p>
                <p className="text-sm">No pending reports.</p>
              </div>
            ) : (
              reports.map((report, i) => {
                const relatedUpdate = updates.find((u) => u.id === report.update_id);
                return (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="bg-card border border-border rounded-2xl p-4"
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full mb-1">
                          <Flag className="w-3 h-3" /> {report.reason?.replace(/_/g, " ")}
                        </span>
                        <p className="text-xs text-muted-foreground">Reported by {report.reported_by} · {getFreshnessLabel(report.created_date)}</p>
                      </div>
                    </div>
                    {relatedUpdate && (
                      <div className="bg-secondary/50 rounded-xl p-3 mb-3 text-sm">
                        <p className="font-medium text-foreground">{relatedUpdate.title}</p>
                        <p className="text-muted-foreground text-xs mt-0.5">{relatedUpdate.description}</p>
                      </div>
                    )}
                    {report.details && (
                      <p className="text-sm text-muted-foreground italic mb-3">"{report.details}"</p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => dismissReport(report.id)}
                        className="flex-1 rounded-xl text-xs"
                      >
                        Dismiss
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => actionReport(report.id, report.update_id)}
                        className="flex-1 rounded-xl text-xs"
                      >
                        <EyeOff className="w-3.5 h-3.5 mr-1" /> Hide Post
                      </Button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </>
        )}

        {/* Updates tab */}
        {tab === "updates" && (
          <>
            <div className="flex gap-2 mb-2">
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                ✅ {visibleCount} visible
              </span>
              <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
                🚫 {hiddenCount} hidden
              </span>
            </div>
            {updates.map((u, i) => {
              const cat = getCategoryConfig(u.category);
              return (
                <motion.div
                  key={u.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className={`bg-card border border-border rounded-2xl p-4 ${u.status_visibility === "hidden" ? "opacity-50" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span>{cat.emoji}</span>
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">{u.title}</p>
                        <p className="text-xs text-muted-foreground">{u.location_name} · {getFreshnessLabel(u.created_date)}</p>
                        <p className="text-xs text-muted-foreground">by {u.user_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {u.status_visibility === "visible" ? (
                        <button
                          onClick={() => hideUpdate(u.id)}
                          className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-red-50"
                          title="Hide update"
                        >
                          <EyeOff className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => showUpdate(u.id)}
                          className="p-1.5 text-muted-foreground hover:text-green-600 transition-colors rounded-lg hover:bg-green-50"
                          title="Show update"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  {u.report_count > 0 && (
                    <p className="text-xs text-red-500 mt-2">⚠️ {u.report_count} report{u.report_count !== 1 ? "s" : ""}</p>
                  )}
                </motion.div>
              );
            })}
          </>
        )}

        {/* Analytics tab */}
        {tab === "analytics" && (
          <div className="space-y-5">
            <div className="bg-card border border-border rounded-2xl p-4">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" /> Top Categories
              </h3>
              <div className="space-y-2">
                {topCats.map(([catId, count]) => {
                  const cat = getCategoryConfig(catId);
                  const pct = Math.round((count / updates.length) * 100);
                  return (
                    <div key={catId} className="flex items-center gap-3">
                      <span className="text-lg w-7 text-center">{cat.emoji}</span>
                      <div className="flex-1">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium text-foreground">{cat.label}</span>
                          <span className="text-muted-foreground">{count} updates</span>
                        </div>
                        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-category-${cat.color} rounded-full`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-4">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" /> Most Active Locations
              </h3>
              <div className="space-y-2">
                {topLocs.map(([locName, count], i) => (
                  <div key={locName} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground">
                        {i + 1}
                      </span>
                      <span className="text-sm font-medium text-foreground">{locName}</span>
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">{count} updates</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}