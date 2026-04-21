"use client";

import { useEffect, useState, useMemo, useCallback, memo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import Link from "next/link";
import Image from "next/image";
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
  Zap,
  ChevronLeft,
  CalendarClock,
  UserCog,
  MoreHorizontal,
  GraduationCap,
  Workflow,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import OnboardingTour, {
  useOnboardingTour,
} from "@/components/onboarding/OnboardingTour";

type NavItem = {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  tourId?: string;
};

/* ─── Sidebar Nav Item (desktop) ─── */
const SidebarNavItem = memo(function SidebarNavItem({
  item,
  active,
  expanded,
}: {
  item: NavItem;
  active: boolean;
  expanded: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      data-tour={item.tourId}
      className={cn(
        "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-colors duration-150",
        active
          ? "bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg shadow-purple-500/25"
          : "text-gray-400 hover:bg-white/5 hover:text-white"
      )}
    >
      <Icon size={20} strokeWidth={active ? 2.5 : 2} className="shrink-0" />
      {expanded && (
        <>
          <span className="flex-1 truncate">{item.name}</span>
          {item.badge !== undefined && item.badge > 0 && (
            <span
              className={cn(
                "text-xs font-semibold px-2 py-0.5 rounded-full min-w-[20px] text-center",
                active ? "bg-white/25 text-white" : "bg-cyan-500 text-white"
              )}
            >
              {item.badge > 99 ? "99+" : item.badge}
            </span>
          )}
        </>
      )}
      {!expanded && (
        <div className="absolute left-full ml-2 px-2.5 py-1.5 rounded-lg bg-[#1a1a2e] border border-white/10 text-sm text-white whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-50 shadow-xl">
          {item.name}
          {item.badge !== undefined && item.badge > 0 && (
            <span className="ml-2 text-xs bg-cyan-500 text-white px-1.5 py-0.5 rounded-full">
              {item.badge}
            </span>
          )}
        </div>
      )}
      {!expanded && item.badge !== undefined && item.badge > 0 && (
        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-cyan-500" />
      )}
    </Link>
  );
});

/* ─── Bottom Tab Item (mobile) ─── */
const BottomTabItem = memo(function BottomTabItem({
  item,
  active,
}: {
  item: NavItem;
  active: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      prefetch
      className={cn(
        "relative flex flex-col items-center justify-center gap-1 py-2 flex-1 min-w-0",
        active ? "text-violet-400" : "text-gray-500"
      )}
    >
      <div className="relative">
        <Icon size={24} strokeWidth={active ? 2.5 : 1.8} />
        {item.badge !== undefined && item.badge > 0 && (
          <span className="absolute -top-1.5 -right-3 h-5 min-w-[20px] px-1 flex items-center justify-center rounded-full bg-cyan-500 text-[10px] font-bold text-white">
            {item.badge > 99 ? "99+" : item.badge}
          </span>
        )}
      </div>
      <span className="text-[11px] font-medium truncate max-w-full">
        {item.name}
      </span>
      {active && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 rounded-full bg-violet-400" />
      )}
    </Link>
  );
});

/* ─── More Sheet Grid Item ─── */
const MoreSheetItem = memo(function MoreSheetItem({
  item,
  active,
  onClose,
}: {
  item: NavItem;
  active: boolean;
  onClose: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      prefetch
      onClick={onClose}
      className={cn(
        "flex flex-col items-center gap-2 p-3 rounded-2xl",
        active
          ? "bg-violet-500/20 text-violet-300"
          : "text-gray-400 active:bg-white/5"
      )}
    >
      <div className="relative">
        <Icon size={24} strokeWidth={active ? 2.5 : 1.8} />
        {item.badge !== undefined && item.badge > 0 && (
          <span className="absolute -top-1 -right-2 h-4 min-w-[16px] px-1 flex items-center justify-center rounded-full bg-cyan-500 text-[10px] font-bold text-white">
            {item.badge > 99 ? "99+" : item.badge}
          </span>
        )}
      </div>
      <span className="text-xs font-medium text-center leading-tight">
        {item.name}
      </span>
    </Link>
  );
});

