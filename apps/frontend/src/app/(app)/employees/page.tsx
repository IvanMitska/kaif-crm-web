"use client";

import { useState, useEffect, useRef } from "react";
import {
  Plus,
  Search,
  Users,
  Phone,
  Mail,
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
  Download,
  Shield,
  ShieldCheck,
  Clock,
  Smartphone,
  Monitor,
  MessageSquare,
  Building2,
  UserCog,
  Crown,
  BadgeCheck,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: "ADMIN" | "SUPERVISOR" | "MANAGER" | "OPERATOR";
  department: string;
  position?: string;
  lastActivity?: string;
  mobileApp: boolean;
  desktopApp: boolean;
  status: "active" | "inactive" | "vacation";
  createdAt: string;
}

const mockEmployees: Employee[] = [
  {
    id: "1",
    firstName: "Борис",
    lastName: "Дадабаев",
    email: "retroyohi@gmail.com",
    phone: "+7 999 123 4567",
    role: "ADMIN",
    department: "Руководство",
    position: "Главный администратор",
    lastActivity: "2026-01-30T11:15:00",
    mobileApp: false,
    desktopApp: false,
    status: "active",
    createdAt: "2024-01-01",
  },
  {
    id: "2",
    firstName: "Иван",
    lastName: "Мицка",
    email: "mitska91@gmail.com",
    phone: "+66 82 790 1131",
    role: "MANAGER",
    department: "Продажи",
    position: "Менеджер по продажам",
    lastActivity: "2026-03-01T21:55:00",
    mobileApp: false,
    desktopApp: false,
    status: "active",
    createdAt: "2024-01-15",
  },
  {
    id: "3",
    firstName: "Алья",
    lastName: "Зенина",
    email: "alyazenina50@gmail.com",
    phone: "+66 88 900 1049",
    role: "OPERATOR",
    department: "Поддержка",
    position: "Оператор",
    lastActivity: "2025-12-25T12:33:00",
    mobileApp: false,
    desktopApp: false,
    status: "active",
    createdAt: "2024-02-01",
  },
  {
    id: "4",
    firstName: "Ирина",
    lastName: "Гертей",
    email: "gerteyirina123@gmail.com",
    phone: "+66 99 489 6120",
    role: "MANAGER",
    department: "Продажи",
    position: "Старший менеджер",
    lastActivity: "2025-11-29T23:18:00",
    mobileApp: false,
    desktopApp: false,
    status: "vacation",
    createdAt: "2024-02-10",
  },
  {
    id: "5",
    firstName: "Дмитрий",
    lastName: "Штарк",
    email: "kalpachokshtark@gmail.com",
    role: "SUPERVISOR",
    department: "Продажи",
    position: "Руководитель отдела продаж",
    lastActivity: "2025-12-24T12:21:00",
    mobileApp: false,
    desktopApp: false,
    status: "active",
    createdAt: "2024-01-20",
  },
  {
    id: "6",
    firstName: "Мария",
    lastName: "Петрова",
    email: "maria.petrova@company.ru",
    phone: "+7 999 888 7766",
    role: "OPERATOR",
    department: "Поддержка",
    position: "Специалист поддержки",
    lastActivity: "2026-02-28T09:45:00",
    mobileApp: true,
    desktopApp: true,
    status: "active",
    createdAt: "2024-03-01",
  },
  {
    id: "7",
    firstName: "Алексей",
    lastName: "Сидоров",
    email: "a.sidorov@company.ru",
    phone: "+7 999 555 4433",
    role: "MANAGER",
    department: "Маркетинг",
    position: "Маркетолог",
    lastActivity: "2026-02-27T16:30:00",
    mobileApp: true,
    desktopApp: false,
    status: "inactive",
    createdAt: "2024-02-15",
  },
];

