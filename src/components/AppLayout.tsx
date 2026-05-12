import { useNavigate, useLocation, Outlet, Navigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Users,
  Building2,
  Settings,
  LogOut,
  Menu,
  ChevronLeft,
  ClipboardList,
  Printer,
  UserCog,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import sikakLogo from "@/assets/sikak-logo.png";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

type MenuItem = { title: string; url: string; icon: React.ElementType };

const menuByRole: Record<string, MenuItem[]> = {
  admin_dinkes: [
    { title: "Dashboard", url: "/app", icon: LayoutDashboard },
    { title: "Kartu Keluarga", url: "/app/keluarga", icon: Users },
    { title: "Kartu Keperawatan", url: "/app/kartu", icon: FileText },
    { title: "Puskesmas", url: "/app/puskesmas", icon: Building2 },
    { title: "Pengguna", url: "/app/pengguna", icon: UserCog },
    { title: "Statistik", url: "/app/laporan", icon: BarChart3 },
    { title: "Cetak", url: "/app/cetak", icon: Printer },
    { title: "Pengaturan", url: "/app/pengaturan", icon: Settings },
  ],
  admin_puskesmas: [
    { title: "Dashboard", url: "/app", icon: LayoutDashboard },
    { title: "Kartu Keluarga", url: "/app/keluarga", icon: Users },
    { title: "Kartu Keperawatan", url: "/app/kartu", icon: FileText },
    { title: "Puskesmas", url: "/app/puskesmas", icon: Building2 },
    { title: "Pengguna", url: "/app/pengguna", icon: UserCog },
    { title: "Statistik", url: "/app/laporan", icon: BarChart3 },
    { title: "Cetak", url: "/app/cetak", icon: Printer },
    { title: "Pengaturan", url: "/app/pengaturan", icon: Settings },
  ],
  user_du: [
    { title: "Dashboard", url: "/app", icon: LayoutDashboard },
    { title: "Kartu Keluarga", url: "/app/keluarga", icon: Users },
    { title: "Statistik", url: "/app/laporan", icon: BarChart3 },
    { title: "Cetak", url: "/app/cetak", icon: Printer },
    { title: "Pengaturan", url: "/app/pengaturan", icon: Settings },
  ],
  user_poli: [
    { title: "Dashboard", url: "/app", icon: LayoutDashboard },
    { title: "Kartu Keperawatan", url: "/app/kartu", icon: FileText },
    { title: "Daftar Masuk", url: "/app/daftar-masuk", icon: ClipboardList },
    { title: "Statistik", url: "/app/laporan", icon: BarChart3 },
    { title: "Cetak", url: "/app/cetak", icon: Printer },
    { title: "Pengaturan", url: "/app/pengaturan", icon: Settings },
  ],
};

function getRoleLabel(role: string | null): string {
  if (role === "admin_dinkes") return "Admin Dinkes";
  if (role === "admin_puskesmas") return "Admin Puskesmas";
  if (role === "user_du") return "Petugas DU";
  if (role === "user_poli") return "Petugas Poli";
  return role ?? "";
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");
}

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, role, signOut, isAuthenticated } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [locationLabel, setLocationLabel] = useState("");

  const userName = user?.fullname_users || user?.email_users || "Petugas";
  const initials = getInitials(userName);
  const menuItems = menuByRole[role ?? ""] ?? menuByRole["user_du"];
  const roleLabel = getRoleLabel(role);

  /* Build location label for sidebar footer */
  useEffect(() => {
    const build = async () => {
      if (!role) return;

      if (role === "admin_dinkes") {
        setLocationLabel("Dinas Kesehatan Kab. Ponorogo");
        return;
      }

      if (
        (role === "admin_puskesmas" || role === "user_du") &&
        user?.id_puskesmas
      ) {
        const { data } = await (supabase as any)
          .from("puskesmas")
          .select("nama_puskesmas")
          .eq("id", user.id_puskesmas)
          .maybeSingle();
        setLocationLabel(`Puskesmas ${data?.nama_puskesmas ?? ""}`);
        return;
      }

      if (role === "user_poli" && user?.id_poli) {
        const { data } = await (supabase as any)
          .from("poli")
          .select("nama_poli")
          .eq("id", user.id_poli)
          .maybeSingle();
        setLocationLabel(`Poli ${data?.nama_poli ?? ""}`);
        return;
      }
    };
    build();
  }, [role, user]);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const isActive = (url: string) => {
    if (url === "/app") return location.pathname === "/app";
    return location.pathname.startsWith(url);
  };

