"use client";

import { useState, useRef, useEffect } from "react";
import {
  Plus,
  Search,
  Building2,
  Users,
  TrendingUp,
  Phone,
  Mail,
  Globe,
  MapPin,
  LayoutGrid,
  List,
  MoreHorizontal,
  CheckSquare,
  Square,
  Minus,
  Eye,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  Filter,
  Download,
  Star,
  StarOff,
  Briefcase,
  Calendar,
  X,
  ExternalLink,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { companiesApi } from "@/lib/api";
import { CompanyModal } from "@/components/companies/CompanyModal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface Company {
  id: string;
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
  contactsCount?: number;
  dealsCount?: number;
  createdAt: string;
  isFavorite?: boolean;
}

const mockCompanies: Company[] = [
  { id: "1", name: "ООО Технологии", inn: "1234567890", revenue: 5000000, employees: 50, phone: "+7 (495) 123-45-67", email: "info@tech.ru", website: "tech.ru", address: "Москва, ул. Технологическая, 10", status: "active", industry: "IT", contactsCount: 5, dealsCount: 3, createdAt: "2024-01-10", isFavorite: true },
  { id: "2", name: "АО Инновации", inn: "0987654321", revenue: 15000000, employees: 120, phone: "+7 (495) 234-56-78", email: "info@innov.ru", website: "innovations.ru", address: "Москва, ул. Инновационная, 25", status: "active", industry: "Финансы", contactsCount: 8, dealsCount: 5, createdAt: "2024-01-15", isFavorite: true },
  { id: "3", name: "ИП Петров", inn: "1122334455", revenue: 1500000, employees: 5, phone: "+7 (495) 345-67-89", email: "petrov@mail.ru", website: "petrov.ru", address: "Москва, ул. Садовая, 5", status: "active", industry: "Торговля", contactsCount: 2, dealsCount: 1, createdAt: "2024-02-01", isFavorite: false },
  { id: "4", name: "СтройПроект", inn: "5544332211", revenue: 8000000, employees: 85, phone: "+7 (495) 456-78-90", email: "info@stroy.ru", website: "stroyproject.ru", address: "Москва, ул. Строителей, 25", status: "active", industry: "Строительство", contactsCount: 12, dealsCount: 4, createdAt: "2024-02-10", isFavorite: false },
  { id: "5", name: "МедиаГрупп", inn: "9988776655", revenue: 4500000, employees: 35, phone: "+7 (495) 567-89-01", email: "media@group.ru", website: "mediagroup.ru", address: "Москва, ул. Тверская, 12", status: "inactive", industry: "Медиа", contactsCount: 6, dealsCount: 2, createdAt: "2024-02-15", isFavorite: false },
  { id: "6", name: "КорпСервис", inn: "6677889900", revenue: 12000000, employees: 200, phone: "+7 (495) 678-90-12", email: "corp@service.ru", website: "corpservice.ru", address: "Москва, Бизнес-центр Империя", status: "active", industry: "Консалтинг", contactsCount: 15, dealsCount: 8, createdAt: "2024-02-20", isFavorite: true },
];

