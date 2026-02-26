import { Sidebar, MobileSidebarNav } from "@/components/layout/Sidebar";
import { Footer } from "@/components/layout/Footer";
import { Shield, Bell, Sun, Moon } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <Sidebar organizationName="Mine Corp Ltd" />

      {/* Main content area — offset by sidebar width on large screens */}
      <div className="lg:pl-60">
        {/* Top bar */}
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
          <div className="flex h-14 items-center gap-4 px-4 lg:px-6">
            <div className="flex items-center gap-2 lg:hidden">
              <Shield className="h-5 w-5" />
              <span className="font-semibold text-sm">Dustinel AI</span>
            </div>
            <div className="flex-1" />
            <button className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-secondary transition-colors">
              <Bell className="h-4 w-4" />
            </button>
          </div>
          {/* Mobile nav */}
          <MobileSidebarNav />
        </header>

        <main className="p-4 lg:p-6 min-h-[calc(100vh-3.5rem)]">
          {children}
        </main>

        <Footer />
      </div>
    </div>
  );
}