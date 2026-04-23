import { Link } from "react-router-dom";
import { Clock, ThumbsUp, ThumbsDown, CheckCircle, Flag, AlertTriangle } from "lucide-react";
import { getCategoryConfig, getFreshnessLabel, isStale } from "@/lib/categoryConfig";
import { cn } from "@/lib/utils";
import { base44 } from "@/api/base44Client";
import { useState } from "react";

export default function UpdateCard({ update, onReact, showLocation = true }) {
  const cat = getCategoryConfig(update.category);
  const stale = isStale(update.created_date, 120);
  const [reacting, setReacting] = useState(false);

  const handleReact = async (type) => {
    if (reacting) return;
    setReacting(true);
    try {
      await onReact?.(update.id, type);
    } finally {
      setReacting(false);
    }
  };

  return (
    <div className={cn(
      "bg-card rounded-2xl border border-border overflow-hidden shadow-sm transition-all hover:shadow-md",
      stale && "opacity-70"
    )}>
      {/* Category stripe */}
      <div className={cn("h-1 w-full", `bg-category-${cat.color}`)} />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl">{cat.emoji}</span>
            <div className="min-w-0">
              <span className={cn(
                "text-xs font-semibold uppercase tracking-wide",
                `text-category-${cat.color}`
              )}>
                {cat.label}
              </span>
              {showLocation && update.location_name && (
                <p className="text-xs text-muted-foreground truncate">{update.location_name}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {stale && (
              <span className="flex items-center gap-1 text-[10px] text-amber-500 font-medium bg-amber-50 px-2 py-0.5 rounded-full">
                <AlertTriangle className="w-3 h-3" /> Old
              </span>
            )}
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Clock className="w-3 h-3" />
              {getFreshnessLabel(update.created_date)}
            </span>
          </div>
        </div>

        {/* Content */}
        <h3 className="font-semibold text-foreground leading-snug mb-1">{update.title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{update.description}</p>

        {/* Photo */}
        {update.photo_url && (
          <img
            src={update.photo_url}
            alt="Update"
            className="mt-3 w-full h-40 object-cover rounded-xl"
          />
        )}

        {/* Structured data pills */}
        {update.structured_data && Object.keys(update.structured_data).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {update.structured_data.crowd_level && (
              <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                👥 {update.structured_data.crowd_level}
              </span>
            )}
            {update.structured_data.wait_minutes != null && (
              <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                ⏱ {update.structured_data.wait_minutes} min wait
              </span>
            )}
            {update.structured_data.congestion_level && (
              <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                🚦 {update.structured_data.congestion_level}
              </span>
            )}
            {update.structured_data.has_accident && (
              <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                ⚠️ Accident reported
              </span>
            )}
            {update.structured_data.wave_height_m != null && (
              <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                🌊 {update.structured_data.wave_height_m}m waves
              </span>
            )}
            {update.structured_data.parking_availability && (
              <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                🅿️ {update.structured_data.parking_availability}
              </span>
            )}
            {update.structured_data.water_quality && (
              <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                💧 {update.structured_data.water_quality}
              </span>
            )}
          </div>
        )}

        {/* Reactions */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleReact("accurate")}
              disabled={reacting}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-green-600 transition-colors px-2 py-1 rounded-lg hover:bg-green-50"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Accurate {update.confirm_count > 0 && `(${update.confirm_count})`}</span>
            </button>
            <button
              onClick={() => handleReact("not_accurate")}
              disabled={reacting}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
            >
              <ThumbsDown className="w-3.5 h-3.5" />
              <span>{update.deny_count > 0 && update.deny_count}</span>
            </button>
          </div>
          <Link
            to={`/location/${update.location_id}`}
            className="text-xs text-primary font-medium hover:underline"
          >
            View location →
          </Link>
        </div>
      </div>
    </div>
  );
}