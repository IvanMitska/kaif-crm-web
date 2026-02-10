"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { api } from "@/lib/api";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavCounts {
  contacts: number;
  unreadMessages: number;
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const [navCounts, setNavCounts] = useState<NavCounts>({ contacts: 0, unreadMessages: 0 });

  // Fetch navigation counts
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [contactsRes, messagesRes] = await Promise.allSettled([
          api.get('/contacts', { params: { limit: 0 } }),
          api.get('/messages/unread/count'),
        ]);

        setNavCounts({
          contacts: contactsRes.status === 'fulfilled' ? (contactsRes.value.data.total || 0) : 0,
          unreadMessages: messagesRes.status === 'fulfilled' ? (messagesRes.value.data.count || 0) : 0,
        });
      } catch (error) {
        console.error('Failed to fetch nav counts:', error);
      }
    };

    if (mounted) {
      fetchCounts();
      // Refresh counts every minute
      const interval = setInterval(fetchCounts, 60000);
      return () => clearInterval(interval);
    }
  }, [mounted]);

  const navigation = useMemo(() => [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Лиды", href: "/leads", icon: Users, badge: navCounts.contacts || undefined },
    { name: "Сделки", href: "/deals", icon: Briefcase },
    { name: "Контакты", href: "/contacts", icon: Users },
    { name: "Компании", href: "/companies", icon: Building2 },
    { name: "Задачи", href: "/tasks", icon: CheckSquare },
    { name: "Сообщения", href: "/messages", icon: MessageSquare, badge: navCounts.unreadMessages || undefined },
    { name: "Аналитика", href: "/analytics", icon: BarChart3 },
  ], [navCounts]);

  useEffect(() => {
    setMounted(true);
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

  // Close sidebar on navigation (mobile)
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [pathname, isMobile]);

  // Use real user from auth store or fallback
  const displayUser = user || {
    firstName: "Пользователь",
    lastName: "",
    email: "",
    role: "MANAGER"
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed md:relative inset-y-0 left-0 z-50 flex flex-col border-r border-gray-100 bg-white transition-transform duration-200 md:transition-[width] md:translate-x-0",
          sidebarOpen
            ? "translate-x-0 w-72 md:w-64"
            : "-translate-x-full md:translate-x-0 md:w-16"
        )}
      >
        <div className="flex h-14 items-center justify-between px-4 border-b border-gray-100">
          {(sidebarOpen || isMobile) && (
            <span className="text-lg font-semibold tracking-tight">KAIF</span>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-md hover:bg-gray-100 transition-colors ml-auto"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto scrollbar-minimal">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <a
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors",
                  isActive
                    ? "bg-gray-900 text-white"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <item.icon size={20} strokeWidth={isActive ? 2 : 1.5} className="shrink-0" />
                <span className={cn("flex-1", !sidebarOpen && "md:hidden")}>{item.name}</span>
                {item.badge !== undefined && (
                  <span className={cn(
                    "text-xs font-medium px-1.5 py-0.5 rounded",
                    isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600",
                    !sidebarOpen && "md:hidden"
                  )}>
                    {item.badge}
                  </span>
                )}
              </a>
            );
          })}
        </nav>

        <div className="border-t border-gray-100 p-3">
          <a
            href="/settings"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors",
              pathname === '/settings'
                ? "bg-gray-900 text-white"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            )}
          >
            <Settings size={20} strokeWidth={pathname === '/settings' ? 2 : 1.5} className="shrink-0" />
            <span className={cn(!sidebarOpen && "md:hidden")}>Настройки</span>
          </a>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-14 border-b border-gray-100 bg-white shrink-0">
          <div className="flex h-full items-center justify-between px-4 md:px-6 gap-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-md hover:bg-gray-100 transition-colors md:hidden"
            >
              <Menu size={20} className="text-gray-600" />
            </button>

            {/* Search */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  placeholder="Поиск..."
                  className="w-full rounded-md bg-gray-50 border-0 pl-9 pr-4 py-2 text-sm focus:bg-white focus:ring-1 focus:ring-gray-200 transition-all placeholder:text-gray-400"
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

            {/* Right side */}
            <div className="flex items-center gap-2 md:gap-3 shrink-0">
              <button className="relative p-2 rounded-md hover:bg-gray-100 transition-colors">
                <Bell size={18} className="text-gray-600" />
                {navCounts.unreadMessages > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
                )}
              </button>

              <div className="flex items-center gap-2 md:gap-3 pl-2 md:pl-3 border-l border-gray-100">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">
                    {displayUser.firstName} {displayUser.lastName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {displayUser.role === "ADMIN" ? "Администратор" :
                     displayUser.role === "SUPERVISOR" ? "Супервайзер" :
                     displayUser.role === "OPERATOR" ? "Оператор" : "Менеджер"}
                  </p>
                </div>
                <div className="h-9 w-9 rounded-full bg-gray-900 flex items-center justify-center text-white text-sm font-medium shrink-0">
                  {displayUser.firstName?.[0] || 'U'}{displayUser.lastName?.[0] || ''}
                </div>
                <button
                  onClick={() => {
                    logout();
                    router.push("/login");
                  }}
                  className="p-2 rounded-md hover:bg-gray-100 transition-colors hidden sm:block"
                >
                  <LogOut size={18} className="text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto bg-gray-50">
          {children}
        </div>
      </main>
    </div>
  );
}
