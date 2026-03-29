"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  ChevronRight,
  ChevronDown,
  Briefcase,
  DollarSign,
  TrendingUp,
  Target,
  Building2,
  User,
  Calendar,
  SlidersHorizontal,
  ArrowUpRight,
  Phone,
  MessageSquare,
  CheckSquare,
  Flame,
  Thermometer,
  Snowflake,
  AlertCircle,
  Clock,
  Mail,
  Edit,
  Trash2,
  X,
} from "lucide-react";
import { mockDeals, mockPipelines } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { DealModal } from "@/components/deals/DealModal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface Deal {
  id: string;
  title: string;
  amount: number;
  stageId: string;
  stage: { id: string; name: string; color: string };
  contact?: { id: string; firstName: string; lastName: string };
  company?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
  // Extended fields for enhanced cards
  assignee?: { id: string; name: string; avatar?: string };
  temperature?: "hot" | "warm" | "cold";
  hasOverdueTasks?: boolean;
  lastActivityDays?: number;
  tags?: string[];
  nextTask?: { title: string; dueDate: string; isOverdue: boolean };
}


// Quick filter types
type QuickFilter = "all" | "my" | "overdue" | "no-tasks" | "hot";

// Temperature indicator component
function TemperatureIndicator({ temperature }: { temperature?: "hot" | "warm" | "cold" }) {
  if (!temperature) return null;

  const config = {
    hot: { icon: Flame, color: "text-red-500", bg: "bg-red-500/20", label: "Горячая" },
    warm: { icon: Thermometer, color: "text-amber-500", bg: "bg-amber-500/20", label: "Тёплая" },
    cold: { icon: Snowflake, color: "text-blue-500", bg: "bg-blue-500/20", label: "Холодная" },
  };

  const { icon: Icon, color, bg } = config[temperature];

  return (
    <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center", bg)}>
      <Icon className={cn("w-3.5 h-3.5", color)} />
    </div>
  );
}

// Manager avatar component
function ManagerAvatar({ name, avatar, size = "sm" }: { name?: string; avatar?: string; size?: "sm" | "md" }) {
  const initials = name?.split(" ").map(n => n[0]).join("").slice(0, 2) || "?";
  const sizeClasses = size === "sm" ? "w-7 h-7 text-xs" : "w-9 h-9 text-sm";

  return (
    <div className={cn(
      "rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-semibold",
      sizeClasses
    )}>
      {avatar ? (
        <img src={avatar} alt={name} className="w-full h-full rounded-full object-cover" />
      ) : (
        initials
      )}
    </div>
  );
}

