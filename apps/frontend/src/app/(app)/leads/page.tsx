"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Search,
  Plus,
  MoreHorizontal,
  Phone,
  Mail,
  Globe,
  MessageSquare,
  Instagram,
  Loader2,
  Zap,
  ArrowRight,
  LayoutGrid,
  List,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Square,
  Minus,
  Eye,
  Pencil,
  Copy,
  Trash2,
  FileText,
  Calendar,
  ShoppingBag
} from "lucide-react";
import { leadsApi, usersApi, pipelinesApi, tasksApi, companiesApi } from "@/lib/api";
import { LeadModal } from "@/components/leads/LeadModal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";

interface Lead {
  id: string;
  name: string;
  source: string;
  status: string;
  email?: string;
  phone?: string;
  company?: string;
  description?: string;
  createdAt: string;
  assignedToId?: string;
  assignedTo?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

const leadStages = [
  { id: "NEW", name: "Новые", color: "#3B82F6", bg: "bg-blue-500" },
  { id: "IN_PROGRESS", name: "В работе", color: "#8B5CF6", bg: "bg-purple-500" },
  { id: "QUALIFIED", name: "Квалифицирован", color: "#F59E0B", bg: "bg-amber-500" },
  { id: "CONVERTED", name: "Конвертирован", color: "#10B981", bg: "bg-emerald-500" },
];

const sourceConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  website: { icon: Globe, color: "text-blue-400", bg: "bg-blue-500/20", label: "Сайт" },
  call: { icon: Phone, color: "text-green-400", bg: "bg-green-500/20", label: "Звонок" },
  email: { icon: Mail, color: "text-purple-400", bg: "bg-purple-500/20", label: "Email" },
  social: { icon: Instagram, color: "text-pink-400", bg: "bg-pink-500/20", label: "Соцсети" },
  telegram: { icon: MessageSquare, color: "text-sky-400", bg: "bg-sky-500/20", label: "Telegram" },
};

