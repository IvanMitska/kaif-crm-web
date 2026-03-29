"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus, Clock, PlayCircle, CheckCircle2, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TaskCard } from "./TaskCard";
import { Task, TaskStatus } from "./types";

interface TaskKanbanProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onTaskComplete?: (id: string) => void;
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
  onCreateTask?: (status: TaskStatus) => void;
}

interface Column {
  id: TaskStatus;
  title: string;
  icon: React.ReactNode;
  accentColor: string;
  headerBg: string;
}

const columns: Column[] = [
  {
    id: "PENDING",
    title: "Ожидают",
    icon: <Clock className="h-4 w-4" />,
    accentColor: "bg-gray-400",
    headerBg: "bg-white/5",
  },
  {
    id: "IN_PROGRESS",
    title: "В работе",
    icon: <PlayCircle className="h-4 w-4" />,
    accentColor: "bg-violet-500",
    headerBg: "bg-violet-500/10",
  },
  {
    id: "COMPLETED",
    title: "Выполнено",
    icon: <CheckCircle2 className="h-4 w-4" />,
    accentColor: "bg-emerald-500",
    headerBg: "bg-emerald-500/10",
  },
];

function SortableTaskCard({
  task,
  onTaskClick,
  onTaskComplete,
}: {
  task: Task;
  onTaskClick?: (task: Task) => void;
  onTaskComplete?: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        isDragging && "opacity-40"
      )}
    >
      <TaskCard
        task={task}
        variant="kanban"
        onClick={onTaskClick}
        onComplete={onTaskComplete}
      />
    </div>
  );
}

function KanbanColumn({
  column,
  tasks,
  onTaskClick,
  onTaskComplete,
  onCreateTask,
}: {
  column: Column;
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onTaskComplete?: (id: string) => void;
  onCreateTask?: (status: TaskStatus) => void;
}) {
  return (
    <div
      className={cn(
        "flex flex-col w-80 min-w-80 rounded-xl overflow-hidden",
        "bg-[#0d0d14]/80 border border-white/5"
      )}
    >
      {/* Header */}
      <div className={cn("px-4 py-3 border-b border-white/5", column.headerBg)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={cn("h-2 w-2 rounded-full", column.accentColor)} />
            <h3 className="font-semibold text-white text-sm uppercase tracking-wide">
              {column.title}
            </h3>
            <span className="flex items-center justify-center h-5 min-w-5 px-1.5 text-xs font-semibold bg-white/10 rounded text-gray-300 border border-white/5">
              {tasks.length}
            </span>
          </div>
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-gray-400 hover:text-white hover:bg-white/10"
              onClick={() => onCreateTask?.(column.id)}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-gray-400 hover:text-white hover:bg-white/10"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 bg-[#0d0d14] border-white/10">
                <DropdownMenuItem onClick={() => onCreateTask?.(column.id)} className="hover:bg-white/5">
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Tasks area */}
      <ScrollArea className="flex-1">
        <div className="p-3">
          <SortableContext
            items={tasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2.5">
              {tasks.map((task) => (
                <SortableTaskCard
                  key={task.id}
                  task={task}
                  onTaskClick={onTaskClick}
                  onTaskComplete={onTaskComplete}
                />
              ))}
            </div>
          </SortableContext>

          {tasks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center mb-3">
                {column.icon}
              </div>
              <p className="text-sm font-medium">Нет задач</p>
              <p className="text-xs mt-1 text-gray-600">Перетащите сюда или создайте</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 pt-0">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-2 text-gray-400 font-medium",
            "hover:text-white hover:bg-white/5"
          )}
          onClick={() => onCreateTask?.(column.id)}
        >
          <Plus className="h-4 w-4" />
          <span className="text-sm">Добавить задачу</span>
        </Button>
      </div>
    </div>
  );
}

export function TaskKanban({
  tasks,
  onTaskClick,
  onTaskComplete,
  onStatusChange,
  onCreateTask,
}: TaskKanbanProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const getTasksByStatus = (status: TaskStatus) =>
    tasks.filter((task) => task.status === status);

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveTask(null);

    if (!over) return;

    const activeTask = tasks.find((t) => t.id === active.id);
    if (!activeTask) return;

    const overId = over.id as string;

    const isOverColumn = columns.some((col) => col.id === overId);
    if (isOverColumn) {
      if (activeTask.status !== overId) {
        onStatusChange?.(activeTask.id, overId as TaskStatus);
      }
      return;
    }

    const overTask = tasks.find((t) => t.id === overId);
    if (overTask && activeTask.status !== overTask.status) {
      onStatusChange?.(activeTask.id, overTask.status);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeTask = tasks.find((t) => t.id === active.id);
    if (!activeTask) return;

    const overId = over.id as string;

    const isOverColumn = columns.some((col) => col.id === overId);
    if (isOverColumn && activeTask.status !== overId) {
      return;
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
    >
      <div className="flex gap-5 overflow-x-auto pb-4 min-h-[600px]">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            tasks={getTasksByStatus(column.id)}
            onTaskClick={onTaskClick}
            onTaskComplete={onTaskComplete}
            onCreateTask={onCreateTask}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask && (
          <div className="rotate-2 scale-105 shadow-2xl opacity-95">
            <TaskCard task={activeTask} variant="kanban" />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