// Deal card component for Kanban
function DealCard({
  deal,
  onClick,
  onQuickAction,
}: {
  deal: Deal;
  onClick: () => void;
  onQuickAction: (action: string, deal: Deal) => void;
}) {
  const [showActions, setShowActions] = useState(false);

  const formatAmount = (amount: number) => {
    if (amount >= 1000000) return (amount / 1000000).toFixed(1) + "M";
    if (amount >= 1000) return (amount / 1000).toFixed(0) + "K";
    return new Intl.NumberFormat("ru-RU").format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
  };

  // Mock data for demo - in real app this comes from API
  const mockAssignee = deal.assignee || { name: "Иван М.", avatar: undefined };
  const mockTemperature = deal.temperature || (["hot", "warm", "cold"] as const)[Math.floor(Math.random() * 3)];
  const mockLastActivity = deal.lastActivityDays ?? Math.floor(Math.random() * 14);
  const mockHasOverdue = deal.hasOverdueTasks ?? Math.random() > 0.7;
  const mockTags = deal.tags || (Math.random() > 0.5 ? ["B2B", "Оборудование"] : ["Сайт"]);

  return (
    <div
      className="group glass-card rounded-2xl p-4 hover:bg-white/5 cursor-pointer border border-white/5 hover:border-violet-500/30"
      onClick={onClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Header with title and actions */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <h4 className="font-semibold text-white line-clamp-2 text-[15px] leading-snug flex-1">
          {deal.title}
        </h4>
        <div className="flex items-center gap-1 shrink-0">
          <TemperatureIndicator temperature={mockTemperature} />
          {mockHasOverdue && (
            <div className="w-6 h-6 rounded-lg bg-red-500/20 flex items-center justify-center" title="Просроченная задача">
              <AlertCircle className="w-3.5 h-3.5 text-red-500" />
            </div>
          )}
        </div>
      </div>

      {/* Amount - highlighted */}
      <div className="mb-3">
        <span className="text-2xl font-bold text-white">{formatAmount(deal.amount)}</span>
        <span className="text-sm text-gray-500 ml-1">₽</span>
      </div>

      {/* Company & Contact */}
      {deal.company && (
        <div className="flex items-center gap-2 text-sm text-gray-300 mb-1.5">
          <Building2 className="w-4 h-4 text-gray-500" />
          <span className="truncate">{deal.company.name}</span>
        </div>
      )}
      {deal.contact && (
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
          <User className="w-4 h-4 text-gray-500" />
          <span>{deal.contact.firstName} {deal.contact.lastName}</span>
        </div>
      )}

      {/* Tags */}
      {mockTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {mockTags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 bg-white/5 text-gray-300 text-xs font-medium rounded-md"
            >
              {tag}
            </span>
          ))}
          {mockTags.length > 3 && (
            <span className="px-2 py-0.5 bg-white/5 text-gray-500 text-xs rounded-md">
              +{mockTags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer with manager, activity, date */}
      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <div className="flex items-center gap-2">
          <ManagerAvatar name={mockAssignee.name} avatar={mockAssignee.avatar} />
          {mockLastActivity > 0 && (
            <div className={cn(
              "flex items-center gap-1 text-xs",
              mockLastActivity > 7 ? "text-red-500" : mockLastActivity > 3 ? "text-amber-500" : "text-gray-500"
            )}>
              <Clock className="w-3 h-3" />
              <span>{mockLastActivity}д</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Calendar className="w-3 h-3" />
          <span>{formatDate(deal.createdAt)}</span>
        </div>
      </div>

      {/* Quick action buttons - appear on hover */}
      <div className={cn(
        "flex items-center gap-1 mt-3 pt-3 border-t border-white/5",
        showActions ? "opacity-100" : "opacity-0"
      )}>
        <button
          onClick={(e) => { e.stopPropagation(); onQuickAction("call", deal); }}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-green-500/20 text-green-400 hover:bg-green-500/30 text-xs font-medium"
        >
          <Phone className="w-3.5 h-3.5" />
          Позвонить
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onQuickAction("task", deal); }}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 text-xs font-medium"
        >
          <CheckSquare className="w-3.5 h-3.5" />
          Задача
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onQuickAction("message", deal); }}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 text-xs font-medium"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Написать
        </button>
      </div>
    </div>
  );
}

