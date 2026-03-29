"use client";

import { useState, useEffect } from "react";
import {
  X,
  User,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Loader2,
  Tag,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Contact {
  id?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string | { id: string; name: string };
  position?: string;
  tags?: string[];
}

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (contact: Contact) => void;
  contact?: Contact | null;
  isLoading?: boolean;
}

const availableTags = [
  { id: "VIP", label: "VIP", bg: "bg-amber-500/20", text: "text-amber-400" },
  { id: "Партнер", label: "Партнер", bg: "bg-purple-500/20", text: "text-purple-400" },
  { id: "Клиент", label: "Клиент", bg: "bg-green-500/20", text: "text-green-400" },
  { id: "Лид", label: "Лид", bg: "bg-blue-500/20", text: "text-blue-400" },
  { id: "Поставщик", label: "Поставщик", bg: "bg-orange-500/20", text: "text-orange-400" },
];

export function ContactModal({ isOpen, onClose, onSave, contact, isLoading }: ContactModalProps) {
  const [formData, setFormData] = useState<Contact>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    position: "",
    tags: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newTag, setNewTag] = useState("");

  useEffect(() => {
    if (contact) {
      setFormData({
        firstName: contact.firstName || "",
        lastName: contact.lastName || "",
        email: contact.email || "",
        phone: contact.phone || "",
        company: typeof contact.company === "string" ? contact.company : (contact.company as any)?.name || "",
        position: contact.position || "",
        tags: contact.tags || [],
      });
    } else {
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        company: "",
        position: "",
        tags: [],
      });
    }
    setErrors({});
    setNewTag("");
  }, [contact, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "Имя обязательно";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Фамилия обязательна";
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
      id: contact?.id,
    });
  };

  const toggleTag = (tagId: string) => {
    const currentTags = formData.tags || [];
    if (currentTags.includes(tagId)) {
      setFormData({ ...formData, tags: currentTags.filter(t => t !== tagId) });
    } else {
      setFormData({ ...formData, tags: [...currentTags, tagId] });
    }
  };

  const addCustomTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData({ ...formData, tags: [...(formData.tags || []), newTag.trim()] });
      setNewTag("");
    }
  };

  if (!isOpen) return null;

  const isEdit = !!contact?.id;

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
              {isEdit ? "Редактировать контакт" : "Новый контакт"}
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
            {/* Name row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Имя <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="Введите имя"
                    className={cn(
                      "w-full pl-12 pr-4 py-3 bg-white/5 rounded-xl text-sm text-white border-2  placeholder:text-gray-500",
                      errors.firstName ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-violet-500 focus:bg-white/10"
                    )}
                  />
                </div>
                {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Фамилия <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Введите фамилию"
                  className={cn(
                    "w-full px-4 py-3 bg-white/5 rounded-xl text-sm text-white border-2  placeholder:text-gray-500",
                    errors.lastName ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-violet-500 focus:bg-white/10"
                  )}
                />
                {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
              </div>
            </div>

            {/* Company & Position */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Компания
                </label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={typeof formData.company === "string" ? formData.company : ""}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="Название компании"
                    className="w-full pl-12 pr-4 py-3 bg-white/5 rounded-xl text-sm text-white border-2 border-white/10 focus:border-violet-500 focus:bg-white/10  placeholder:text-gray-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Должность
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder="Должность"
                    className="w-full pl-12 pr-4 py-3 bg-white/5 rounded-xl text-sm text-white border-2 border-white/10 focus:border-violet-500 focus:bg-white/10  placeholder:text-gray-500"
                  />
                </div>
              </div>
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

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Теги
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {availableTags.map((tag) => {
                  const isSelected = formData.tags?.includes(tag.id);

                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium ",
                        isSelected
                          ? `${tag.bg} ${tag.text} ring-2 ring-offset-1 ring-offset-[#0d0d14]`
                          : "bg-white/5 text-gray-400 hover:bg-white/10"
                      )}
                    >
                      <Tag className="w-3.5 h-3.5" />
                      {tag.label}
                    </button>
                  );
                })}
              </div>

              {/* Custom tag input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomTag())}
                  placeholder="Добавить свой тег..."
                  className="flex-1 px-4 py-2.5 bg-white/5 rounded-xl text-sm text-white border-2 border-white/10 focus:border-violet-500 focus:bg-white/10  placeholder:text-gray-500"
                />
                <button
                  type="button"
                  onClick={addCustomTag}
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl "
                >
                  <Plus className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Selected custom tags */}
              {formData.tags && formData.tags.filter(t => !availableTags.find(at => at.id === t)).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.tags
                    .filter(t => !availableTags.find(at => at.id === t))
                    .map((tag) => (
                      <span
                        key={tag}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 text-gray-300 rounded-lg text-sm"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => toggleTag(tag)}
                          className="hover:text-red-500 "
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                </div>
              )}
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
