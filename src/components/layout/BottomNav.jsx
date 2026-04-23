import { Link, useLocation } from "react-router-dom";
import { Home, Map, PlusCircle, User, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/map", icon: Map, label: "Map" },
  { to: "/add", icon: PlusCircle, label: "Post", primary: true },
  { to: "/profile", icon: User, label: "Profile" },
  { to: "/admin", icon: Shield, label: "Admin" },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border safe-bottom">
      <div className="flex items-center justify-around px-2 pt-2 pb-3 max-w-lg mx-auto">
        {navItems.map(({ to, icon: Icon, label, primary }) => {
          const active = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex flex-col items-center gap-0.5 min-w-[56px] transition-all duration-200",
                primary
                  ? "relative -top-3"
                  : ""
              )}
            >
              {primary ? (
                <span className={cn(
                  "flex items-center justify-center w-14 h-14 rounded-full shadow-lg shadow-primary/30 transition-all",
                  active
                    ? "bg-primary scale-105"
                    : "bg-primary hover:scale-105"
                )}>
                  <Icon className="w-6 h-6 text-primary-foreground" strokeWidth={2.5} />
                </span>
              ) : (
                <span className={cn(
                  "flex flex-col items-center gap-0.5 transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}>
                  <Icon className={cn("w-5 h-5", active && "stroke-[2.5]")} />
                  <span className="text-[10px] font-medium">{label}</span>
                </span>
              )}
              {primary && (
                <span className="text-[10px] font-medium text-muted-foreground mt-1">{label}</span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}