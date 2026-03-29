"use client";

import {
  Calendar,
  User,
  Edit,
  Trash2,
  CheckCircle2,
  Check,
  Play,
  Pause,
  MoreHorizontal,
  Clock,
  AlertCircle,
  Briefcase,
  Tag,
  ArrowRight,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Task, PRIORITY_CONFIG, STATUS_CONFIG, TaskStatus } from "./types";

interface TaskDetailSheetProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (id: string) => void;
  onComplete?: (id: string) => void;
  onStatusChange?: (id: string, status: TaskStatus) => void;
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

export function TaskDetailSheet({
  task,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  onComplete,
  onStatusChange,
}: TaskDetailSheetProps) {
  if (!task) return null;

  const priorityConfig = PRIORITY_CONFIG[task.priority];
  const statusConfig = STATUS_CONFIG[task.status];

  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== "COMPLETED";

  const formatDueDate = (date: string) => {
    const d = new Date(date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (d.toDateString() === today.toDateString()) return "Сегодня";
    if (d.toDateString() === tomorrow.toDateString()) return "Завтра";

    return d.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCreatedDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getInitials = (name: string) => {
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg p-0 gap-0 bg-[#0d0d14] border-white/10">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="px-6 pt-6 pb-5 border-b border-white/5">
            {/* Status & Actions Row */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {/* Status Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg">
                  <span className={cn("h-2 w-2 rounded-full", STATUS_DOTS[task.status])} />
                  <span className="text-sm font-medium text-gray-300">
                    {statusConfig.label}
                  </span>
                </div>
                {/* Overdue Badge */}
                {isOverdue && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span className="text-sm font-medium">Просрочено</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/5">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-[#0d0d14] border-white/10">
                    <DropdownMenuItem onClick={() => onEdit?.(task)} className="focus:bg-white/5">
                      <Edit className="h-4 w-4 mr-2" />
                      Редактировать
                    </DropdownMenuItem>
                    {task.status === "PENDING" && (
                      <DropdownMenuItem onClick={() => onStatusChange?.(task.id, "IN_PROGRESS")} className="focus:bg-white/5">
                        <Play className="h-4 w-4 mr-2" />
                        Начать выполнение
                      </DropdownMenuItem>
                    )}
                    {task.status === "IN_PROGRESS" && (
                      <DropdownMenuItem onClick={() => onStatusChange?.(task.id, "PENDING")} className="focus:bg-white/5">
                        <Pause className="h-4 w-4 mr-2" />
                        Приостановить
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator className="bg-white/5" />
                    <DropdownMenuItem
                      className="text-red-400 focus:text-red-400 focus:bg-white/5"
                      onClick={() => onDelete?.(task.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Удалить
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/5"
                  onClick={() => onOpenChange(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-xl font-semibold text-white leading-tight">
              {task.title}
            </h2>
          </div>

          {/* Content */}
          <ScrollArea className="flex-1">
            <div className="px-6 py-5 space-y-6">
              {/* Complete Button */}
              {task.status !== "COMPLETED" && (
                <Button
                  onClick={() => onComplete?.(task.id)}
                  className="w-full h-11 gap-2.5 bg-violet-500 hover:bg-violet-600 text-white font-medium rounded-lg"
                >
                  <CheckCircle2 className="h-5 w-5" />
                  Завершить задачу
                </Button>
              )}

              {/* Completed state */}
              {task.status === "COMPLETED" && (
                <div className="flex items-center gap-3 p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                  <div className="flex items-center justify-center h-10 w-10 bg-emerald-500 rounded-full">
                    <Check className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-emerald-400">Задача выполнена</p>
                    {task.completedAt && (
                      <p className="text-sm text-emerald-500/70">
                        {formatCreatedDate(task.completedAt)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Description */}
              {task.description && (
                <div>
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Описание
                  </h4>
                  <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {task.description}
                  </p>
                </div>
              )}

              {/* Priority & Due Date Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Priority */}
                <div className="p-4 bg-white/5 rounded-xl">
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Приоритет
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className={cn("h-2.5 w-2.5 rounded-full", PRIORITY_DOTS[task.priority])} />
                    <span className="font-medium text-white">{priorityConfig.label}</span>
                  </div>
                </div>

                {/* Due Date */}
                <div className={cn(
                  "p-4 rounded-xl",
                  isOverdue ? "bg-red-500/10" : "bg-white/5"
                )}>
                  <h4 className={cn(
                    "text-xs font-medium uppercase tracking-wide mb-2",
                    isOverdue ? "text-red-400" : "text-gray-500"
                  )}>
                    Срок
                  </h4>
                  {task.dueDate ? (
                    <div className={cn(
                      "flex items-center gap-2",
                      isOverdue ? "text-red-400" : "text-white"
                    )}>
                      <Calendar className="h-4 w-4" />
                      <span className="font-medium">
                        {formatDueDate(task.dueDate)}
                        {task.dueDate.includes("T") && (
                          <span className="text-gray-500 font-normal ml-1">
                            {formatTime(task.dueDate)}
                          </span>
                        )}
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-500">Не указан</span>
                  )}
                </div>
              </div>

              {/* People Section */}
              <div className="space-y-3">
                {/* Assignee */}
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-400">Исполнитель</span>
                  </div>
                  {task.assignee ? (
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-7 w-7 border border-white/10">
                        <AvatarImage src={task.assignee.avatar} />
                        <AvatarFallback className="text-[10px] font-medium bg-white/10 text-gray-300">
                          {getInitials(task.assignee.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-white">{task.assignee.name}</span>
                    </div>
                  ) : (
                    <span className="text-gray-500 text-sm">Не назначен</span>
                  )}
                </div>

                {/* Creator */}
                {task.creator && (
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                    <div className="flex items-center gap-2.5">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-400">Автор</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-7 w-7 border border-white/10">
                        <AvatarImage src={task.creator.avatar} />
                        <AvatarFallback className="text-[10px] font-medium bg-white/10 text-gray-300">
                          {getInitials(task.creator.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-white">{task.creator.name}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Linked Entities */}
              {(task.contact || task.deal) && (
                <div className="space-y-3">
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Связи
                  </h4>

                  {task.contact && (
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl group hover:bg-white/10 cursor-pointer">
                      <div className="flex items-center gap-2.5">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-400">Контакт</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{task.contact.name}</span>
                        <ArrowRight className="h-4 w-4 text-gray-500 opacity-0 group-hover:opacity-100" />
                      </div>
                    </div>
                  )}

                  {task.deal && (
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl group hover:bg-white/10 cursor-pointer">
                      <div className="flex items-center gap-2.5">
                        <Briefcase className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-400">Сделка</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{task.deal.title}</span>
                        <ArrowRight className="h-4 w-4 text-gray-500 opacity-0 group-hover:opacity-100" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Checklist */}
              {task.checklist && task.checklist.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Чеклист
                    </h4>
                    <span className="text-sm font-semibold text-gray-300">
                      {completedChecklist}/{totalChecklist}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-4">
                    <div
                      className="h-full bg-violet-500 rounded-full"
                      style={{
                        width: `${(completedChecklist / totalChecklist) * 100}%`,
                      }}
                    />
                  </div>

                  {/* Items */}
                  <div className="space-y-2">
                    {task.checklist.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 cursor-pointer"
                      >
                        <div
                          className={cn(
                            "flex h-5 w-5 items-center justify-center rounded-full border-2",
                            item.completed
                              ? "bg-violet-500 border-violet-500 text-white"
                              : "border-gray-600"
                          )}
                        >
                          {item.completed && <Check className="h-3 w-3" />}
                        </div>
                        <span
                          className={cn(
                            "flex-1 text-sm",
                            item.completed ? "line-through text-gray-500" : "text-gray-300"
                          )}
                        >
                          {item.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {task.tags && task.tags.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <Tag className="h-3.5 w-3.5" />
                    Теги
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {task.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs font-medium uppercase tracking-wider px-3 py-1.5 bg-white/5 text-gray-400 rounded-lg border border-white/5"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Meta Info */}
              <div className="pt-4 border-t border-white/5">
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5" />
                  История
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Создано</span>
                    <span className="font-medium text-gray-300">{formatCreatedDate(task.createdAt)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Обновлено</span>
                    <span className="font-medium text-gray-300">{formatCreatedDate(task.updatedAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-white/5 bg-[#0a0a10]">
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 h-10 gap-2 border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white hover:border-white/20"
                onClick={() => onEdit?.(task)}
              >
                <Edit className="h-4 w-4" />
                Редактировать
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 border-white/10 bg-white/5 text-gray-400 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10"
                onClick={() => onDelete?.(task.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
