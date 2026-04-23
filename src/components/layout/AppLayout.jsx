import { Outlet } from "react-router-dom";
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
}