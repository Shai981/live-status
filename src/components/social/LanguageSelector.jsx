import { useState, useRef, useEffect } from "react";
import { SUPPORTED_LANGUAGES } from "@/lib/i18n";
import { ChevronDown } from "lucide-react";

export default function LanguageSelector({ lang, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = SUPPORTED_LANGUAGES.find((l) => l.code === lang) || SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-border bg-card hover:bg-secondary transition-colors text-sm font-medium text-foreground"
      >
        <span>{current.flag}</span>
        <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute end-0 top-full mt-1 bg-card border border-border rounded-xl shadow-xl z-50 min-w-[160px] overflow-hidden">
          {SUPPORTED_LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => { onChange(l.code); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-start hover:bg-secondary transition-colors ${l.code === lang ? "font-semibold text-primary" : "text-foreground"}`}
            >
              <span>{l.flag}</span> <span>{l.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}