"use client";

import { useState } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

const salesData = [
  { month: "Янв", sales: 850000, deals: 12, leads: 45 },
  { month: "Фев", sales: 920000, deals: 15, leads: 52 },
  { month: "Мар", sales: 1100000, deals: 18, leads: 48 },
  { month: "Апр", sales: 980000, deals: 14, leads: 55 },
  { month: "Май", sales: 1250000, deals: 20, leads: 62 },
  { month: "Июн", sales: 1180000, deals: 17, leads: 58 },
];

const funnelData = [
  { stage: "Новые", count: 45, value: 4500000, color: "#8B5CF6" },
  { stage: "Квалификация", count: 32, value: 3200000, color: "#A855F7" },
  { stage: "Предложение", count: 24, value: 2400000, color: "#F59E0B" },
  { stage: "Переговоры", count: 18, value: 1800000, color: "#10B981" },
  { stage: "Закрыто", count: 12, value: 1200000, color: "#EF4444" },
];

const sourceData = [
  { name: "Сайт", value: 35, color: "#8B5CF6" },
  { name: "Холодные звонки", value: 25, color: "#10B981" },
  { name: "Партнеры", value: 20, color: "#F59E0B" },
  { name: "Email", value: 15, color: "#A855F7" },
  { name: "Соцсети", value: 5, color: "#EF4444" },
];

const activityData = [
  { day: "Пн", calls: 24, meetings: 3, emails: 45 },
  { day: "Вт", calls: 18, meetings: 5, emails: 38 },
  { day: "Ср", calls: 32, meetings: 4, emails: 52 },
  { day: "Чт", calls: 28, meetings: 6, emails: 48 },
  { day: "Пт", calls: 35, meetings: 8, emails: 60 },
];

const topManagers = [
  { id: 1, name: "Иван Менеджеров", avatar: "ИМ", deals: 8, revenue: 2450000, conversion: 32 },
  { id: 2, name: "Анна Продажина", avatar: "АП", deals: 6, revenue: 1980000, conversion: 28 },
  { id: 3, name: "Петр Сделкин", avatar: "ПС", deals: 5, revenue: 1650000, conversion: 25 },
  { id: 4, name: "Мария Лидова", avatar: "МЛ", deals: 4, revenue: 1320000, conversion: 22 },
];

const periods = [
  { id: "week", name: "Неделя" },
  { id: "month", name: "Месяц" },
  { id: "quarter", name: "Квартал" },
  { id: "year", name: "Год" },
];

// KPI Card Component
function KPICard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  change: string;
  changeType: "up" | "down";
  icon: any;
  color: string;
}) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", color)}>
          <Icon className="w-6 h-6 text-white" />
        </div>
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
      </div>
      <p className="text-sm text-gray-400 mb-1">{title}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