const roleConfig: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
  ADMIN: { label: "Администратор", color: "text-red-400", bgColor: "bg-red-500/20", icon: Crown },
  SUPERVISOR: { label: "Супервайзер", color: "text-purple-400", bgColor: "bg-purple-500/20", icon: ShieldCheck },
  MANAGER: { label: "Менеджер", color: "text-violet-400", bgColor: "bg-violet-500/20", icon: BadgeCheck },
  OPERATOR: { label: "Оператор", color: "text-green-400", bgColor: "bg-green-500/20", icon: Shield },
};

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  active: { label: "Активен", color: "text-green-400", bgColor: "bg-green-500/20" },
  inactive: { label: "Неактивен", color: "text-gray-400", bgColor: "bg-white/10" },
  vacation: { label: "В отпуске", color: "text-amber-400", bgColor: "bg-amber-500/20" },
};

export default function EmployeesPage() {
  const [employees] = useState<Employee[]>(mockEmployees);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<string>("lastName");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [perPage, setPerPage] = useState(20);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const departments = Array.from(new Set(employees.map((e) => e.department)));

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      employee.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.department.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDepartment = filterDepartment === "all" || employee.department === filterDepartment;

    return matchesSearch && matchesDepartment;
  });

  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
    let aVal: string | number = "";
    let bVal: string | number = "";

    if (sortField === "lastName") {
      aVal = a.lastName;
      bVal = b.lastName;
    } else if (sortField === "department") {
      aVal = a.department;
      bVal = b.department;
    } else if (sortField === "lastActivity") {
      aVal = a.lastActivity || "";
      bVal = b.lastActivity || "";
    } else if (sortField === "role") {
      aVal = a.role;
      bVal = b.role;
    }

    return sortOrder === "asc"
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });

  const toggleSelectAll = () => {
    if (selectedEmployees.size === filteredEmployees.length) {
      setSelectedEmployees(new Set());
    } else {
      setSelectedEmployees(new Set(filteredEmployees.map((e) => e.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedEmployees);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedEmployees(newSelected);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const totalEmployees = employees.length;
  const activeEmployees = employees.filter((e) => e.status === "active").length;
  const admins = employees.filter((e) => e.role === "ADMIN").length;
  const withMobileApp = employees.filter((e) => e.mobileApp).length;

  const isAllSelected = filteredEmployees.length > 0 && selectedEmployees.size === filteredEmployees.length;
  const isSomeSelected = selectedEmployees.size > 0 && selectedEmployees.size < filteredEmployees.length;

  return (
    <div className="h-full min-h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 glass-card border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-bold text-white">Сотрудники</h1>

            {/* Stats Pills */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400">Всего</span>
                <span className="text-sm font-bold text-white">{totalEmployees}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm text-green-400">Активных</span>
                <span className="text-sm font-bold text-green-400">{activeEmployees}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 rounded-lg">
                <Crown className="w-4 h-4 text-red-400" />
                <span className="text-sm text-red-400">Админов</span>
                <span className="text-sm font-bold text-red-400">{admins}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-violet-500/20 rounded-lg">
                <Smartphone className="w-4 h-4 text-violet-400" />
                <span className="text-sm text-violet-400">С приложением</span>
                <span className="text-sm font-bold text-violet-400">{withMobileApp}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск сотрудника..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-72 pl-10 pr-4 py-2.5 bg-white/5 rounded-xl text-sm text-white border-0 focus:ring-2 focus:ring-violet-500 focus:bg-white/10 placeholder:text-gray-400"
              />
            </div>

            {/* Department Filter */}
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="px-4 py-2.5 bg-white/5 rounded-xl text-sm text-white border-0 focus:ring-2 focus:ring-violet-500 focus:bg-white/10"
            >
              <option value="all">Все подразделения</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>

            {/* View Toggle */}
            <div className="flex bg-white/5 rounded-xl p-1">
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

            {/* Export */}
            <button className="p-2.5 hover:bg-white/5 rounded-xl">
              <Download className="w-5 h-5 text-gray-400" />
            </button>

            {/* Add Button */}
            <button className="flex items-center gap-2 px-5 py-2.5 bg-violet-500 text-white rounded-xl text-sm font-semibold hover:bg-purple-500 shadow-sm">
              <Plus className="w-5 h-5" />
              Добавить сотрудника
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
            <div className="glass-card border-b border-white/5 sticky top-0 z-10">
              <div className="flex items-center h-12 text-sm">
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

                {/* Columns */}
                <button
                  onClick={() => handleSort("lastName")}
                  className="flex-1 min-w-[220px] flex items-center gap-2 px-4 h-full hover:bg-white/5 text-left border-r border-white/5"
                >
                  <span className="font-semibold text-gray-300">Сотрудник</span>
                  {sortField === "lastName" && (
                    sortOrder === "asc" ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </button>

                <button
                  onClick={() => handleSort("department")}
                  className="w-[150px] flex items-center gap-2 px-4 h-full hover:bg-white/5 border-r border-white/5"
                >
                  <span className="font-semibold text-gray-300">Подразделение</span>
                  {sortField === "department" && (
                    sortOrder === "asc" ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </button>

                <div className="w-[200px] flex items-center px-4 h-full border-r border-white/5">
                  <span className="font-semibold text-gray-300">E-Mail</span>
                </div>

                <div className="w-[150px] flex items-center px-4 h-full border-r border-white/5">
                  <span className="font-semibold text-gray-300">Телефон</span>
                </div>

                <button
                  onClick={() => handleSort("lastActivity")}
                  className="w-[170px] flex items-center gap-2 px-4 h-full hover:bg-white/5 border-r border-white/5"
                >
                  <span className="font-semibold text-gray-300">Последняя активность</span>
                  {sortField === "lastActivity" && (
                    sortOrder === "asc" ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </button>

                <div className="w-[120px] flex items-center px-4 h-full border-r border-white/5">
                  <span className="font-semibold text-gray-300">Моб. прил.</span>
                </div>

                <div className="w-[120px] flex items-center px-4 h-full">
                  <span className="font-semibold text-gray-300">ПК прил.</span>
                </div>
              </div>
            </div>

            {/* Table Body */}
            <div className="flex-1 overflow-auto glass-card">
              {sortedEmployees.map((employee, index) => {
                const isSelected = selectedEmployees.has(employee.id);
                const role = roleConfig[employee.role];

                return (
                  <div
                    key={employee.id}
                    className={cn(
                      "flex items-center min-h-[72px] border-b border-white/5 hover:bg-white/5 cursor-pointer",
                      isSelected ? "bg-violet-500/10" : index % 2 === 1 ? "bg-white/[0.02]" : ""
                    )}
                    onClick={() => setSelectedEmployee(employee)}
                  >
                    {/* Checkbox */}
                    <div className="w-12 flex items-center justify-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleSelect(employee.id); }}
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
                    <div className="w-10 flex items-center justify-center relative" ref={openDropdown === employee.id ? dropdownRef : null}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDropdown(openDropdown === employee.id ? null : employee.id);
                        }}
                        className={cn(
                          "p-1.5 hover:bg-white/5 rounded",
                          openDropdown === employee.id && "bg-white/5"
                        )}
                      >
                        <MoreHorizontal className="w-4 h-4 text-gray-400" />
                      </button>

                      {openDropdown === employee.id && (
                        <div className="absolute left-0 top-full mt-1 w-56 glass-card rounded-xl shadow-lg border border-white/10 py-1 z-50">
                          <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5">
                            <Eye className="w-4 h-4 text-gray-400" />
                            Просмотреть профиль
                          </button>
                          <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5">
                            <Pencil className="w-4 h-4 text-gray-400" />
                            Редактировать
                          </button>
                          <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5">
                            <MessageSquare className="w-4 h-4 text-gray-400" />
                            Написать сообщение
                          </button>
                          <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5">
                            <UserCog className="w-4 h-4 text-gray-400" />
                            Изменить роль
                          </button>
                          <div className="border-t border-white/5 my-1" />
                          <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10">
                            <Trash2 className="w-4 h-4 text-red-400" />
                            Уволить
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Employee Name */}
                    <div className="flex-1 min-w-[220px] px-4 py-3 border-r border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          {employee.avatar ? (
                            <img
                              src={employee.avatar}
                              alt={`${employee.firstName} ${employee.lastName}`}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                              {employee.firstName[0]}{employee.lastName[0]}
                            </div>
                          )}
                          {employee.status === "active" && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[#0B0E14]" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-white">
                            {employee.firstName} {employee.lastName}
                          </p>
                          <p className={cn("text-xs font-medium", role.color)}>
                            {employee.position || role.label}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Department */}
                    <div className="w-[150px] px-4 border-r border-white/5">
                      <span className="text-sm text-gray-300">{employee.department}</span>
                    </div>

                    {/* Email */}
                    <div className="w-[200px] px-4 border-r border-white/5">
                      <a
                        href={`mailto:${employee.email}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-sm text-violet-400 hover:underline truncate block"
                      >
                        {employee.email}
                      </a>
                    </div>

                    {/* Phone */}
                    <div className="w-[150px] px-4 border-r border-white/5">
                      <span className="text-sm text-gray-300">{employee.phone || "—"}</span>
                    </div>

                    {/* Last Activity */}
                    <div className="w-[170px] px-4 border-r border-white/5">
                      <span className="text-sm text-gray-400">{formatDate(employee.lastActivity)}</span>
                    </div>

                    {/* Mobile App */}
                    <div className="w-[120px] px-4 border-r border-white/5">
                      {employee.mobileApp ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-500/20 text-green-400 rounded-lg text-xs font-medium">
                          <Smartphone className="w-3.5 h-3.5" />
                          Установлено
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">Не установлено</span>
                      )}
                    </div>

                    {/* Desktop App */}
                    <div className="w-[120px] px-4">
                      {employee.desktopApp ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-500/20 text-green-400 rounded-lg text-xs font-medium">
                          <Monitor className="w-3.5 h-3.5" />
                          Установлено
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">Не установлено</span>
                      )}
                    </div>
                  </div>
                );
              })}

              {sortedEmployees.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                    <Users className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-400 font-medium">Сотрудники не найдены</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="glass-card border-t border-white/5 px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <span className="text-sm text-gray-400">
                  <span className="font-medium">ОТМЕЧЕНО:</span> {selectedEmployees.size} / {filteredEmployees.length}
                </span>
                <span className="text-sm text-gray-400">
                  <span className="font-medium">ВСЕГО:</span>{" "}
                  <button className="text-violet-400 hover:underline">ПОКАЗАТЬ КОЛИЧЕСТВО</button>
                </span>
                <span className="text-sm text-gray-400">
                  <span className="font-medium">СТРАНИЦЫ:</span> 1
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">НА СТРАНИЦЕ:</span>
                  <select
                    value={perPage}
                    onChange={(e) => setPerPage(Number(e.target.value))}
                    className="px-3 py-1.5 bg-white/5 rounded-lg text-sm text-white border-0 focus:ring-2 focus:ring-violet-500"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Selected Actions Bar */}
            {selectedEmployees.size > 0 && (
              <div className="bg-violet-500 text-white px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="font-medium">Выбрано: {selectedEmployees.size}</span>
                  <button className="px-4 py-1.5 bg-white/20 rounded-lg text-sm font-medium hover:bg-white/30 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Создать чат
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-4 py-1.5 bg-white/20 rounded-lg text-sm font-medium hover:bg-white/30">
                    Экспорт
                  </button>
                  <button className="px-4 py-1.5 bg-white/20 rounded-lg text-sm font-medium hover:bg-white/30">
                    Изменить роль
                  </button>
                  <button className="px-4 py-1.5 bg-red-500 rounded-lg text-sm font-medium hover:bg-red-600">
                    Уволить
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Cards View */
          <div className="flex-1 overflow-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sortedEmployees.map((employee) => {
                const role = roleConfig[employee.role];
                const status = statusConfig[employee.status];
                const RoleIcon = role.icon;

                return (
                  <div
                    key={employee.id}
                    className="glass-card rounded-2xl p-5 border border-white/10 hover:border-violet-500/50 cursor-pointer"
                    onClick={() => setSelectedEmployee(employee)}
                  >
                    <div className="flex flex-col items-center mb-4">
                      <div className="relative mb-3">
                        {employee.avatar ? (
                          <img
                            src={employee.avatar}
                            alt={`${employee.firstName} ${employee.lastName}`}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                            {employee.firstName[0]}{employee.lastName[0]}
                          </div>
                        )}
                        {employee.status === "active" && (
                          <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-[#0B0E14]" />
                        )}
                      </div>
                      <p className="font-semibold text-white text-center">
                        {employee.firstName} {employee.lastName}
                      </p>
                      <p className="text-xs text-gray-400 text-center">{employee.position || role.label}</p>
                    </div>

                    <div className="flex items-center justify-center gap-2 mb-4">
                      <span className={cn("px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1", role.bgColor, role.color)}>
                        <RoleIcon className="w-3.5 h-3.5" />
                        {role.label}
                      </span>
                      <span className={cn("px-2.5 py-1 rounded-lg text-xs font-medium", status.bgColor, status.color)}>
                        {status.label}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-400">{employee.department}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-violet-400 truncate">{employee.email}</span>
                      </div>
                      {employee.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-400">{employee.phone}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {employee.lastActivity ? formatDate(employee.lastActivity).split(",")[0] : "—"}
                      </span>
                      <div className="flex items-center gap-1">
                        <Smartphone className={cn("w-4 h-4", employee.mobileApp ? "text-green-500" : "text-gray-500")} />
                        <Monitor className={cn("w-4 h-4", employee.desktopApp ? "text-green-500" : "text-gray-500")} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Employee Details Modal Overlay */}
        {selectedEmployee && (
          <>
            {/* Backdrop - covers everything including sidebar */}
            <div
              className="fixed inset-0 bg-black/50 z-[60]"
              onClick={() => setSelectedEmployee(null)}
            />

            {/* Modal Panel - Bitrix style */}
            <div
              className="fixed inset-y-4 right-4 w-[480px] max-w-[calc(100vw-2rem)] z-[70] flex flex-col glass-card rounded-2xl shadow-2xl overflow-hidden border border-white/10"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                <h3 className="text-lg font-semibold text-white">
                  {selectedEmployee.firstName} {selectedEmployee.lastName}
                </h3>
                <button
                  onClick={() => setSelectedEmployee(null)}
                  className="w-8 h-8 flex items-center justify-center bg-violet-500 hover:bg-purple-500 rounded-lg"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-1 px-6 py-2 border-b border-white/5 bg-white/[0.02]">
                <button className="px-4 py-2 text-sm font-medium text-violet-400 bg-white/10 rounded-lg shadow-sm">
                  Профиль
                </button>
                <button className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 rounded-lg">
                  Задачи
                </button>
                <button className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 rounded-lg">
                  Календарь
                </button>
                <button className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 rounded-lg">
                  Файлы
                </button>
              </div>

              <div className="flex-1 overflow-auto">
                <div className="flex gap-6 p-6">
                  {/* Left Column - Avatar & Actions */}
                  <div className="flex flex-col items-center">
                    {/* Avatar with status */}
                    <div className="relative mb-4">
                      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-500/20 p-1">
                        {selectedEmployee.avatar ? (
                          <img
                            src={selectedEmployee.avatar}
                            alt={`${selectedEmployee.firstName} ${selectedEmployee.lastName}`}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full rounded-full bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white text-4xl font-bold">
                            {selectedEmployee.firstName[0]}{selectedEmployee.lastName[0]}
                          </div>
                        )}
                      </div>
                      {/* Status indicator */}
                      <div className={cn(
                        "absolute top-1 right-1 flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold",
                        selectedEmployee.status === "active"
                          ? "bg-green-500 text-white"
                          : selectedEmployee.status === "vacation"
                          ? "bg-amber-500 text-white"
                          : "bg-gray-500 text-white"
                      )}>
                        <span className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          selectedEmployee.status === "active" ? "bg-white" : "bg-white/60"
                        )} />
                        {selectedEmployee.status === "active" ? "В сети" : selectedEmployee.status === "vacation" ? "Отпуск" : "Не в сети"}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 mb-4">
                      <button className="px-4 py-2 text-sm font-medium text-gray-300 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10">
                        Чат
                      </button>
                      <button className="px-4 py-2 text-sm font-medium text-gray-300 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10">
                        Видеозвонок
                      </button>
                    </div>

                    {/* Role badge */}
                    <div className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-semibold",
                      roleConfig[selectedEmployee.role].bgColor,
                      roleConfig[selectedEmployee.role].color
                    )}>
                      {roleConfig[selectedEmployee.role].label}
                    </div>
                  </div>

                  {/* Right Column - Contact Info */}
                  <div className="flex-1 min-w-0">
                    <div className="bg-white/5 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-white mb-4">Контактная информация</h4>

                      <div className="space-y-4">
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">Имя</p>
                          <p className="text-sm text-white">{selectedEmployee.firstName}</p>
                        </div>

                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">Фамилия</p>
                          <p className="text-sm text-white">{selectedEmployee.lastName}</p>
                        </div>

                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">Почта</p>
                          <a href={`mailto:${selectedEmployee.email}`} className="text-sm text-violet-400 hover:underline">
                            {selectedEmployee.email}
                          </a>
                        </div>

                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">Отдел</p>
                          <p className="text-sm text-white">{selectedEmployee.department}</p>
                        </div>

                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">Должность</p>
                          <p className="text-sm text-white">{selectedEmployee.position || roleConfig[selectedEmployee.role].label}</p>
                        </div>

                        {selectedEmployee.phone && (
                          <div>
                            <p className="text-xs text-gray-400 mb-0.5">Мобильный</p>
                            <p className="text-sm text-white">{selectedEmployee.phone}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional sections */}
                <div className="px-6 pb-6 space-y-4">
                  {/* Apps section */}
                  <div className="bg-white/5 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-white mb-3">Приложения</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className={cn(
                        "flex flex-col items-center p-3 rounded-xl border-2",
                        selectedEmployee.mobileApp
                          ? "bg-green-500/10 border-green-500/30"
                          : "bg-white/5 border-white/5"
                      )}>
                        <Smartphone className={cn(
                          "w-8 h-8 mb-1",
                          selectedEmployee.mobileApp ? "text-green-500" : "text-gray-500"
                        )} />
                        <p className="text-xs font-medium text-gray-300">Мобильное</p>
                        <p className={cn(
                          "text-[10px]",
                          selectedEmployee.mobileApp ? "text-green-400" : "text-gray-500"
                        )}>
                          {selectedEmployee.mobileApp ? "Установлено" : "Не установлено"}
                        </p>
                      </div>
                      <div className={cn(
                        "flex flex-col items-center p-3 rounded-xl border-2",
                        selectedEmployee.desktopApp
                          ? "bg-green-500/10 border-green-500/30"
                          : "bg-white/5 border-white/5"
                      )}>
                        <Monitor className={cn(
                          "w-8 h-8 mb-1",
                          selectedEmployee.desktopApp ? "text-green-500" : "text-gray-500"
                        )} />
                        <p className="text-xs font-medium text-gray-300">Десктоп</p>
                        <p className={cn(
                          "text-[10px]",
                          selectedEmployee.desktopApp ? "text-green-400" : "text-gray-500"
                        )}>
                          {selectedEmployee.desktopApp ? "Установлено" : "Не установлено"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Activity section */}
                  <div className="bg-white/5 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-white mb-3">Активность</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">Последняя активность</span>
                        <span className="text-sm text-white">{formatDate(selectedEmployee.lastActivity)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">В компании с</span>
                        <span className="text-sm text-white">{formatShortDate(selectedEmployee.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-4 border-t border-white/5 bg-white/[0.02]">
                <div className="flex gap-3">
                  <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-500 text-white rounded-lg font-medium hover:bg-purple-500">
                    <MessageSquare className="w-4 h-4" />
                    Написать сообщение
                  </button>
                  <button className="px-4 py-2.5 text-gray-400 bg-white/5 border border-white/10 rounded-lg font-medium hover:bg-white/10">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button className="px-4 py-2.5 text-red-400 bg-white/5 border border-white/10 rounded-lg font-medium hover:bg-red-500/10 hover:border-red-500/30">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
