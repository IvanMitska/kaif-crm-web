"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  LayoutList,
  Kanban,
  Calendar as CalendarIcon,
  Download,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  PlayCircle,
  ListTodo,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Task,
  TaskFilters as TaskFiltersType,
  TaskStats as TaskStatsType,
  ViewMode,
  TaskStatus,
} from "@/components/tasks/types";
import { TaskKanban } from "@/components/tasks/TaskKanban";
import { TaskListView } from "@/components/tasks/TaskListView";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { TaskDetailSheet } from "@/components/tasks/TaskDetailSheet";

const mockTasks: Task[] = [
  {
    id: "1",
    title: "Позвонить клиенту по договору",
    description: "Обсудить условия нового контракта и уточнить сроки поставки",
    priority: "HIGH",
    status: "PENDING",
    dueDate: new Date().toISOString(),
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    assignee: { id: "1", name: "Иван Петров" },
    contact: { id: "1", name: "Алексей Смирнов" },
    deal: { id: "1", title: "Поставка оборудования" },
    tags: ["важно", "клиент"],
    checklist: [
      { id: "1", title: "Подготовить документы", completed: true },
      { id: "2", title: "Уточнить цены", completed: false },
      { id: "3", title: "Отправить КП", completed: false },
    ],
  },
  {
    id: "2",
    title: "Отправить коммерческое предложение",
    description: "Подготовить и отправить КП для ООО Ромашка",
    priority: "MEDIUM",
    status: "IN_PROGRESS",
    dueDate: new Date(Date.now() + 86400000).toISOString(),
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date().toISOString(),
    assignee: { id: "2", name: "Мария Иванова" },
    tags: ["продажи"],
  },
  {
    id: "3",
    title: "Встреча с партнерами",
    description: "Обсуждение стратегического партнерства",
    priority: "HIGH",
    status: "PENDING",
    dueDate: new Date(Date.now() + 172800000).toISOString(),
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    updatedAt: new Date().toISOString(),
    assignee: { id: "1", name: "Иван Петров" },
    contact: { id: "2", name: "Дмитрий Козлов" },
  },
  {
    id: "4",
    title: "Подготовить отчет за месяц",
    priority: "LOW",
    status: "PENDING",
    dueDate: new Date(Date.now() + 604800000).toISOString(),
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "5",
    title: "Провести презентацию продукта",
    description: "Демонстрация нового функционала для клиента",
    priority: "URGENT",
    status: "IN_PROGRESS",
    dueDate: new Date().toISOString(),
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date().toISOString(),
    assignee: { id: "3", name: "Анна Сидорова" },
    deal: { id: "2", title: "Внедрение CRM" },
    checklist: [
      { id: "1", title: "Подготовить слайды", completed: true },
      { id: "2", title: "Протестировать демо", completed: true },
      { id: "3", title: "Отправить приглашения", completed: true },
    ],
  },
  {
    id: "6",
    title: "Обновить документацию",
    priority: "LOW",
    status: "COMPLETED",
    dueDate: new Date(Date.now() - 86400000).toISOString(),
    completedAt: new Date().toISOString(),
    createdAt: new Date(Date.now() - 432000000).toISOString(),
    updatedAt: new Date().toISOString(),
    assignee: { id: "2", name: "Мария Иванова" },
  },
  {
    id: "7",
    title: "Просроченная задача",
    description: "Эта задача уже просрочена",
    priority: "HIGH",
    status: "PENDING",
    dueDate: new Date(Date.now() - 172800000).toISOString(),
    createdAt: new Date(Date.now() - 432000000).toISOString(),
    updatedAt: new Date().toISOString(),
    assignee: { id: "1", name: "Иван Петров" },
  },
  {
    id: "8",
    title: "Интеграция с 1С",
    description: "Настроить обмен данными с 1С",
    priority: "MEDIUM",
    status: "PENDING",
    dueDate: new Date(Date.now() + 432000000).toISOString(),
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    assignee: { id: "3", name: "Анна Сидорова" },
    tags: ["интеграция", "технический"],
  },
];

const mockAssignees = [
  { id: "1", name: "Иван Петров" },
  { id: "2", name: "Мария Иванова" },
  { id: "3", name: "Анна Сидорова" },
];

