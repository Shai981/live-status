import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, CheckCircle } from "lucide-react";
import { jsPDF } from "jspdf";

const FILES = [
  {
    name: "App.jsx",
    content: `import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import AppLayout from '@/components/layout/AppLayout';
import Home from '@/pages/Home';
import MapPage from '@/pages/MapPage';
import AddUpdate from '@/pages/AddUpdate';
import LocationDetails from '@/pages/LocationDetails';
import UserProfile from '@/pages/UserProfile';
import AdminDashboard from '@/pages/AdminDashboard';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading Live Status...</p>
        </div>
      </div>
    );
  }
  if (authError) {
    if (authError.type === 'user_not_registered') return <UserNotRegisteredError />;
    else if (authError.type === 'auth_required') { navigateToLogin(); return null; }
  }
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/add" element={<AddUpdate />} />
        <Route path="/location/:id" element={<LocationDetails />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}
export default App`,
  },
  {
    name: "lib/categoryConfig.js",
    content: `export const CATEGORIES = [
  { id: "traffic", label: "Traffic", emoji: "Car", color: "traffic" },
  { id: "supermarket", label: "Supermarket", emoji: "Cart", color: "supermarket" },
  { id: "beach", label: "Beach", emoji: "Beach", color: "beach" },
  { id: "parking", label: "Parking", emoji: "P", color: "parking" },
  { id: "public_place", label: "Public Place", emoji: "Building", color: "public" },
  { id: "restaurant", label: "Restaurant", emoji: "Food", color: "restaurant" },
  { id: "clinic", label: "Clinic", emoji: "Hospital", color: "clinic" },
  { id: "other", label: "Other", emoji: "Pin", color: "other" },
];

export const getCategoryConfig = (id) =>
  CATEGORIES.find((c) => c.id === id) || CATEGORIES[CATEGORIES.length - 1];

export const getFreshnessLabel = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return mins + "m ago";
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + "h ago";
  return Math.floor(hrs / 24) + "d ago";
};

export const isStale = (dateStr, thresholdMinutes = 120) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  return diff > thresholdMinutes * 60000;
};`,
  },
  {
    name: "components/layout/AppLayout.jsx",
    content: `import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-background font-inter">
      <main className="pb-24 min-h-screen">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}`,
  },
  {
    name: "components/layout/BottomNav.jsx",
    content: `import { Link, useLocation } from "react-router-dom";
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
            <Link key={to} to={to} className={cn("flex flex-col items-center gap-0.5 min-w-[56px]", primary && "relative -top-3")}>
              {primary ? (
                <span className="flex items-center justify-center w-14 h-14 rounded-full bg-primary shadow-lg">
                  <Icon className="w-6 h-6 text-primary-foreground" />
                </span>
              ) : (
                <span className={cn("flex flex-col items-center gap-0.5", active ? "text-primary" : "text-muted-foreground")}>
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium">{label}</span>
                </span>
              )}
              {primary && <span className="text-[10px] font-medium text-muted-foreground mt-1">{label}</span>}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}`,
  },
  {
    name: "pages/Home.jsx",
    content: `// Home page - shows live feed of status updates with search, category filter,
// and highlights updates from favorited locations.
// Fetches: StatusUpdate (visible), Favorite (by user), allows reactions.
// Key state: updates, favorites, loading, category filter, search term.
// Uses UpdateCard, CategoryFilter components.
// Reaction handler updates confirm_count / deny_count on StatusUpdate entity.`,
  },
  {
    name: "pages/MapPage.jsx",
    content: `// MapPage - shows locations with active updates on an interactive map (react-leaflet).
// Toggle between map view (emoji pins per category) and list view (UpdateCard feed).
// Fetches: Location list, StatusUpdate (visible).
// Uses CategoryFilter, custom L.divIcon per category, Popup with link to LocationDetails.
// Geolocation: navigator.geolocation for user position marker.`,
  },
  {
    name: "pages/AddUpdate.jsx",
    content: `// AddUpdate - form to post a new status update.
// Steps: 1) Pick location (searchable dropdown), 2) Select category,
//        3) Title + description, 4) Structured fields (category-specific),
//        5) Optional photo upload via Core.UploadFile integration.
// On submit: creates StatusUpdate entity with expires_at = now + 4h.
// Redirects to Home after successful submission.
// Structured fields by category:
//   supermarket/restaurant/clinic/public_place: crowd_level, wait_minutes
//   traffic: congestion_level, has_accident, road_speed_kmh
//   beach: water_quality, wind_level, wave_height_m, crowd_level
//   parking: parking_availability`,
  },
  {
    name: "pages/LocationDetails.jsx",
    content: `// LocationDetails - detail view for a specific location (/location/:id).
// Shows: colored header with category, favorite toggle, "Post Update" CTA.
// Live Status card: most recent update.
// Most Trusted card: highest accuracy_score update.
// Full list: all visible updates with react buttons (accurate / not_accurate) and flag.
// ReportModal: submit Report entity with reason + details.
// Favorite toggle: creates/deletes Favorite entity for current user.`,
  },
  {
    name: "pages/UserProfile.jsx",
    content: `// UserProfile - authenticated user's profile page.
// Badge system based on update count / trust_score:
//   newcomer (default), contributor (5+ updates), local_reporter (20+), top_contributor (50+).
// Stats grid: total updates, trust score, saved places, helpful votes.
// Lists: saved favorite locations, recent updates posted by user.
// Unauthenticated state: sign-in prompt with redirectToLogin().`,
  },
  {
    name: "pages/AdminDashboard.jsx",
    content: `// AdminDashboard - restricted to role="admin" users only.
// 3 tabs:
//   Reports: pending Report entities; Dismiss or Hide Post actions.
//   All Updates: list with Eye/EyeOff toggle for status_visibility.
//   Analytics: top categories by count (progress bars), top active locations.
// Header stats: total updates, pending reports, total locations.`,
  },
  {
    name: "components/updates/UpdateCard.jsx",
    content: `// UpdateCard - card for a single StatusUpdate.
// Shows: category stripe color, emoji, label, location name, freshness label.
// Stale badge if update > 120 minutes old.
// Structured data pills: crowd_level, wait_minutes, congestion_level, has_accident,
//   wave_height_m, parking_availability, water_quality.
// Reaction buttons: Accurate (confirm_count), Not accurate (deny_count).
// Link to LocationDetails page.`,
  },
  {
    name: "components/updates/CategoryFilter.jsx",
    content: `// CategoryFilter - horizontal scrollable pill buttons for category filtering.
// Props: selected (string|null), onChange (fn).
// "All" pill + one pill per CATEGORY from categoryConfig.
// Active pill uses bg-category-{color} class (safelisted in tailwind.config.js).`,
  },
  {
    name: "components/updates/ReportModal.jsx",
    content: `// ReportModal - Dialog for reporting an update.
// Props: updateId, open, onClose.
// Reason choices: spam, false_info, inappropriate, offensive, other.
// On submit: creates Report entity, increments report_count on StatusUpdate.
// Shows success message then closes after 1.5s.`,
  },
  {
    name: "entities/StatusUpdate.json",
    content: `{
  "name": "StatusUpdate",
  "properties": {
    "user_id": "string",
    "user_name": "string",
    "location_id": "string (required)",
    "location_name": "string",
    "category": "enum: traffic|supermarket|beach|parking|public_place|restaurant|clinic|other (required)",
    "title": "string (required)",
    "description": "string (required)",
    "structured_data": {
      "crowd_level": "enum: empty|light|moderate|busy|packed",
      "wait_minutes": "number",
      "congestion_level": "enum: clear|light|moderate|heavy|standstill",
      "has_accident": "boolean",
      "road_speed_kmh": "number",
      "wave_height_m": "number",
      "water_quality": "enum: excellent|good|fair|poor",
      "wind_level": "enum: calm|light|moderate|strong|dangerous",
      "parking_availability": "enum: available|limited|full"
    },
    "photo_url": "string",
    "accuracy_score": "number (default 0)",
    "confirm_count": "number (default 0)",
    "deny_count": "number (default 0)",
    "report_count": "number (default 0)",
    "status_visibility": "enum: visible|hidden|flagged (default visible)",
    "expires_at": "string (date-time)"
  }
}`,
  },
  {
    name: "entities/Location.json",
    content: `{
  "name": "Location",
  "properties": {
    "name": "string (required)",
    "category": "enum: traffic|supermarket|beach|parking|public_place|restaurant|clinic|other (required)",
    "address": "string",
    "city": "string",
    "country": "string",
    "latitude": "number",
    "longitude": "number",
    "place_description": "string",
    "update_count": "number (default 0)"
  }
}`,
  },
  {
    name: "entities/Reaction.json",
    content: `{
  "name": "Reaction",
  "properties": {
    "update_id": "string (required)",
    "user_id": "string (required)",
    "reaction_type": "enum: accurate|still_true|not_accurate (required)"
  }
}`,
  },
  {
    name: "entities/Report.json",
    content: `{
  "name": "Report",
  "properties": {
    "update_id": "string (required)",
    "reported_by": "string (required)",
    "reason": "enum: spam|false_info|inappropriate|offensive|other (required)",
    "details": "string",
    "status": "enum: pending|reviewed|dismissed|actioned (default pending)"
  }
}`,
  },
  {
    name: "entities/Favorite.json",
    content: `{
  "name": "Favorite",
  "properties": {
    "user_id": "string (required)",
    "location_id": "string (required)",
    "location_name": "string"
  }
}`,
  },
];