export default function LeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Task dialog (for "Запланировать")
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [taskPrefillTitle, setTaskPrefillTitle] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"kanban" | "list">("list");
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Delete confirmation states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingLead, setDeletingLead] = useState<Lead | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
        setOpenSubmenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [leadsRes, usersRes, pipelinesRes] = await Promise.allSettled([
        leadsApi.getAll(),
        usersApi.getAll(),
        pipelinesApi.getAll(),
      ]);

      if (leadsRes.status === "fulfilled") {
        const leadsData = leadsRes.value.data.items || leadsRes.value.data || [];
        setLeads(Array.isArray(leadsData) ? leadsData : []);
      }

      if (usersRes.status === "fulfilled") {
        const usersData = usersRes.value.data.items || usersRes.value.data || [];
        setUsers(Array.isArray(usersData) ? usersData : []);
      }

      if (pipelinesRes.status === "fulfilled") {
        const pipelinesData = Array.isArray(pipelinesRes.value.data)
          ? pipelinesRes.value.data
          : [pipelinesRes.value.data];
        setPipelines(pipelinesData);
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLead = async (lead: Lead) => {
    const parts = [
      lead.name,
      lead.company && `Компания: ${lead.company}`,
      lead.email && `Email: ${lead.email}`,
      lead.phone && `Телефон: ${lead.phone}`,
    ].filter(Boolean);
    try {
      await navigator.clipboard.writeText(parts.join("\n"));
      toast.success("Данные лида скопированы");
    } catch {
      toast.error("Не удалось скопировать");
    }
    setOpenDropdown(null);
    setOpenSubmenu(null);
  };

  const handleConvertToDeal = async (lead: Lead) => {
    const firstStage = pipelines[0]?.stages?.sort((a: any, b: any) => a.order - b.order)?.[0];
    if (!firstStage) {
      toast.error("Нет доступных этапов воронки");
      return;
    }
    try {
      await leadsApi.convert(lead.id, {
        createDeal: true,
        stageId: firstStage.id,
        dealTitle: `Сделка от лида: ${lead.name}`,
      });
      toast.success("Создана сделка и контакт");
      await fetchData();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Не удалось конвертировать");
    }
    setOpenDropdown(null);
    setOpenSubmenu(null);
  };

  const handleConvertToContact = async (lead: Lead) => {
    try {
      const res = await leadsApi.convert(lead.id, {});
      toast.success("Создан контакт");
      await fetchData();
      if (res.data?.contact?.id) {
        router.push(`/contacts`);
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Не удалось конвертировать");
    }
    setOpenDropdown(null);
    setOpenSubmenu(null);
  };

  const handleCreateCompany = async (lead: Lead) => {
    if (!lead.company) {
      toast.error("У лида не указана компания");
      return;
    }
    try {
      await companiesApi.create({
        name: lead.company,
        email: lead.email,
        phone: lead.phone,
      });
      toast.success("Компания создана");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Не удалось создать компанию");
    }
    setOpenDropdown(null);
    setOpenSubmenu(null);
  };

  const handleScheduleTask = (lead: Lead, type: "call" | "meeting" | "task" | "email") => {
    const titles = {
      call: `Позвонить: ${lead.name}`,
      meeting: `Встреча: ${lead.name}`,
      task: `Задача: ${lead.name}`,
      email: `Написать email: ${lead.name}`,
    };
    setTaskPrefillTitle(titles[type]);
    setIsTaskDialogOpen(true);
    setOpenDropdown(null);
    setOpenSubmenu(null);
  };

  const handleTaskSubmit = async (taskData: any) => {
    try {
      const payload: any = {
        title: taskData.title,
        description: taskData.description,
        priority: taskData.priority,
        status: taskData.status,
        dueDate: taskData.dueDate,
      };
      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
      await tasksApi.create(payload);
      toast.success("Задача создана");
      setIsTaskDialogOpen(false);
      setTaskPrefillTitle("");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Не удалось создать задачу");
    }
  };

  const getUserById = (userId?: string) => {
    if (!userId) return null;
    return users.find(u => u.id === userId);
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0) || "";
    const last = lastName?.charAt(0) || "";
    return (first + last).toUpperCase() || "?";
  };

  const handleCreateLead = () => {
    setEditingLead(null);
    setIsModalOpen(true);
  };

  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead);
    setIsModalOpen(true);
    setOpenDropdown(null);
  };

  const handleSaveLead = async (leadData: any) => {
    setIsSaving(true);
    try {
      if (editingLead?.id) {
        // Update existing lead
        const response = await leadsApi.update(editingLead.id, leadData);
        const updatedLead = response.data;
        setLeads(leads.map(l => l.id === editingLead.id ? updatedLead : l));
      } else {
        // Create new lead
        const response = await leadsApi.create(leadData);
        const newLead = response.data;
        setLeads([newLead, ...leads]);
      }
      setIsModalOpen(false);
      setEditingLead(null);
    } catch (err) {
      console.error("Failed to save lead:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (lead: Lead) => {
    setDeletingLead(lead);
    setIsDeleteDialogOpen(true);
    setOpenDropdown(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingLead) return;

    setIsDeleting(true);
    try {
      await leadsApi.delete(deletingLead.id);
      setLeads(leads.filter(l => l.id !== deletingLead.id));
      setSelectedLeads(prev => {
        const newSet = new Set(prev);
        newSet.delete(deletingLead.id);
        return newSet;
      });
      setIsDeleteDialogOpen(false);
      setDeletingLead(null);
    } catch (err) {
      console.error("Failed to delete lead:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedLeads.size === 0) return;

    setIsDeleting(true);
    try {
      // Delete all selected leads
      await Promise.all(Array.from(selectedLeads).map(id => leadsApi.delete(id)));
      setLeads(leads.filter(l => !selectedLeads.has(l.id)));
      setSelectedLeads(new Set());
    } catch (err) {
      console.error("Failed to delete leads:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredLeads = leads.filter(
    (lead) =>
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone?.includes(searchQuery)
  );

  const getLeadsForStage = (stageId: string) => {
    return filteredLeads.filter((lead) => lead.status === stageId);
  };

  const getSource = (source: string) => sourceConfig[source] || sourceConfig.website;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  const toggleSelectAll = () => {
    if (selectedLeads.size === filteredLeads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(filteredLeads.map(l => l.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedLeads);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedLeads(newSelected);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const totalLeads = leads.length;
  const newLeads = leads.filter((l) => l.status === "NEW").length;
  const convertedLeads = leads.filter((l) => l.status === "CONVERTED").length;
  const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

  const isAllSelected = filteredLeads.length > 0 && selectedLeads.size === filteredLeads.length;
  const isSomeSelected = selectedLeads.size > 0 && selectedLeads.size < filteredLeads.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-full">
        <Loader2 className="w-8 h-8 text-violet-500" />
      </div>
    );
  }

  return (
    <div className="h-full min-h-full flex flex-col">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 glass-card border-b border-white/5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
            <h1 className="text-xl sm:text-2xl font-bold text-white">Лиды</h1>

            {/* Stats Pills - hidden on mobile */}
            <div className="hidden lg:flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg">
                <span className="text-sm text-gray-400">Всего</span>
                <span className="text-sm font-bold text-white">{totalLeads}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-violet-500/20 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-violet-500" />
                <span className="text-sm text-violet-300">Новых</span>
                <span className="text-sm font-bold text-violet-300">{newLeads}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 rounded-lg">
                <span className="text-sm text-emerald-300">Конверсия</span>
                <span className="text-sm font-bold text-emerald-300">{conversionRate}%</span>
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
                className="w-full sm:w-48 lg:w-72 pl-10 pr-4 py-2.5 bg-white/5 rounded-xl text-sm border border-white/10 text-white placeholder-gray-500 focus:ring-2 focus:ring-violet-500 focus:bg-white/10"
              />
            </div>

            {/* View Toggle - hidden on small mobile */}
            <div className="hidden sm:flex bg-white/5 rounded-xl p-1">
              <button
                onClick={() => setViewMode("kanban")}
                className={`p-2.5 rounded-lg ${
                  viewMode === "kanban"
                    ? "bg-white/10 shadow-sm text-white"
                    : "text-gray-400 hover:text-gray-300"
                }`}
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2.5 rounded-lg ${
                  viewMode === "list"
                    ? "bg-white/10 shadow-sm text-white"
                    : "text-gray-400 hover:text-gray-300"
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>

            {/* Add Button */}
            <button
              onClick={handleCreateLead}
              className="flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-violet-500 text-white rounded-xl text-sm font-semibold hover:bg-purple-500 shadow-sm"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Новый лид</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === "kanban" ? (
          /* Kanban View */
          <div className="flex gap-3 sm:gap-5 h-full overflow-x-auto p-4 sm:p-6 pb-4 snap-x snap-mandatory">
            {leadStages.map((stage) => {
              const stageLeads = getLeadsForStage(stage.id);

              return (
                <div
                  key={stage.id}
                  className="flex-shrink-0 w-[280px] sm:w-[300px] md:w-[320px] flex flex-col glass-card rounded-2xl snap-start"
                >
                  {/* Stage Header */}
                  <div className="p-4 border-b border-white/5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full ${stage.bg}`} />
                        <span className="font-bold text-white">{stage.name}</span>
                        <span className="px-2.5 py-1 bg-white/10 text-gray-300 text-sm font-semibold rounded-lg">
                          {stageLeads.length}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setEditingLead(null);
                          setIsModalOpen(true);
                        }}
                        className="p-2 hover:bg-white/5 rounded-lg"
                      >
                        <Plus className="w-5 h-5 text-gray-400" />
                      </button>
                    </div>
                  </div>

                  {/* Leads */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {stageLeads.map((lead) => {
                      const source = getSource(lead.source);
                      const SourceIcon = source.icon;
                      const assignedUser = lead.assignedTo || getUserById(lead.assignedToId);

                      return (
                        <div
                          key={lead.id}
                          onClick={() => handleEditLead(lead)}
                          className="glass-card rounded-xl p-4 border border-white/5 hover:border-violet-500/30 hover:shadow-lg cursor-pointer group"
                        >
                          {/* Source Badge */}
                          <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg ${source.bg} mb-3`}>
                            <SourceIcon className={`w-4 h-4 ${source.color}`} />
                            <span className={`text-xs font-semibold ${source.color}`}>{source.label}</span>
                          </div>

                          {/* Lead Title */}
                          <h4 className="font-semibold text-white text-[15px] leading-snug mb-3">
                            {lead.name}
                          </h4>

                          {/* Contact Info */}
                          <div className="space-y-2 mb-4">
                            {lead.email && (
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-300">{lead.email}</span>
                              </div>
                            )}
                            {lead.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-300 font-medium">{lead.phone}</span>
                              </div>
                            )}
                          </div>

                          {/* Footer */}
                          <div className="flex items-center justify-between pt-3 border-t border-white/5">
                            <div className="flex items-center gap-2">
                              {assignedUser ? (
                                <div className="w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center text-white text-xs font-semibold">
                                  {getInitials(assignedUser.firstName, assignedUser.lastName)}
                                </div>
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center text-gray-400 text-xs">
                                  —
                                </div>
                              )}
                              <span className="text-xs text-gray-400">{formatDate(lead.createdAt)}</span>
                            </div>
                            <button className="flex items-center gap-1 px-3 py-1.5 text-sm font-semibold text-violet-400 bg-violet-500/20 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-violet-500/30">
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {stageLeads.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                          <Zap className="w-6 h-6" />
                        </div>
                        <span className="text-sm">Нет лидов</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="h-full flex flex-col">
            {/* Table Header */}
            <div className="glass-card border-b border-white/5 sticky top-0 z-10 overflow-x-auto">
              <div className="flex items-center h-12 text-sm min-w-[1100px]">
                {/* Checkbox */}
                <div className="w-12 flex items-center justify-center">
                  <button
                    onClick={toggleSelectAll}
                    className="p-1 hover:bg-white/5 rounded"
                  >
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
                  onClick={() => handleSort("name")}
                  className="flex-1 min-w-[200px] flex items-center gap-2 px-4 h-full hover:bg-white/5 text-left"
                >
                  <span className="font-semibold text-gray-300">Лид</span>
                  {sortField === "name" && (
                    sortOrder === "asc" ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </button>

                <button
                  onClick={() => handleSort("status")}
                  className="w-[160px] flex items-center gap-2 px-4 h-full hover:bg-white/5 border-l border-white/5"
                >
                  <span className="font-semibold text-gray-300">Статус</span>
                  {sortField === "status" && (
                    sortOrder === "asc" ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </button>

                <div className="w-[120px] flex items-center px-4 h-full border-l border-white/5">
                  <span className="font-semibold text-gray-300">Задачи</span>
                </div>

                <div className="w-[200px] flex items-center px-4 h-full border-l border-white/5">
                  <span className="font-semibold text-gray-300">Контакт</span>
                </div>

                <button
                  onClick={() => handleSort("source")}
                  className="w-[140px] flex items-center gap-2 px-4 h-full hover:bg-white/5 border-l border-white/5"
                >
                  <span className="font-semibold text-gray-300">Источник</span>
                </button>

                <div className="w-[140px] flex items-center px-4 h-full border-l border-white/5">
                  <span className="font-semibold text-gray-300">Ответственный</span>
                </div>

                <button
                  onClick={() => handleSort("createdAt")}
                  className="w-[150px] flex items-center gap-2 px-4 h-full hover:bg-white/5 border-l border-white/5"
                >
                  <span className="font-semibold text-gray-300">Дата создания</span>
                  {sortField === "createdAt" && (
                    sortOrder === "asc" ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Table Body */}
            <div className="flex-1 overflow-x-auto overflow-y-auto">
              <div className="min-w-[1100px]">
              {filteredLeads.map((lead, index) => {
                const source = getSource(lead.source);
                const SourceIcon = source.icon;
                const stage = leadStages.find((s) => s.id === lead.status);
                const isSelected = selectedLeads.has(lead.id);
                const assignedUser = lead.assignedTo || getUserById(lead.assignedToId);

                return (
                  <div
                    key={lead.id}
                    className={`flex items-center min-h-[64px] border-b border-white/5 hover:bg-white/5 cursor-pointer ${
                      isSelected ? 'bg-violet-500/10' : index % 2 === 1 ? 'bg-white/[0.02]' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <div className="w-12 flex items-center justify-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleSelect(lead.id); }}
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
                    <div className="w-10 flex items-center justify-center relative" ref={openDropdown === lead.id ? dropdownRef : null}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDropdown(openDropdown === lead.id ? null : lead.id);
                          setOpenSubmenu(null);
                        }}
                        className={`p-1.5 hover:bg-white/5 rounded ${openDropdown === lead.id ? 'bg-white/5' : ''}`}
                      >
                        <MoreHorizontal className="w-4 h-4 text-gray-400" />
                      </button>

                      {/* Dropdown Menu */}
                      {openDropdown === lead.id && (
                        <div className="absolute left-0 top-full mt-1 w-64 glass-card rounded-xl shadow-lg border border-white/10 py-1 z-50">
                          <button
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5"
                            onClick={() => handleEditLead(lead)}
                          >
                            <Eye className="w-4 h-4 text-gray-400" />
                            Просмотреть
                          </button>
                          <button
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5"
                            onClick={() => handleEditLead(lead)}
                          >
                            <Pencil className="w-4 h-4 text-gray-400" />
                            Редактировать
                          </button>
                          <button
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5"
                            onClick={() => handleCopyLead(lead)}
                          >
                            <Copy className="w-4 h-4 text-gray-400" />
                            Копировать
                          </button>
                          <button
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10"
                            onClick={() => handleDeleteClick(lead)}
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                            Удалить
                          </button>

                          <div className="border-t border-white/5 my-1" />

                          {/* Submenu: Создать на основании */}
                          <div
                            className="relative"
                            onMouseEnter={() => setOpenSubmenu("create")}
                            onMouseLeave={() => setOpenSubmenu(null)}
                          >
                            <button className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5">
                              <div className="flex items-center gap-3 whitespace-nowrap">
                                <FileText className="w-4 h-4 text-gray-400" />
                                Создать на основании
                              </div>
                              <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                            </button>
                            {openSubmenu === "create" && (
                              <div className="absolute left-full top-0 ml-1 w-48 glass-card rounded-xl shadow-lg border border-white/10 py-1 z-50">
                                <button
                                  className="w-full flex items-center px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5"
                                  onClick={() => handleConvertToDeal(lead)}
                                >
                                  Сделку
                                </button>
                                <button
                                  className="w-full flex items-center px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5"
                                  onClick={() => handleConvertToContact(lead)}
                                >
                                  Контакт
                                </button>
                                <button
                                  className="w-full flex items-center px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5"
                                  onClick={() => handleCreateCompany(lead)}
                                >
                                  Компанию
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Submenu: Запланировать */}
                          <div
                            className="relative"
                            onMouseEnter={() => setOpenSubmenu("schedule")}
                            onMouseLeave={() => setOpenSubmenu(null)}
                          >
                            <button className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5">
                              <div className="flex items-center gap-3 whitespace-nowrap">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                Запланировать
                              </div>
                              <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                            </button>
                            {openSubmenu === "schedule" && (
                              <div className="absolute left-full top-0 ml-1 w-48 glass-card rounded-xl shadow-lg border border-white/10 py-1 z-50">
                                <button
                                  className="w-full flex items-center px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5"
                                  onClick={() => handleScheduleTask(lead, "call")}
                                >
                                  Звонок
                                </button>
                                <button
                                  className="w-full flex items-center px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5"
                                  onClick={() => handleScheduleTask(lead, "meeting")}
                                >
                                  Встречу
                                </button>
                                <button
                                  className="w-full flex items-center px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5"
                                  onClick={() => handleScheduleTask(lead, "task")}
                                >
                                  Задачу
                                </button>
                                <button
                                  className="w-full flex items-center px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5"
                                  onClick={() => handleScheduleTask(lead, "email")}
                                >
                                  Email
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="border-t border-white/5 my-1" />

                          <button
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5"
                            onClick={() => {
                              toast.info("Маркетплейс интеграций скоро появится");
                              setOpenDropdown(null);
                            }}
                          >
                            <ShoppingBag className="w-4 h-4 text-gray-400" />
                            Маркетплейс
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Lead Name */}
                    <div
                      className="flex-1 min-w-[200px] px-4 py-3"
                      onClick={() => handleEditLead(lead)}
                    >
                      <p className="font-semibold text-white truncate">{lead.name}</p>
                    </div>

                    {/* Status */}
                    <div className="w-[160px] px-4">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold"
                        style={{
                          backgroundColor: `${stage?.color}20`,
                          color: stage?.color,
                        }}
                      >
                        <div
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: stage?.color }}
                        />
                        {stage?.name}
                      </span>
                    </div>

                    {/* Tasks */}
                    <div className="w-[120px] px-4">
                      <span className="text-gray-500 text-sm">—</span>
                    </div>

                    {/* Contact */}
                    <div className="w-[200px] px-4">
                      <div className="space-y-0.5">
                        {lead.email && (
                          <p className="text-sm text-gray-400 truncate">{lead.email}</p>
                        )}
                        {lead.phone && (
                          <p className="text-sm text-white font-medium">{lead.phone}</p>
                        )}
                      </div>
                    </div>

                    {/* Source */}
                    <div className="w-[140px] px-4">
                      <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md ${source.bg}`}>
                        <SourceIcon className={`w-3.5 h-3.5 ${source.color}`} />
                        <span className={`text-xs font-medium ${source.color}`}>{source.label}</span>
                      </div>
                    </div>

                    {/* Responsible */}
                    <div className="w-[140px] px-4">
                      {assignedUser ? (
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white text-xs font-semibold">
                            {getInitials(assignedUser.firstName, assignedUser.lastName)}
                          </div>
                          <span className="text-sm text-gray-300">
                            {assignedUser.firstName} {assignedUser.lastName?.charAt(0)}.
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-500 text-sm">Не назначен</span>
                      )}
                    </div>

                    {/* Date */}
                    <div className="w-[150px] px-4">
                      <span className="text-sm text-gray-400">{formatDate(lead.createdAt)}</span>
                    </div>
                  </div>
                );
              })}

              {filteredLeads.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                    <Zap className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-400 font-medium">Лиды не найдены</p>
                </div>
              )}
              </div>
            </div>

            {/* Selected Actions Bar */}
            {selectedLeads.size > 0 && (
              <div className="bg-violet-500 text-white px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2">
                <span className="font-medium text-sm sm:text-base whitespace-nowrap">Выбрано: {selectedLeads.size}</span>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button className="hidden sm:block px-4 py-1.5 bg-white/20 rounded-lg text-sm font-medium hover:bg-white/30">
                    Изменить статус
                  </button>
                  <button className="hidden sm:block px-4 py-1.5 bg-white/20 rounded-lg text-sm font-medium hover:bg-white/30">
                    Назначить
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    disabled={isDeleting}
                    className="px-3 sm:px-4 py-1.5 bg-red-500 rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-50"
                  >
                    {isDeleting ? "..." : "Удалить"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lead Modal */}
      <LeadModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingLead(null);
        }}
        onSave={handleSaveLead}
        lead={editingLead}
        isLoading={isSaving}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setDeletingLead(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Удалить лид?"
        description={`Вы уверены, что хотите удалить лид "${deletingLead?.name}"? Это действие нельзя отменить.`}
        confirmText="Удалить"
        cancelText="Отмена"
        variant="danger"
        isLoading={isDeleting}
      />

      {/* Schedule task dialog */}
      <CreateTaskDialog
        open={isTaskDialogOpen}
        onOpenChange={(open) => {
          setIsTaskDialogOpen(open);
          if (!open) setTaskPrefillTitle("");
        }}
        onSubmit={handleTaskSubmit}
        prefillTitle={taskPrefillTitle}
      />
    </div>
  );
}
