import { avatarColor } from "@/lib/i18n";

export default function Avatar({ name = "", src, size = 40, className = "" }) {
  const bg = avatarColor(name);
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const style = { width: size, height: size, minWidth: size, minHeight: size, fontSize: size * 0.38 };

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={style}
        className={`rounded-full object-cover ${className}`}
      />
    );
  }
  return (
    <div
      style={{ ...style, backgroundColor: bg }}
      className={`rounded-full flex items-center justify-center text-white font-bold shrink-0 ${className}`}
    >
      {initials || "?"}
    </div>
  );
}