"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import Link from "next/link";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Building2,
  CheckSquare,
  MessageSquare,
  BarChart3,
  Settings,
  LogOut,
  Search,
  Bell,
  Menu,
  X,
  Zap,
  ChevronRight,
  Plus,
  CalendarClock,
  UserCog,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, isAuthenticated } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Static counts for fast navigation (no API calls)
  const navCounts = { contacts: 0, unreadMessages: 3 };

  const mainNavigation = useMemo(() => [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Лиды", href: "/leads", icon: Zap },
    { name: "Сделки", href: "/deals", icon: Briefcase },
    { name: "Контакты", href: "/contacts", icon: Users },
    { name: "Компании", href: "/companies", icon: Building2 },
    { name: "Онлайн-запись", href: "/booking", icon: CalendarClock },
  ], []);

  const secondaryNavigation = useMemo(() => [
    { name: "Задачи", href: "/tasks", icon: CheckSquare },
    { name: "Сообщения", href: "/messages", icon: MessageSquare, badge: navCounts.unreadMessages || undefined },
    { name: "Сотрудники", href: "/employees", icon: UserCog },
    { name: "Аналитика", href: "/analytics", icon: BarChart3 },
  ], [navCounts]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [pathname, isMobile]);

  // Auth protection - redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  // Show loading while checking auth
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#050508]">
        <div className="text-white">Загрузка...</div>
      </div>
    );
  }

  const displayUser = user || {
    firstName: "Пользователь",
    lastName: "",
    email: "",
    role: "MANAGER"
  };

  const collapsed = !sidebarOpen && !isMobile;

  const renderNavItem = (item: { name: string; href: string; icon: any; badge?: number }) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
    const Icon = item.icon;

    return (
      <Link
        key={item.name}
        href={item.href}
        className={cn(
          "group flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium",
          isActive
            ? "bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg shadow-purple-500/25"
            : "text-gray-400 hover:bg-white/5 hover:text-white"
        )}
      >
        <Icon
          size={20}
          strokeWidth={isActive ? 2.5 : 2}
          className="shrink-0"
        />
        {!collapsed && (
          <>
            <span className="flex-1 truncate">{item.name}</span>
            {item.badge !== undefined && item.badge > 0 && (
              <span className={cn(
                "text-xs font-semibold px-2 py-0.5 rounded-full min-w-[20px] text-center",
                isActive
                  ? "bg-white/25 text-white"
                  : "bg-cyan-500 text-white"
              )}>
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            )}
          </>
        )}
      </Link>
    );
  };

  return (
    <div className="flex h-screen cosmic-bg overflow-hidden">
      {/* Stars overlay */}
      <div className="stars" />

      {/* Mobile backdrop */}
      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black/70 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed md:relative inset-y-0 left-0 z-50 flex flex-col glass-sidebar",
          isMobile
            ? (sidebarOpen ? "translate-x-0 w-[85vw] max-w-72" : "-translate-x-full w-[85vw] max-w-72")
            : (sidebarOpen ? "w-64" : "w-[72px]"),
          "md:translate-x-0"
        )}
      >
        {/* Logo Header */}
        <div className={cn(
          "flex items-center h-16 px-4 border-b border-white/5",
          !sidebarOpen && !isMobile ? "justify-center" : "justify-between"
        )}>
          {(sidebarOpen || isMobile) ? (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white tracking-tight">KAIF</h1>
                <p className="text-[10px] text-gray-500 font-medium -mt-0.5">CRM SYSTEM</p>
              </div>
            </div>
          ) : (
            <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
          )}

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={cn(
              "p-2 rounded-xl hover:bg-white/10",
              !sidebarOpen && !isMobile && "hidden"
            )}
          >
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        {/* Quick Actions */}
        {(sidebarOpen || isMobile) && (
          <div className="px-3 py-3 border-b border-white/5">
            <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-xl font-semibold text-sm hover:opacity-90 shadow-lg shadow-purple-500/25">
              <Plus size={18} strokeWidth={2.5} />
              Быстрое действие
            </button>
          </div>
        )}

        {/* Main Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1 scrollbar-minimal">
          {(sidebarOpen || isMobile) && (
            <p className="px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              Основное
            </p>
          )}

          {mainNavigation.map(renderNavItem)}

          {(sidebarOpen || isMobile) && (
            <p className="px-3 py-2 mt-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              Инструменты
            </p>
          )}

          {!sidebarOpen && !isMobile && (
            <div className="my-3 border-t border-white/5" />
          )}

          {secondaryNavigation.map(renderNavItem)}
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-white/5 p-3 space-y-1">
          {/* Settings */}
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium",
              pathname === '/settings'
                ? "bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg shadow-purple-500/25"
                : "text-gray-400 hover:bg-white/5 hover:text-white"
            )}
          >
            <Settings size={20} strokeWidth={pathname === '/settings' ? 2.5 : 2} className="shrink-0" />
            {(sidebarOpen || isMobile) && <span>Настройки</span>}
          </Link>

          {/* User Profile */}
          {(sidebarOpen || isMobile) ? (
            <div className="mt-2 p-3 bg-white/5 rounded-xl border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center text-white text-sm font-semibold shadow-lg shadow-cyan-500/25">
                  {displayUser.firstName?.[0] || 'U'}{displayUser.lastName?.[0] || ''}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {displayUser.firstName} {displayUser.lastName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {displayUser.role === "ADMIN" ? "Администратор" :
                     displayUser.role === "SUPERVISOR" ? "Супервайзер" :
                     displayUser.role === "OPERATOR" ? "Оператор" : "Менеджер"}
                  </p>
                </div>
                <button
                  onClick={() => {
                    logout();
                    router.push("/login");
                  }}
                  className="p-2 rounded-lg hover:bg-white/10"
                  title="Выйти"
                >
                  <LogOut size={16} className="text-gray-500" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => {
                logout();
                router.push("/login");
              }}
              className="w-full flex items-center justify-center p-2.5 rounded-xl text-gray-400 hover:bg-white/5"
              title="Выйти"
            >
              <LogOut size={20} />
            </button>
          )}
        </div>

        {/* Collapse Button (Desktop only) */}
        {!isMobile && (
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="absolute -right-3 top-20 w-6 h-6 bg-[#1a1a2e] border border-white/10 rounded-full shadow-lg flex items-center justify-center hover:bg-white/10 z-10"
          >
            <ChevronRight
              size={14}
              className={cn("text-gray-400", sidebarOpen && "rotate-180")}
            />
          </button>
        )}
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Header */}
        <header className="h-16 glass-card border-b border-white/5 shrink-0">
          <div className="flex h-full items-center justify-between px-4 md:px-6 gap-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2.5 rounded-xl hover:bg-white/10 md:hidden"
            >
              <Menu size={20} className="text-gray-400" />
            </button>

            {/* Search */}
            <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
              <div className="relative flex-1 max-w-lg hidden sm:block">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <input
                  type="search"
                  placeholder="Поиск по CRM..."
                  className="w-full rounded-xl bg-white/5 border border-white/10 pl-11 pr-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:bg-white/10 focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && searchQuery) {
                      router.push(`/search?q=${searchQuery}`);
                    }
                  }}
                />
              </div>
              {/* Mobile search button */}
              <button className="p-2.5 rounded-xl hover:bg-white/10 sm:hidden">
                <Search size={20} className="text-gray-400" />
              </button>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Notifications */}
              <button className="relative p-2.5 rounded-xl hover:bg-white/10">
                <Bell size={20} className="text-gray-400" />
                {navCounts.unreadMessages > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-cyan-500 border-2 border-[#0d0d14]" />
                )}
              </button>

              {/* User (Desktop) */}
              <div className="hidden md:flex items-center gap-3 pl-3 ml-1 border-l border-white/10">
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">
                    {displayUser.firstName} {displayUser.lastName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {displayUser.role === "ADMIN" ? "Администратор" :
                     displayUser.role === "SUPERVISOR" ? "Супервайзер" :
                     displayUser.role === "OPERATOR" ? "Оператор" : "Менеджер"}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center text-white text-sm font-semibold shadow-lg shadow-cyan-500/25">
                  {displayUser.firstName?.[0] || 'U'}{displayUser.lastName?.[0] || ''}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto scrollbar-minimal">
          {children}
        </div>
      </main>
    </div>
  );
}
