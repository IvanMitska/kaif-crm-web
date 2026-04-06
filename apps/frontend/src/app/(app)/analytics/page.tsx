"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  DollarSign,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Filter,
  RefreshCw,
  ShoppingCart,
  UserPlus,
  Award,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { analyticsApi, dealsApi, pipelinesApi } from "@/lib/api";
import { useCurrency } from "@/hooks/useCurrency";

const periods = [
  { id: "week", name: "Неделя", days: 7 },
  { id: "month", name: "Месяц", days: 30 },
  { id: "quarter", name: "Квартал", days: 90 },
  { id: "year", name: "Год", days: 365 },
];

const defaultColors = ["#8B5CF6", "#A855F7", "#F59E0B", "#10B981", "#EF4444", "#6366F1", "#EC4899"];

// KPI Card Component
function KPICard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  color,
  loading,
}: {
  title: string;
  value: string;
  change?: string;
  changeType?: "up" | "down" | "neutral";
  icon: any;
  color: string;
  loading?: boolean;
}) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", color)}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {change && changeType && changeType !== "neutral" && (
          <div className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold",
            changeType === "up" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
          )}>
            {changeType === "up" ? (
              <ArrowUpRight className="w-3 h-3" />
            ) : (
              <ArrowDownRight className="w-3 h-3" />
            )}
            {change}
          </div>
        )}
      </div>
      <p className="text-sm text-gray-400 mb-1">{title}</p>
      {loading ? (
        <div className="h-8 flex items-center">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      ) : (
        <p className="text-2xl font-bold text-white">{value}</p>
      )}
    </div>
  );
}