if (loading) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );
}

if (!isAuthenticated) {
  return <Navigate to="/login" replace />;
}

  return (
    <div className="min-h-screen flex bg-background">
      {/* ── SIDEBAR ──────────────────────────────────────────── */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen bg-sidebar text-sidebar-foreground transition-all duration-300 flex flex-col
          ${collapsed ? "w-16" : "w-64"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* LOGO AREA */}
        <div
          className={`flex flex-col items-center justify-center border-b border-sidebar-border bg-black/20
            ${collapsed ? "py-3 px-2" : "py-5 px-4"}`}
        >
          <img
            src={sikakLogo}
            alt="SIKAK"
            className={`rounded-lg object-contain transition-all duration-300 ${collapsed ? "w-9 h-9" : "w-16 h-16"}`}
          />
          {!collapsed && (
            <>
              <p className="mt-3 text-lg font-bold text-sidebar-primary leading-tight tracking-wide">
                SIKAK
              </p>
              <p className="mt-1 text-[11px] text-sidebar-foreground/60 leading-snug text-center px-2">
                Sistem Informasi Kartu Asuhan Keperawatan
              </p>
            </>
          )}
        </div>

        {/* NAV MENU */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {menuItems.map((item) => {
            const active = isActive(item.url);
            return (
              <button
                key={item.url}
                onClick={() => {
                  navigate(item.url);
                  setMobileOpen(false);
                }}
                title={collapsed ? item.title : undefined}
                className={`w-full flex items-center gap-3 text-sm transition-colors
                  ${collapsed ? "justify-center px-2 py-2.5" : "px-4 py-2.5"}
                  ${
                    active
                      ? "bg-sidebar-accent text-sidebar-primary font-semibold border-r-2 border-sidebar-primary"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  }`}
              >
                <item.icon
                  className={`shrink-0 transition-all ${active ? "h-[18px] w-[18px]" : "h-[17px] w-[17px]"}`}
                />
                {!collapsed && <span>{item.title}</span>}
              </button>
            );
          })}
        </nav>

        {/* USER INFO FOOTER */}
        <div className="border-t border-sidebar-border p-3 space-y-2">
          {!collapsed && (
            <div className="flex items-center gap-2.5 px-1">
              {/* Avatar */}
              <div className="h-8 w-8 shrink-0 rounded-full bg-sidebar-primary/20 border border-sidebar-primary/30 flex items-center justify-center">
                <span className="text-xs font-bold text-sidebar-primary">
                  {initials}
                </span>
              </div>
              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-sidebar-foreground truncate">
                  {userName}
                </p>
                {locationLabel && (
                  <p className="text-[10px] text-sidebar-foreground/50 truncate mt-0.5">
                    {locationLabel}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Logout */}
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-sidebar-foreground/60
              hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors
              ${collapsed ? "justify-center px-2" : ""}`}
            title={collapsed ? "Keluar" : undefined}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="text-sm">Keluar</span>}
          </button>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex absolute -right-3 top-20 h-6 w-6 bg-card border border-border rounded-full items-center justify-center text-muted-foreground hover:text-foreground shadow-sm"
        >
          <ChevronLeft
            className={`h-3 w-3 transition-transform ${collapsed ? "rotate-180" : ""}`}
          />
        </button>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-foreground/20 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── MAIN CONTENT ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* HEADER */}
        <header className="sticky top-0 z-20 h-14 bg-card/95 backdrop-blur border-b border-border flex items-center px-4 gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex-1" />

          {/* User info right */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-medium text-foreground leading-tight">
                {userName}
              </span>
              <span className="text-xs text-muted-foreground leading-tight">
                {roleLabel}
              </span>
            </div>
            <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-primary">{initials}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
