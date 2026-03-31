"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  Loader2,
  RefreshCw,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usersApi, invitationsApi } from "@/lib/api";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: "ADMIN" | "SUPERVISOR" | "MANAGER" | "OPERATOR";
  isActive: boolean;
  lastLoginAt?: string;
  lastActivityAt?: string;
  createdAt: string;
  updatedAt?: string;
}

const roleConfig: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
  ADMIN: { label: "Администратор", color: "text-red-400", bgColor: "bg-red-500/20", icon: Crown },
  SUPERVISOR: { label: "Супервайзер", color: "text-purple-400", bgColor: "bg-purple-500/20", icon: ShieldCheck },
  MANAGER: { label: "Менеджер", color: "text-violet-400", bgColor: "bg-violet-500/20", icon: BadgeCheck },
  OPERATOR: { label: "Оператор", color: "text-green-400", bgColor: "bg-green-500/20", icon: Shield },
};

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  active: { label: "Активен", color: "text-green-400", bgColor: "bg-green-500/20" },
  inactive: { label: "Неактивен", color: "text-gray-400", bgColor: "bg-white/10" },
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<string>("lastName");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [filterRole, setFilterRole] = useState<string>("all");
  const [perPage, setPerPage] = useState(20);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("OPERATOR");
  const [inviting, setInviting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Employee | null>(null);
  const [roleChangeEmployee, setRoleChangeEmployee] = useState<Employee | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [usersResponse, onlineResponse] = await Promise.all([
        usersApi.getAll(),
        usersApi.getOnline(),
      ]);
      // Safely extract data - handle different response formats
      const usersData = usersResponse?.data?.data || usersResponse?.data || [];
      const onlineData = onlineResponse?.data?.data || onlineResponse?.data || [];

      setEmployees(Array.isArray(usersData) ? usersData : []);
      const onlineIds = new Set<string>(
        Array.isArray(onlineData) ? onlineData.map((u: any) => u.id) : []
      );
      setOnlineUserIds(onlineIds);
    } catch (err: any) {
      setError(err.response?.data?.message || "Ошибка загрузки сотрудников");
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Refresh online status every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await usersApi.getOnline();
        const onlineData = response?.data?.data || response?.data || [];
        const onlineIds = new Set<string>(
          Array.isArray(onlineData) ? onlineData.map((u: any) => u.id) : []
        );
        setOnlineUserIds(onlineIds);
      } catch (err) {
        // Silently fail for polling
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggleActive = async (employee: Employee) => {
    try {
      await usersApi.toggleActive(employee.id);
      setEmployees(employees.map(e =>
        e.id === employee.id ? { ...e, isActive: !e.isActive } : e
      ));
      setOpenDropdown(null);
    } catch (err: any) {
      alert(err.response?.data?.message || "Ошибка изменения статуса");
    }
  };

  const handleChangeRole = async (employee: Employee, newRole: string) => {
    try {
      await usersApi.updateRole(employee.id, newRole);
      setEmployees(employees.map(e =>
        e.id === employee.id ? { ...e, role: newRole as Employee["role"] } : e
      ));
      setRoleChangeEmployee(null);
      setOpenDropdown(null);
    } catch (err: any) {
      alert(err.response?.data?.message || "Ошибка изменения роли");
    }
  };

  const handleDelete = async (employee: Employee) => {
    try {
      await usersApi.delete(employee.id);
      setEmployees(employees.filter(e => e.id !== employee.id));
      setConfirmDelete(null);
      setSelectedEmployee(null);
      setOpenDropdown(null);
    } catch (err: any) {
      alert(err.response?.data?.message || "Ошибка удаления сотрудника");
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    try {
      setInviting(true);
      const response = await invitationsApi.create({ email: inviteEmail, role: inviteRole });
      alert(`Приглашение отправлено!\n\nСсылка для регистрации:\n${response.data.inviteUrl}`);
      setShowInviteModal(false);
      setInviteEmail("");
      setInviteRole("OPERATOR");
    } catch (err: any) {
      alert(err.response?.data?.message || "Ошибка отправки приглашения");
    } finally {
      setInviting(false);
    }
  };

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      employee.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = filterRole === "all" || employee.role === filterRole;

    return matchesSearch && matchesRole;
  });

  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
    let aVal: string | number = "";
    let bVal: string | number = "";

    if (sortField === "lastName") {
      aVal = a.lastName;
      bVal = b.lastName;
    } else if (sortField === "role") {
      aVal = a.role;
      bVal = b.role;
    } else if (sortField === "lastActivity") {
      aVal = a.lastActivityAt || a.lastLoginAt || "";
      bVal = b.lastActivityAt || b.lastLoginAt || "";
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
  const activeEmployees = employees.filter((e) => e.isActive).length;
  const admins = employees.filter((e) => e.role === "ADMIN").length;
  const onlineCount = onlineUserIds.size;

  const isAllSelected = filteredEmployees.length > 0 && selectedEmployees.size === filteredEmployees.length;
  const isSomeSelected = selectedEmployees.size > 0 && selectedEmployees.size < filteredEmployees.length;

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
          <p className="text-gray-400">Загрузка сотрудников...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
            <X className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-red-400">{error}</p>
          <button
            onClick={fetchEmployees}
            className="flex items-center gap-2 px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-purple-500"
          >
            <RefreshCw className="w-4 h-4" />
            Повторить
          </button>
        </div>
      </div>
    );
  }

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
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm text-green-400">Онлайн</span>
                <span className="text-sm font-bold text-green-400">{onlineCount}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-violet-500/20 rounded-lg">
                <Shield className="w-4 h-4 text-violet-400" />
                <span className="text-sm text-violet-400">Активных</span>
                <span className="text-sm font-bold text-violet-400">{activeEmployees}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 rounded-lg">
                <Crown className="w-4 h-4 text-red-400" />
                <span className="text-sm text-red-400">Админов</span>
                <span className="text-sm font-bold text-red-400">{admins}</span>
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

            {/* Role Filter */}
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-2.5 bg-white/5 rounded-xl text-sm text-white border-0 focus:ring-2 focus:ring-violet-500 focus:bg-white/10"
            >
              <option value="all">Все роли</option>
              <option value="ADMIN">Администраторы</option>
              <option value="SUPERVISOR">Супервайзеры</option>
              <option value="MANAGER">Менеджеры</option>
              <option value="OPERATOR">Операторы</option>
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

            {/* Refresh */}
            <button
              onClick={fetchEmployees}
              className="p-2.5 hover:bg-white/5 rounded-xl"
            >
              <RefreshCw className="w-5 h-5 text-gray-400" />
            </button>

            {/* Export */}
            <button className="p-2.5 hover:bg-white/5 rounded-xl">
              <Download className="w-5 h-5 text-gray-400" />
            </button>

            {/* Add Button */}
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-violet-500 text-white rounded-xl text-sm font-semibold hover:bg-purple-500 shadow-sm"
            >
              <UserPlus className="w-5 h-5" />
              Пригласить
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
                  onClick={() => handleSort("role")}
                  className="w-[150px] flex items-center gap-2 px-4 h-full hover:bg-white/5 border-r border-white/5"
                >
                  <span className="font-semibold text-gray-300">Роль</span>
                  {sortField === "role" && (
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
                  <span className="font-semibold text-gray-300">Последний вход</span>
                  {sortField === "lastActivity" && (
                    sortOrder === "asc" ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </button>

                <div className="w-[100px] flex items-center px-4 h-full">
                  <span className="font-semibold text-gray-300">Статус</span>
                </div>
              </div>
            </div>

            {/* Table Body */}
            <div className="flex-1 overflow-auto glass-card">
              {sortedEmployees.map((employee, index) => {
                const isSelected = selectedEmployees.has(employee.id);
                const role = roleConfig[employee.role];
                const isOnline = onlineUserIds.has(employee.id);

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
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedEmployee(employee); setOpenDropdown(null); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5"
                          >
                            <Eye className="w-4 h-4 text-gray-400" />
                            Просмотреть профиль
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setRoleChangeEmployee(employee); setOpenDropdown(null); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5"
                          >
                            <UserCog className="w-4 h-4 text-gray-400" />
                            Изменить роль
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleToggleActive(employee); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5"
                          >
                            <Shield className="w-4 h-4 text-gray-400" />
                            {employee.isActive ? "Деактивировать" : "Активировать"}
                          </button>
                          <div className="border-t border-white/5 my-1" />
                          <button
                            onClick={(e) => { e.stopPropagation(); setConfirmDelete(employee); setOpenDropdown(null); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                            Удалить
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
                          {isOnline && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[#0B0E14]" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-white">
                            {employee.firstName} {employee.lastName}
                          </p>
                          <p className={cn("text-xs font-medium", role.color)}>
                            {role.label}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Role */}
                    <div className="w-[150px] px-4 border-r border-white/5">
                      <span className={cn("px-2.5 py-1 rounded-lg text-xs font-medium", role.bgColor, role.color)}>
                        {role.label}
                      </span>
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
                      <span className="text-sm text-gray-400">{formatDate(employee.lastLoginAt)}</span>
                    </div>

                    {/* Status */}
                    <div className="w-[100px] px-4">
                      {employee.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-500/20 text-green-400 rounded-lg text-xs font-medium">
                          Активен
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-500/20 text-gray-400 rounded-lg text-xs font-medium">
                          Неактивен
                        </span>
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
                  <span className="font-medium">ВСЕГО:</span> {totalEmployees}
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
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-4 py-1.5 bg-white/20 rounded-lg text-sm font-medium hover:bg-white/30">
                    Экспорт
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
                const RoleIcon = role.icon;
                const isOnline = onlineUserIds.has(employee.id);

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
                        {isOnline && (
                          <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-[#0B0E14]" />
                        )}
                      </div>
                      <p className="font-semibold text-white text-center">
                        {employee.firstName} {employee.lastName}
                      </p>
                      <p className="text-xs text-gray-400 text-center">{role.label}</p>
                    </div>

                    <div className="flex items-center justify-center gap-2 mb-4">
                      <span className={cn("px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1", role.bgColor, role.color)}>
                        <RoleIcon className="w-3.5 h-3.5" />
                        {role.label}
                      </span>
                      <span className={cn(
                        "px-2.5 py-1 rounded-lg text-xs font-medium",
                        employee.isActive ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"
                      )}>
                        {employee.isActive ? "Активен" : "Неактивен"}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
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
                        {employee.lastLoginAt ? formatDate(employee.lastLoginAt).split(",")[0] : "—"}
                      </span>
                      {isOnline && (
                        <span className="flex items-center gap-1 text-green-400">
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                          Онлайн
                        </span>
                      )}
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
                  Активность
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
                        onlineUserIds.has(selectedEmployee.id)
                          ? "bg-green-500 text-white"
                          : "bg-gray-500 text-white"
                      )}>
                        <span className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          onlineUserIds.has(selectedEmployee.id) ? "bg-white animate-pulse" : "bg-white/60"
                        )} />
                        {onlineUserIds.has(selectedEmployee.id) ? "В сети" : "Не в сети"}
                      </div>
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

                        {selectedEmployee.phone && (
                          <div>
                            <p className="text-xs text-gray-400 mb-0.5">Телефон</p>
                            <p className="text-sm text-white">{selectedEmployee.phone}</p>
                          </div>
                        )}

                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">Роль</p>
                          <p className="text-sm text-white">{roleConfig[selectedEmployee.role].label}</p>
                        </div>

                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">Статус</p>
                          <p className={cn(
                            "text-sm",
                            selectedEmployee.isActive ? "text-green-400" : "text-gray-400"
                          )}>
                            {selectedEmployee.isActive ? "Активен" : "Неактивен"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Activity section */}
                <div className="px-6 pb-6 space-y-4">
                  <div className="bg-white/5 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-white mb-3">Активность</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">Последний вход</span>
                        <span className="text-sm text-white">{formatDate(selectedEmployee.lastLoginAt)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">Зарегистрирован</span>
                        <span className="text-sm text-white">{formatShortDate(selectedEmployee.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-4 border-t border-white/5 bg-white/[0.02]">
                <div className="flex gap-3">
                  <button
                    onClick={() => setRoleChangeEmployee(selectedEmployee)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-500 text-white rounded-lg font-medium hover:bg-purple-500"
                  >
                    <UserCog className="w-4 h-4" />
                    Изменить роль
                  </button>
                  <button
                    onClick={() => handleToggleActive(selectedEmployee)}
                    className="px-4 py-2.5 text-gray-400 bg-white/5 border border-white/10 rounded-lg font-medium hover:bg-white/10"
                  >
                    <Shield className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(selectedEmployee)}
                    className="px-4 py-2.5 text-red-400 bg-white/5 border border-white/10 rounded-lg font-medium hover:bg-red-500/10 hover:border-red-500/30"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Invite Modal */}
        {showInviteModal && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-[60]"
              onClick={() => setShowInviteModal(false)}
            />
            <div className="fixed inset-0 flex items-center justify-center z-[70] p-4">
              <div className="w-full max-w-md glass-card rounded-2xl shadow-2xl border border-white/10">
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                  <h3 className="text-lg font-semibold text-white">Пригласить сотрудника</h3>
                  <button
                    onClick={() => setShowInviteModal(false)}
                    className="w-8 h-8 flex items-center justify-center hover:bg-white/5 rounded-lg"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full px-4 py-3 bg-white/5 rounded-xl text-white border-0 focus:ring-2 focus:ring-violet-500 placeholder:text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Роль</label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 rounded-xl text-white border-0 focus:ring-2 focus:ring-violet-500"
                    >
                      <option value="OPERATOR">Оператор</option>
                      <option value="MANAGER">Менеджер</option>
                      <option value="SUPERVISOR">Супервайзер</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 px-6 py-4 border-t border-white/5">
                  <button
                    onClick={() => setShowInviteModal(false)}
                    className="flex-1 px-4 py-2.5 text-gray-400 bg-white/5 rounded-lg font-medium hover:bg-white/10"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleInvite}
                    disabled={inviting || !inviteEmail.trim()}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-500 text-white rounded-lg font-medium hover:bg-purple-500 disabled:opacity-50"
                  >
                    {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                    Отправить
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Role Change Modal */}
        {roleChangeEmployee && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-[80]"
              onClick={() => setRoleChangeEmployee(null)}
            />
            <div className="fixed inset-0 flex items-center justify-center z-[90] p-4">
              <div className="w-full max-w-md glass-card rounded-2xl shadow-2xl border border-white/10">
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                  <h3 className="text-lg font-semibold text-white">Изменить роль</h3>
                  <button
                    onClick={() => setRoleChangeEmployee(null)}
                    className="w-8 h-8 flex items-center justify-center hover:bg-white/5 rounded-lg"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
                <div className="p-6">
                  <p className="text-sm text-gray-400 mb-4">
                    Изменить роль для {roleChangeEmployee.firstName} {roleChangeEmployee.lastName}
                  </p>
                  <div className="space-y-2">
                    {Object.entries(roleConfig).map(([key, config]) => (
                      <button
                        key={key}
                        onClick={() => handleChangeRole(roleChangeEmployee, key)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors",
                          roleChangeEmployee.role === key
                            ? "border-violet-500 bg-violet-500/10"
                            : "border-white/10 hover:border-white/20 hover:bg-white/5"
                        )}
                      >
                        <config.icon className={cn("w-5 h-5", config.color)} />
                        <span className="text-white font-medium">{config.label}</span>
                        {roleChangeEmployee.role === key && (
                          <span className="ml-auto text-xs text-violet-400">Текущая</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Delete Confirmation */}
        {confirmDelete && (
          <ConfirmDialog
            isOpen={true}
            onClose={() => setConfirmDelete(null)}
            onConfirm={() => handleDelete(confirmDelete)}
            title="Удалить сотрудника?"
            description={`Вы уверены, что хотите удалить ${confirmDelete.firstName} ${confirmDelete.lastName}? Это действие нельзя отменить.`}
            confirmText="Удалить"
            cancelText="Отмена"
            variant="danger"
          />
        )}
      </div>
    </div>
  );
}
