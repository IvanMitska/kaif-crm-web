"use client";

import { useState } from "react";
import {
  Search,
  X,
  User,
  Flag,
  Clock,
  ChevronDown,
  SlidersHorizontal,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TaskFilters as TaskFiltersType, PRIORITY_CONFIG, STATUS_CONFIG } from "./types";

interface TaskFiltersProps {
  filters: TaskFiltersType;
  onFiltersChange: (filters: TaskFiltersType) => void;
  assignees?: { id: string; name: string }[];
}

const PRIORITY_DOTS = {
  URGENT: "bg-red-500",
  HIGH: "bg-orange-500",
  MEDIUM: "bg-yellow-500",
  LOW: "bg-emerald-500",
};

const STATUS_DOTS = {
  PENDING: "bg-gray-400",
  IN_PROGRESS: "bg-violet-500",
  COMPLETED: "bg-emerald-500",
  CANCELLED: "bg-gray-500",
};

export function TaskFilters({
  filters,
  onFiltersChange,
  assignees = [],
}: TaskFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const activeFiltersCount = [
    filters.status && filters.status !== "ALL",
    filters.priority && filters.priority !== "ALL",
    filters.assigneeId,
    filters.overdue,
    filters.dueDateFrom,
    filters.dueDateTo,
  ].filter(Boolean).length;

  const clearFilters = () => {
    onFiltersChange({
      search: filters.search,
      status: "ALL",
      priority: "ALL",
      assigneeId: undefined,
      overdue: undefined,
      dueDateFrom: undefined,
      dueDateTo: undefined,
    });
  };

  const quickFilters = [
    { label: "Сегодня", key: "today", icon: Clock },
    { label: "Просроченные", key: "overdue", icon: AlertTriangle },
    { label: "Мои задачи", key: "mine", icon: User },
    { label: "Срочные", key: "high", icon: Flag },
  ];

  const handleQuickFilter = (key: string) => {
    switch (key) {
      case "today":
        const today = new Date().toISOString().split("T")[0];
        const isToday = filters.dueDateFrom === today && filters.dueDateTo === today;
        onFiltersChange({
          ...filters,
          dueDateFrom: isToday ? undefined : today,
          dueDateTo: isToday ? undefined : today,
        });
        break;
      case "overdue":
        onFiltersChange({
          ...filters,
          overdue: !filters.overdue,
        });
        break;
      case "mine":
        onFiltersChange({
          ...filters,
          assigneeId: filters.assigneeId === "current" ? undefined : "current",
        });
        break;
      case "high":
        onFiltersChange({
          ...filters,
          priority: filters.priority === "URGENT" ? "ALL" : "URGENT",
        });
        break;
    }
  };

  const isQuickFilterActive = (key: string) => {
    switch (key) {
      case "today":
        const today = new Date().toISOString().split("T")[0];
        return filters.dueDateFrom === today && filters.dueDateTo === today;
      case "overdue":
        return filters.overdue === true;
      case "mine":
        return filters.assigneeId === "current";
      case "high":
        return filters.priority === "URGENT";
      default:
        return false;
    }
  };

  return (
    <div className="space-y-4">
      {/* Main filters row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Поиск задач..."
            value={filters.search || ""}
            onChange={(e) =>
              onFiltersChange({ ...filters, search: e.target.value })
            }
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-violet-500 focus:ring-violet-500/20"
          />
          {filters.search && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              onClick={() => onFiltersChange({ ...filters, search: "" })}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter dropdowns */}
        <div className="flex gap-2">
          {/* Status dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "gap-2 border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white",
                  filters.status && filters.status !== "ALL" && "bg-white/10 border-white/20"
                )}
              >
                {filters.status && filters.status !== "ALL" && (
                  <div className={cn("h-2 w-2 rounded-full", STATUS_DOTS[filters.status as keyof typeof STATUS_DOTS])} />
                )}
                <span className="text-sm">Статус</span>
                <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-[#0d0d14] border-white/10">
              <DropdownMenuLabel className="text-xs uppercase tracking-wide text-gray-500 font-medium">
                Статус задачи
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/5" />
              <DropdownMenuItem
                onClick={() => onFiltersChange({ ...filters, status: "ALL" })}
                className={cn("focus:bg-white/5", filters.status === "ALL" && "bg-white/5")}
              >
                <span className="text-gray-300">Все статусы</span>
              </DropdownMenuItem>
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => onFiltersChange({ ...filters, status: key as any })}
                  className={cn("focus:bg-white/5", filters.status === key && "bg-white/5")}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={cn("h-2 w-2 rounded-full", STATUS_DOTS[key as keyof typeof STATUS_DOTS])} />
                    <span className="text-gray-300">{config.label}</span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Priority dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "gap-2 border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white",
                  filters.priority && filters.priority !== "ALL" && "bg-white/10 border-white/20"
                )}
              >
                {filters.priority && filters.priority !== "ALL" && (
                  <div className={cn("h-2 w-2 rounded-full", PRIORITY_DOTS[filters.priority as keyof typeof PRIORITY_DOTS])} />
                )}
                <span className="text-sm">Приоритет</span>
                <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-[#0d0d14] border-white/10">
              <DropdownMenuLabel className="text-xs uppercase tracking-wide text-gray-500 font-medium">
                Приоритет
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/5" />
              <DropdownMenuItem
                onClick={() => onFiltersChange({ ...filters, priority: "ALL" })}
                className={cn("focus:bg-white/5", filters.priority === "ALL" && "bg-white/5")}
              >
                <span className="text-gray-300">Все приоритеты</span>
              </DropdownMenuItem>
              {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => onFiltersChange({ ...filters, priority: key as any })}
                  className={cn("focus:bg-white/5", filters.priority === key && "bg-white/5")}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={cn("h-2 w-2 rounded-full", PRIORITY_DOTS[key as keyof typeof PRIORITY_DOTS])} />
                    <span className="text-gray-300">{config.label}</span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Advanced filters button */}
          <Button
            variant="outline"
            className={cn(
              "gap-2 border-white/10 bg-white/5 text-gray-300",
              showAdvanced && "bg-violet-500 text-white border-violet-500 hover:bg-violet-600 hover:text-white"
            )}
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline text-sm">Фильтры</span>
            {activeFiltersCount > 0 && (
              <span className={cn(
                "flex items-center justify-center h-5 min-w-5 px-1 text-xs font-semibold rounded",
                showAdvanced ? "bg-white text-violet-500" : "bg-violet-500 text-white"
              )}>
                {activeFiltersCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Quick filters */}
      <div className="flex flex-wrap gap-2">
        {quickFilters.map((filter) => {
          const Icon = filter.icon;
          const isActive = isQuickFilterActive(filter.key);
          return (
            <button
              key={filter.key}
              onClick={() => handleQuickFilter(filter.key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium",
                isActive
                  ? "bg-violet-500 text-white"
                  : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {filter.label}
            </button>
          );
        })}

        {activeFiltersCount > 0 && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10"
          >
            <X className="h-3.5 w-3.5" />
            Сбросить
          </button>
        )}
      </div>

      {/* Advanced filters panel */}
      {showAdvanced && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5 bg-white/5 rounded-xl border border-white/10">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">
              Исполнитель
            </label>
            <Select
              value={filters.assigneeId || "all"}
              onValueChange={(value) =>
                onFiltersChange({
                  ...filters,
                  assigneeId: value === "all" ? undefined : value,
                })
              }
            >
              <SelectTrigger className="bg-[#0d0d14] border-white/10 text-white">
                <SelectValue placeholder="Все исполнители" />
              </SelectTrigger>
              <SelectContent className="bg-[#0d0d14] border-white/10">
                <SelectItem value="all" className="text-gray-300 focus:bg-white/5">Все исполнители</SelectItem>
                <SelectItem value="current" className="text-gray-300 focus:bg-white/5">Мои задачи</SelectItem>
                <SelectItem value="unassigned" className="text-gray-300 focus:bg-white/5">Не назначены</SelectItem>
                {assignees.map((assignee) => (
                  <SelectItem key={assignee.id} value={assignee.id} className="text-gray-300 focus:bg-white/5">
                    {assignee.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">
              Срок от
            </label>
            <Input
              type="date"
              value={filters.dueDateFrom || ""}
              onChange={(e) =>
                onFiltersChange({ ...filters, dueDateFrom: e.target.value })
              }
              className="bg-[#0d0d14] border-white/10 text-white"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">
              Срок до
            </label>
            <Input
              type="date"
              value={filters.dueDateTo || ""}
              onChange={(e) =>
                onFiltersChange({ ...filters, dueDateTo: e.target.value })
              }
              className="bg-[#0d0d14] border-white/10 text-white"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">
              Дополнительно
            </label>
            <label className="flex items-center gap-3 cursor-pointer p-3 bg-[#0d0d14] rounded-lg border border-white/10 hover:border-white/20">
              <input
                type="checkbox"
                checked={filters.overdue || false}
                onChange={(e) =>
                  onFiltersChange({ ...filters, overdue: e.target.checked })
                }
                className="rounded border-white/20 bg-white/5 text-violet-500 focus:ring-violet-500"
              />
              <span className="text-sm text-gray-300">Только просроченные</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
