"use client";

import { useState, useEffect } from "react";
import {
  X,
  User,
  Mail,
  Phone,
  Globe,
  MessageSquare,
  Instagram,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Lead {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  source: string;
  status: string;
  description?: string;
  company?: string;
}

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (lead: Lead) => void;
  lead?: Lead | null;
  isLoading?: boolean;
}

const sources = [
  { id: "website", label: "Сайт", icon: Globe, color: "text-blue-400", bg: "bg-blue-500/20" },
  { id: "call", label: "Звонок", icon: Phone, color: "text-green-400", bg: "bg-green-500/20" },
  { id: "email", label: "Email", icon: Mail, color: "text-purple-400", bg: "bg-purple-500/20" },
  { id: "social", label: "Соцсети", icon: Instagram, color: "text-pink-400", bg: "bg-pink-500/20" },
  { id: "telegram", label: "Telegram", icon: MessageSquare, color: "text-sky-400", bg: "bg-sky-500/20" },
];

const statuses = [
  { id: "NEW", label: "Новый", color: "#3B82F6" },
  { id: "IN_PROGRESS", label: "В работе", color: "#8B5CF6" },
  { id: "QUALIFIED", label: "Квалифицирован", color: "#F59E0B" },
  { id: "CONVERTED", label: "Конвертирован", color: "#10B981" },
];

export function LeadModal({ isOpen, onClose, onSave, lead, isLoading }: LeadModalProps) {
  const [formData, setFormData] = useState<Lead>({
    name: "",
    email: "",
    phone: "",
    source: "website",
    status: "NEW",
    description: "",
    company: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (lead) {
      setFormData({
        name: lead.name || "",
        email: lead.email || "",
        phone: lead.phone || "",
        source: lead.source || "website",
        status: lead.status || "NEW",
        description: lead.description || "",
        company: lead.company || "",
      });
    } else {
      setFormData({
        name: "",
        email: "",
        phone: "",
        source: "website",
        status: "NEW",
        description: "",
        company: "",
      });
    }
    setErrors({});
  }, [lead, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Имя обязательно";
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Неверный формат email";
    }

    if (formData.phone && !/^[\d\s\+\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = "Неверный формат телефона";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    onSave({
      ...formData,
      id: lead?.id,
    });
  };

  if (!isOpen) return null;

  const isEdit = !!lead?.id;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 z-[60]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div className="bg-[#0d0d14] rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-[95vw] sm:max-w-xl max-h-[90vh] overflow-hidden border border-white/10">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <h2 className="text-xl font-bold text-white">
              {isEdit ? "Редактировать лид" : "Новый лид"}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-xl "
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-140px)]">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Имя лида <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Введите имя"
                  className={cn(
                    "w-full pl-12 pr-4 py-3 bg-white/5 rounded-xl text-sm text-white border-2  placeholder:text-gray-500",
                    errors.name ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-violet-500 focus:bg-white/10"
                  )}
                />
              </div>
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            {/* Company */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Компания
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="Название компании"
                className="w-full px-4 py-3 bg-white/5 rounded-xl text-sm text-white border-2 border-white/10 focus:border-violet-500 focus:bg-white/10  placeholder:text-gray-500"
              />
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@example.com"
                    className={cn(
                      "w-full pl-12 pr-4 py-3 bg-white/5 rounded-xl text-sm text-white border-2  placeholder:text-gray-500",
                      errors.email ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-violet-500 focus:bg-white/10"
                    )}
                  />
                </div>
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Телефон
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+7 (999) 123-45-67"
                    className={cn(
                      "w-full pl-12 pr-4 py-3 bg-white/5 rounded-xl text-sm text-white border-2  placeholder:text-gray-500",
                      errors.phone ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-violet-500 focus:bg-white/10"
                    )}
                  />
                </div>
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>
            </div>

            {/* Source */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Источник
              </label>
              <div className="flex flex-wrap gap-2">
                {sources.map((source) => {
                  const Icon = source.icon;
                  const isSelected = formData.source === source.id;

                  return (
                    <button
                      key={source.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, source: source.id })}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium",
                        isSelected
                          ? `${source.bg} ${source.color} ring-2 ring-offset-1 ring-offset-[#0d0d14]`
                          : "bg-white/5 text-gray-400 hover:bg-white/10"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {source.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Статус
              </label>
              <div className="flex flex-wrap gap-2">
                {statuses.map((status) => {
                  const isSelected = formData.status === status.id;

                  return (
                    <button
                      key={status.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, status: status.id })}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium",
                        isSelected ? "ring-2 ring-offset-1 ring-offset-[#0d0d14]" : "bg-white/5 text-gray-400 hover:bg-white/10"
                      )}
                      style={isSelected ? {
                        backgroundColor: `${status.color}20`,
                        color: status.color,
                      } : {}}
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: status.color }}
                      />
                      {status.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Описание
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Дополнительная информация о лиде..."
                rows={3}
                className="w-full px-4 py-3 bg-white/5 rounded-xl text-sm text-white border-2 border-white/10 focus:border-violet-500 focus:bg-white/10  resize-none placeholder:text-gray-500"
              />
            </div>
          </form>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10 bg-white/5">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-gray-400 font-medium rounded-xl hover:bg-white/5 "
            >
              Отмена
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-2.5 bg-violet-500 text-white font-medium rounded-xl hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed "
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEdit ? "Сохранить" : "Создать"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
