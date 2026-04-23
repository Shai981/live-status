import { useState } from "react";
import { t } from "@/lib/i18n";

export default function NicknameModal({ lang, onSave }) {
  const [nick, setNick] = useState("");
  const [error, setError] = useState(false);

  const handleSave = () => {
    const trimmed = nick.trim();
    if (!trimmed) { setError(true); return; }
    localStorage.setItem("statusnow_nick", trimmed);
    onSave(trimmed);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className="text-4xl text-center mb-3">👋</div>
        <h2 className="text-xl font-bold text-foreground text-center mb-1">{t(lang, "nicknamePrompt")}</h2>
        <p className="text-sm text-muted-foreground text-center mb-5">{t(lang, "nicknameDesc")}</p>
        <input
          autoFocus
          type="text"
          maxLength={30}
          value={nick}
          onChange={(e) => { setNick(e.target.value); setError(false); }}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          placeholder={t(lang, "nicknamePlaceholder")}
          className={`w-full px-4 py-3 rounded-xl border text-foreground bg-background text-base outline-none transition-colors ${
            error ? "border-red-500" : "border-border focus:border-primary"
          }`}
        />
        {error && <p className="text-xs text-red-500 mt-1">{t(lang, "errorLocation")}</p>}
        <button
          onClick={handleSave}
          className="mt-4 w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-base hover:bg-primary/90 transition-colors"
        >
          {t(lang, "nicknameConfirm")}
        </button>
      </div>
    </div>
  );
}