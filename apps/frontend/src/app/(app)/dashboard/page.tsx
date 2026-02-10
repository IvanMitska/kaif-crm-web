"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  Briefcase,
  DollarSign,
  CheckSquare,
  Users,
  Plus,
  UserPlus,
  FileText,
  Calendar,
  ArrowRight,
  Circle,
  Loader2
} from "lucide-react";
import { analyticsApi } from "@/lib/api";

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
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ru-RU').format(amount);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} мин. назад`;
    if (diffHours < 24) return `${diffHours} ч. назад`;
    if (diffDays === 1) return 'Вчера';
    return `${diffDays} дн. назад`;
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'DEAL_CREATED': return 'bg-green-500';
      case 'CONTACT_CREATED': return 'bg-blue-500';
      case 'TASK_COMPLETED': return 'bg-purple-500';
      case 'DEAL_UPDATED': return 'bg-yellow-500';
      default: return 'bg-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-gray-500">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
        >
          Повторить
        </button>
      </div>
    );
  }

  if (!stats) return null;

  // Calculate funnel total for percentages
  const funnelTotal = stats.funnel.reduce((sum, stage) => sum + stage.dealsCount, 0) || 1;

  return (
    <div className="p-4 md:p-6 overflow-y-auto h-full">
      <div className="max-w-[1400px] mx-auto space-y-4 md:space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900">Добро пожаловать</h1>
          <p className="text-sm md:text-base text-gray-500 mt-1">Обзор активности за сегодня</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
          <div className="bg-white rounded-xl p-4 md:p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm font-medium text-gray-500 truncate">Активные сделки</p>
                <p className="mt-1 md:mt-2 text-2xl md:text-3xl font-semibold text-gray-900">{stats.activeDeals}</p>
              </div>
              <div className="p-2 md:p-2.5 bg-gray-100 rounded-lg shrink-0 ml-2">
                <Briefcase size={18} className="text-gray-700 md:w-5 md:h-5" />
              </div>
            </div>
            <div className="mt-2 md:mt-3 flex items-center gap-1 md:gap-1.5 text-xs md:text-sm">
              <TrendingUp size={12} className="text-green-600 md:w-3.5 md:h-3.5" />
              <span className="text-green-600 font-medium">+{stats.dealsAddedToday}</span>
              <span className="text-gray-500">за сегодня</span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 md:p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm font-medium text-gray-500 truncate">Сумма сделок</p>
                <p className="mt-1 md:mt-2 text-xl md:text-3xl font-semibold text-gray-900">
                  {formatAmount(stats.totalDealsAmount)}
                  <span className="text-sm md:text-lg font-normal text-gray-400 ml-0.5 md:ml-1">₽</span>
                </p>
              </div>
              <div className="p-2 md:p-2.5 bg-gray-100 rounded-lg shrink-0 ml-2">
                <DollarSign size={18} className="text-gray-700 md:w-5 md:h-5" />
              </div>
            </div>
            <div className="mt-2 md:mt-3 flex items-center gap-1 md:gap-1.5 text-xs md:text-sm">
              <TrendingUp size={12} className="text-green-600 md:w-3.5 md:h-3.5" />
              <span className="text-green-600 font-medium">{stats.activeDeals}</span>
              <span className="text-gray-500 hidden sm:inline">активных сделок</span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 md:p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm font-medium text-gray-500 truncate">Задачи на сегодня</p>
                <p className="mt-1 md:mt-2 text-2xl md:text-3xl font-semibold text-gray-900">{stats.todayTasks}</p>
              </div>
              <div className="p-2 md:p-2.5 bg-gray-100 rounded-lg shrink-0 ml-2">
                <CheckSquare size={18} className="text-gray-700 md:w-5 md:h-5" />
              </div>
            </div>
            <div className="mt-2 md:mt-3 flex items-center gap-1 md:gap-1.5 text-xs md:text-sm">
              <Circle size={6} className="text-orange-500 fill-orange-500 md:w-2 md:h-2" />
              <span className="text-gray-600 truncate">{stats.highPriorityTasks} высокого приоритета</span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 md:p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm font-medium text-gray-500 truncate">Контакты</p>
                <p className="mt-1 md:mt-2 text-2xl md:text-3xl font-semibold text-gray-900">{stats.totalContacts}</p>
              </div>
              <div className="p-2 md:p-2.5 bg-gray-100 rounded-lg shrink-0 ml-2">
                <Users size={18} className="text-gray-700 md:w-5 md:h-5" />
              </div>
            </div>
            <div className="mt-2 md:mt-3 flex items-center gap-1 md:gap-1.5 text-xs md:text-sm">
              <TrendingUp size={12} className="text-green-600 md:w-3.5 md:h-3.5" />
              <span className="text-green-600 font-medium">+{stats.recentContacts}</span>
              <span className="text-gray-500">за неделю</span>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-4 md:gap-6 lg:grid-cols-5">
          {/* Recent Activity */}
          <div className="lg:col-span-3 bg-white rounded-xl p-4 md:p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4 md:mb-5">
              <h3 className="font-semibold text-gray-900">Последние действия</h3>
              <button
                onClick={() => router.push('/analytics')}
                className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1"
              >
                Все <ArrowRight size={14} />
              </button>
            </div>
            <div className="space-y-1">
              {stats.recentActivities.length > 0 ? (
                stats.recentActivities.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3 md:gap-4 p-2.5 md:p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className={`w-2 h-2 md:w-2.5 md:h-2.5 rounded-full shrink-0 ${getActivityColor(activity.type)}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{formatRelativeTime(activity.createdAt)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">Нет активности</p>
              )}
            </div>
          </div>

          {/* Today Tasks */}
          <div className="lg:col-span-2 bg-white rounded-xl p-4 md:p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4 md:mb-5">
              <h3 className="font-semibold text-gray-900">Задачи</h3>
              <button
                onClick={() => router.push('/tasks')}
                className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1"
              >
                Все <ArrowRight size={14} />
              </button>
            </div>
            <div className="space-y-2">
              {todayTasks.length > 0 ? (
                todayTasks.slice(0, 5).map((task, index) => (
                  <div
                    key={task.id}
                    className={`flex items-center justify-between p-2.5 md:p-3 rounded-lg ${
                      index === 0 && task.priority === 'HIGH'
                        ? 'bg-orange-50 border border-orange-200'
                        : 'hover:bg-gray-50'
                    } transition-colors`}
                  >
                    <div className="flex items-center gap-2.5 md:gap-3 min-w-0 flex-1">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${
                        task.priority === 'URGENT' ? 'bg-red-500' :
                        task.priority === 'HIGH' ? 'bg-orange-500' :
                        'bg-gray-400'
                      }`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                        <p className="text-xs text-gray-500">
                          {task.contact ? `${task.contact.firstName} ${task.contact.lastName}` :
                           task.deal?.title || ''}
                        </p>
                      </div>
                    </div>
                    <span className={`text-sm shrink-0 ml-2 ${
                      task.priority === 'HIGH' || task.priority === 'URGENT'
                        ? 'font-semibold text-orange-600'
                        : 'text-gray-500'
                    }`}>
                      {formatTime(task.dueDate)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">Нет задач на сегодня</p>
              )}
            </div>
          </div>
        </div>

        {/* Additional Sections */}
        <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
          {/* Sales Funnel */}
          <div className="bg-white rounded-xl p-4 md:p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4 md:mb-5">Воронка продаж</h3>
            <div className="space-y-3 md:space-y-4">
              {stats.funnel.map((stage, index) => (
                <div key={stage.id}>
                  <div className="flex justify-between text-xs md:text-sm mb-1.5 md:mb-2">
                    <span className="text-gray-700 truncate mr-2">{stage.name}</span>
                    <span className="font-semibold text-gray-900">{stage.dealsCount}</span>
                  </div>
                  <div className="h-1.5 md:h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(stage.dealsCount / funnelTotal) * 100}%`,
                        backgroundColor: stage.color || (index === stats.funnel.length - 1 ? '#22c55e' : '#374151')
                      }}
                    />
                  </div>
                </div>
              ))}
              {stats.funnel.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">Нет данных о воронке</p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl p-4 md:p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4 md:mb-5">Быстрые действия</h3>
            <div className="grid grid-cols-2 gap-2 md:gap-3">
              <button
                onClick={() => router.push('/deals?new=true')}
                className="p-3 md:p-4 rounded-xl bg-gray-900 hover:bg-gray-800 transition-colors flex flex-col items-center gap-2 md:gap-2.5 group"
              >
                <div className="p-2 md:p-2.5 bg-white/10 rounded-lg">
                  <Plus size={18} className="text-white md:w-5 md:h-5" />
                </div>
                <span className="text-xs md:text-sm font-medium text-white">Новая сделка</span>
              </button>

              <button
                onClick={() => router.push('/contacts?new=true')}
                className="p-3 md:p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors flex flex-col items-center gap-2 md:gap-2.5 border border-gray-200"
              >
                <div className="p-2 md:p-2.5 bg-white rounded-lg shadow-sm">
                  <UserPlus size={18} className="text-gray-700 md:w-5 md:h-5" />
                </div>
                <span className="text-xs md:text-sm font-medium text-gray-700">Новый контакт</span>
              </button>

              <button
                onClick={() => router.push('/tasks?new=true')}
                className="p-3 md:p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors flex flex-col items-center gap-2 md:gap-2.5 border border-gray-200"
              >
                <div className="p-2 md:p-2.5 bg-white rounded-lg shadow-sm">
                  <FileText size={18} className="text-gray-700 md:w-5 md:h-5" />
                </div>
                <span className="text-xs md:text-sm font-medium text-gray-700">Новая задача</span>
              </button>

              <button
                onClick={() => router.push('/tasks?view=calendar')}
                className="p-3 md:p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors flex flex-col items-center gap-2 md:gap-2.5 border border-gray-200"
              >
                <div className="p-2 md:p-2.5 bg-white rounded-lg shadow-sm">
                  <Calendar size={18} className="text-gray-700 md:w-5 md:h-5" />
                </div>
                <span className="text-xs md:text-sm font-medium text-gray-700">Календарь</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
