export type TaskStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt?: string;
  assignee?: {
    id: string;
    name: string;
    avatar?: string;
  };
  creator?: {
    id: string;
    name: string;
    avatar?: string;
  };
  contact?: {
    id: string;
    name: string;
  };
  deal?: {
    id: string;
    title: string;
  };
  tags?: string[];
  checklist?: ChecklistItem[];
}

export interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
}

export interface TaskFilters {
  search?: string;
  status?: TaskStatus | "ALL";
  priority?: TaskPriority | "ALL";
  assigneeId?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  overdue?: boolean;
}

export interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  inProgress: number;
  overdue: number;
  dueToday: number;
  dueThisWeek: number;
}

export type ViewMode = "list" | "kanban" | "calendar";

export const PRIORITY_CONFIG = {
  URGENT: { label: "Срочный", color: "bg-red-500", textColor: "text-red-500", bgLight: "bg-red-50" },
  HIGH: { label: "Высокий", color: "bg-orange-500", textColor: "text-orange-500", bgLight: "bg-orange-50" },
  MEDIUM: { label: "Средний", color: "bg-yellow-500", textColor: "text-yellow-500", bgLight: "bg-yellow-50" },
  LOW: { label: "Низкий", color: "bg-green-500", textColor: "text-green-500", bgLight: "bg-green-50" },
} as const;

export const STATUS_CONFIG = {
  PENDING: { label: "Ожидает", color: "bg-gray-500", textColor: "text-gray-600", bgLight: "bg-gray-100" },
  IN_PROGRESS: { label: "В работе", color: "bg-blue-500", textColor: "text-blue-600", bgLight: "bg-blue-100" },
  COMPLETED: { label: "Выполнена", color: "bg-green-500", textColor: "text-green-600", bgLight: "bg-green-100" },
  CANCELLED: { label: "Отменена", color: "bg-red-500", textColor: "text-red-600", bgLight: "bg-red-100" },
} as const;