// Chart Card Component
function ChartCard({
  title,
  subtitle,
  children,
  action,
  loading,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-white">{title}</h3>
          {subtitle && <p className="text-sm text-gray-400">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center h-60">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const { formatCompact, format } = useCurrency();
  const [period, setPeriod] = useState("month");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [funnelStats, setFunnelStats] = useState<any[]>([]);
  const [sourceData, setSourceData] = useState<any[]>([]);
  const [activityData, setActivityData] = useState<any[]>([]);
  const [topManagers, setTopManagers] = useState<any[]>([]);

  const selectedPeriod = periods.find(p => p.id === period) || periods[1];

  // Fetch all analytics data
  const fetchAnalytics = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - selectedPeriod.days * 24 * 60 * 60 * 1000).toISOString();

      const [
        statsRes,
        salesRes,
        activityRes,
        sourcesRes,
        managersRes,
        dealsRes,
        pipelinesRes,
      ] = await Promise.allSettled([
        analyticsApi.getDashboardStats(),
        analyticsApi.getSalesAnalytics(startDate, endDate),
        analyticsApi.getActivityAnalytics(selectedPeriod.days),
        analyticsApi.getLeadSources(),
        analyticsApi.getManagerStats(),
        dealsApi.getAll(),
        pipelinesApi.getAll(),
      ]);

      // Dashboard stats
      if (statsRes.status === 'fulfilled') {
        setDashboardStats(statsRes.value.data);
      }

      // Sales data
      if (salesRes.status === 'fulfilled' && salesRes.value.data?.length > 0) {
        setSalesData(salesRes.value.data);
      }

      // Activity data
      if (activityRes.status === 'fulfilled' && activityRes.value.data?.length > 0) {
        setActivityData(activityRes.value.data);
      }

      // Lead sources
      if (sourcesRes.status === 'fulfilled' && sourcesRes.value.data?.length > 0) {
        const sources = sourcesRes.value.data.map((s: any, i: number) => ({
          name: s.source || s.name,
          value: s.count || s.value || s.percentage,
          color: defaultColors[i % defaultColors.length],
        }));
        setSourceData(sources);
      }

      // Top managers
      if (managersRes.status === 'fulfilled' && managersRes.value.data?.length > 0) {
        setTopManagers(managersRes.value.data);
      }

      // Funnel from deals and pipelines
      if (dealsRes.status === 'fulfilled' && pipelinesRes.status === 'fulfilled') {
        const deals = dealsRes.value.data?.items || dealsRes.value.data || [];
        const pipelines = Array.isArray(pipelinesRes.value.data)
          ? pipelinesRes.value.data
          : [pipelinesRes.value.data];
        const pipeline = pipelines[0];

        if (pipeline?.stages) {
          const stages = pipeline.stages.sort((a: any, b: any) => a.order - b.order);
          const funnelFromDeals = stages.map((stage: any, index: number) => {
            const stageDeals = deals.filter((d: any) => d.stageId === stage.id);
            const count = stageDeals.length;
            const value = stageDeals.reduce((sum: number, d: any) => sum + (d.amount || 0), 0);
            return {
              stage: stage.name,
              count,
              value,
              color: defaultColors[index % defaultColors.length],
            };
          });
          setFunnelStats(funnelFromDeals);
        }
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  // Calculate KPIs from dashboard stats
  const totalRevenue = dashboardStats?.totalRevenue || dashboardStats?.revenue || 0;
  const conversionRate = dashboardStats?.conversionRate || 0;
  const avgDealSize = dashboardStats?.avgDealSize || dashboardStats?.averageDealSize || 0;
  const newClients = dashboardStats?.newClients || dashboardStats?.newContacts || 0;
  const totalDeals = dashboardStats?.totalDeals || dashboardStats?.deals || 0;
  const totalTasks = dashboardStats?.totalTasks || dashboardStats?.tasks || 0;

  // Calculate changes (you'd normally get this from API comparing periods)
  const revenueChange = dashboardStats?.revenueChange;
  const conversionChange = dashboardStats?.conversionChange;
  const avgDealChange = dashboardStats?.avgDealChange;
  const clientsChange = dashboardStats?.clientsChange;

  return (
    <div className="h-full min-h-full overflow-y-auto">
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Аналитика</h1>
            <p className="text-sm text-gray-400 mt-1">Обзор ключевых показателей</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-1">
            {/* Period Selector */}
            <div className="glass-card rounded-xl p-1 flex shrink-0">
              {periods.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPeriod(p.id)}
                  className={cn(
                    "px-3 sm:px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap",
                    period === p.id
                      ? "bg-violet-500 text-white shadow-sm"
                      : "text-gray-400 hover:text-white"
                  )}
                >
                  {p.name}
                </button>
              ))}
            </div>

            {/* Actions - hidden on mobile */}
            <button className="hidden sm:block p-2.5 glass-card rounded-xl hover:bg-white/5">
              <Filter className="w-5 h-5 text-gray-400" />
            </button>
            <button className="hidden sm:block p-2.5 glass-card rounded-xl hover:bg-white/5">
              <Download className="w-5 h-5 text-gray-400" />
            </button>
            <button
              onClick={() => fetchAnalytics(true)}
              disabled={refreshing}
              className="p-2.5 glass-card rounded-xl hover:bg-white/5 disabled:opacity-50"
            >
              <RefreshCw className={cn("w-5 h-5 text-gray-400", refreshing && "animate-spin")} />
            </button>
          </div>
        </div>

        {/* Quick Stats Pills */}
        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-1 scrollbar-minimal">
          <div className="px-3 sm:px-4 py-2 glass-card rounded-xl flex items-center gap-2 shrink-0">
            <div className={cn("w-2 h-2 rounded-full", loading ? "bg-yellow-500" : "bg-green-500")} />
            <span className="text-sm font-medium text-gray-300 whitespace-nowrap">
              {loading ? "Загрузка..." : "Данные обновлены"}
            </span>
          </div>
          {!loading && (
            <>
              <div className="px-3 sm:px-4 py-2 bg-violet-500/20 text-violet-400 rounded-xl text-sm font-medium whitespace-nowrap shrink-0">
                {totalDeals} сделок
              </div>
              <div className="px-3 sm:px-4 py-2 bg-green-500/20 text-green-400 rounded-xl text-sm font-medium whitespace-nowrap shrink-0">
                {formatCompact(totalRevenue)}
              </div>
              <div className="px-3 sm:px-4 py-2 bg-amber-500/20 text-amber-400 rounded-xl text-sm font-medium whitespace-nowrap shrink-0">
                {totalTasks} задач
              </div>
            </>
          )}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <KPICard
            title="Общая выручка"
            value={format(totalRevenue)}
            change={revenueChange ? `${revenueChange > 0 ? '+' : ''}${revenueChange}%` : undefined}
            changeType={revenueChange ? (revenueChange > 0 ? "up" : "down") : undefined}
            icon={DollarSign}
            color="bg-gradient-to-br from-violet-500 to-purple-500"
            loading={loading}
          />
          <KPICard
            title="Конверсия"
            value={`${conversionRate.toFixed(1)}%`}
            change={conversionChange ? `${conversionChange > 0 ? '+' : ''}${conversionChange}%` : undefined}
            changeType={conversionChange ? (conversionChange > 0 ? "up" : "down") : undefined}
            icon={Target}
            color="bg-gradient-to-br from-green-500 to-green-600"
            loading={loading}
          />
          <KPICard
            title="Средний чек"
            value={format(avgDealSize)}
            change={avgDealChange ? `${avgDealChange > 0 ? '+' : ''}${avgDealChange}%` : undefined}
            changeType={avgDealChange ? (avgDealChange > 0 ? "up" : "down") : undefined}
            icon={ShoppingCart}
            color="bg-gradient-to-br from-amber-500 to-amber-600"
            loading={loading}
          />
          <KPICard
            title="Новые клиенты"
            value={newClients.toString()}
            change={clientsChange ? `${clientsChange > 0 ? '+' : ''}${clientsChange}%` : undefined}
            changeType={clientsChange ? (clientsChange > 0 ? "up" : "down") : undefined}
            icon={UserPlus}
            color="bg-gradient-to-br from-purple-500 to-purple-600"
            loading={loading}
          />
        </div>

        {/* Main Chart */}
        <ChartCard
          title="Динамика продаж"
          subtitle="Выручка и количество сделок за период"
          loading={loading}
          action={
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-violet-500" />
                <span className="text-gray-400">Выручка</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-gray-400">Сделки</span>
              </div>
            </div>
          }
        >
          {salesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorDeals" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="period" stroke="#9CA3AF" fontSize={12} />
                <YAxis stroke="#9CA3AF" fontSize={12} tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v.toLocaleString()} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(17, 17, 27, 0.9)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.3)",
                  }}
                  labelStyle={{ color: "#fff" }}
                  itemStyle={{ color: "#9CA3AF" }}
                  formatter={(value: any, name: string) => [
                    name === "revenue" || name === "sales" ? format(value) : value,
                    name === "revenue" || name === "sales" ? "Выручка" : "Сделки"
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorSales)"
                />
                <Area
                  type="monotone"
                  dataKey="deals"
                  stroke="#10B981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorDeals)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-80 text-gray-400">
              Нет данных за выбранный период
            </div>
          )}
        </ChartCard>

        {/* Two Column Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Funnel */}
          <ChartCard title="Воронка продаж" subtitle="Конверсия по этапам" loading={loading}>
            {funnelStats.length > 0 ? (
              <div className="space-y-4">
                {funnelStats.map((item) => {
                  const maxCount = Math.max(...funnelStats.map(f => f.count), 1);
                  const percentage = (item.count / maxCount) * 100;
                  return (
                    <div key={item.stage}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-300">{item.stage}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-400">{item.count} сделок</span>
                          <span className="text-sm font-semibold text-white">
                            {formatCompact(item.value)}
                          </span>
                        </div>
                      </div>
                      <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: item.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-60 text-gray-400">
                Нет данных о сделках
              </div>
            )}
          </ChartCard>

          {/* Pie Chart - Lead Sources */}
          <ChartCard title="Источники лидов" subtitle="Распределение по каналам" loading={loading}>
            {sourceData.length > 0 ? (
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
                <div className="w-40 sm:w-48 h-40 sm:h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sourceData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {sourceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(17, 17, 27, 0.9)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "12px",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.3)",
                        }}
                        labelStyle={{ color: "#fff" }}
                        itemStyle={{ color: "#9CA3AF" }}
                        formatter={(value: any) => [value, "Количество"]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-3">
                  {sourceData.map((source) => (
                    <div key={source.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: source.color }}
                        />
                        <span className="text-sm text-gray-300">{source.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-white">{source.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-60 text-gray-400">
                Нет данных об источниках
              </div>
            )}
          </ChartCard>
        </div>

        {/* Activity and Top Managers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Activity Chart */}
          <ChartCard title="��ктивность команды" subtitle="За последнюю неделю" loading={loading}>
            {activityData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={activityData} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                    <XAxis dataKey="day" stroke="#9CA3AF" fontSize={12} />
                    <YAxis stroke="#9CA3AF" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(17, 17, 27, 0.9)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "12px",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.3)",
                      }}
                      labelStyle={{ color: "#fff" }}
                      itemStyle={{ color: "#9CA3AF" }}
                    />
                    <Bar dataKey="calls" fill="#8B5CF6" name="Звонки" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="meetings" fill="#10B981" name="Встречи" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="emails" fill="#F59E0B" name="Email" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex items-center justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-violet-500" />
                    <span className="text-sm text-gray-400">Звонки</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-green-500" />
                    <span className="text-sm text-gray-400">Встречи</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-amber-500" />
                    <span className="text-sm text-gray-400">Email</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-60 text-gray-400">
                Нет данных об активности
              </div>
            )}
          </ChartCard>

          {/* Top Managers */}
          <ChartCard
            title="Лучшие менеджеры"
            subtitle="По выручке за период"
            loading={loading}
            action={
              <button className="text-sm text-violet-400 font-medium hover:text-violet-300">
                Смотреть всех
              </button>
            }
          >
            {topManagers.length > 0 ? (
              <div className="space-y-4">
                {topManagers.slice(0, 5).map((manager, index) => (
                  <div
                    key={manager.id}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 text-sm font-bold text-gray-400">
                      {index + 1}
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                      {manager.avatar || `${manager.firstName?.[0] || ''}${manager.lastName?.[0] || ''}`}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-white">
                        {manager.name || `${manager.firstName || ''} ${manager.lastName || ''}`}
                      </p>
                      <p className="text-xs text-gray-400">
                        {manager.deals || manager.dealsCount || 0} сделок • {manager.conversion || manager.conversionRate || 0}% конверсия
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-white">
                        {formatCompact(manager.revenue || manager.totalRevenue || 0)}
                      </p>
                      {index === 0 && (
                        <div className="flex items-center gap-1 justify-end">
                          <Award className="w-3 h-3 text-amber-500" />
                          <span className="text-xs text-amber-400 font-medium">Лидер</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-60 text-gray-400">
                Нет данных о менеджерах
              </div>
            )}
          </ChartCard>
        </div>

        {/* Goals Progress */}
        <div className="glass-card rounded-2xl p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="font-semibold text-white">Цели на месяц</h3>
              <p className="text-sm text-gray-400">Прогресс выполнения плана</p>
            </div>
            <button className="px-4 py-2 bg-violet-500 hover:bg-purple-500 text-white text-sm font-medium rounded-xl w-full sm:w-auto">
              Настроить цели
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                name: "Выручка",
                current: totalRevenue,
                target: dashboardStats?.revenueTarget || totalRevenue * 1.2,
                color: "bg-violet-500"
              },
              {
                name: "Новые клиенты",
                current: newClients,
                target: dashboardStats?.clientsTarget || Math.ceil(newClients * 1.1),
                color: "bg-green-500"
              },
              {
                name: "Закрытые сделки",
                current: totalDeals,
                target: dashboardStats?.dealsTarget || Math.ceil(totalDeals * 1.3),
                color: "bg-purple-500"
              },
            ].map((goal) => {
              const percentage = goal.target > 0 ? Math.min((goal.current / goal.target) * 100, 100) : 0;
              return (
                <div key={goal.name} className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-300">{goal.name}</span>
                    <span className={cn(
                      "text-xs font-semibold px-2 py-0.5 rounded-full",
                      percentage >= 80 ? "bg-green-500/20 text-green-400" : "bg-amber-500/20 text-amber-400"
                    )}>
                      {percentage.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-2">
                    <div
                      className={cn("h-full rounded-full", goal.color)}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">
                      {typeof goal.current === "number" && goal.current > 10000
                        ? formatCompact(goal.current)
                        : goal.current}
                    </span>
                    <span className="text-gray-500">
                      из {typeof goal.target === "number" && goal.target > 10000
                        ? formatCompact(goal.target)
                        : Math.round(goal.target)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