const mockContacts = [
  { id: "1", name: "Алексей Смирнов" },
  { id: "2", name: "Дмитрий Козлов" },
  { id: "3", name: "Елена Новикова" },
];

const mockDeals = [
  { id: "1", title: "Поставка оборудования" },
  { id: "2", title: "Внедрение CRM" },
  { id: "3", title: "Консалтинг" },
];

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [filters, setFilters] = useState<TaskFiltersType>({
    status: "ALL",
    priority: "ALL",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [groupBy, setGroupBy] = useState<"status" | "priority" | "dueDate" | "assignee" | "none">("dueDate");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [initialStatus, setInitialStatus] = useState<TaskStatus>("PENDING");
  const [showFilters, setShowFilters] = useState(false);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        if (
          !task.title.toLowerCase().includes(searchLower) &&
          !task.description?.toLowerCase().includes(searchLower)
        ) {
          return false;
        }
      }

      if (filters.status && filters.status !== "ALL" && task.status !== filters.status) {
        return false;
      }

      if (filters.priority && filters.priority !== "ALL" && task.priority !== filters.priority) {
        return false;
      }

      if (filters.assigneeId) {
        if (filters.assigneeId === "current") {
          if (task.assignee?.id !== "1") return false;
        } else if (filters.assigneeId === "unassigned") {
          if (task.assignee) return false;
        } else if (task.assignee?.id !== filters.assigneeId) {
          return false;
        }
      }

      if (filters.overdue) {
        const isOverdue =
          task.dueDate &&
          new Date(task.dueDate) < new Date() &&
          task.status !== "COMPLETED";
        if (!isOverdue) return false;
      }

      return true;
    });
  }, [tasks, filters, searchQuery]);

  const stats: TaskStatsType = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);

    return {
      total: tasks.length,
      completed: tasks.filter((t) => t.status === "COMPLETED").length,
      pending: tasks.filter((t) => t.status === "PENDING").length,
      inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
      overdue: tasks.filter(
        (t) =>
          t.dueDate &&
          new Date(t.dueDate) < new Date() &&
          t.status !== "COMPLETED"
      ).length,
      dueToday: tasks.filter(
        (t) =>
          t.dueDate &&
          new Date(t.dueDate).toDateString() === today.toDateString() &&
          t.status !== "COMPLETED"
      ).length,
      dueThisWeek: tasks.filter((t) => {
        if (!t.dueDate || t.status === "COMPLETED") return false;
        const due = new Date(t.dueDate);
        return due >= today && due <= weekEnd;
      }).length,
    };
  }, [tasks]);

  const completionRate = stats.total > 0
    ? Math.round((stats.completed / stats.total) * 100)
    : 0;

  const handleTaskComplete = (id: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id
          ? {
              ...task,
              status: task.status === "COMPLETED" ? "PENDING" : "COMPLETED",
              completedAt: task.status === "COMPLETED" ? undefined : new Date().toISOString(),
            }
          : task
      )
    );
  };

  const handleStatusChange = (id: string, status: TaskStatus) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id
          ? {
              ...task,
              status,
              completedAt: status === "COMPLETED" ? new Date().toISOString() : undefined,
            }
          : task
      )
    );
  };

  const handleTaskDelete = (id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
    setDetailSheetOpen(false);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setDetailSheetOpen(true);
  };

  const handleTaskEdit = (task: Task) => {
    setEditTask(task);
    setCreateDialogOpen(true);
    setDetailSheetOpen(false);
  };

  const handleCreateTask = (taskData: Partial<Task>) => {
    if (editTask) {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === editTask.id
            ? { ...task, ...taskData, updatedAt: new Date().toISOString() }
            : task
        )
      );
      setEditTask(null);
    } else {
      const newTask: Task = {
        id: Date.now().toString(),
        title: taskData.title || "",
        description: taskData.description,
        priority: taskData.priority || "MEDIUM",
        status: taskData.status || initialStatus,
        dueDate: taskData.dueDate,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        assignee: taskData.assignee,
        contact: taskData.contact,
        deal: taskData.deal,
        tags: taskData.tags,
        checklist: taskData.checklist,
      };
      setTasks((prev) => [newTask, ...prev]);
    }
  };

  const handleCreateTaskForStatus = (status: TaskStatus) => {
    setInitialStatus(status);
    setEditTask(null);
    setCreateDialogOpen(true);
  };

  return (
    <div className="h-full min-h-full flex flex-col">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 glass-card border-b border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 sm:gap-6">
            <h1 className="text-xl sm:text-2xl font-bold text-white">Задачи</h1>

            {/* Stats Pills */}
            <div className="hidden lg:flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg">
                <ListTodo className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400">Всего</span>
                <span className="text-sm font-bold text-white">{stats.total}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-violet-500/20 rounded-lg">
                <PlayCircle className="w-4 h-4 text-violet-500" />
                <span className="text-sm text-violet-300">В работе</span>
                <span className="text-sm font-bold text-violet-300">{stats.inProgress}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-300">Готово</span>
                <span className="text-sm font-bold text-green-300">{stats.completed}</span>
              </div>
              {stats.overdue > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-300">Просрочено</span>
                  <span className="text-sm font-bold text-red-300">{stats.overdue}</span>
                </div>
              )}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/20 rounded-lg">
                <Clock className="w-4 h-4 text-amber-500" />
                <span className="text-sm text-amber-300">Сегодня</span>
                <span className="text-sm font-bold text-amber-300">{stats.dueToday}</span>
              </div>
            </div>

            {/* Progress */}
            <div className="hidden xl:flex items-center gap-3">
              <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
              <span className="text-sm font-bold text-gray-300">{completionRate}%</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search */}
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-48 lg:w-64 pl-10 pr-4 py-2.5 bg-white/5 rounded-xl text-sm text-white placeholder-gray-400 border border-white/10 focus:ring-2 focus:ring-violet-500 focus:bg-white/10"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "p-2.5 rounded-xl",
                showFilters ? "bg-violet-500 text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"
              )}
            >
              <SlidersHorizontal className="w-5 h-5" />
            </button>

            {/* Export - hidden on mobile */}
            <button className="hidden sm:block p-2.5 hover:bg-white/5 rounded-xl">
              <Download className="w-5 h-5 text-gray-400" />
            </button>

            {/* Add Button */}
            <button
              onClick={() => {
                setEditTask(null);
                setInitialStatus("PENDING");
                setCreateDialogOpen(true);
              }}
              className="flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-xl text-sm font-semibold hover:from-violet-600 hover:to-purple-600 shadow-sm"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Новая задача</span>
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex flex-wrap items-center gap-3">
              {/* Status Filter */}
              <select
                value={filters.status || "ALL"}
                onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
                className="px-4 py-2 bg-white/5 text-white rounded-xl text-sm border border-white/10 focus:ring-2 focus:ring-violet-500"
              >
                <option value="ALL">Все статусы</option>
                <option value="PENDING">Ожидают</option>
                <option value="IN_PROGRESS">В работе</option>
                <option value="COMPLETED">Выполнено</option>
              </select>

              {/* Priority Filter */}
              <select
                value={filters.priority || "ALL"}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value as any })}
                className="px-4 py-2 bg-white/5 text-white rounded-xl text-sm border border-white/10 focus:ring-2 focus:ring-violet-500"
              >
                <option value="ALL">Все приоритеты</option>
                <option value="URGENT">Срочный</option>
                <option value="HIGH">Высокий</option>
                <option value="MEDIUM">Средний</option>
                <option value="LOW">Низкий</option>
              </select>

              {/* Assignee Filter */}
              <select
                value={filters.assigneeId || ""}
                onChange={(e) => setFilters({ ...filters, assigneeId: e.target.value || undefined })}
                className="px-4 py-2 bg-white/5 text-white rounded-xl text-sm border border-white/10 focus:ring-2 focus:ring-violet-500"
              >
                <option value="">Все исполнители</option>
                <option value="current">Мои задачи</option>
                <option value="unassigned">Без исполнителя</option>
                {mockAssignees.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>

              {/* Overdue Toggle */}
              <button
                onClick={() => setFilters({ ...filters, overdue: !filters.overdue })}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium",
                  filters.overdue
                    ? "bg-red-500 text-white"
                    : "bg-white/5 text-gray-400 hover:bg-white/10"
                )}
              >
                Просроченные
              </button>

              {/* Clear Filters */}
              {(filters.status !== "ALL" || filters.priority !== "ALL" || filters.assigneeId || filters.overdue) && (
                <button
                  onClick={() => setFilters({ status: "ALL", priority: "ALL" })}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                  Сбросить
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* View Tabs */}
      <div className="px-4 sm:px-6 py-3 glass-card border-b border-white/10 overflow-x-auto">
        <div className="flex items-center justify-between gap-4 min-w-fit">
          <div className="flex bg-white/5 rounded-xl p-1">
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap",
                viewMode === "list"
                  ? "bg-white/10 text-white shadow-sm"
                  : "text-gray-400 hover:text-white"
              )}
            >
              <LayoutList className="w-4 h-4" />
              <span className="hidden sm:inline">Список</span>
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={cn(
                "flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap",
                viewMode === "kanban"
                  ? "bg-white/10 text-white shadow-sm"
                  : "text-gray-400 hover:text-white"
              )}
            >
              <Kanban className="w-4 h-4" />
              <span className="hidden sm:inline">Канбан</span>
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={cn(
                "flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap",
                viewMode === "calendar"
                  ? "bg-white/10 text-white shadow-sm"
                  : "text-gray-400 hover:text-white"
              )}
            >
              <CalendarIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Календарь</span>
            </button>
          </div>

          {viewMode === "list" && (
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-sm text-gray-400">Группировка:</span>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as any)}
                className="px-3 py-1.5 bg-white/5 text-white rounded-lg text-sm border border-white/10 focus:ring-2 focus:ring-violet-500"
              >
                <option value="dueDate">По дате</option>
                <option value="status">По статусу</option>
                <option value="priority">По приоритету</option>
                <option value="assignee">По исполнителю</option>
                <option value="none">Без группировки</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        {viewMode === "list" && (
          <div className="glass-card rounded-2xl border border-white/10 p-4 sm:p-6">
            <TaskListView
              tasks={filteredTasks}
              groupBy={groupBy}
              onTaskClick={handleTaskClick}
              onTaskComplete={handleTaskComplete}
              onTaskEdit={handleTaskEdit}
              onTaskDelete={handleTaskDelete}
              onStatusChange={handleStatusChange}
            />
          </div>
        )}

        {viewMode === "kanban" && (
          <TaskKanban
            tasks={filteredTasks}
            onTaskClick={handleTaskClick}
            onTaskComplete={handleTaskComplete}
            onStatusChange={handleStatusChange}
            onCreateTask={handleCreateTaskForStatus}
          />
        )}

        {viewMode === "calendar" && (
          <div className="glass-card rounded-2xl border border-white/10 p-12">
            <div className="flex flex-col items-center justify-center text-gray-400">
              <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                <CalendarIcon className="w-10 h-10 text-gray-500" />
              </div>
              <p className="text-lg font-semibold text-white">Календарь задач</p>
              <p className="text-sm text-gray-400 mt-1">Скоро будет доступно</p>
            </div>
          </div>
        )}

        {filteredTasks.length === 0 && viewMode !== "calendar" && (
          <div className="glass-card rounded-2xl border border-white/10 p-12">
            <div className="flex flex-col items-center justify-center text-gray-400">
              <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                <ListTodo className="w-10 h-10 text-gray-500" />
              </div>
              <p className="text-lg font-semibold text-white">Задач не найдено</p>
              <p className="text-sm text-gray-400 mt-1">Попробуйте изменить фильтры или создайте новую задачу</p>
              <button
                onClick={() => {
                  setEditTask(null);
                  setInitialStatus("PENDING");
                  setCreateDialogOpen(true);
                }}
                className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-xl text-sm font-semibold hover:from-violet-600 hover:to-purple-600"
              >
                <Plus className="w-4 h-4" />
                Создать задачу
              </button>
            </div>
          </div>
        )}
      </div>

      <CreateTaskDialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) setEditTask(null);
        }}
        onSubmit={handleCreateTask}
        initialStatus={initialStatus}
        assignees={mockAssignees}
        contacts={mockContacts}
        deals={mockDeals}
        editTask={editTask}
      />

      <TaskDetailSheet
        task={selectedTask}
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
        onEdit={handleTaskEdit}
        onDelete={handleTaskDelete}
        onComplete={handleTaskComplete}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
