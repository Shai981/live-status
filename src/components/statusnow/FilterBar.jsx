import { t, CATEGORIES } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export default function FilterBar({ lang, selected, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      <button
        onClick={() => onChange(null)}
        className={cn(
          "shrink-0 px-3 py-1.5 rounded-full text-sm font-medium border transition-all",
          !selected
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-card text-muted-foreground border-border hover:border-primary/40"
        )}
      >
        {t(lang, "filterAll")}
      </button>
      {CATEGORIES.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onChange(cat.id === selected ? null : cat.id)}
          className={cn(
            "shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all",
            selected === cat.id
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card text-muted-foreground border-border hover:border-primary/40"
          )}
        >
          <span>{cat.emoji}</span>
          <span>{t(lang, `cat_${cat.id}`)}</span>
        </button>
      ))}
    </div>
  );
}