// Chart Card Component
function ChartCard({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
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
        {children}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState("month");

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
            <button className="p-2.5 glass-card rounded-xl hover:bg-white/5">
              <RefreshCw className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Quick Stats Pills */}
        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-1 scrollbar-minimal">
          <div className="px-3 sm:px-4 py-2 glass-card rounded-xl flex items-center gap-2 shrink-0">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-sm font-medium text-gray-300 whitespace-nowrap">Данные обновлены</span>
            <span className="text-sm text-gray-500 hidden sm:inline">5 мин назад</span>
          </div>
          <div className="px-3 sm:px-4 py-2 bg-violet-500/20 text-violet-400 rounded-xl text-sm font-medium whitespace-nowrap shrink-0">
            96 сделок
          </div>
          <div className="px-3 sm:px-4 py-2 bg-green-500/20 text-green-400 rounded-xl text-sm font-medium whitespace-nowrap shrink-0">
            ₽12.4M
          </div>
          <div className="px-3 sm:px-4 py-2 bg-amber-500/20 text-amber-400 rounded-xl text-sm font-medium whitespace-nowrap shrink-0">
            24 задачи
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <KPICard
            title="Общая выручка"
            value="₽6,478,000"
            change="+12.5%"
            changeType="up"
            icon={DollarSign}
            color="bg-gradient-to-br from-violet-500 to-purple-500"
          />
          <KPICard
            title="Конверсия"
            value="26.7%"
            change="+3.2%"
            changeType="up"
            icon={Target}
            color="bg-gradient-to-br from-green-500 to-green-600"
          />
          <KPICard
            title="Средний чек"
            value="₽104,300"
            change="-2.1%"
            changeType="down"
            icon={ShoppingCart}
            color="bg-gradient-to-br from-amber-500 to-amber-600"
          />
          <KPICard
            title="Новые клиенты"
            value="184"
            change="+18.7%"
            changeType="up"
            icon={UserPlus}
            color="bg-gradient-to-br from-purple-500 to-purple-600"
          />
        </div>

        {/* Main Chart */}
        <ChartCard
          title="Динамика продаж"
          subtitle="Выручка и количество сделок за период"
          action={
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-violet-500" />
                <span className="text-gray-400">Выручка</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-gray-400">Лиды</span>
              </div>
            </div>
          }
        >
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={salesData}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} />
              <YAxis stroke="#9CA3AF" fontSize={12} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
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
                  name === "sales" ? `₽${value.toLocaleString()}` : value,
                  name === "sales" ? "Выручка" : "Лиды"
                ]}
              />
              <Area
                type="monotone"
                dataKey="sales"
                stroke="#8B5CF6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorSales)"
              />
              <Area
                type="monotone"
                dataKey="leads"
                stroke="#10B981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorLeads)"
                yAxisId={0}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Two Column Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Funnel */}
          <ChartCard title="Воронка продаж" subtitle="Конверсия по этапам">
            <div className="space-y-4">
              {funnelData.map((item) => {
                const percentage = (item.count / funnelData[0].count) * 100;
                return (
                  <div key={item.stage}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-300">{item.stage}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-400">{item.count} сделок</span>
                        <span className="text-sm font-semibold text-white">
                          ₽{(item.value / 1000000).toFixed(1)}M
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
          </ChartCard>

          {/* Pie Chart - Lead Sources */}
          <ChartCard title="Источники лидов" subtitle="Распределение по каналам">
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
                      formatter={(value: any) => [`${value}%`, "Доля"]}
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
                    <span className="text-sm font-semibold text-white">{source.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </ChartCard>
        </div>

        {/* Activity and Top Managers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Activity Chart */}
          <ChartCard title="Активность команды" subtitle="За последнюю неделю">
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
          </ChartCard>

          {/* Top Managers */}
          <ChartCard
            title="Лучшие менеджеры"
            subtitle="По выручке за период"
            action={
              <button className="text-sm text-violet-400 font-medium hover:text-violet-300">
                Смотреть всех
              </button>
            }
          >
            <div className="space-y-4">
              {topManagers.map((manager, index) => (
                <div
                  key={manager.id}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 text-sm font-bold text-gray-400">
                    {index + 1}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                    {manager.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-white">{manager.name}</p>
                    <p className="text-xs text-gray-400">{manager.deals} сделок • {manager.conversion}% конверсия</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-white">₽{(manager.revenue / 1000000).toFixed(2)}M</p>
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
              { name: "Выручка", current: 6478000, target: 8000000, color: "bg-violet-500" },
              { name: "Новые клиенты", current: 184, target: 200, color: "bg-green-500" },
              { name: "Закрытые сделки", current: 62, target: 80, color: "bg-purple-500" },
            ].map((goal) => {
              const percentage = Math.min((goal.current / goal.target) * 100, 100);
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
                        ? `₽${(goal.current / 1000000).toFixed(1)}M`
                        : goal.current}
                    </span>
                    <span className="text-gray-500">
                      из {typeof goal.target === "number" && goal.target > 10000
                        ? `₽${(goal.target / 1000000).toFixed(1)}M`
                        : goal.target}
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