/* ═══════════════════════════════════════════ */
/* Main Layout                                */
/* ═══════════════════════════════════════════ */
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, isAuthenticated, hasHydrated } = useAuthStore();
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { isCompleted: tourCompleted, restart: restartTour } = useOnboardingTour();

  const navCounts = { contacts: 0, unreadMessages: 3 };

  const mainNavigation: NavItem[] = useMemo(
    () => [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, tourId: "dashboard" },
      { name: "Лиды", href: "/leads", icon: Zap, tourId: "leads" },
      { name: "Сделки", href: "/deals", icon: Briefcase, tourId: "deals" },
      { name: "Контакты", href: "/contacts", icon: Users, tourId: "contacts" },
      { name: "Компании", href: "/companies", icon: Building2, tourId: "companies" },
      { name: "Онлайн-запись", href: "/booking", icon: CalendarClock },
    ],
    []
  );

  const secondaryNavigation: NavItem[] = useMemo(
    () => [
      { name: "Задачи", href: "/tasks", icon: CheckSquare, tourId: "tasks" },
      {
        name: "Сообщения",
        href: "/messages",
        icon: MessageSquare,
        badge: navCounts.unreadMessages || undefined,
        tourId: "messages",
      },
      { name: "Сотрудники", href: "/employees", icon: UserCog },
      { name: "Автоматизации", href: "/automation", icon: Workflow },
      { name: "Аналитика", href: "/analytics", icon: BarChart3, tourId: "analytics" },
    ],
    [navCounts]
  );

  const allNavigation = useMemo(
    () => [...mainNavigation, ...secondaryNavigation],
    [mainNavigation, secondaryNavigation]
  );

  // Mobile bottom bar: key items + "More"
  const mobileTabItems = useMemo(
    () => [
      allNavigation[0], // Dashboard
      allNavigation[2], // Сделки
      allNavigation[6], // Задачи
      allNavigation[7], // Сообщения
    ],
    [allNavigation]
  );

  // Items inside "More" sheet
  const moreSheetItems: NavItem[] = useMemo(
    () => [
      allNavigation[1], // Лиды
      allNavigation[3], // Контакты
      allNavigation[4], // Компании
      allNavigation[5], // Онлайн-запись
      allNavigation[8], // Сотрудники
      allNavigation[9], // Аналитика
      { name: "Настройки", href: "/settings", icon: Settings },
    ],
    [allNavigation]
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.push("/login");
    }
  }, [hasHydrated, isAuthenticated, router]);

  const handleLogout = useCallback(() => {
    logout();
    router.push("/login");
  }, [logout, router]);

  const closeMore = useCallback(() => setMoreOpen(false), []);

  const isItemActive = useCallback(
    (href: string) => pathname === href || pathname.startsWith(href + "/"),
    [pathname]
  );

  const isMoreActive = moreSheetItems.some((item) => isItemActive(item.href));

  if (!hasHydrated || !isAuthenticated) {
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
    role: "MANAGER",
  };

  const roleLabel =
    displayUser.role === "ADMIN"
      ? "Администратор"
      : displayUser.role === "SUPERVISOR"
        ? "Супервайзер"
        : displayUser.role === "OPERATOR"
          ? "Оператор"
          : "Менеджер";

  return (
    <div className="flex h-[100dvh] cosmic-bg overflow-hidden">
      <div className="stars" />

      {/* ═══ Desktop Sidebar (lg+) ═══ */}
      <aside
        className={cn(
          "hidden lg:flex flex-col fixed inset-y-0 left-0 z-40 glass-sidebar transition-all duration-300 ease-in-out",
          sidebarExpanded ? "w-64" : "w-[72px]"
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            "flex items-center h-16 px-4 border-b border-white/5",
            !sidebarExpanded && "justify-center"
          )}
        >
          <div className="flex items-center gap-3">
            <Image
              src="/logo-icon-v2.png"
              alt="Sintara CRM"
              width={36}
              height={36}
              className="rounded-xl shadow-lg shadow-purple-500/30 shrink-0"
            />
            {sidebarExpanded && (
              <div>
                <h1 className="text-lg font-bold text-white tracking-tight">
                  Sintara
                </h1>
                <p className="text-[10px] text-gray-500 font-medium -mt-0.5">
                  CRM SYSTEM
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1 scrollbar-minimal">
          {sidebarExpanded && (
            <p className="px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              Основное
            </p>
          )}
          {mainNavigation.map((item) => (
            <SidebarNavItem
              key={item.href}
              item={item}
              active={isItemActive(item.href)}
              expanded={sidebarExpanded}
            />
          ))}

          {sidebarExpanded ? (
            <p className="px-3 py-2 mt-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              Инструменты
            </p>
          ) : (
            <div className="my-3 border-t border-white/5" />
          )}
          {secondaryNavigation.map((item) => (
            <SidebarNavItem
              key={item.href}
              item={item}
              active={isItemActive(item.href)}
              expanded={sidebarExpanded}
            />
          ))}
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-white/5 p-3 space-y-1">
          {tourCompleted && (
            <button
              onClick={restartTour}
              className={cn(
                "group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-colors duration-150 text-gray-400 hover:bg-white/5 hover:text-white",
                !sidebarExpanded && "justify-center"
              )}
            >
              <GraduationCap size={20} strokeWidth={2} className="shrink-0" />
              {sidebarExpanded && <span>Обучение</span>}
              {!sidebarExpanded && (
                <div className="absolute left-full ml-2 px-2.5 py-1.5 rounded-lg bg-[#1a1a2e] border border-white/10 text-sm text-white whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-50 shadow-xl">
                  Обучение
                </div>
              )}
            </button>
          )}
          <Link
            href="/settings"
            className={cn(
              "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-colors duration-150",
              isItemActive("/settings")
                ? "bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg shadow-purple-500/25"
                : "text-gray-400 hover:bg-white/5 hover:text-white"
            )}
          >
            <Settings
              size={20}
              strokeWidth={isItemActive("/settings") ? 2.5 : 2}
              className="shrink-0"
            />
            {sidebarExpanded && <span>Настройки</span>}
            {!sidebarExpanded && (
              <div className="absolute left-full ml-2 px-2.5 py-1.5 rounded-lg bg-[#1a1a2e] border border-white/10 text-sm text-white whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-50 shadow-xl">
                Настройки
              </div>
            )}
          </Link>

          {sidebarExpanded ? (
            <div className="mt-2 p-3 bg-white/5 rounded-xl border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center text-white text-sm font-semibold shadow-lg shadow-cyan-500/25 shrink-0">
                  {displayUser.firstName?.[0] || "U"}
                  {displayUser.lastName?.[0] || ""}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {displayUser.firstName} {displayUser.lastName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{roleLabel}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg hover:bg-white/10"
                  title="Выйти"
                >
                  <LogOut size={16} className="text-gray-500" />
                </button>
              </div>
            </div>
          ) : (
            <div className="group relative">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center p-2.5 rounded-xl text-gray-400 hover:bg-white/5"
                title="Выйти"
              >
                <LogOut size={20} />
              </button>
              <div className="absolute left-full ml-2 bottom-0 px-2.5 py-1.5 rounded-lg bg-[#1a1a2e] border border-white/10 text-sm text-white whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-50 shadow-xl">
                Выйти
              </div>
            </div>
          )}

          <button
            onClick={() => setSidebarExpanded((prev) => !prev)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 hover:bg-white/5 hover:text-gray-400 transition-colors duration-150",
              !sidebarExpanded && "justify-center"
            )}
          >
            <ChevronLeft
              size={20}
              className={cn(
                "shrink-0 transition-transform duration-300",
                !sidebarExpanded && "rotate-180"
              )}
            />
            {sidebarExpanded && <span className="text-sm">Свернуть</span>}
          </button>
        </div>
      </aside>

      {/* ═══ Main Content ═══ */}
      <main
        className={cn(
          "flex-1 flex flex-col overflow-hidden min-w-0 transition-all duration-300",
          !isMobile && sidebarExpanded && "lg:ml-64",
          !isMobile && !sidebarExpanded && "lg:ml-[72px]"
        )}
      >
        {/* Top Header */}
        <header className="h-14 lg:h-16 glass-card border-b border-white/5 shrink-0">
          <div className="flex h-full items-center justify-between px-4 lg:px-6 gap-4">
            <div className="flex items-center gap-2 lg:hidden">
              <Image
                src="/logo-icon-v2.png"
                alt="Sintara CRM"
                width={30}
                height={30}
                className="rounded-lg shadow-lg shadow-purple-500/30"
              />
              <span className="text-base font-bold text-white">Sintara</span>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
              <div className="relative flex-1 max-w-lg hidden lg:block">
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
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button className="p-2.5 rounded-xl hover:bg-white/10 lg:hidden">
                <Search size={20} className="text-gray-400" />
              </button>
              <button className="relative p-2.5 rounded-xl hover:bg-white/10">
                <Bell size={20} className="text-gray-400" />
                {navCounts.unreadMessages > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-cyan-500 border-2 border-[#0d0d14]" />
                )}
              </button>
              <div className="hidden lg:flex items-center gap-3 pl-3 ml-1 border-l border-white/10">
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">
                    {displayUser.firstName} {displayUser.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{roleLabel}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center text-white text-sm font-semibold shadow-lg shadow-cyan-500/25">
                  {displayUser.firstName?.[0] || "U"}
                  {displayUser.lastName?.[0] || ""}
                </div>
              </div>
            </div>
          </div>
        </header>

        <div
          className={cn(
            "flex-1 overflow-auto scrollbar-minimal",
            isMobile && "pb-20"
          )}
        >
          {children}
        </div>
      </main>

      {/* ═══ Mobile Bottom Tab Bar ═══ */}
      <nav className="fixed bottom-0 inset-x-0 z-40 lg:hidden glass-card border-t border-white/5">
        <div className="flex items-stretch h-[72px] px-2 safe-area-bottom">
          {mobileTabItems.map((item) => (
            <BottomTabItem
              key={item.href}
              item={item}
              active={isItemActive(item.href)}
            />
          ))}
          <button
            onClick={() => setMoreOpen(true)}
            className={cn(
              "relative flex flex-col items-center justify-center gap-1 py-2 flex-1 min-w-0",
              isMoreActive ? "text-violet-400" : "text-gray-500"
            )}
          >
            <MoreHorizontal size={24} strokeWidth={1.8} />
            <span className="text-[11px] font-medium">Ещё</span>
            {isMoreActive && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-violet-400" />
            )}
          </button>
        </div>
      </nav>

      {/* ═══ "More" Bottom Sheet ═══ */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent
          side="bottom"
          className="glass-strong border-white/10 rounded-t-2xl px-4 pb-8 pt-3 max-h-[70dvh]"
        >
          <span className="sr-only">
            <SheetTitle>Навигация</SheetTitle>
          </span>

          <div className="flex justify-center mb-4">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>

          <div className="grid grid-cols-4 gap-3">
            {moreSheetItems.map((item) => (
              <MoreSheetItem
                key={item.href}
                item={item}
                active={isItemActive(item.href)}
                onClose={closeMore}
              />
            ))}
          </div>

          <div className="mt-6 p-3 bg-white/5 rounded-xl border border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center text-white text-sm font-semibold shadow-lg shadow-cyan-500/25 shrink-0">
                {displayUser.firstName?.[0] || "U"}
                {displayUser.lastName?.[0] || ""}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {displayUser.firstName} {displayUser.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate">{roleLabel}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-white/10"
                title="Выйти"
              >
                <LogOut size={16} className="text-gray-500" />
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <OnboardingTour />
    </div>
  );
}
