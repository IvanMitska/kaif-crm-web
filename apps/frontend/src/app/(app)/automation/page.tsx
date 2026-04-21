"use client";

import { useEffect, useState } from "react";
import {
  Zap,
  Plus,
  Play,
  Pencil,
  Trash2,
  Loader2,
  Power,
  Clock,
  Workflow,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { automationApi } from "@/lib/api";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";

interface AutomationTrigger {
  type: string;
  config?: Record<string, any>;
}

interface AutomationAction {
  type: string;
  config: Record<string, any>;
}

interface Automation {
  id: string;
  name: string;
  description?: string | null;
  trigger: AutomationTrigger;
  conditions?: any[] | null;
  actions: AutomationAction[];
  isActive: boolean;
  lastRunAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

const TRIGGER_LABELS: Record<string, string> = {
  deal_stage_changed: "Смена этапа сделки",
  deal_created: "Создана сделка",
  deal_won: "Сделка выиграна",
  deal_lost: "Сделка проиграна",
  contact_created: "Создан контакт",
  task_created: "Создана задача",
  task_overdue: "Задача просрочена",
  lead_created: "Создан лид",
  lead_status_changed: "Смена статуса лида",
  lead_converted: "Лид конвертирован",
};

const ACTION_LABELS: Record<string, string> = {
  create_task: "Создать задачу",
  send_notification: "Отправить уведомление",
  update_field: "Обновить поле",
  assign_owner: "Назначить ответственного",
  add_tag: "Добавить тег",
};

const TRIGGER_OPTIONS = Object.entries(TRIGGER_LABELS).map(([value, label]) => ({ value, label }));
const ACTION_OPTIONS = Object.entries(ACTION_LABELS).map(([value, label]) => ({ value, label }));

function formatRelativeTime(dateString?: string | null) {
  if (!dateString) return "никогда";
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "только что";
  if (mins < 60) return `${mins} мин назад`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ч назад`;
  const days = Math.floor(hrs / 24);
  return `${days} д назад`;
}

export default function AutomationPage() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Automation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Automation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [runningId, setRunningId] = useState<string | null>(null);

  useEffect(() => {
    fetchAutomations();
  }, []);

  const fetchAutomations = async () => {
    try {
      setLoading(true);
      const res = await automationApi.getAll();
      const list = Array.isArray(res.data) ? res.data : res.data?.items || [];
      setAutomations(list);
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Не удалось загрузить автоматизации");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (a: Automation) => {
    try {
      await automationApi.update(a.id, { isActive: !a.isActive });
      setAutomations((prev) => prev.map((x) => (x.id === a.id ? { ...x, isActive: !a.isActive } : x)));
      toast.success(!a.isActive ? "Автоматизация включена" : "Автоматизация выключена");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Не удалось обновить");
    }
  };

  const handleExecute = async (a: Automation) => {
    setRunningId(a.id);
    try {
      await automationApi.execute(a.id);
      toast.success("Автоматизация запущена");
      await fetchAutomations();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Не удалось выполнить");
    } finally {
      setRunningId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await automationApi.delete(deleteTarget.id);
      setAutomations((prev) => prev.filter((x) => x.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success("Автоматизация удалена");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Не удалось удалить");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaved = (saved: Automation) => {
    setAutomations((prev) => {
      const exists = prev.find((x) => x.id === saved.id);
      return exists ? prev.map((x) => (x.id === saved.id ? saved : x)) : [saved, ...prev];
    });
    setIsModalOpen(false);
    setEditing(null);
  };

  const active = automations.filter((a) => a.isActive).length;
  const inactive = automations.length - active;

  return (
    <div className="min-h-full">
      <div className="max-w-[1400px] mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[28px] md:text-[34px] font-bold text-white tracking-tight">
              Автоматизации
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Триггеры и действия, которые работают за вас
            </p>
          </div>
          <button
            onClick={() => {
              setEditing(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-violet-500 text-white rounded-xl text-sm font-semibold hover:bg-purple-500 shadow-sm"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Новая автоматизация</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <div className="glass-card rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                <Workflow className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{automations.length}</p>
                <p className="text-xs text-gray-500">Всего</p>
              </div>
            </div>
          </div>
          <div className="glass-card rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Power className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{active}</p>
                <p className="text-xs text-gray-500">Активных</p>
              </div>
            </div>
          </div>
          <div className="glass-card rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-500/20 flex items-center justify-center">
                <Power className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{inactive}</p>
                <p className="text-xs text-gray-500">Выключенных</p>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
          </div>
        ) : automations.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-violet-500/10 flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-violet-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">Нет автоматизаций</h3>
            <p className="text-gray-500 text-sm mb-6">
              Создайте первую автоматизацию, чтобы сэкономить время на рутине
            </p>
            <button
              onClick={() => {
                setEditing(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-500 text-white rounded-xl text-sm font-semibold hover:bg-purple-500"
            >
              <Plus className="w-5 h-5" />
              Новая автоматизация
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {automations.map((a) => (
              <div
                key={a.id}
                className={cn(
                  "glass-card rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4",
                  !a.isActive && "opacity-70"
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-white truncate">{a.name}</h3>
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[11px] font-medium",
                        a.isActive
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-gray-500/20 text-gray-400"
                      )}
                    >
                      {a.isActive ? "Активна" : "Выключена"}
                    </span>
                  </div>
                  {a.description && (
                    <p className="text-sm text-gray-400 mt-1 line-clamp-2">{a.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5" />
                      Триггер: {TRIGGER_LABELS[a.trigger?.type] || a.trigger?.type || "—"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Workflow className="w-3.5 h-3.5" />
                      Действий: {Array.isArray(a.actions) ? a.actions.length : 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Последний запуск: {formatRelativeTime(a.lastRunAt)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggle(a)}
                    title={a.isActive ? "Выключить" : "Включить"}
                    className={cn(
                      "p-2.5 rounded-xl",
                      a.isActive
                        ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                        : "bg-white/5 text-gray-400 hover:bg-white/10"
                    )}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleExecute(a)}
                    disabled={runningId === a.id || !a.isActive}
                    title="Запустить сейчас"
                    className="p-2.5 rounded-xl bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 disabled:opacity-40"
                  >
                    {runningId === a.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setEditing(a);
                      setIsModalOpen(true);
                    }}
                    title="Редактировать"
                    className="p-2.5 rounded-xl bg-white/5 text-gray-400 hover:bg-white/10"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(a)}
                    title="Удалить"
                    className="p-2.5 rounded-xl bg-white/5 text-gray-400 hover:bg-red-500/20 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <AutomationModal
          automation={editing}
          onClose={() => {
            setIsModalOpen(false);
            setEditing(null);
          }}
          onSaved={handleSaved}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Удалить автоматизацию?"
        description={`Вы уверены, что хотите удалить "${deleteTarget?.name}"? Это действие нельзя отменить.`}
        confirmText="Удалить"
        cancelText="Отмена"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}

function AutomationModal({
  automation,
  onClose,
  onSaved,
}: {
  automation: Automation | null;
  onClose: () => void;
  onSaved: (a: Automation) => void;
}) {
  const [name, setName] = useState(automation?.name || "");
  const [description, setDescription] = useState(automation?.description || "");
  const [triggerType, setTriggerType] = useState(automation?.trigger?.type || "deal_created");
  const [isActive, setIsActive] = useState(automation?.isActive ?? true);
  const [actions, setActions] = useState<AutomationAction[]>(
    automation?.actions?.length ? automation.actions : [{ type: "create_task", config: {} }]
  );
  const [saving, setSaving] = useState(false);

  const addAction = () => setActions((a) => [...a, { type: "create_task", config: {} }]);
  const removeAction = (i: number) => setActions((a) => a.filter((_, idx) => idx !== i));
  const updateAction = (i: number, patch: Partial<AutomationAction>) =>
    setActions((a) => a.map((x, idx) => (idx === i ? { ...x, ...patch, config: { ...x.config, ...(patch.config || {}) } } : x)));

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Укажите название");
      return;
    }
    if (actions.length === 0) {
      toast.error("Добавьте хотя бы одно действие");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        trigger: { type: triggerType },
        actions,
        isActive,
      };
      const res = automation
        ? await automationApi.update(automation.id, payload)
        : await automationApi.create(payload);
      onSaved(res.data);
      toast.success(automation ? "Сохранено" : "Автоматизация создана");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/70 z-[60]" onClick={onClose} />
      <div className="fixed inset-0 sm:inset-auto sm:right-0 sm:top-0 sm:bottom-0 w-full sm:max-w-xl glass-card z-[70] overflow-hidden flex flex-col sm:border-l border-white/10">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">
              {automation ? "Редактировать автоматизацию" : "Новая автоматизация"}
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Выберите триггер и настройте действия
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Название</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Создать задачу при новой сделке"
              className="w-full px-4 py-2.5 bg-white/5 rounded-xl text-sm text-white placeholder-gray-500 border border-white/10 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Описание</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Коротко — что делает эта автоматизация"
              className="w-full px-4 py-2.5 bg-white/5 rounded-xl text-sm text-white placeholder-gray-500 border border-white/10 focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Триггер</label>
            <select
              value={triggerType}
              onChange={(e) => setTriggerType(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/5 rounded-xl text-sm text-white border border-white/10 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            >
              {TRIGGER_OPTIONS.map((t) => (
                <option key={t.value} value={t.value} className="bg-[#0a0a0f]">
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-300">Действия</label>
              <button
                onClick={addAction}
                className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Добавить
              </button>
            </div>
            <div className="space-y-3">
              {actions.map((act, i) => (
                <div key={i} className="glass-card rounded-xl p-3 border border-white/5">
                  <div className="flex items-center gap-2 mb-3">
                    <select
                      value={act.type}
                      onChange={(e) => updateAction(i, { type: e.target.value, config: {} })}
                      className="flex-1 px-3 py-2 bg-white/5 rounded-lg text-sm text-white border border-white/10"
                    >
                      {ACTION_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value} className="bg-[#0a0a0f]">
                          {o.label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => removeAction(i)}
                      disabled={actions.length === 1}
                      className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded-lg text-gray-400 disabled:opacity-40"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <ActionConfig
                    action={act}
                    onChange={(cfg) => updateAction(i, { config: cfg })}
                  />
                </div>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded border-white/20 bg-white/5 text-violet-500 focus:ring-violet-500"
            />
            <span className="text-sm text-gray-300">Активна сразу после сохранения</span>
          </label>
        </div>

        <div className="p-6 border-t border-white/10 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-300 hover:bg-white/5"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-violet-500 text-white hover:bg-purple-500 disabled:opacity-50 flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {automation ? "Сохранить" : "Создать"}
          </button>
        </div>
      </div>
    </>
  );
}

function ActionConfig({
  action,
  onChange,
}: {
  action: AutomationAction;
  onChange: (cfg: Record<string, any>) => void;
}) {
  const cfg = action.config || {};
  const set = (k: string, v: any) => onChange({ ...cfg, [k]: v });

  if (action.type === "create_task") {
    return (
      <div className="space-y-2">
        <input
          value={cfg.taskTitle || ""}
          onChange={(e) => set("taskTitle", e.target.value)}
          placeholder="Название задачи (можно использовать {{dealTitle}})"
          className="w-full px-3 py-2 bg-white/5 rounded-lg text-sm text-white placeholder-gray-500 border border-white/10"
        />
        <input
          value={cfg.taskDescription || ""}
          onChange={(e) => set("taskDescription", e.target.value)}
          placeholder="Описание"
          className="w-full px-3 py-2 bg-white/5 rounded-lg text-sm text-white placeholder-gray-500 border border-white/10"
        />
        <div className="flex gap-2">
          <input
            type="number"
            value={cfg.taskDueDays || ""}
            onChange={(e) => set("taskDueDays", Number(e.target.value) || undefined)}
            placeholder="Через N дней"
            className="flex-1 px-3 py-2 bg-white/5 rounded-lg text-sm text-white placeholder-gray-500 border border-white/10"
          />
          <select
            value={cfg.taskPriority || "MEDIUM"}
            onChange={(e) => set("taskPriority", e.target.value)}
            className="flex-1 px-3 py-2 bg-white/5 rounded-lg text-sm text-white border border-white/10"
          >
            <option value="LOW" className="bg-[#0a0a0f]">Низкий</option>
            <option value="MEDIUM" className="bg-[#0a0a0f]">Средний</option>
            <option value="HIGH" className="bg-[#0a0a0f]">Высокий</option>
            <option value="URGENT" className="bg-[#0a0a0f]">Срочный</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            checked={!!cfg.assignToOwner}
            onChange={(e) => set("assignToOwner", e.target.checked)}
            className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 text-violet-500"
          />
          Назначить на владельца сущности
        </label>
      </div>
    );
  }

  if (action.type === "send_notification") {
    return (
      <div className="space-y-2">
        <input
          value={cfg.notificationTitle || ""}
          onChange={(e) => set("notificationTitle", e.target.value)}
          placeholder="Заголовок уведомления"
          className="w-full px-3 py-2 bg-white/5 rounded-lg text-sm text-white placeholder-gray-500 border border-white/10"
        />
        <input
          value={cfg.notificationContent || ""}
          onChange={(e) => set("notificationContent", e.target.value)}
          placeholder="Текст (поддерживает {{поле}})"
          className="w-full px-3 py-2 bg-white/5 rounded-lg text-sm text-white placeholder-gray-500 border border-white/10"
        />
        <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            checked={!!cfg.notifyOwner}
            onChange={(e) => set("notifyOwner", e.target.checked)}
            className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 text-violet-500"
          />
          Уведомить владельца сущности
        </label>
      </div>
    );
  }

  if (action.type === "update_field") {
    return (
      <div className="flex gap-2">
        <input
          value={cfg.fieldName || ""}
          onChange={(e) => set("fieldName", e.target.value)}
          placeholder="Имя поля (напр. status)"
          className="flex-1 px-3 py-2 bg-white/5 rounded-lg text-sm text-white placeholder-gray-500 border border-white/10"
        />
        <input
          value={cfg.fieldValue ?? ""}
          onChange={(e) => set("fieldValue", e.target.value)}
          placeholder="Новое значение"
          className="flex-1 px-3 py-2 bg-white/5 rounded-lg text-sm text-white placeholder-gray-500 border border-white/10"
        />
      </div>
    );
  }

  if (action.type === "assign_owner") {
    return (
      <input
        value={cfg.newOwnerId || ""}
        onChange={(e) => set("newOwnerId", e.target.value)}
        placeholder="ID пользователя"
        className="w-full px-3 py-2 bg-white/5 rounded-lg text-sm text-white placeholder-gray-500 border border-white/10"
      />
    );
  }

  if (action.type === "add_tag") {
    return (
      <input
        value={cfg.tagId || ""}
        onChange={(e) => set("tagId", e.target.value)}
        placeholder="ID тега"
        className="w-full px-3 py-2 bg-white/5 rounded-lg text-sm text-white placeholder-gray-500 border border-white/10"
      />
    );
  }

  return null;
}
