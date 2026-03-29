"use client";

import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  TrendingUp,
  ListTodo,
  PlayCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TaskStats as TaskStatsType } from "./types";

interface TaskStatsProps {
  stats: TaskStatsType;
  className?: string;
}

export function TaskStats({ stats, className }: TaskStatsProps) {
  const completionRate = stats.total > 0
    ? Math.round((stats.completed / stats.total) * 100)
    : 0;

  const statItems = [
    {
      label: "Всего",
      value: stats.total,
      icon: ListTodo,
      accentColor: "bg-gray-400",
    },
    {
      label: "В работе",
      value: stats.inProgress,
      icon: PlayCircle,
      accentColor: "bg-violet-500",
    },
    {
      label: "Выполнено",
      value: stats.completed,
      icon: CheckCircle2,
      accentColor: "bg-emerald-500",
    },
    {
      label: "Просрочено",
      value: stats.overdue,
      icon: AlertTriangle,
      accentColor: "bg-red-500",
      highlight: stats.overdue > 0,
    },
    {
      label: "Сегодня",
      value: stats.dueToday,
      icon: Clock,
      accentColor: "bg-amber-500",
    },
    {
      label: "На неделю",
      value: stats.dueThisWeek,
      icon: Calendar,
      accentColor: "bg-purple-500",
    },
  ];

  return (
    <div className={cn("space-y-5", className)}>
      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statItems.map((item) => {
          return (
            <div
              key={item.label}
              className={cn(
                "relative glass-card border border-white/5 rounded-xl p-4",
                "cursor-pointer hover:border-white/10",
                item.highlight && "border-red-500/30 bg-red-500/10"
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={cn("h-2 w-2 rounded-full", item.accentColor)} />
                {item.highlight && (
                  <span className="relative flex h-2 w-2">
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-white tracking-tight">{item.value}</p>
              <p className="text-xs text-gray-400 mt-1 uppercase tracking-wide font-medium">{item.label}</p>
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="glass-card border border-white/5 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <TrendingUp className="h-4 w-4 text-gray-500" />
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Прогресс выполнения
            </span>
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">
            {completionRate}%
          </span>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-violet-500 rounded-full"
            style={{ width: `${completionRate}%` }}
          />
        </div>
        <div className="flex justify-between mt-3 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {stats.completed} выполнено
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-gray-500" />
            {stats.pending} ожидает
          </span>
        </div>
      </div>
    </div>
  );
}

export function TaskStatsCompact({ stats }: TaskStatsProps) {
  const completionRate = stats.total > 0
    ? Math.round((stats.completed / stats.total) * 100)
    : 0;

  return (
    <div className="flex items-center gap-6 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-gray-500 text-xs uppercase tracking-wide font-medium">Всего:</span>
        <span className="font-semibold text-white">{stats.total}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        <span className="text-gray-500 text-xs uppercase tracking-wide font-medium">Готово:</span>
        <span className="font-semibold text-white">{stats.completed}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-violet-500" />
        <span className="text-gray-500 text-xs uppercase tracking-wide font-medium">В работе:</span>
        <span className="font-semibold text-white">{stats.inProgress}</span>
      </div>
      {stats.overdue > 0 && (
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-red-500" />
          <span className="text-gray-500 text-xs uppercase tracking-wide font-medium">Просрочено:</span>
          <span className="font-semibold text-red-400">{stats.overdue}</span>
        </div>
      )}
      <div className="flex items-center gap-3 ml-auto">
        <div className="h-1.5 w-24 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-violet-500 rounded-full"
            style={{ width: `${completionRate}%` }}
          />
        </div>
        <span className="font-bold text-white">{completionRate}%</span>
      </div>
    </div>
  );
}