// Kanban column component
function KanbanColumn({
  stage,
  deals,
  onDealClick,
  onQuickAction,
  onAddDeal,
}: {
  stage: { id: string; name: string; color: string };
  deals: Deal[];
  onDealClick: (deal: Deal) => void;
  onQuickAction: (action: string, deal: Deal) => void;
  onAddDeal: (stageId: string) => void;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const stageTotal = deals.reduce((sum, d) => sum + d.amount, 0);

  const formatAmount = (amount: number) => {
    if (amount >= 1000000) return (amount / 1000000).toFixed(1) + "M ₽";
    if (amount >= 1000) return (amount / 1000).toFixed(0) + "K ₽";
    return new Intl.NumberFormat("ru-RU").format(amount) + " ₽";
  };

  // Empty state messages
  const emptyMessages = [
    "Перетащите сделку сюда или создайте новую",
    "Здесь пока пусто — время исправить это!",
    "Добавьте первую сделку на этот этап",
  ];
  const randomEmptyMessage = emptyMessages[Math.floor(Math.random() * emptyMessages.length)];

  return (
    <div className={cn(
      "flex-shrink-0 glass-card rounded-2xl sm:rounded-3xl snap-start",
      isCollapsed ? "w-16" : "w-[280px] sm:w-[320px] md:w-[340px]"
    )}>
      {/* Column Header */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 hover:bg-white/5 rounded-lg"
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>
            {!isCollapsed && (
              <>
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: stage.color }}
                />
                <h3 className="font-bold text-white text-lg">{stage.name}</h3>
              </>
            )}
          </div>
          {!isCollapsed && (
            <button
              onClick={() => onAddDeal(stage.id)}
              className="p-2 hover:bg-white/5 rounded-xl"
            >
              <Plus className="w-5 h-5 text-gray-400" />
            </button>
          )}
        </div>

        {!isCollapsed && (
          <div className="flex items-center gap-4 bg-white/5 rounded-xl px-4 py-3">
            <div>
              <span className="text-2xl font-bold text-white">{deals.length}</span>
              <span className="text-sm text-gray-400 ml-1">сделок</span>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div>
              <span className="text-lg font-bold text-white">{formatAmount(stageTotal)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Collapsed state */}
      {isCollapsed && (
        <div className="p-2 text-center">
          <div
            className="w-4 h-4 rounded-full mx-auto mb-2"
            style={{ backgroundColor: stage.color }}
          />
          <div className="text-xs font-bold text-white writing-mode-vertical transform -rotate-180" style={{ writingMode: "vertical-rl" }}>
            {stage.name}
          </div>
          <div className="mt-2 text-sm font-bold text-gray-300">{deals.length}</div>
        </div>
      )}

      {/* Cards */}
      {!isCollapsed && (
        <div className="p-4 space-y-3 max-h-[calc(100vh-400px)] overflow-y-auto scrollbar-minimal">
          {deals.map((deal) => (
            <DealCard
              key={deal.id}
              deal={deal}
              onClick={() => onDealClick(deal)}
              onQuickAction={onQuickAction}
            />
          ))}

          {deals.length === 0 && (
            <div className="text-center py-12 px-4">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-8 h-8 text-gray-500" />
              </div>
              <p className="text-gray-400 text-sm mb-4">{randomEmptyMessage}</p>
              <button
                onClick={() => onAddDeal(stage.id)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500 text-white rounded-xl text-sm font-medium hover:bg-violet-600"
              >
                <Plus className="w-4 h-4" />
                Добавить сделку
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Deal detail modal component
function DealDetailModal({
  deal,
  stages,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}: {
  deal: Deal | null;
  stages: Array<{ id: string; name: string; color: string; order: number }>;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (deal: Deal) => void;
  onDelete?: (deal: Deal) => void;
}) {
  const [activeTab, setActiveTab] = useState<"info" | "tasks" | "history">("info");

  if (!isOpen || !deal) return null;

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("ru-RU").format(amount);
  };

  // Calculate stage progress
  const currentStageIndex = stages.findIndex(s => s.id === deal.stageId);
  const progressPercent = stages.length > 0 ? ((currentStageIndex + 1) / stages.length) * 100 : 0;

  // Mock data
  const mockAssignee = deal.assignee || { name: "Иван Менеджеров" };
  const mockPhone = "+7 (999) 123-45-67";
  const mockEmail = "client@company.ru";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 z-[60]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 sm:inset-auto sm:right-0 sm:top-0 sm:bottom-0 w-full sm:max-w-xl md:max-w-2xl glass-card z-[70] overflow-hidden flex flex-col sm:border-l border-white/10">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold text-white mb-2">{deal.title}</h2>
              <div className="flex items-center gap-3">
                <span
                  className="px-3 py-1 rounded-lg text-sm font-medium"
                  style={{
                    backgroundColor: `${deal.stage.color}20`,
                    color: deal.stage.color,
                  }}
                >
                  {deal.stage.name}
                </span>
                {deal.company && (
                  <span className="text-gray-400 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4" />
                    {deal.company.name}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-xl"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          {/* Stage progress bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
              <span>Прогресс воронки</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${progressPercent}%`,
                  backgroundColor: deal.stage.color,
                }}
              />
            </div>
            <div className="flex justify-between mt-2">
              {stages.map((s: any, i: number) => (
                <div
                  key={s.id}
                  className={cn(
                    "w-3 h-3 rounded-full border-2 border-white/10 shadow-sm",
                    i <= currentStageIndex ? "" : "opacity-30"
                  )}
                  style={{ backgroundColor: s.color }}
                  title={s.name}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Amount highlight */}
        <div className="px-6 py-4 bg-gradient-to-r from-violet-500/10 to-purple-500/10 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Сумма сделки</p>
              <p className="text-4xl font-bold text-white">
                {formatAmount(deal.amount)}
                <span className="text-xl text-gray-500 ml-2">₽</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onEdit?.(deal)}
                className="p-3 glass-card rounded-xl hover:bg-white/5"
                title="Редактировать"
              >
                <Edit className="w-5 h-5 text-gray-400" />
              </button>
              <button
                onClick={() => onDelete?.(deal)}
                className="p-3 glass-card rounded-xl hover:bg-red-500/10"
                title="Удалить"
              >
                <Trash2 className="w-5 h-5 text-gray-400 hover:text-red-500" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-green-500 text-white font-medium hover:bg-green-600">
              <Phone className="w-5 h-5" />
              Позвонить
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-500 text-white font-medium hover:bg-violet-600">
              <CheckSquare className="w-5 h-5" />
              Добавить задачу
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-purple-500 text-white font-medium hover:bg-purple-600">
              <Mail className="w-5 h-5" />
              Написать
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 border-b border-white/10">
          <div className="flex gap-1">
            {[
              { id: "info", label: "Информация" },
              { id: "tasks", label: "Задачи" },
              { id: "history", label: "История" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "px-4 py-3 text-sm font-medium border-b-2",
                  activeTab === tab.id
                    ? "border-violet-500 text-violet-400"
                    : "border-transparent text-gray-400 hover:text-gray-300"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "info" && (
            <div className="space-y-6">
              {/* Contact section */}
              <div className="glass-card rounded-2xl p-5">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-gray-500" />
                  Контакт
                </h3>
                <div className="space-y-3">
                  {deal.contact && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Имя</span>
                      <span className="font-medium text-white">
                        {deal.contact.firstName} {deal.contact.lastName}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Телефон</span>
                    <a href={`tel:${mockPhone}`} className="font-medium text-violet-400 hover:underline">
                      {mockPhone}
                    </a>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Email</span>
                    <a href={`mailto:${mockEmail}`} className="font-medium text-violet-400 hover:underline">
                      {mockEmail}
                    </a>
                  </div>
                </div>
              </div>

              {/* Deal info section */}
              <div className="glass-card rounded-2xl p-5">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-gray-500" />
                  Сделка
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Ответственный</span>
                    <div className="flex items-center gap-2">
                      <ManagerAvatar name={mockAssignee.name} size="sm" />
                      <span className="font-medium text-white">{mockAssignee.name}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Создана</span>
                    <span className="font-medium text-white">
                      {new Date(deal.createdAt).toLocaleDateString("ru-RU", {
                        day: "numeric",
                        month: "long",
                        year: "numeric"
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Обновлена</span>
                    <span className="font-medium text-white">
                      {new Date(deal.updatedAt).toLocaleDateString("ru-RU", {
                        day: "numeric",
                        month: "long",
                        year: "numeric"
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Company section */}
              {deal.company && (
                <div className="glass-card rounded-2xl p-5">
                  <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-gray-500" />
                    Компания
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Название</span>
                    <span className="font-medium text-white">{deal.company.name}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "tasks" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-red-500/10 rounded-2xl border border-red-500/20">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-white">Отправить КП</p>
                  <p className="text-sm text-red-500">Просрочено: вчера</p>
                </div>
                <button className="p-2 hover:bg-red-500/20 rounded-xl">
                  <CheckSquare className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="flex items-center gap-3 p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-white">Позвонить клиенту</p>
                  <p className="text-sm text-amber-500">Сегодня, 15:00</p>
                </div>
                <button className="p-2 hover:bg-amber-500/20 rounded-xl">
                  <CheckSquare className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="flex items-center gap-3 p-4 bg-green-500/10 rounded-2xl border border-green-500/20">
                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <CheckSquare className="w-5 h-5 text-green-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-white line-through opacity-60">Первичный контакт</p>
                  <p className="text-sm text-green-500">Выполнено 2 дня назад</p>
                </div>
              </div>

              <button className="w-full py-3 border-2 border-dashed border-white/10 rounded-2xl text-gray-400 hover:border-violet-500/30 hover:text-violet-400 flex items-center justify-center gap-2">
                <Plus className="w-5 h-5" />
                Добавить задачу
              </button>
            </div>
          )}

          {activeTab === "history" && (
            <div className="space-y-4">
              {[
                { action: "Сделка перемещена в этап", detail: deal.stage.name, time: "Сегодня, 14:30", color: "violet" },
                { action: "Добавлен комментарий", detail: "Клиент заинтересован", time: "Вчера, 16:45", color: "gray" },
                { action: "Звонок клиенту", detail: "Длительность: 5 мин", time: "Вчера, 10:15", color: "green" },
                { action: "Сделка создана", detail: "", time: new Date(deal.createdAt).toLocaleDateString("ru-RU"), color: "purple" },
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className={cn(
                    "w-3 h-3 rounded-full mt-1.5 shrink-0",
                    item.color === "violet" ? "bg-violet-500" :
                    item.color === "green" ? "bg-green-500" :
                    item.color === "purple" ? "bg-purple-500" : "bg-gray-500"
                  )} />
                  <div className="flex-1 pb-4 border-b border-white/5 last:border-0">
                    <p className="font-medium text-white">{item.action}</p>
                    {item.detail && <p className="text-sm text-gray-400">{item.detail}</p>}
                    <p className="text-xs text-gray-500 mt-1">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function DealsPage() {
  // Use mock data directly for instant loading
  const [deals, setDeals] = useState<Deal[]>(mockDeals as Deal[]);
  const [pipelines] = useState(mockPipelines);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

  // Modal state
  const [isDealModalOpen, setIsDealModalOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [defaultStageId, setDefaultStageId] = useState<string | null>(null);

  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingDeal, setDeletingDeal] = useState<Deal | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const currentPipeline = pipelines[0];
  const stages = currentPipeline?.stages?.sort((a: any, b: any) => a.order - b.order) || [];

  // Memoized filtered deals
  const filteredDeals = useMemo(() => {
    return deals.filter(deal => {
      if (selectedStage && deal.stageId !== selectedStage) return false;
      if (searchQuery && !deal.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;

      // Quick filters - mock implementation
      if (quickFilter === "hot") {
        return Math.random() > 0.5;
      }
      if (quickFilter === "overdue") {
        return Math.random() > 0.7;
      }
      if (quickFilter === "no-tasks") {
        return Math.random() > 0.6;
      }

      return true;
    });
  }, [deals, selectedStage, searchQuery, quickFilter]);

  const getDealsForStage = (stageId: string) => {
    return filteredDeals.filter(deal => deal.stageId === stageId);
  };

  const formatAmount = (amount: number) => {
    if (amount >= 1000000) return (amount / 1000000).toFixed(1) + " млн";
    if (amount >= 1000) return (amount / 1000).toFixed(0) + " тыс";
    return new Intl.NumberFormat("ru-RU").format(amount);
  };

  const totalAmount = deals.reduce((sum, deal) => sum + deal.amount, 0);
  const avgDealSize = deals.length > 0 ? totalAmount / deals.length : 0;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
  };

  const handleQuickAction = (action: string, deal: Deal) => {
    console.log(`Quick action: ${action}`, deal);
    // TODO: Implement quick actions
  };

  // Modal handlers
  const handleOpenCreateModal = (stageId?: string) => {
    setEditingDeal(null);
    setDefaultStageId(stageId || stages[0]?.id || null);
    setIsDealModalOpen(true);
  };

  const handleOpenEditModal = (deal: Deal) => {
    setEditingDeal(deal);
    setDefaultStageId(deal.stageId);
    setIsDealModalOpen(true);
    setSelectedDeal(null);
  };

  const handleCloseModal = () => {
    setIsDealModalOpen(false);
    setEditingDeal(null);
    setDefaultStageId(null);
  };

  const handleSaveDeal = async (dealData: any) => {
    try {
      if (editingDeal?.id) {
        // Update existing deal
        setDeals(
          deals.map(d =>
            d.id === editingDeal.id ? {
              ...d,
              ...dealData,
              stage: stages.find((s: any) => s.id === dealData.stageId) || d.stage,
            } : d
          )
        );
      } else {
        // Create new deal
        const stageId = dealData.stageId || defaultStageId || stages[0]?.id;
        const stage = stages.find((s: any) => s.id === stageId);
        const newDeal: Deal = {
          ...dealData,
          id: `deal-${Date.now()}`,
          stageId,
          stage: stage || { id: stageId, name: "Новый", color: "#3B82F6" },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setDeals([newDeal, ...deals]);
      }
      handleCloseModal();
    } catch (error) {
      console.error("Failed to save deal:", error);
    }
  };

  const handleAddDeal = (stageId: string) => {
    handleOpenCreateModal(stageId);
  };

  // Delete handlers
  const handleOpenDeleteDialog = (deal: Deal) => {
    setDeletingDeal(deal);
    setIsDeleteDialogOpen(true);
    setSelectedDeal(null);
  };

  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setDeletingDeal(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingDeal) return;

    setIsDeleting(true);
    try {
      setDeals(deals.filter(d => d.id !== deletingDeal.id));
      handleCloseDeleteDialog();
    } catch (error) {
      console.error("Failed to delete deal:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-full">
      <div className="max-w-[1800px] mx-auto p-4 md:p-6 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[28px] md:text-[34px] font-bold text-white tracking-tight">
              Сделки
            </h1>
            <p className="text-gray-400 mt-1">Управление воронкой продаж</p>
          </div>
          <button
            onClick={() => handleOpenCreateModal()}
            className="flex items-center gap-2 px-5 py-3 bg-violet-500 text-white rounded-2xl font-medium hover:bg-violet-600 shadow-lg shadow-violet-500/25"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Новая сделка</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-violet-500/20 flex items-center justify-center">
                <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-violet-400" />
              </div>
              <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-white">{deals.length}</p>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">Всего сделок</p>
          </div>

          <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-green-500/20 flex items-center justify-center">
                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
              </div>
              <span className="text-xs text-gray-500 font-medium">RUB</span>
            </div>
            <p className="text-xl sm:text-3xl font-bold text-white">{formatAmount(totalAmount)}</p>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">Общая сумма</p>
          </div>

          <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-purple-500/20 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
              </div>
            </div>
            <p className="text-xl sm:text-3xl font-bold text-white">{formatAmount(avgDealSize)}</p>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">Средний чек</p>
          </div>

          <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-orange-500/20 flex items-center justify-center">
                <Target className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" />
              </div>
              <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-green-500/20 text-green-400 text-[10px] sm:text-xs font-medium rounded-full">
                +12%
              </span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-white">{stages.length}</p>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">Этапов воронки</p>
          </div>
        </div>

        {/* Quick Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { id: "all" as QuickFilter, label: "Все сделки", icon: Briefcase },
            { id: "my" as QuickFilter, label: "Мои сделки", icon: User },
            { id: "hot" as QuickFilter, label: "Горячие", icon: Flame },
            { id: "overdue" as QuickFilter, label: "Просроченные", icon: AlertCircle },
            { id: "no-tasks" as QuickFilter, label: "Без задач", icon: CheckSquare },
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setQuickFilter(filter.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-2xl whitespace-nowrap font-medium",
                quickFilter === filter.id
                  ? "bg-violet-500 text-white shadow-lg shadow-violet-500/25"
                  : "glass-card text-gray-300 hover:bg-white/5"
              )}
            >
              <filter.icon className="w-4 h-4" />
              {filter.label}
            </button>
          ))}
        </div>

        {/* Search & View Toggle */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="search"
              placeholder="Поиск сделок..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 glass-card rounded-2xl border-0 text-white placeholder-gray-500 focus:ring-2 focus:ring-violet-500/50"
            />
          </div>

          <button className="flex items-center gap-2 px-4 py-3 glass-card rounded-2xl hover:bg-white/5">
            <SlidersHorizontal className="w-5 h-5 text-gray-400" />
            <span className="hidden sm:inline text-gray-300 font-medium">Фильтры</span>
          </button>

          {/* View Mode Toggle */}
          <div className="flex glass-card rounded-2xl p-1">
            <button
              onClick={() => setViewMode("kanban")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl font-medium",
                viewMode === "kanban"
                  ? "bg-violet-500 text-white shadow-sm"
                  : "text-gray-400 hover:text-gray-300"
              )}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Канбан</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl font-medium",
                viewMode === "list"
                  ? "bg-violet-500 text-white shadow-sm"
                  : "text-gray-400 hover:text-gray-300"
              )}
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Список</span>
            </button>
          </div>
        </div>

        {/* Kanban View */}
        {viewMode === "kanban" ? (
          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 scrollbar-minimal snap-x snap-mandatory">
            {stages.map((stage: { id: string; name: string; color: string; order: number }) => (
              <KanbanColumn
                key={stage.id}
                stage={stage}
                deals={getDealsForStage(stage.id)}
                onDealClick={(deal) => setSelectedDeal(deal)}
                onQuickAction={handleQuickAction}
                onAddDeal={handleAddDeal}
              />
            ))}
          </div>
        ) : (
          /* List View */
          <div className="glass-card rounded-2xl sm:rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Сделка
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Сумма
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Этап
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Компания
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Ответственный
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Дата
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredDeals.map((deal) => (
                    <tr
                      key={deal.id}
                      onClick={() => setSelectedDeal(deal)}
                      className="hover:bg-white/5 cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <TemperatureIndicator temperature={["hot", "warm", "cold"][Math.floor(Math.random() * 3)] as any} />
                          <p className="font-semibold text-white">{deal.title}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-white">
                          {formatAmount(deal.amount)} ₽
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium"
                          style={{
                            backgroundColor: `${deal.stage.color}15`,
                            color: deal.stage.color,
                          }}
                        >
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: deal.stage.color }}
                          />
                          {deal.stage.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        {deal.company?.name || "—"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <ManagerAvatar name="Иван М." size="sm" />
                          <span className="text-gray-300">Иван М.</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-sm">
                        {formatDate(deal.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredDeals.length === 0 && (
                <div className="text-center py-12">
                  <Briefcase className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-400">Сделки не найдены</p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Deal Detail Modal */}
      <DealDetailModal
        deal={selectedDeal}
        stages={stages}
        isOpen={!!selectedDeal}
        onClose={() => setSelectedDeal(null)}
        onEdit={handleOpenEditModal}
        onDelete={handleOpenDeleteDialog}
      />

      {/* Deal Create/Edit Modal */}
      <DealModal
        isOpen={isDealModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveDeal}
        deal={editingDeal ? {
          ...editingDeal,
          company: editingDeal.company?.name || "",
          contact: editingDeal.contact ? `${editingDeal.contact.firstName} ${editingDeal.contact.lastName}` : "",
        } : undefined}
        stages={stages.map((s: any) => ({ id: s.id, title: s.name }))}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleConfirmDelete}
        title="Удалить сделку?"
        description={`Вы уверены, что хотите удалить сделку "${deletingDeal?.title}"? Это действие нельзя отменить.`}
        confirmText="Удалить"
        cancelText="Отмена"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
