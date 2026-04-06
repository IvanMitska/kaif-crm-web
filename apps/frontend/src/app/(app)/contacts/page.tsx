"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import {
  Search,
  Plus,
  MoreHorizontal,
  Phone,
  Mail,
  Building2,
  User,
  LayoutGrid,
  List,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Square,
  Minus,
  Eye,
  Pencil,
  Trash2,
  Calendar,
  MessageSquare,
  Star,
  StarOff,
  Filter,
  Download,
  Upload,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { contactsApi } from "@/lib/api";
import { ContactModal } from "@/components/contacts/ContactModal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string | { id: string; name: string };
  position?: string;
  tags?: string[];
  createdAt: string;
  isFavorite?: boolean;
}

const tagColors: Record<string, { bg: string; text: string }> = {
  "VIP": { bg: "bg-amber-500/20", text: "text-amber-400" },
  "Партнер": { bg: "bg-purple-500/20", text: "text-purple-400" },
  "Клиент": { bg: "bg-green-500/20", text: "text-green-400" },
  "Лид": { bg: "bg-violet-500/20", text: "text-violet-400" },
};

// Helper to get company name from string or object
const getCompanyName = (company?: string | { id: string; name: string }): string | undefined => {
  if (!company) return undefined;
  if (typeof company === "string") return company;
  return company.name;
};

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);

  // Fetch contacts from API
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const response = await contactsApi.getAll();
        const contactsData = response.data?.items || response.data || [];
        setContacts(Array.isArray(contactsData) ? contactsData as Contact[] : []);
      } catch (error) {
        console.error("Failed to fetch contacts:", error);
      }
    };
    fetchContacts();
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<string>("lastName");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingContact, setDeletingContact] = useState<Contact | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Memoized filtered and sorted contacts
  const sortedContacts = useMemo(() => {
    const filtered = contacts.filter((contact) => {
      const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
      const query = searchQuery.toLowerCase();
      return (
        fullName.includes(query) ||
        contact.email?.toLowerCase().includes(query) ||
        contact.phone?.includes(query) ||
        getCompanyName(contact.company)?.toLowerCase().includes(query)
      );
    });

    return [...filtered].sort((a, b) => {
      let aVal = "", bVal = "";
      if (sortField === "name") {
        aVal = `${a.lastName} ${a.firstName}`;
        bVal = `${b.lastName} ${b.firstName}`;
      } else if (sortField === "company") {
        aVal = getCompanyName(a.company) || "";
        bVal = getCompanyName(b.company) || "";
      } else if (sortField === "createdAt") {
        aVal = a.createdAt;
        bVal = b.createdAt;
      }
      return sortOrder === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
  }, [contacts, searchQuery, sortField, sortOrder]);

  const filteredContacts = sortedContacts;

  const toggleSelectAll = () => {
    if (selectedContacts.size === filteredContacts.length) {
      setSelectedContacts(new Set());
    } else {
      setSelectedContacts(new Set(filteredContacts.map((c) => c.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedContacts);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedContacts(newSelected);
  };

  const toggleFavorite = (id: string) => {
    setContacts(contacts.map(c => c.id === id ? { ...c, isFavorite: !c.isFavorite } : c));
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
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
    setEditingContact(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (contact: Contact) => {
    setEditingContact(contact);
    setIsModalOpen(true);
    setOpenDropdown(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingContact(null);
  };

  const handleSaveContact = async (contactData: any) => {
    setIsSaving(true);
    try {
      if (editingContact?.id) {
        // Update existing contact via API
        const response = await contactsApi.update(editingContact.id, contactData);
        const updatedContact = response.data;
        setContacts(contacts.map(c => c.id === editingContact.id ? { ...c, ...updatedContact } : c));
      } else {
        // Create new contact via API
        const response = await contactsApi.create(contactData);
        const newContact = response.data;
        setContacts([newContact, ...contacts]);
      }
      handleCloseModal();
    } catch (error) {
      console.error("Failed to save contact:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete handlers
  const handleOpenDeleteDialog = (contact: Contact) => {
    setDeletingContact(contact);
    setIsDeleteDialogOpen(true);
    setOpenDropdown(null);
  };

  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setDeletingContact(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingContact) return;

    setIsDeleting(true);
    try {
      await contactsApi.delete(deletingContact.id);
      setContacts(contacts.filter(c => c.id !== deletingContact.id));
      if (selectedContact?.id === deletingContact.id) {
        setSelectedContact(null);
      }
      handleCloseDeleteDialog();
    } catch (error) {
      console.error("Failed to delete contact:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const totalContacts = contacts.length;
  const favoriteContacts = contacts.filter((c) => c.isFavorite).length;
  const withCompany = contacts.filter((c) => getCompanyName(c.company)).length;

  const isAllSelected = filteredContacts.length > 0 && selectedContacts.size === filteredContacts.length;
  const isSomeSelected = selectedContacts.size > 0 && selectedContacts.size < filteredContacts.length;


  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 glass-card border-b border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
            <h1 className="text-xl sm:text-2xl font-bold text-white">Контакты</h1>

            {/* Stats Pills - hidden on mobile */}
            <div className="hidden lg:flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400">Всего</span>
                <span className="text-sm font-bold text-white">{totalContacts}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 rounded-lg">
                <Star className="w-4 h-4 text-amber-500" />
                <span className="text-sm text-amber-400">Избранные</span>
                <span className="text-sm font-bold text-amber-400">{favoriteContacts}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-violet-500/10 rounded-lg">
                <Building2 className="w-4 h-4 text-violet-500" />
                <span className="text-sm text-violet-400">С компанией</span>
                <span className="text-sm font-bold text-violet-400">{withCompany}</span>
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
                className="w-full sm:w-48 lg:w-72 pl-10 pr-4 py-2.5 bg-white/5 rounded-xl text-sm text-white placeholder-gray-400 border border-white/10 focus:ring-2 focus:ring-violet-500 focus:border-transparent focus:bg-white/10"
              />
            </div>

            {/* Filter */}
            <button className="p-2.5 hover:bg-white/5 rounded-xl">
              <Filter className="w-5 h-5 text-gray-400" />
            </button>

            {/* View Toggle */}
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

            {/* Import/Export - hidden on mobile */}
            <button className="hidden sm:block p-2.5 hover:bg-white/5 rounded-xl">
              <Download className="w-5 h-5 text-gray-400" />
            </button>
            <button className="hidden sm:block p-2.5 hover:bg-white/5 rounded-xl">
              <Upload className="w-5 h-5 text-gray-400" />
            </button>

            {/* Add Button */}
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-violet-500 text-white rounded-xl text-sm font-semibold hover:bg-purple-500 shadow-sm"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Новый контакт</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex">
        {viewMode === "table" ? (
          /* Table View - hidden on small mobile, show scrollable table */
          <div className="flex-1 flex flex-col">
            {/* Table Header */}
            <div className="glass-card border-b border-white/10 sticky top-0 z-10 overflow-x-auto">
              <div className="flex items-center h-12 text-sm min-w-[900px]">
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
                  className="flex-1 min-w-[200px] flex items-center gap-2 px-4 h-full hover:bg-white/5 text-left"
                >
                  <span className="font-semibold text-gray-300">Контакт</span>
                  {sortField === "name" && (
                    sortOrder === "asc" ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </button>

                <button
                  onClick={() => handleSort("company")}
                  className="w-[180px] flex items-center gap-2 px-4 h-full hover:bg-white/5 border-l border-white/5"
                >
                  <span className="font-semibold text-gray-300">Компания</span>
                  {sortField === "company" && (
                    sortOrder === "asc" ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </button>

                <div className="w-[200px] flex items-center px-4 h-full border-l border-white/5">
                  <span className="font-semibold text-gray-300">Контактные данные</span>
                </div>

                <div className="w-[140px] flex items-center px-4 h-full border-l border-white/5">
                  <span className="font-semibold text-gray-300">Теги</span>
                </div>

                <button
                  onClick={() => handleSort("createdAt")}
                  className="w-[130px] flex items-center gap-2 px-4 h-full hover:bg-white/5 border-l border-white/5"
                >
                  <span className="font-semibold text-gray-300">Добавлен</span>
                  {sortField === "createdAt" && (
                    sortOrder === "asc" ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Table Body */}
            <div className="flex-1 overflow-x-auto overflow-y-auto glass-card">
              <div className="min-w-[900px]">
              {sortedContacts.map((contact, index) => {
                const isSelected = selectedContacts.has(contact.id);

                return (
                  <div
                    key={contact.id}
                    className={cn(
                      "flex items-center min-h-[72px] border-b border-white/5 hover:bg-white/5 cursor-pointer",
                      isSelected ? "bg-violet-500/10" : index % 2 === 1 ? "bg-white/[0.02]" : ""
                    )}
                    onClick={() => setSelectedContact(contact)}
                  >
                    {/* Checkbox */}
                    <div className="w-12 flex items-center justify-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleSelect(contact.id); }}
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
                    <div className="w-10 flex items-center justify-center relative" ref={openDropdown === contact.id ? dropdownRef : null}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDropdown(openDropdown === contact.id ? null : contact.id);
                        }}
                        className={cn(
                          "p-1.5 hover:bg-white/5 rounded",
                          openDropdown === contact.id && "bg-white/5"
                        )}
                      >
                        <MoreHorizontal className="w-4 h-4 text-gray-400" />
                      </button>

                      {openDropdown === contact.id && (
                        <div className="absolute left-0 top-full mt-1 w-56 glass-card rounded-xl shadow-lg border border-white/10 py-1 z-50">
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedContact(contact); setOpenDropdown(null); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5"
                          >
                            <Eye className="w-4 h-4 text-gray-400" />
                            Просмотреть
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleOpenEditModal(contact); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5"
                          >
                            <Pencil className="w-4 h-4 text-gray-400" />
                            Редактировать
                          </button>
                          <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5">
                            <MessageSquare className="w-4 h-4 text-gray-400" />
                            Написать
                          </button>
                          <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            Запланировать
                          </button>
                          <div className="border-t border-white/5 my-1" />
                          <button
                            onClick={(e) => { e.stopPropagation(); handleOpenDeleteDialog(contact); }}
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
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(contact.id); }}
                        className="p-1 hover:bg-white/5 rounded"
                      >
                        {contact.isFavorite ? (
                          <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                        ) : (
                          <StarOff className="w-5 h-5 text-gray-500 hover:text-gray-400" />
                        )}
                      </button>
                    </div>

                    {/* Contact Name */}
                    <div className="flex-1 min-w-[200px] px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white text-sm font-semibold">
                          {contact.firstName[0]}{contact.lastName[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-white">
                            {contact.firstName} {contact.lastName}
                          </p>
                          {contact.position && (
                            <p className="text-xs text-gray-400">{contact.position}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Company */}
                    <div className="w-[180px] px-4">
                      {getCompanyName(contact.company) ? (
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-300 truncate">{getCompanyName(contact.company)}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">—</span>
                      )}
                    </div>

                    {/* Contact Info */}
                    <div className="w-[200px] px-4 space-y-1">
                      {contact.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-sm text-gray-400 truncate">{contact.email}</span>
                        </div>
                      )}
                      {contact.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-sm text-white font-medium">{contact.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    <div className="w-[140px] px-4">
                      <div className="flex flex-wrap gap-1">
                        {contact.tags?.map((tag: string) => {
                          const colors = tagColors[tag] || { bg: "bg-white/10", text: "text-gray-300" };
                          return (
                            <span
                              key={tag}
                              className={cn(
                                "px-2 py-0.5 rounded-md text-xs font-medium",
                                colors.bg,
                                colors.text
                              )}
                            >
                              {tag}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Date */}
                    <div className="w-[130px] px-4">
                      <span className="text-sm text-gray-400">{formatDate(contact.createdAt)}</span>
                    </div>
                  </div>
                );
              })}

              {sortedContacts.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                    <User className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-400 font-medium">Контакты не найдены</p>
                </div>
              )}
              </div>
            </div>

            {/* Selected Actions Bar */}
            {selectedContacts.size > 0 && (
              <div className="bg-violet-500 text-white px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2">
                <span className="font-medium text-sm sm:text-base whitespace-nowrap">Выбрано: {selectedContacts.size}</span>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button className="hidden sm:block px-4 py-1.5 bg-white/20 rounded-lg text-sm font-medium hover:bg-white/30">
                    Добавить тег
                  </button>
                  <button className="hidden sm:block px-4 py-1.5 bg-white/20 rounded-lg text-sm font-medium hover:bg-white/30">
                    Экспорт
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {sortedContacts.map((contact) => (
                <div
                  key={contact.id}
                  className="glass-card rounded-2xl p-5 border border-white/10 hover:border-violet-500/50 cursor-pointer"
                  onClick={() => setSelectedContact(contact)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                        {contact.firstName[0]}{contact.lastName[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-white">
                          {contact.firstName} {contact.lastName}
                        </p>
                        {contact.position && (
                          <p className="text-xs text-gray-400">{contact.position}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(contact.id); }}
                      className="p-1"
                    >
                      {contact.isFavorite ? (
                        <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                      ) : (
                        <StarOff className="w-5 h-5 text-gray-500" />
                      )}
                    </button>
                  </div>

                  {getCompanyName(contact.company) && (
                    <div className="flex items-center gap-2 mb-3">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-400">{getCompanyName(contact.company)}</span>
                    </div>
                  )}

                  <div className="space-y-2 mb-4">
                    {contact.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-400 truncate">{contact.email}</span>
                      </div>
                    )}
                    {contact.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-white font-medium">{contact.phone}</span>
                      </div>
                    )}
                  </div>

                  {contact.tags && contact.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {contact.tags.map((tag: string) => {
                        const colors = tagColors[tag] || { bg: "bg-white/10", text: "text-gray-300" };
                        return (
                          <span
                            key={tag}
                            className={cn(
                              "px-2 py-0.5 rounded-md text-xs font-medium",
                              colors.bg,
                              colors.text
                            )}
                          >
                            {tag}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contact Details Sidebar */}
        {selectedContact && (
          <>
            {/* Mobile backdrop */}
            <div
              className="fixed inset-0 bg-black/50 z-[60] md:hidden"
              onClick={() => setSelectedContact(null)}
            />
            <div className="fixed inset-0 md:inset-auto md:relative md:w-96 w-full glass-card md:border-l border-white/10 flex flex-col z-[70]">
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="font-semibold text-white">Профиль контакта</h3>
                <button
                  onClick={() => setSelectedContact(null)}
                  className="p-1.5 hover:bg-white/5 rounded-lg"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

            <div className="flex-1 overflow-auto p-6">
              {/* Avatar & Name */}
              <div className="flex flex-col items-center mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white text-2xl font-semibold mb-3">
                  {selectedContact.firstName[0]}{selectedContact.lastName[0]}
                </div>
                <h2 className="text-xl font-bold text-white">
                  {selectedContact.firstName} {selectedContact.lastName}
                </h2>
                {selectedContact.position && (
                  <p className="text-sm text-gray-400">{selectedContact.position}</p>
                )}
              </div>

              {/* Quick Actions */}
              <div className="flex justify-center gap-2 mb-6">
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-500 text-white rounded-xl font-medium hover:bg-purple-500">
                  <Phone className="w-4 h-4" />
                  Позвонить
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 text-gray-300 rounded-xl font-medium hover:bg-white/10">
                  <Mail className="w-4 h-4" />
                  Написать
                </button>
              </div>

              {/* Contact Info */}
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Контактная информация</p>
                  <div className="bg-white/5 rounded-xl p-4 space-y-3">
                    {selectedContact.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Email</p>
                          <p className="text-sm font-medium text-white">{selectedContact.email}</p>
                        </div>
                      </div>
                    )}
                    {selectedContact.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Телефон</p>
                          <p className="text-sm font-medium text-white">{selectedContact.phone}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {getCompanyName(selectedContact.company) && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Компания</p>
                    <div className="bg-white/5 rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        <Building2 className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-white">{getCompanyName(selectedContact.company)}</p>
                          {selectedContact.position && (
                            <p className="text-xs text-gray-400">{selectedContact.position}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedContact.tags && selectedContact.tags.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Теги</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedContact.tags.map((tag: string) => {
                        const colors = tagColors[tag] || { bg: "bg-white/10", text: "text-gray-300" };
                        return (
                          <span
                            key={tag}
                            className={cn(
                              "px-3 py-1 rounded-lg text-sm font-medium",
                              colors.bg,
                              colors.text
                            )}
                          >
                            {tag}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Информация</p>
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Добавлен</p>
                        <p className="text-sm font-medium text-white">{formatDate(selectedContact.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-white/10 space-y-2">
              <button
                onClick={() => handleOpenEditModal(selectedContact)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-500 text-white hover:bg-purple-500 rounded-xl font-medium"
              >
                <Pencil className="w-4 h-4" />
                Редактировать
              </button>
              <button
                onClick={() => handleOpenDeleteDialog(selectedContact)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-red-400 hover:bg-red-500/10 rounded-xl font-medium"
              >
                <Trash2 className="w-4 h-4" />
                Удалить контакт
              </button>
            </div>
            </div>
          </>
        )}
      </div>

      {/* Contact Modal */}
      <ContactModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveContact}
        contact={editingContact}
        isLoading={isSaving}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleConfirmDelete}
        title="Удалить контакт?"
        description={`Вы уверены, что хотите удалить контакт "${deletingContact?.firstName} ${deletingContact?.lastName}"? Это действие нельзя отменить.`}
        confirmText="Удалить"
        cancelText="Отмена"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