export default function ExportCode() {
  const [done, setDone] = useState(false);
  const [generating, setGenerating] = useState(false);

  const generatePDF = () => {
    setGenerating(true);
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 40;
    const maxW = pageW - margin * 2;
    const lineH = 13;

    // Cover page
    doc.setFillColor(30, 58, 138);
    doc.rect(0, 0, pageW, pageH, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(32);
    doc.setFont("helvetica", "bold");
    doc.text("Live Status App", pageW / 2, 180, { align: "center" });
    doc.setFontSize(16);
    doc.setFont("helvetica", "normal");
    doc.text("Source Code Documentation", pageW / 2, 220, { align: "center" });
    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageW / 2, 260, { align: "center" });

    doc.setFontSize(13);
    doc.text("Architecture Overview", pageW / 2, 330, { align: "center" });
    const overview = [
      "Frontend: React + Tailwind CSS + Framer Motion",
      "Backend: Base44 (entities, auth, integrations)",
      "Map: React-Leaflet / OpenStreetMap",
      "Entities: StatusUpdate, Location, Reaction, Report, Favorite",
      "Pages: Home, Map, AddUpdate, LocationDetails, UserProfile, AdminDashboard",
    ];
    doc.setFontSize(10);
    overview.forEach((line, i) => {
      doc.text("• " + line, pageW / 2, 360 + i * 20, { align: "center" });
    });

    // Table of contents
    doc.addPage();
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, pageW, pageH, "F");
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Table of Contents", margin, 60);
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(2);
    doc.line(margin, 68, margin + 160, 68);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    FILES.forEach((file, i) => {
      doc.setTextColor(59, 130, 246);
      doc.text(`${i + 1}.`, margin, 100 + i * 18);
      doc.setTextColor(30, 41, 59);
      doc.text(file.name, margin + 20, 100 + i * 18);
    });

    // File pages
    FILES.forEach((file) => {
      doc.addPage();
      doc.setFillColor(248, 250, 252);
      doc.rect(0, 0, pageW, pageH, "F");

      // File header bar
      doc.setFillColor(30, 58, 138);
      doc.rect(0, 0, pageW, 50, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text(file.name, margin, 32);

      // Code background
      doc.setFillColor(15, 23, 42);
      doc.roundedRect(margin - 8, 65, maxW + 16, pageH - 80, 6, 6, "F");

      doc.setFont("courier", "normal");
      doc.setFontSize(8);
      doc.setTextColor(203, 213, 225);

      const lines = doc.splitTextToSize(file.content, maxW - 10);
      let y = 82;

      lines.forEach((line) => {
        if (y > pageH - 30) {
          doc.addPage();
          doc.setFillColor(248, 250, 252);
          doc.rect(0, 0, pageW, pageH, "F");
          // Continuation header
          doc.setFillColor(30, 58, 138);
          doc.rect(0, 0, pageW, 30, "F");
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(9);
          doc.setFont("helvetica", "bold");
          doc.text(file.name + " (continued)", margin, 20);
          // Code background
          doc.setFillColor(15, 23, 42);
          doc.roundedRect(margin - 8, 40, maxW + 16, pageH - 55, 6, 6, "F");
          doc.setFont("courier", "normal");
          doc.setFontSize(8);
          doc.setTextColor(203, 213, 225);
          y = 57;
        }
        // Syntax highlight keywords
        if (
          line.trim().startsWith("//") ||
          line.trim().startsWith("#")
        ) {
          doc.setTextColor(134, 239, 172); // green for comments
        } else if (
          line.includes("import ") ||
          line.includes("export ") ||
          line.includes("const ") ||
          line.includes("function ") ||
          line.includes("return ")
        ) {
          doc.setTextColor(147, 197, 253); // blue for keywords
        } else {
          doc.setTextColor(203, 213, 225); // default
        }
        doc.text(line, margin, y);
        y += lineH;
      });
    });

    // Footer on last page
    doc.addPage();
    doc.setFillColor(30, 58, 138);
    doc.rect(0, 0, pageW, pageH, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Live Status", pageW / 2, pageH / 2 - 30, { align: "center" });
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Built with Base44", pageW / 2, pageH / 2, { align: "center" });
    doc.text("base44.com", pageW / 2, pageH / 2 + 24, { align: "center" });

    doc.save("live-status-app-code.pdf");
    setGenerating(false);
    setDone(true);
    setTimeout(() => setDone(false), 3000);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="max-w-sm w-full text-center">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <FileDown className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Export App Code</h1>
        <p className="text-muted-foreground text-sm mb-8">
          Download a PDF with the full source code and architecture documentation for the Live Status app.
        </p>

        <div className="bg-card border border-border rounded-2xl p-4 mb-6 text-left space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Included in PDF</p>
          {FILES.map((f) => (
            <div key={f.name} className="flex items-center gap-2 text-sm text-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              {f.name}
            </div>
          ))}
        </div>

        <Button
          onClick={generatePDF}
          disabled={generating || done}
          className="w-full rounded-xl h-12 text-base font-semibold gap-2"
        >
          {done ? (
            <><CheckCircle className="w-5 h-5" /> Downloaded!</>
          ) : generating ? (
            "Generating PDF..."
          ) : (
            <><FileDown className="w-5 h-5" /> Download PDF</>
          )}
        </Button>
      </div>
    </div>
  );
}