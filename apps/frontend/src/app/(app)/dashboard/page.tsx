"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  Briefcase,
  DollarSign,
  CheckCircle2,
  Users,
  Plus,
  ChevronRight,
  Clock,
  Target,
  Zap,
  Bell,
  Loader2,
  CircleDot,
  ArrowUpRight,
  Sparkles
} from "lucide-react";
import { analyticsApi } from "@/lib/api";
import { useCurrency } from "@/hooks/useCurrency";

interface DashboardStats {
  totalContacts: number;
  totalDeals: number;
  totalTasks: number;
  totalCompanies: number;
  activeDeals: number;
  totalDealsAmount: number;
  pendingTasks: number;
  todayTasks: number;
  highPriorityTasks: number;
  recentContacts: number;
  dealsAddedToday: number;
  recentActivities: Array<{
    id: string;
    type: string;
    description: string;
    createdAt: string;
    user?: { firstName: string; lastName: string };
  }>;
  funnel: Array<{
    id: string;
    name: string;
    color: string;
    dealsCount: number;
    totalAmount: number;
  }>;
}

interface Task {
  id: string;
  title: string;
  dueDate: string;
  priority: string;
  contact?: { firstName: string; lastName: string };
  deal?: { title: string };
}

export default function DashboardPage() {
  const router = useRouter();
  const { formatCompact, format } = useCurrency();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsRes, tasksRes] = await Promise.all([
          analyticsApi.getDashboardStats(),
          analyticsApi.getTodayTasks(),
        ]);
        setStats(statsRes.data);
        setTodayTasks(tasksRes.data);
        setError(null);
      } catch (err: any) {
        console.error("Failed to fetch dashboard data:", err);
        setError(err.response?.data?.message || "Не удалось загрузить данные");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Доброе утро';
    if (hour < 18) return 'Добрый день';
    return 'Добрый вечер';
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('ru-RU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  const toggleTask = (taskId: string) => {
    setCompletedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'text-red-400';
      case 'HIGH': return 'text-orange-400';
      case 'MEDIUM': return 'text-violet-400';
      default: return 'text-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-violet-500" />
          <span className="text-gray-400 text-sm">Загрузка...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
          <Bell className="w-8 h-8 text-red-400" />
        </div>
        <p className="text-gray-300 font-medium">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-xl font-medium hover:from-violet-600 hover:to-purple-600 shadow-lg shadow-purple-500/25"
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  if (!stats) return null;

  const funnelTotal = stats.funnel.reduce((sum, stage) => sum + stage.dealsCount, 0) || 1;

  return (
    <div className="min-h-full">
      <div className="max-w-[1400px] mx-auto p-4 md:p-6 space-y-6">

        {/* Header */}
        <div className="pt-2">
          <p className="text-gray-500 text-sm capitalize">{getCurrentDate()}</p>
          <h1 className="text-[28px] md:text-[34px] font-bold text-white tracking-tight">
            {getGreeting()}
          </h1>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => router.push('/deals?new=true')}
            className="group bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-3 sm:p-4 flex flex-col items-center gap-2 shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 flex items-center justify-center">
              <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <span className="text-white text-xs font-medium">Сделка</span>
          </button>

          <button
            onClick={() => router.push('/contacts?new=true')}
            className="group glass-card rounded-2xl p-3 sm:p-4 flex flex-col items-center gap-2 hover:bg-white/5"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-cyan-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
            </div>
            <span className="text-gray-300 text-xs font-medium">Контакт</span>
          </button>

          <button
            onClick={() => router.push('/tasks?new=true')}
            className="group glass-card rounded-2xl p-3 sm:p-4 flex flex-col items-center gap-2 hover:bg-white/5"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400" />
            </div>
            <span className="text-gray-300 text-xs font-medium">Задача</span>
          </button>

          <button
            onClick={() => router.push('/leads')}
            className="group glass-card rounded-2xl p-3 sm:p-4 flex flex-col items-center gap-2 hover:bg-white/5"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-violet-500/20 flex items-center justify-center">
              <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-violet-400" />
            </div>
            <span className="text-gray-300 text-xs font-medium">Лиды</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Active Deals */}
          <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-violet-500/20 flex items-center justify-center">
                <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-violet-400" />
              </div>
              <div className="flex items-center gap-1 text-cyan-400 text-xs sm:text-sm font-medium">
                <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>+{stats.dealsAddedToday}</span>
              </div>
            </div>
            <div className="space-y-0.5 sm:space-y-1">
              <p className="text-2xl sm:text-3xl font-bold text-white">{stats.activeDeals}</p>
              <p className="text-gray-500 text-xs sm:text-sm">Активных сделок</p>
            </div>
          </div>

          {/* Total Amount */}
          <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
              </div>
            </div>
            <div className="space-y-0.5 sm:space-y-1">
              <p className="text-xl sm:text-3xl font-bold text-white">{formatCompact(stats.totalDealsAmount)}</p>
              <p className="text-gray-500 text-xs sm:text-sm">Сумма сделок</p>
            </div>
          </div>

          {/* Today Tasks */}
          <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-orange-500/20 flex items-center justify-center">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" />
              </div>
              {stats.highPriorityTasks > 0 && (
                <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-red-500/20 text-red-400 text-[10px] sm:text-xs font-medium rounded-full">
                  {stats.highPriorityTasks} срочных
                </span>
              )}
            </div>
            <div className="space-y-0.5 sm:space-y-1">
              <p className="text-2xl sm:text-3xl font-bold text-white">{stats.todayTasks}</p>
              <p className="text-gray-500 text-xs sm:text-sm">Задач на сегодня</p>
            </div>
          </div>

          {/* Contacts */}
          <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-cyan-500/20 flex items-center justify-center">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
              </div>
              <div className="flex items-center gap-1 text-cyan-400 text-xs sm:text-sm font-medium">
                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>+{stats.recentContacts}</span>
              </div>
            </div>
            <div className="space-y-0.5 sm:space-y-1">
              <p className="text-2xl sm:text-3xl font-bold text-white">{stats.totalContacts}</p>
              <p className="text-gray-500 text-xs sm:text-sm">Контактов</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-5 gap-3 sm:gap-4">

          {/* Tasks Widget */}
          <div className="lg:col-span-2 glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/25">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-semibold text-white">Мои задачи</h3>
              </div>
              <button
                onClick={() => router.push('/tasks')}
                className="text-violet-400 text-sm font-medium hover:text-violet-300 flex items-center gap-1"
              >
                Все <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              {todayTasks.length > 0 ? (
                todayTasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    onClick={() => toggleTask(task.id)}
                    className={`flex items-start gap-3 p-3 rounded-2xl cursor-pointer ${
                      completedTasks.has(task.id)
                        ? 'bg-white/5'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    <div className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      completedTasks.has(task.id)
                        ? 'bg-emerald-500 border-emerald-500'
                        : `border-gray-600 ${getPriorityColor(task.priority)}`
                    }`}>
                      {completedTasks.has(task.id) && (
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium ${
                        completedTasks.has(task.id)
                          ? 'text-gray-500 line-through'
                          : 'text-white'
                      }`}>
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-3 h-3 text-gray-500" />
                        <span className="text-xs text-gray-500">{formatTime(task.dueDate)}</span>
                        {task.contact && (
                          <>
                            <span className="text-gray-600">•</span>
                            <span className="text-xs text-gray-500 truncate">
                              {task.contact.firstName} {task.contact.lastName}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="w-6 h-6 text-gray-500" />
                  </div>
                  <p className="text-gray-500 text-sm">Нет задач на сегодня</p>
                </div>
              )}
            </div>
          </div>

          {/* Sales Funnel */}
          <div className="lg:col-span-3 glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
                  <Target className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-semibold text-white">Воронка продаж</h3>
              </div>
              <button
                onClick={() => router.push('/deals')}
                className="text-violet-400 text-sm font-medium hover:text-violet-300 flex items-center gap-1"
              >
                Сделки <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {stats.funnel.map((stage) => {
                const percentage = Math.round((stage.dealsCount / funnelTotal) * 100);
                const widthPercent = Math.max(percentage, 8);

                return (
                  <div key={stage.id} className="group">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: stage.color }}
                        />
                        <span className="text-sm font-medium text-gray-300">{stage.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500">
                          {format(stage.totalAmount)}
                        </span>
                        <span className="text-sm font-semibold text-white w-8 text-right">
                          {stage.dealsCount}
                        </span>
                      </div>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${widthPercent}%`,
                          backgroundColor: stage.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}

              {stats.funnel.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm">Нет данных о воронке</p>
                </div>
              )}
            </div>

            {/* Funnel Summary */}
            {stats.funnel.length > 0 && (
              <div className="mt-6 pt-5 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CircleDot className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-500">Всего в воронке</span>
                  </div>
                  <span className="text-lg font-bold text-white">{funnelTotal} сделок</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center shadow-lg shadow-cyan-500/25">
                <Bell className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-semibold text-white">Последние действия</h3>
            </div>
            <button
              onClick={() => router.push('/analytics')}
              className="text-violet-400 text-sm font-medium hover:text-violet-300 flex items-center gap-1"
            >
              История <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {stats.recentActivities.length > 0 ? (
              stats.recentActivities.slice(0, 6).map((activity) => {
                const getActivityIcon = (type: string) => {
                  switch (type) {
                    case 'DEAL_CREATED': return { icon: Briefcase, bg: 'bg-emerald-500/20', color: 'text-emerald-400' };
                    case 'CONTACT_CREATED': return { icon: Users, bg: 'bg-violet-500/20', color: 'text-violet-400' };
                    case 'TASK_COMPLETED': return { icon: CheckCircle2, bg: 'bg-cyan-500/20', color: 'text-cyan-400' };
                    case 'DEAL_UPDATED': return { icon: TrendingUp, bg: 'bg-orange-500/20', color: 'text-orange-400' };
                    default: return { icon: CircleDot, bg: 'bg-white/5', color: 'text-gray-400' };
                  }
                };

                const activityStyle = getActivityIcon(activity.type);
                const ActivityIcon = activityStyle.icon;

                const timeAgo = (dateString: string) => {
                  const date = new Date(dateString);
                  const now = new Date();
                  const diffMs = now.getTime() - date.getTime();
                  const diffMins = Math.floor(diffMs / 60000);
                  const diffHours = Math.floor(diffMs / 3600000);

                  if (diffMins < 60) return `${diffMins} мин`;
                  if (diffHours < 24) return `${diffHours} ч`;
                  return `${Math.floor(diffHours / 24)} д`;
                };

                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 rounded-2xl hover:bg-white/5 cursor-pointer"
                  >
                    <div className={`w-10 h-10 rounded-xl ${activityStyle.bg} flex items-center justify-center shrink-0`}>
                      <ActivityIcon className={`w-5 h-5 ${activityStyle.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-300 line-clamp-2">{activity.description}</p>
                      <p className="text-xs text-gray-600 mt-1">{timeAgo(activity.createdAt)} назад</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-500 text-sm">Нет активности</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
