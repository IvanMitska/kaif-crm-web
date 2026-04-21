"use client";

import { useState } from "react";
import {
  Check,
  Calendar,
  User,
  MoreHorizontal,
  Edit,
  Trash2,
  Play,
  Pause,
  CheckCircle2,
  AlertCircle,
  Link2,
  MessageSquare,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Task, TaskStatus, PRIORITY_CONFIG, STATUS_CONFIG } from "./types";

interface TaskCardProps {
  task: Task;
  variant?: "default" | "compact" | "kanban";
  onComplete?: (id: string) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (id: string) => void;
  onClick?: (task: Task) => void;
  onStatusChange?: (id: string, status: TaskStatus) => void;
}

const PRIORITY_DOTS = {
  URGENT: "bg-red-500",
  HIGH: "bg-orange-500",
  MEDIUM: "bg-yellow-500",
  LOW: "bg-emerald-500",
};

export function TaskCard({
  task,
  variant = "default",
  onComplete,
  onEdit,
  onDelete,
  onClick,
  onStatusChange,
}: TaskCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const priorityConfig = PRIORITY_CONFIG[task.priority];

  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== "COMPLETED";
  const isDueToday =
    task.dueDate &&
    new Date(task.dueDate).toDateString() === new Date().toDateString();

  const formatDueDate = (date: string) => {
    const d = new Date(date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (d.toDateString() === today.toDateString()) return "Сегодня";
    if (d.toDateString() === tomorrow.toDateString()) return "Завтра";

    return d.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
    });
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getInitials = (name?: string) => {
    if (!name) return "—";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const completedChecklist =
    task.checklist?.filter((item) => item.completed).length || 0;
  const totalChecklist = task.checklist?.length || 0;

  // Compact variant
  if (variant === "compact") {
    return (
      <div
        className={cn(
          "group flex items-center gap-3 bg-[#0d0d14] border border-white/5 rounded-lg p-3",
          "cursor-pointer hover:border-white/10",
          isOverdue && "border-l-2 border-l-red-500",
          task.status === "COMPLETED" && "opacity-60"
        )}
        onClick={() => onClick?.(task)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <button
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
            task.status === "COMPLETED"
              ? "border-violet-500 bg-violet-500 text-white"
              : "border-gray-600 hover:border-violet-500"
          )}
          onClick={(e) => {
            e.stopPropagation();
            onComplete?.(task.id);
          }}
        >
          {task.status === "COMPLETED" && <Check className="h-3 w-3" />}
        </button>

        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "text-sm font-medium text-white truncate",
              task.status === "COMPLETED" && "line-through text-gray-400"
            )}
          >
            {task.title}
          </p>
          {task.dueDate && (
            <span
              className={cn(
                "text-xs tracking-wide",
                isOverdue ? "text-red-400 font-medium" : "text-gray-400"
              )}
            >
              {formatDueDate(task.dueDate)}
            </span>
          )}
        </div>

        <div
          className={cn("h-2 w-2 rounded-full shrink-0", PRIORITY_DOTS[task.priority])}
          title={priorityConfig.label}
        />
      </div>
    );
  }

  // Kanban variant
  if (variant === "kanban") {
    return (
      <div
        className={cn(
          "group bg-[#0d0d14] border border-white/5 rounded-lg p-4",
          "cursor-pointer hover:border-white/10",
          isOverdue && "border-l-2 border-l-red-500"
        )}
        onClick={() => onClick?.(task)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <p className="text-sm font-medium text-white line-clamp-2 leading-snug">
            {task.title}
          </p>
          <div
            className={cn("h-2 w-2 rounded-full shrink-0 mt-1.5", PRIORITY_DOTS[task.priority])}
            title={priorityConfig.label}
          />
        </div>

        {/* Description */}
        {task.description && (
          <p className="text-xs text-gray-400 line-clamp-2 mb-3 leading-relaxed">
            {task.description}
          </p>
        )}

        {/* Meta info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {task.dueDate && (
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded",
                  isOverdue
                    ? "bg-red-500/20 text-red-400"
                    : isDueToday
                    ? "bg-amber-500/20 text-amber-400"
                    : "bg-white/5 text-gray-400"
                )}
              >
                <Calendar className="h-3 w-3" />
                {formatDueDate(task.dueDate)}
              </span>
            )}
            {totalChecklist > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                <CheckCircle2 className="h-3 w-3" />
                <span className="font-medium">{completedChecklist}/{totalChecklist}</span>
              </span>
            )}
          </div>

          {task.assignee && (
            <Avatar className="h-6 w-6 border border-white/10">
              <AvatarImage src={task.assignee.avatar} />
              <AvatarFallback className="text-[10px] font-medium bg-white/10 text-gray-300">
                {getInitials(task.assignee.name)}
              </AvatarFallback>
            </Avatar>
          )}
        </div>

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-white/5">
            {task.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 bg-white/5 text-gray-400 rounded"
              >
                {tag}
              </span>
            ))}
            {task.tags.length > 2 && (
              <span className="text-[10px] text-gray-500 font-medium">
                +{task.tags.length - 2}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div
      className={cn(
        "group relative glass-card border border-white/5 rounded-xl",
        "cursor-pointer hover:border-white/10",
        isOverdue && "border-l-4 border-l-red-500",
        task.status === "COMPLETED" && "opacity-75"
      )}
      onClick={() => onClick?.(task)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="p-5">
        {/* Main content */}
        <div className="flex items-start gap-4">
          {/* Checkbox */}
          <button
            className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 mt-0.5",
              task.status === "COMPLETED"
                ? "border-violet-500 bg-violet-500 text-white"
                : "border-gray-600 hover:border-violet-500"
            )}
            onClick={(e) => {
              e.stopPropagation();
              onComplete?.(task.id);
            }}
          >
            {task.status === "COMPLETED" && <Check className="h-4 w-4" />}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                {/* Title */}
                <h3
                  className={cn(
                    "font-semibold text-white leading-snug",
                    task.status === "COMPLETED" && "line-through text-gray-400"
                  )}
                >
                  {task.title}
                </h3>
                {/* Description */}
                {task.description && (
                  <p className="text-sm text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                    {task.description}
                  </p>
                )}
              </div>

              {/* Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-8 w-8 text-gray-400 hover:text-white hover:bg-white/5",
                      "opacity-0 group-hover:opacity-100",
                      isHovered && "opacity-100"
                    )}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-[#0d0d14] border-white/10">
                  <DropdownMenuItem onClick={() => onEdit?.(task)} className="hover:bg-white/5">
                    <Edit className="h-4 w-4 mr-2" />
                    Редактировать
                  </DropdownMenuItem>
                  {task.status === "PENDING" && (
                    <DropdownMenuItem
                      onClick={() => onStatusChange?.(task.id, "IN_PROGRESS")}
                      className="hover:bg-white/5"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Начать выполнение
                    </DropdownMenuItem>
                  )}
                  {task.status === "IN_PROGRESS" && (
                    <DropdownMenuItem
                      onClick={() => onStatusChange?.(task.id, "PENDING")}
                      className="hover:bg-white/5"
                    >
                      <Pause className="h-4 w-4 mr-2" />
                      Приостановить
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-white/5" />
                  <DropdownMenuItem
                    className="text-red-400 focus:text-red-400 hover:bg-white/5"
                    onClick={() => onDelete?.(task.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Удалить
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Meta badges */}
            <div className="flex flex-wrap items-center gap-2 mt-4">
              {/* Priority */}
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md",
                  "bg-white/5 text-gray-300"
                )}
              >
                <span className={cn("h-2 w-2 rounded-full", PRIORITY_DOTS[task.priority])} />
                {priorityConfig.label}
              </span>

              {/* Status */}
              <span
                className={cn(
                  "inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-md",
                  task.status === "COMPLETED"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : task.status === "IN_PROGRESS"
                    ? "bg-violet-500/20 text-violet-400"
                    : "bg-white/5 text-gray-400"
                )}
              >
                {STATUS_CONFIG[task.status].label}
              </span>

              {/* Due date */}
              {task.dueDate && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md",
                    isOverdue
                      ? "bg-red-500/20 text-red-400"
                      : isDueToday
                      ? "bg-amber-500/20 text-amber-400"
                      : "bg-white/5 text-gray-400"
                  )}
                >
                  {isOverdue ? (
                    <AlertCircle className="h-3.5 w-3.5" />
                  ) : (
                    <Calendar className="h-3.5 w-3.5" />
                  )}
                  {formatDueDate(task.dueDate)}
                  {task.dueDate.includes("T") && `, ${formatTime(task.dueDate)}`}
                </span>
              )}
            </div>

            {/* Linked entities */}
            {(task.contact || task.deal) && (
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-400">
                {task.contact && (
                  <span className="inline-flex items-center gap-1.5 hover:text-white">
                    <User className="h-3.5 w-3.5" />
                    {task.contact.name}
                  </span>
                )}
                {task.deal && (
                  <span className="inline-flex items-center gap-1.5 hover:text-white">
                    <Link2 className="h-3.5 w-3.5" />
                    {task.deal.title}
                  </span>
                )}
              </div>
            )}

            {/* Checklist progress */}
            {totalChecklist > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-gray-400 uppercase tracking-wide font-medium">Чеклист</span>
                  <span className="font-semibold text-gray-300">
                    {completedChecklist}/{totalChecklist}
                  </span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-violet-500 rounded-full"
                    style={{
                      width: `${(completedChecklist / totalChecklist) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Tags */}
            {task.tags && task.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-4">
                {task.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] font-medium uppercase tracking-wider px-2 py-1 bg-white/5 text-gray-400 rounded"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-5 pt-4 border-t border-white/5">
          <div className="flex items-center gap-3">
            {task.assignee ? (
              <div className="flex items-center gap-2.5">
                <Avatar className="h-7 w-7 border border-white/10">
                  <AvatarImage src={task.assignee.avatar} />
                  <AvatarFallback className="text-xs font-medium bg-white/10 text-gray-300">
                    {getInitials(task.assignee.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-gray-400">
                  {task.assignee.name}
                </span>
              </div>
            ) : (
              <span className="text-sm text-gray-500">Не назначено</span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/5"
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 text-gray-400 hover:text-white hover:bg-white/5",
                "opacity-0 group-hover:opacity-100"
              )}
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
