"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  User,
  Flag,
  Inbox,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TaskCard } from "./TaskCard";
import { Task, TaskStatus } from "./types";

interface TaskListViewProps {
  tasks: Task[];
  groupBy?: "status" | "priority" | "dueDate" | "assignee" | "none";
  onTaskClick?: (task: Task) => void;
  onTaskComplete?: (id: string) => void;
  onTaskEdit?: (task: Task) => void;
  onTaskDelete?: (id: string) => void;
  onStatusChange?: (id: string, status: TaskStatus) => void;
}

interface TaskGroup {
  id: string;
  title: string;
  icon?: React.ReactNode;
  accentColor?: string;
  tasks: Task[];
}

export function TaskListView({
  tasks,
  groupBy = "dueDate",
  onTaskClick,
  onTaskComplete,
  onTaskEdit,
  onTaskDelete,
  onStatusChange,
}: TaskListViewProps) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    new Set()
  );

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const groupTasks = (): TaskGroup[] => {
    if (groupBy === "none") {
      return [{ id: "all", title: "Все задачи", tasks }];
    }

    if (groupBy === "status") {
      const statusGroups: Record<TaskStatus, Task[]> = {
        PENDING: [],
        IN_PROGRESS: [],
        COMPLETED: [],
        CANCELLED: [],
      };

      tasks.forEach((task) => {
        statusGroups[task.status].push(task);
      });

      return [
        {
          id: "IN_PROGRESS",
          title: "В работе",
          icon: <Clock className="h-4 w-4" />,
          accentColor: "bg-violet-500",
          tasks: statusGroups.IN_PROGRESS,
        },
        {
          id: "PENDING",
          title: "Ожидают",
          icon: <Clock className="h-4 w-4" />,
          accentColor: "bg-gray-400",
          tasks: statusGroups.PENDING,
        },
        {
          id: "COMPLETED",
          title: "Выполнено",
          icon: <CheckCircle2 className="h-4 w-4" />,
          accentColor: "bg-emerald-500",
          tasks: statusGroups.COMPLETED,
        },
      ].filter((g) => g.tasks.length > 0);
    }

    if (groupBy === "priority") {
      const priorityOrder = ["URGENT", "HIGH", "MEDIUM", "LOW"] as const;
      const priorityGroups: Record<string, Task[]> = {
        URGENT: [],
        HIGH: [],
        MEDIUM: [],
        LOW: [],
      };

      tasks.forEach((task) => {
        priorityGroups[task.priority].push(task);
      });

      const priorityConfig = {
        URGENT: {
          title: "Срочные",
          icon: <AlertTriangle className="h-4 w-4" />,
          accentColor: "bg-red-500",
        },
        HIGH: {
          title: "Высокий приоритет",
          icon: <Flag className="h-4 w-4" />,
          accentColor: "bg-orange-500",
        },
        MEDIUM: {
          title: "Средний приоритет",
          icon: <Flag className="h-4 w-4" />,
          accentColor: "bg-yellow-500",
        },
        LOW: {
          title: "Низкий приоритет",
          icon: <Flag className="h-4 w-4" />,
          accentColor: "bg-emerald-500",
        },
      };

      return priorityOrder
        .map((priority) => ({
          id: priority,
          title: priorityConfig[priority].title,
          icon: priorityConfig[priority].icon,
          accentColor: priorityConfig[priority].accentColor,
          tasks: priorityGroups[priority],
        }))
        .filter((g) => g.tasks.length > 0);
    }

    if (groupBy === "dueDate") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);

      const groups: Record<string, Task[]> = {
        overdue: [],
        today: [],
        tomorrow: [],
        thisWeek: [],
        later: [],
        noDueDate: [],
      };

      tasks.forEach((task) => {
        if (!task.dueDate) {
          groups.noDueDate.push(task);
          return;
        }

        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);

        if (dueDate < today && task.status !== "COMPLETED") {
          groups.overdue.push(task);
        } else if (dueDate.getTime() === today.getTime()) {
          groups.today.push(task);
        } else if (dueDate.getTime() === tomorrow.getTime()) {
          groups.tomorrow.push(task);
        } else if (dueDate < nextWeek) {
          groups.thisWeek.push(task);
        } else {
          groups.later.push(task);
        }
      });

      return [
        {
          id: "overdue",
          title: "Просрочено",
          icon: <AlertTriangle className="h-4 w-4" />,
          accentColor: "bg-red-500",
          tasks: groups.overdue,
        },
        {
          id: "today",
          title: "Сегодня",
          icon: <Calendar className="h-4 w-4" />,
          accentColor: "bg-violet-500",
          tasks: groups.today,
        },
        {
          id: "tomorrow",
          title: "Завтра",
          icon: <Calendar className="h-4 w-4" />,
          accentColor: "bg-purple-500",
          tasks: groups.tomorrow,
        },
        {
          id: "thisWeek",
          title: "На этой неделе",
          icon: <Calendar className="h-4 w-4" />,
          accentColor: "bg-indigo-500",
          tasks: groups.thisWeek,
        },
        {
          id: "later",
          title: "Позже",
          icon: <Calendar className="h-4 w-4" />,
          accentColor: "bg-gray-400",
          tasks: groups.later,
        },
        {
          id: "noDueDate",
          title: "Без срока",
          icon: <Inbox className="h-4 w-4" />,
          accentColor: "bg-gray-500",
          tasks: groups.noDueDate,
        },
      ].filter((g) => g.tasks.length > 0);
    }

    if (groupBy === "assignee") {
      const assigneeGroups: Record<string, Task[]> = {};
      const unassigned: Task[] = [];

      tasks.forEach((task) => {
        if (task.assignee) {
          const key = task.assignee.id;
          if (!assigneeGroups[key]) {
            assigneeGroups[key] = [];
          }
          assigneeGroups[key].push(task);
        } else {
          unassigned.push(task);
        }
      });

      const groups: TaskGroup[] = Object.entries(assigneeGroups).map(
        ([, groupTasks]) => ({
          id: groupTasks[0].assignee!.id,
          title: groupTasks[0].assignee!.name,
          icon: <User className="h-4 w-4" />,
          accentColor: "bg-gray-500",
          tasks: groupTasks,
        })
      );

      if (unassigned.length > 0) {
        groups.push({
          id: "unassigned",
          title: "Не назначено",
          icon: <User className="h-4 w-4" />,
          accentColor: "bg-gray-600",
          tasks: unassigned,
        });
      }

      return groups;
    }

    return [{ id: "all", title: "Все задачи", tasks }];
  };

  const groups = groupTasks();

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
          <Inbox className="h-8 w-8" />
        </div>
        <p className="text-lg font-medium text-gray-300">Нет задач</p>
        <p className="text-sm mt-1 text-gray-500">Создайте новую задачу для начала работы</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => {
        const isCollapsed = collapsedGroups.has(group.id);
        const completedCount = group.tasks.filter(
          (t) => t.status === "COMPLETED"
        ).length;

        return (
          <div key={group.id} className="space-y-3">
            {/* Group Header */}
            <button
              onClick={() => toggleGroup(group.id)}
              className={cn(
                "flex items-center gap-3 w-full text-left group",
                "py-2 px-1 -mx-1 rounded-lg",
                "hover:bg-white/5"
              )}
            >
              {/* Collapse indicator */}
              <div
                className={cn(
                  "flex items-center justify-center w-6 h-6 rounded-md",
                  "bg-white/5 group-hover:bg-white/10"
                )}
              >
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
              </div>

              {/* Accent dot */}
              {group.accentColor && (
                <div className={cn("h-2 w-2 rounded-full", group.accentColor)} />
              )}

              {/* Title */}
              <span className="font-semibold text-white text-sm uppercase tracking-wide">
                {group.title}
              </span>

              {/* Count */}
              <span className="flex items-center justify-center h-5 min-w-5 px-1.5 text-xs font-semibold bg-white/10 rounded text-gray-300">
                {completedCount > 0
                  ? `${completedCount}/${group.tasks.length}`
                  : group.tasks.length}
              </span>

              {/* Progress bar for groups with completed tasks */}
              {completedCount > 0 && completedCount < group.tasks.length && (
                <div className="flex-1 max-w-24 h-1 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-violet-500 rounded-full"
                    style={{
                      width: `${(completedCount / group.tasks.length) * 100}%`,
                    }}
                  />
                </div>
              )}
            </button>

            {/* Task Cards */}
            {!isCollapsed && (
              <div
                className={cn(
                  "space-y-3 pl-9"
                )}
              >
                {group.tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onClick={onTaskClick}
                    onComplete={onTaskComplete}
                    onEdit={onTaskEdit}
                    onDelete={onTaskDelete}
                    onStatusChange={onStatusChange}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