const industryColors: Record<string, { bg: string; text: string }> = {
  "IT": { bg: "bg-blue-500/20", text: "text-blue-400" },
  "Финансы": { bg: "bg-green-500/20", text: "text-green-400" },
  "Торговля": { bg: "bg-orange-500/20", text: "text-orange-400" },
  "Строительство": { bg: "bg-amber-500/20", text: "text-amber-400" },
  "Медиа": { bg: "bg-purple-500/20", text: "text-purple-400" },
  "Консалтинг": { bg: "bg-indigo-500/20", text: "text-indigo-400" },
};

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>(mockCompanies);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [selectedCompanies, setSelectedCompanies] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingCompany, setDeletingCompany] = useState<Company | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCompanies = companies.filter((company) =>
    company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.inn.includes(searchQuery) ||
    company.industry?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedCompanies = [...filteredCompanies].sort((a, b) => {
    let aVal: string | number = "";
    let bVal: string | number = "";

    if (sortField === "name") {
      aVal = a.name;
      bVal = b.name;
    } else if (sortField === "revenue") {
      aVal = a.revenue;
      bVal = b.revenue;
    } else if (sortField === "employees") {
      aVal = a.employees;
      bVal = b.employees;
    } else if (sortField === "createdAt") {
      aVal = a.createdAt;
      bVal = b.createdAt;
    }

    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    }
    return sortOrder === "asc"
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });

  const toggleSelectAll = () => {
    if (selectedCompanies.size === filteredCompanies.length) {
      setSelectedCompanies(new Set());
    } else {
      setSelectedCompanies(new Set(filteredCompanies.map((c) => c.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedCompanies);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedCompanies(newSelected);
  };

  const toggleFavorite = (id: string) => {
    setCompanies(companies.map(c =>
      c.id === id ? { ...c, isFavorite: !c.isFavorite } : c
    ));
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const formatRevenue = (revenue: number) => {
    if (revenue >= 1000000) {
      return `${(revenue / 1000000).toFixed(1)}М ₽`;
    }
    return `${(revenue / 1000).toFixed(0)}К ₽`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Modal handlers
  const handleOpenCreateModal = () => {
    setEditingCompany(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (company: Company) => {
    setEditingCompany(company);
    setIsModalOpen(true);
    setOpenDropdown(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCompany(null);
  };

  const handleSaveCompany = async (companyData: any) => {
    setIsSaving(true);
    try {
      if (editingCompany?.id) {
        // Update existing company
        await companiesApi.update(editingCompany.id, companyData);
        setCompanies(companies.map(c =>
          c.id === editingCompany.id ? { ...c, ...companyData } : c
        ));
      } else {
        // Create new company
        const newCompany: Company = {
          ...companyData,
          id: `company-${Date.now()}`,
          createdAt: new Date().toISOString(),
          isFavorite: false,
          contactsCount: 0,
          dealsCount: 0,
        };
        setCompanies([newCompany, ...companies]);
      }
      handleCloseModal();
    } catch (error) {
      console.error("Failed to save company:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete handlers
  const handleOpenDeleteDialog = (company: Company) => {
    setDeletingCompany(company);
    setIsDeleteDialogOpen(true);
    setOpenDropdown(null);
  };

  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setDeletingCompany(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingCompany) return;

    setIsDeleting(true);
    try {
      await companiesApi.delete(deletingCompany.id);
      setCompanies(companies.filter(c => c.id !== deletingCompany.id));
      if (selectedCompany?.id === deletingCompany.id) {
        setSelectedCompany(null);
      }
      handleCloseDeleteDialog();
    } catch (error) {
      console.error("Failed to delete company:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const totalRevenue = companies.reduce((sum, c) => sum + c.revenue, 0);
  const totalEmployees = companies.reduce((sum, c) => sum + c.employees, 0);
  const activeCompanies = companies.filter((c) => c.status === "active").length;

  const isAllSelected = filteredCompanies.length > 0 && selectedCompanies.size === filteredCompanies.length;
  const isSomeSelected = selectedCompanies.size > 0 && selectedCompanies.size < filteredCompanies.length;

  return (
    <div className="h-full min-h-full flex flex-col">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 glass-card border-b border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
            <h1 className="text-xl sm:text-2xl font-bold text-white">Компании</h1>

            {/* Stats Pills - hidden on mobile */}
            <div className="hidden lg:flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg">
                <Building2 className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400">Всего</span>
                <span className="text-sm font-bold text-white">{companies.length}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm text-green-400">Активные</span>
                <span className="text-sm font-bold text-green-400">{activeCompanies}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-violet-500/20 rounded-lg">
                <TrendingUp className="w-4 h-4 text-violet-400" />
                <span className="text-sm text-violet-400">Выручка</span>
                <span className="text-sm font-bold text-violet-400">{formatRevenue(totalRevenue)}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 rounded-lg">
                <Users className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-purple-400">Сотрудники</span>
                <span className="text-sm font-bold text-purple-400">{totalEmployees}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
            {/* Search */}
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-48 lg:w-72 pl-10 pr-4 py-2.5 bg-white/5 rounded-xl text-sm text-white placeholder-gray-400 border border-white/10 focus:ring-2 focus:ring-violet-500 focus:bg-white/10"
              />
            </div>

            {/* Filter */}
            <button className="p-2.5 hover:bg-white/5 rounded-xl">
              <Filter className="w-5 h-5 text-gray-400" />
            </button>

            {/* View Toggle - hidden on small mobile */}
            <div className="hidden sm:flex bg-white/5 rounded-xl p-1">
              <button
                onClick={() => setViewMode("cards")}
                className={cn(
                  "p-2.5 rounded-lg",
                  viewMode === "cards"
                    ? "bg-white/10 shadow-sm text-white"
                    : "text-gray-400 hover:text-white"
                )}
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={cn(
                  "p-2.5 rounded-lg",
                  viewMode === "table"
                    ? "bg-white/10 shadow-sm text-white"
                    : "text-gray-400 hover:text-white"
                )}
              >
                <List className="w-5 h-5" />
              </button>
            </div>

            {/* Export - hidden on mobile */}
            <button className="hidden sm:block p-2.5 hover:bg-white/5 rounded-xl">
              <Download className="w-5 h-5 text-gray-400" />
            </button>

            {/* Add Button */}
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-xl text-sm font-semibold hover:from-violet-600 hover:to-purple-600 shadow-sm"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Новая компания</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex">
        {viewMode === "table" ? (
          /* Table View */
          <div className="flex-1 flex flex-col">
            {/* Table Header */}
            <div className="glass-card border-b border-white/10 sticky top-0 z-10 overflow-x-auto">
              <div className="flex items-center h-12 text-sm min-w-[950px]">
                {/* Checkbox */}
                <div className="w-12 flex items-center justify-center">
                  <button onClick={toggleSelectAll} className="p-1 hover:bg-white/5 rounded">
                    {isAllSelected ? (
                      <CheckSquare className="w-5 h-5 text-violet-500" />
                    ) : isSomeSelected ? (
                      <Minus className="w-5 h-5 text-violet-500" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                </div>

                {/* Burger menu header */}
                <div className="w-10 flex items-center justify-center border-r border-white/5">
                  <MoreHorizontal className="w-4 h-4 text-gray-500" />
                </div>

                {/* Favorite */}
                <div className="w-12 flex items-center justify-center border-r border-white/5">
                  <Star className="w-4 h-4 text-gray-500" />
                </div>

                {/* Columns */}
                <button
                  onClick={() => handleSort("name")}
                  className="flex-1 min-w-[220px] flex items-center gap-2 px-4 h-full hover:bg-white/5 text-left"
                >
                  <span className="font-semibold text-gray-300">Компания</span>
                  {sortField === "name" && (
                    sortOrder === "asc" ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </button>

                <div className="w-[120px] flex items-center px-4 h-full border-l border-white/5">
                  <span className="font-semibold text-gray-300">Отрасль</span>
                </div>

                <button
                  onClick={() => handleSort("revenue")}
                  className="w-[130px] flex items-center gap-2 px-4 h-full hover:bg-white/5 border-l border-white/5"
                >
                  <span className="font-semibold text-gray-300">Выручка</span>
                  {sortField === "revenue" && (
                    sortOrder === "asc" ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </button>

                <button
                  onClick={() => handleSort("employees")}
                  className="w-[100px] flex items-center gap-2 px-4 h-full hover:bg-white/5 border-l border-white/5"
                >
                  <span className="font-semibold text-gray-300">Люди</span>
                  {sortField === "employees" && (
                    sortOrder === "asc" ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </button>

                <div className="w-[180px] flex items-center px-4 h-full border-l border-white/5">
                  <span className="font-semibold text-gray-300">Контакты</span>
                </div>

                <div className="w-[100px] flex items-center px-4 h-full border-l border-white/5">
                  <span className="font-semibold text-gray-300">Статус</span>
                </div>
              </div>
            </div>

            {/* Table Body */}
            <div className="flex-1 overflow-x-auto overflow-y-auto glass-card">
              <div className="min-w-[950px]">
              {sortedCompanies.map((company, index) => {
                const isSelected = selectedCompanies.has(company.id);
                const colors = industryColors[company.industry || ""] || { bg: "bg-white/10", text: "text-gray-300" };

                return (
                  <div
                    key={company.id}
                    className={cn(
                      "flex items-center min-h-[72px] border-b border-white/5 hover:bg-white/5 cursor-pointer",
                      isSelected ? "bg-violet-500/10" : index % 2 === 1 ? "bg-white/[0.02]" : ""
                    )}
                    onClick={() => setSelectedCompany(company)}
                  >
                    {/* Checkbox */}
                    <div className="w-12 flex items-center justify-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleSelect(company.id); }}
                        className="p-1 hover:bg-white/5 rounded"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-violet-500" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-500 hover:text-gray-400" />
                        )}
                      </button>
                    </div>

                    {/* Burger menu */}
                    <div className="w-10 flex items-center justify-center relative" ref={openDropdown === company.id ? dropdownRef : null}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDropdown(openDropdown === company.id ? null : company.id);
                        }}
                        className={cn(
                          "p-1.5 hover:bg-white/5 rounded",
                          openDropdown === company.id && "bg-white/5"
                        )}
                      >
                        <MoreHorizontal className="w-4 h-4 text-gray-400" />
                      </button>

                      {openDropdown === company.id && (
                        <div className="absolute left-0 top-full mt-1 w-56 glass-card rounded-xl shadow-lg border border-white/10 py-1 z-50">
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedCompany(company); setOpenDropdown(null); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5"
                          >
                            <Eye className="w-4 h-4 text-gray-400" />
                            Просмотреть
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleOpenEditModal(company); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5"
                          >
                            <Pencil className="w-4 h-4 text-gray-400" />
                            Редактировать
                          </button>
                          <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5">
                            <Briefcase className="w-4 h-4 text-gray-400" />
                            Создать сделку
                          </button>
                          <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5">
                            <FileText className="w-4 h-4 text-gray-400" />
                            Документы
                          </button>
                          <div className="border-t border-white/5 my-1" />
                          <button
                            onClick={(e) => { e.stopPropagation(); handleOpenDeleteDialog(company); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                            Удалить
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Favorite */}
                    <div className="w-12 flex items-center justify-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(company.id); }}
                        className="p-1 hover:bg-white/5 rounded"
                      >
                        {company.isFavorite ? (
                          <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                        ) : (
                          <StarOff className="w-5 h-5 text-gray-500 hover:text-gray-400" />
                        )}
                      </button>
                    </div>

                    {/* Company Name */}
                    <div className="flex-1 min-w-[220px] px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                          {company.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{company.name}</p>
                          <p className="text-xs text-gray-400">ИНН: {company.inn}</p>
                        </div>
                      </div>
                    </div>

                    {/* Industry */}
                    <div className="w-[120px] px-4">
                      {company.industry && (
                        <span className={cn("px-2.5 py-1 rounded-lg text-xs font-medium", colors.bg, colors.text)}>
                          {company.industry}
                        </span>
                      )}
                    </div>

                    {/* Revenue */}
                    <div className="w-[130px] px-4">
                      <span className="text-sm font-semibold text-white">{formatRevenue(company.revenue)}</span>
                    </div>

                    {/* Employees */}
                    <div className="w-[100px] px-4">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-300">{company.employees}</span>
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="w-[180px] px-4 space-y-1">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-sm text-gray-300 truncate">{company.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs text-gray-400 truncate">{company.email}</span>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="w-[100px] px-4">
                      {company.status === "active" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-500/20 text-green-400 rounded-lg text-xs font-medium">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          Активная
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/10 text-gray-400 rounded-lg text-xs font-medium">
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                          Неактивна
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {sortedCompanies.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
                    <Building2 className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-400 font-medium">Компании не найдены</p>
                </div>
              )}
              </div>
            </div>

            {/* Selected Actions Bar */}
            {selectedCompanies.size > 0 && (
              <div className="bg-gradient-to-r from-violet-500 to-purple-500 text-white px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2">
                <span className="font-medium text-sm sm:text-base whitespace-nowrap">Выбрано: {selectedCompanies.size}</span>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button className="hidden sm:block px-4 py-1.5 bg-white/20 rounded-lg text-sm font-medium hover:bg-white/30">
                    Экспорт
                  </button>
                  <button className="hidden sm:block px-4 py-1.5 bg-white/20 rounded-lg text-sm font-medium hover:bg-white/30">
                    Объединить
                  </button>
                  <button className="px-3 sm:px-4 py-1.5 bg-red-500 rounded-lg text-sm font-medium hover:bg-red-600">
                    Удалить
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Cards View */
          <div className="flex-1 overflow-auto p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {sortedCompanies.map((company) => {
                const colors = industryColors[company.industry || ""] || { bg: "bg-white/10", text: "text-gray-300" };

                return (
                  <div
                    key={company.id}
                    className="glass-card rounded-2xl p-5 border border-white/10 hover:border-violet-500/50 cursor-pointer"
                    onClick={() => setSelectedCompany(company)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold">
                          {company.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{company.name}</p>
                          <p className="text-xs text-gray-400">ИНН: {company.inn}</p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(company.id); }}
                        className="p-1"
                      >
                        {company.isFavorite ? (
                          <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                        ) : (
                          <StarOff className="w-5 h-5 text-gray-500" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                      {company.industry && (
                        <span className={cn("px-2.5 py-1 rounded-lg text-xs font-medium", colors.bg, colors.text)}>
                          {company.industry}
                        </span>
                      )}
                      {company.status === "active" ? (
                        <span className="px-2.5 py-1 bg-green-500/20 text-green-400 rounded-lg text-xs font-medium">
                          Активная
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-white/10 text-gray-400 rounded-lg text-xs font-medium">
                          Неактивна
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-white/5 rounded-xl p-3">
                        <p className="text-xs text-gray-400 mb-1">Выручка</p>
                        <p className="text-sm font-bold text-white">{formatRevenue(company.revenue)}</p>
                      </div>
                      <div className="bg-white/5 rounded-xl p-3">
                        <p className="text-xs text-gray-400 mb-1">Сотрудники</p>
                        <p className="text-sm font-bold text-white">{company.employees}</p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-300">{company.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-violet-400">{company.website}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 pt-3 border-t border-white/5 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {company.contactsCount} контактов
                      </span>
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-3.5 h-3.5" />
                        {company.dealsCount} сделок
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Company Details Sidebar */}
        {selectedCompany && (
          <>
            {/* Mobile backdrop */}
            <div
              className="fixed inset-0 bg-black/50 z-[60] md:hidden"
              onClick={() => setSelectedCompany(null)}
            />
            <div className="fixed inset-0 md:inset-auto md:relative md:w-96 w-full glass-card md:border-l border-white/10 flex flex-col z-[70]">
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <h3 className="font-semibold text-white">Профиль компании</h3>
                <button
                  onClick={() => setSelectedCompany(null)}
                  className="p-1.5 hover:bg-white/5 rounded-lg"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

            <div className="flex-1 overflow-auto p-6">
              {/* Logo & Name */}
              <div className="flex flex-col items-center mb-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold mb-3">
                  {selectedCompany.name.substring(0, 2).toUpperCase()}
                </div>
                <h2 className="text-xl font-bold text-white text-center">{selectedCompany.name}</h2>
                <p className="text-sm text-gray-400">ИНН: {selectedCompany.inn}</p>

                <div className="flex gap-2 mt-3">
                  {selectedCompany.industry && (
                    <span className={cn(
                      "px-3 py-1 rounded-lg text-xs font-medium",
                      industryColors[selectedCompany.industry]?.bg || "bg-white/10",
                      industryColors[selectedCompany.industry]?.text || "text-gray-300"
                    )}>
                      {selectedCompany.industry}
                    </span>
                  )}
                  {selectedCompany.status === "active" ? (
                    <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-xs font-medium">
                      Активная
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-white/10 text-gray-400 rounded-lg text-xs font-medium">
                      Неактивна
                    </span>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-violet-500/20 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-violet-400">{formatRevenue(selectedCompany.revenue)}</p>
                  <p className="text-xs text-violet-400/70">Выручка</p>
                </div>
                <div className="bg-purple-500/20 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-purple-400">{selectedCompany.employees}</p>
                  <p className="text-xs text-purple-400/70">Сотрудников</p>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Контактная информация</p>
                  <div className="bg-white/5 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-400">Телефон</p>
                        <p className="text-sm font-medium text-white">{selectedCompany.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-400">Email</p>
                        <p className="text-sm font-medium text-white">{selectedCompany.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-400">Сайт</p>
                        <a href={`https://${selectedCompany.website}`} className="text-sm font-medium text-violet-400 hover:underline flex items-center gap-1">
                          {selectedCompany.website}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-400">Адрес</p>
                        <p className="text-sm font-medium text-white">{selectedCompany.address}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Связи</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/5 rounded-xl p-3 text-center">
                      <p className="text-lg font-bold text-white">{selectedCompany.contactsCount}</p>
                      <p className="text-xs text-gray-400">Контактов</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 text-center">
                      <p className="text-lg font-bold text-white">{selectedCompany.dealsCount}</p>
                      <p className="text-xs text-gray-400">Сделок</p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Информация</p>
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-400">Добавлена</p>
                        <p className="text-sm font-medium text-white">{formatDate(selectedCompany.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-white/5 space-y-2">
              <button
                onClick={() => handleOpenEditModal(selectedCompany)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-xl font-medium hover:from-violet-600 hover:to-purple-600"
              >
                <Pencil className="w-4 h-4" />
                Редактировать
              </button>
              <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 text-gray-300 rounded-xl font-medium hover:bg-white/20">
                <Briefcase className="w-4 h-4" />
                Создать сделку
              </button>
              <button
                onClick={() => handleOpenDeleteDialog(selectedCompany)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-red-400 hover:bg-red-500/10 rounded-xl font-medium"
              >
                <Trash2 className="w-4 h-4" />
                Удалить компанию
              </button>
            </div>
            </div>
          </>
        )}
      </div>

      {/* Company Modal */}
      <CompanyModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveCompany}
        company={editingCompany}
        isLoading={isSaving}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleConfirmDelete}
        title="Удалить компанию?"
        description={`Вы уверены, что хотите удалить компанию "${deletingCompany?.name}"? Все связанные контакты и сделки будут отвязаны. Это действие нельзя отменить.`}
        confirmText="Удалить"
        cancelText="Отмена"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
