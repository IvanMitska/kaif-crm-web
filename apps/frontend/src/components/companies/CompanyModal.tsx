"use client";

import { useState, useEffect } from "react";
import {
  X,
  Building2,
  Phone,
  Mail,
  Globe,
  MapPin,
  Users,
  Loader2,
  Hash,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Company {
  id?: string;
  name: string;
  inn: string;
  revenue: number;
  employees: number;
  phone: string;
  email: string;
  website: string;
  address: string;
  status: "active" | "inactive";
  industry?: string;
}

interface CompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (company: Company) => void;
  company?: Company | null;
  isLoading?: boolean;
}

const industries = [
  { id: "IT", label: "IT", bg: "bg-blue-500/20", text: "text-blue-400" },
  { id: "Финансы", label: "Финансы", bg: "bg-green-500/20", text: "text-green-400" },
  { id: "Торговля", label: "Торговля", bg: "bg-orange-500/20", text: "text-orange-400" },
  { id: "Строительство", label: "Строительство", bg: "bg-amber-500/20", text: "text-amber-400" },
  { id: "Медиа", label: "Медиа", bg: "bg-purple-500/20", text: "text-purple-400" },
  { id: "Консалтинг", label: "Консалтинг", bg: "bg-indigo-500/20", text: "text-indigo-400" },
  { id: "Производство", label: "Производство", bg: "bg-rose-500/20", text: "text-rose-400" },
  { id: "Логистика", label: "Логистика", bg: "bg-cyan-500/20", text: "text-cyan-400" },
];

export function CompanyModal({ isOpen, onClose, onSave, company, isLoading }: CompanyModalProps) {
  const [formData, setFormData] = useState<Company>({
    name: "",
    inn: "",
    revenue: 0,
    employees: 0,
    phone: "",
    email: "",
    website: "",
    address: "",
    status: "active",
    industry: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || "",
        inn: company.inn || "",
        revenue: company.revenue || 0,
        employees: company.employees || 0,
        phone: company.phone || "",
        email: company.email || "",
        website: company.website || "",
        address: company.address || "",
        status: company.status || "active",
        industry: company.industry || "",
      });
    } else {
      setFormData({
        name: "",
        inn: "",
        revenue: 0,
        employees: 0,
        phone: "",
        email: "",
        website: "",
        address: "",
        status: "active",
        industry: "",
      });
    }
    setErrors({});
  }, [company, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Название компании обязательно";
    }

    if (!formData.inn.trim()) {
      newErrors.inn = "ИНН обязателен";
    } else if (!/^\d{10,12}$/.test(formData.inn)) {
      newErrors.inn = "ИНН должен содержать 10-12 цифр";
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
      id: company?.id,
    });
  };

  const formatRevenueInput = (value: string): number => {
    const num = parseInt(value.replace(/\D/g, ""), 10);
    return isNaN(num) ? 0 : num;
  };

  if (!isOpen) return null;

  const isEdit = !!company?.id;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 z-[60]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div className="bg-[#0d0d14] rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-white/10">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <h2 className="text-xl font-bold text-white">
              {isEdit ? "Редактировать компанию" : "Новая компания"}
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
            {/* Name & INN */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Название компании <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="ООО Компания"
                    className={cn(
                      "w-full pl-12 pr-4 py-3 bg-white/5 rounded-xl text-sm text-white border-2  placeholder:text-gray-500",
                      errors.name ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-violet-500 focus:bg-white/10"
                    )}
                  />
                </div>
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  ИНН <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.inn}
                    onChange={(e) => setFormData({ ...formData, inn: e.target.value.replace(/\D/g, "").slice(0, 12) })}
                    placeholder="1234567890"
                    className={cn(
                      "w-full pl-12 pr-4 py-3 bg-white/5 rounded-xl text-sm text-white border-2  placeholder:text-gray-500",
                      errors.inn ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-violet-500 focus:bg-white/10"
                    )}
                  />
                </div>
                {errors.inn && <p className="text-red-500 text-xs mt-1">{errors.inn}</p>}
              </div>
            </div>

            {/* Industry */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Отрасль
              </label>
              <div className="flex flex-wrap gap-2">
                {industries.map((industry) => {
                  const isSelected = formData.industry === industry.id;

                  return (
                    <button
                      key={industry.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, industry: isSelected ? "" : industry.id })}
                      className={cn(
                        "px-4 py-2 rounded-xl text-sm font-medium ",
                        isSelected
                          ? `${industry.bg} ${industry.text} ring-2 ring-offset-1 ring-offset-[#0d0d14]`
                          : "bg-white/5 text-gray-400 hover:bg-white/10"
                      )}
                    >
                      {industry.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Revenue & Employees */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Годовая выручка (RUB)
                </label>
                <div className="relative">
                  <TrendingUp className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.revenue > 0 ? formData.revenue.toLocaleString("ru-RU") : ""}
                    onChange={(e) => setFormData({ ...formData, revenue: formatRevenueInput(e.target.value) })}
                    placeholder="5 000 000"
                    className="w-full pl-12 pr-4 py-3 bg-white/5 rounded-xl text-sm text-white border-2 border-white/10 focus:border-violet-500 focus:bg-white/10  placeholder:text-gray-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Количество сотрудников
                </label>
                <div className="relative">
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    min="0"
                    value={formData.employees || ""}
                    onChange={(e) => setFormData({ ...formData, employees: parseInt(e.target.value) || 0 })}
                    placeholder="50"
                    className="w-full pl-12 pr-4 py-3 bg-white/5 rounded-xl text-sm text-white border-2 border-white/10 focus:border-violet-500 focus:bg-white/10  placeholder:text-gray-500"
                  />
                </div>
              </div>
            </div>

            {/* Phone & Email */}
            <div className="grid grid-cols-2 gap-4">
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
                    placeholder="+7 (495) 123-45-67"
                    className={cn(
                      "w-full pl-12 pr-4 py-3 bg-white/5 rounded-xl text-sm text-white border-2  placeholder:text-gray-500",
                      errors.phone ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-violet-500 focus:bg-white/10"
                    )}
                  />
                </div>
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>
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
                    placeholder="info@company.ru"
                    className={cn(
                      "w-full pl-12 pr-4 py-3 bg-white/5 rounded-xl text-sm text-white border-2  placeholder:text-gray-500",
                      errors.email ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-violet-500 focus:bg-white/10"
                    )}
                  />
                </div>
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
            </div>

            {/* Website */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Сайт
              </label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="company.ru"
                  className="w-full pl-12 pr-4 py-3 bg-white/5 rounded-xl text-sm text-white border-2 border-white/10 focus:border-violet-500 focus:bg-white/10  placeholder:text-gray-500"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Адрес
              </label>
              <div className="relative">
                <MapPin className="absolute left-4 top-3 w-5 h-5 text-gray-400" />
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Москва, ул. Примерная, 10"
                  rows={2}
                  className="w-full pl-12 pr-4 py-3 bg-white/5 rounded-xl text-sm text-white border-2 border-white/10 focus:border-violet-500 focus:bg-white/10  resize-none placeholder:text-gray-500"
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Статус
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, status: "active" })}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium ",
                    formData.status === "active"
                      ? "bg-green-500/20 text-green-400 ring-2 ring-green-500 ring-offset-1 ring-offset-[#0d0d14]"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  )}
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  Активная
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, status: "inactive" })}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium ",
                    formData.status === "inactive"
                      ? "bg-white/10 text-gray-300 ring-2 ring-gray-400 ring-offset-1 ring-offset-[#0d0d14]"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  )}
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                  Неактивная
                </button>
              </div>
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
