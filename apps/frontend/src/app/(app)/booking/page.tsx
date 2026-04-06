"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  Stethoscope,
  Wrench,
  Users,
  Car,
  Building,
  MoreHorizontal,
  ListTodo,
  Settings2,
  Loader2,
  Clock,
  Check,
  XCircle,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useBookingResources, useBookings, useBookingStats, useWaitingList, useBookingServices } from "@/lib/hooks";
import { bookingApi } from "@/lib/api";
import { mutate } from "swr";

// Types
interface Resource {
  id: string;
  name: string;
  type: string;
  category: string;
  color: string;
  isActive: boolean;
  slotDuration: number;
  workingHours?: Record<string, any>;
}

interface Booking {
  id: string;
  title?: string;
  startTime: string;
  endTime: string;
  status: string;
  resourceId: string;
  serviceId?: string;
  contactId?: string;
  contact?: { firstName: string; lastName: string };
  service?: { name: string; color: string };
  notes?: string;
}

interface WaitingListItem {
  id: string;
  clientName?: string;
  clientPhone?: string;
  contact?: { firstName: string; lastName: string };
  resource?: { name: string };
  service?: { name: string };
  preferredDate?: string;
  notes?: string;
  status: string;
}

// Business categories for new resource modal
const businessCategories = [
  { id: "MEDICAL", name: "Медицинские услуги", description: "Врачи, косметологи, диагностика", icon: Stethoscope, color: "#3B82F6", type: "SPECIALIST" },
  { id: "EQUIPMENT", name: "Аренда оборудования", description: "Строительная техника, электроинструмент", icon: Wrench, color: "#F59E0B", type: "EQUIPMENT" },
  { id: "SERVICES", name: "Услуги специалистов", description: "Консалтинг, ремонт, бьюти-индустрия, фитнес", icon: Users, color: "#8B5CF6", type: "SPECIALIST" },
  { id: "TRANSPORT", name: "Аренда автомобилей", description: "Легковые и грузовые автомобили, мототехника", icon: Car, color: "#10B981", type: "VEHICLE" },
  { id: "REAL_ESTATE", name: "Аренда помещений", description: "Банкетные залы, квартиры и дома, фотостудии", icon: Building, color: "#EC4899", type: "ROOM" },
  { id: "OTHER", name: "Другое", description: "Прочие услуги и ресурсы", icon: MoreHorizontal, color: "#6B7280", type: "OTHER" },
];

// Time slots
const timeSlots = Array.from({ length: 15 }, (_, i) => {
  const hour = 7 + i;
  return `${hour.toString().padStart(2, "0")}:00`;
});

// Days of week
const daysOfWeek = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

// Get avatar initials from name
const getInitials = (name: string) => {
  const parts = name.split(" ");
  if (parts.length >= 2) {
    return parts[0][0] + parts[1][0];
  }
  return name.substring(0, 2).toUpperCase();
};

export default function BookingPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showNewResourceModal, setShowNewResourceModal] = useState(false);
  const [showNewResourceForm, setShowNewResourceForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<typeof businessCategories[0] | null>(null);
  const [newResourceName, setNewResourceName] = useState("");
  const [activeTab, setActiveTab] = useState<"schedule" | "services">("schedule");
  const [showResourcePanel, setShowResourcePanel] = useState(true);
  const [searchFilter, setSearchFilter] = useState("");
  const [isCreatingResource, setIsCreatingResource] = useState(false);

  // Booking modal state
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [bookingForm, setBookingForm] = useState({
    title: '',
    resourceId: '',
    serviceId: '',
    contactId: '',
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    startTime: '',
    endTime: '',
    notes: '',
  });
  const [isSavingBooking, setIsSavingBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Zoom state
  const [zoomLevel, setZoomLevel] = useState(100);

  // Calculate date range for fetching bookings
  const dateFrom = useMemo(() => {
    const d = new Date(selectedDate);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }, [selectedDate]);

  const dateTo = useMemo(() => {
    const d = new Date(selectedDate);
    d.setHours(23, 59, 59, 999);
    return d.toISOString();
  }, [selectedDate]);

  // Fetch data from API
  const { resources, isLoading: resourcesLoading, mutate: mutateResources } = useBookingResources({ isActive: true });
  const { bookings, isLoading: bookingsLoading, mutate: mutateBookings } = useBookings({ dateFrom, dateTo });
  const { stats } = useBookingStats();
  const { waitingList } = useWaitingList({ status: "PENDING" });
  const { services } = useBookingServices({ isActive: true });

  // Open booking modal for creating new booking
  const handleOpenNewBooking = (resourceId: string, hour: number) => {
    const startDate = new Date(selectedDate);
    startDate.setHours(hour, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setHours(hour + 1, 0, 0, 0);

    setEditingBooking(null);
    setBookingForm({
      title: '',
      resourceId,
      serviceId: '',
      contactId: '',
      clientName: '',
      clientPhone: '',
      clientEmail: '',
      startTime: startDate.toISOString().slice(0, 16),
      endTime: endDate.toISOString().slice(0, 16),
      notes: '',
    });
    setBookingError(null);
    setShowBookingModal(true);
  };

  // Open booking modal for editing existing booking
  const handleEditBooking = (booking: Booking) => {
    setEditingBooking(booking);
    setBookingForm({
      title: booking.title || '',
      resourceId: booking.resourceId,
      serviceId: booking.serviceId || '',
      contactId: booking.contactId || '',
      clientName: booking.contact ? `${booking.contact.firstName} ${booking.contact.lastName || ''}`.trim() : '',
      clientPhone: '',
      clientEmail: '',
      startTime: booking.startTime.slice(0, 16),
      endTime: booking.endTime.slice(0, 16),
      notes: booking.notes || '',
    });
    setBookingError(null);
    setShowBookingModal(true);
  };

  // Save booking (create or update)
  const handleSaveBooking = async () => {
    if (!bookingForm.resourceId || !bookingForm.startTime || !bookingForm.endTime) {
      setBookingError('Заполните обязательные поля');
      return;
    }

    setIsSavingBooking(true);
    setBookingError(null);

    try {
      const data = {
        title: bookingForm.title || undefined,
        resourceId: bookingForm.resourceId,
        serviceId: bookingForm.serviceId || undefined,
        contactId: bookingForm.contactId || undefined,
        clientName: bookingForm.clientName || undefined,
        clientPhone: bookingForm.clientPhone || undefined,
        clientEmail: bookingForm.clientEmail || undefined,
        startTime: new Date(bookingForm.startTime).toISOString(),
        endTime: new Date(bookingForm.endTime).toISOString(),
        notes: bookingForm.notes || undefined,
      };

      if (editingBooking) {
        await bookingApi.updateBooking(editingBooking.id, data);
      } else {
        await bookingApi.createBooking(data);
      }

      mutateBookings(undefined, true);
      setShowBookingModal(false);
    } catch (error: any) {
      console.error('Failed to save booking:', error);
      setBookingError(error.response?.data?.message || 'Ошибка сохранения записи');
    } finally {
      setIsSavingBooking(false);
    }
  };

  // Delete booking
  const handleDeleteBooking = async () => {
    if (!editingBooking) return;

    if (!confirm('Вы уверены, что хотите удалить эту запись?')) return;

    try {
      await bookingApi.deleteBooking(editingBooking.id);
      mutateBookings(undefined, true);
      setShowBookingModal(false);
    } catch (error) {
      console.error('Failed to delete booking:', error);
      setBookingError('Ошибка удаления записи');
    }
  };

  // Confirm booking
  const handleConfirmBooking = async () => {
    if (!editingBooking) return;

    try {
      await bookingApi.confirmBooking(editingBooking.id);
      mutateBookings(undefined, true);
      setShowBookingModal(false);
    } catch (error) {
      console.error('Failed to confirm booking:', error);
    }
  };

  // Cancel booking
  const handleCancelBooking = async () => {
    if (!editingBooking) return;

    try {
      await bookingApi.cancelBooking(editingBooking.id);
      mutateBookings(undefined, true);
      setShowBookingModal(false);
    } catch (error) {
      console.error('Failed to cancel booking:', error);
    }
  };

  // Filter resources based on search
  const filteredResources = useMemo(() => {
    if (!searchFilter) return resources;
    return resources.filter((r: Resource) =>
      r.name.toLowerCase().includes(searchFilter.toLowerCase())
    );
  }, [resources, searchFilter]);

  // Get current month calendar
  const getCalendarDays = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

    const days: (number | null)[] = [];

    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(i);
    }

    return days;
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString("ru-RU", { month: "long", year: "numeric" });
  };

  const isToday = (day: number | null) => {
    if (!day) return false;
    const today = new Date();
    return (
      day === today.getDate() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (day: number | null) => {
    if (!day) return false;
    return day === selectedDate.getDate();
  };

  const changeMonth = (delta: number) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setSelectedDate(newDate);
  };

  const selectDay = (day: number | null) => {
    if (!day) return;
    const newDate = new Date(selectedDate);
    newDate.setDate(day);
    setSelectedDate(newDate);
  };

  const getBookingsForResource = (resourceId: string) => {
    return bookings.filter((b: Booking) => b.resourceId === resourceId);
  };

  // Create new resource
  const handleCreateResource = async () => {
    if (!selectedCategory || !newResourceName.trim()) return;

    setIsCreatingResource(true);
    try {
      await bookingApi.createResource({
        name: newResourceName.trim(),
        type: selectedCategory.type,
        category: selectedCategory.id,
        color: selectedCategory.color,
      });

      // Refresh resources
      mutateResources(undefined, true);
      mutate(["booking-resources", { isActive: true }]);

      // Close modals
      setShowNewResourceModal(false);
      setShowNewResourceForm(false);
      setSelectedCategory(null);
      setNewResourceName("");
    } catch (error) {
      console.error("Failed to create resource:", error);
    } finally {
      setIsCreatingResource(false);
    }
  };

  // Get booking color
  const getBookingColor = (booking: Booking) => {
    if (booking.service?.color) return booking.service.color;
    const resource = resources.find((r: Resource) => r.id === booking.resourceId);
    return resource?.color || "#3B82F6";
  };

  // Get booking display title
  const getBookingTitle = (booking: Booking) => {
    if (booking.title) return booking.title;
    if (booking.service?.name) return booking.service.name;
    return "Запись";
  };

  // Get client name
  const getClientName = (booking: Booking) => {
    if (booking.contact) {
      return `${booking.contact.firstName} ${booking.contact.lastName || ""}`.trim();
    }
    return "";
  };

  // Parse time from ISO string
  const parseTime = (isoString: string) => {
    const d = new Date(isoString);
    return {
      hours: d.getHours(),
      minutes: d.getMinutes(),
    };
  };

  // Format time for display
  const formatTime = (isoString: string) => {
    const { hours, minutes } = parseTime(isoString);
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  };

  return (
    <div className="h-full min-h-full flex flex-col">
      {/* Header */}
      <div className="glass-card border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold text-white">Онлайн-запись</h1>

            {/* Date display */}
            <div className="flex items-center gap-2 text-gray-400">
              <span className="text-lg font-medium">
                {selectedDate.toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
              </span>
              <div className="flex items-center gap-1 text-sm text-gray-400">
                <span>+{bookings.length} записей</span>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex bg-white/5 rounded-xl p-1">
              <button
                onClick={() => setActiveTab("schedule")}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium",
                  activeTab === "schedule"
                    ? "bg-white/10 text-white shadow-sm"
                    : "text-gray-400 hover:text-white"
                )}
              >
                Записи
              </button>
              <button
                onClick={() => setActiveTab("services")}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium",
                  activeTab === "services"
                    ? "bg-white/10 text-white shadow-sm"
                    : "text-gray-400 hover:text-white"
                )}
              >
                Услуги
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Filter */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Фильтр"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-64 pl-10 pr-4 py-2.5 bg-white/5 rounded-xl text-sm border-0 focus:ring-2 focus:ring-violet-500 focus:bg-white/10 text-white placeholder-gray-400"
              />
            </div>

            {/* Status indicators */}
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-orange-500" />
                <span className="text-gray-400">{stats.pending} Ожидают подтверждения</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-gray-400">{stats.noShow} Неявки</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Resources */}
        <div className={cn(
          "glass-card border-r border-white/10 flex flex-col transition-all",
          showResourcePanel ? "w-64" : "w-0"
        )}>
          {showResourcePanel && (
            <>
              {/* Add Resource Button */}
              <div className="p-3 border-b border-white/5">
                <button
                  onClick={() => setShowNewResourceModal(true)}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-violet-500 hover:bg-white/5 rounded-xl"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-medium">Добавить ресурс</span>
                </button>
              </div>

              {/* Resources List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-1">
                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-violet-500 hover:bg-white/5 rounded-lg">
                  <ListTodo className="w-4 h-4" />
                  Показать слоты для нескольких ресурсов
                </button>

                {resourcesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
                  </div>
                ) : filteredResources.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    {resources.length === 0 ? "Нет ресурсов" : "Ничего не найдено"}
                  </div>
                ) : (
                  <div className="mt-4 space-y-1">
                    {filteredResources.map((resource: Resource) => (
                      <div
                        key={resource.id}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 cursor-pointer group"
                      >
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                          style={{ backgroundColor: resource.color }}
                        >
                          {getInitials(resource.name)}
                        </div>
                        <span className="flex-1 text-sm font-medium text-white truncate">
                          {resource.name}
                        </span>
                        <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded-lg">
                          <Settings2 className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Center - Schedule Grid */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toggle Resource Panel */}
          <button
            onClick={() => setShowResourcePanel(!showResourcePanel)}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-6 h-12 glass-card border border-white/10 rounded-r-lg shadow-sm flex items-center justify-center hover:bg-white/5"
            style={{ left: showResourcePanel ? "256px" : "0" }}
          >
            {showResourcePanel ? (
              <ChevronLeft className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </button>

          {/* Schedule Header */}
          <div className="glass-card border-b border-white/10 p-3 flex items-center gap-4">
            <button className="p-2 hover:bg-white/5 rounded-lg">
              <Filter className="w-5 h-5 text-gray-400" />
            </button>

            {/* Resources columns header */}
            <div className="flex-1 flex">
              {filteredResources.map((resource: Resource) => (
                <div
                  key={resource.id}
                  className="flex-1 flex items-center justify-center gap-2 py-2"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                    style={{ backgroundColor: resource.color }}
                  >
                    {getInitials(resource.name)}
                  </div>
                  <span className="text-sm font-medium text-gray-300">{resource.name}</span>
                </div>
              ))}
              {filteredResources.length === 0 && !resourcesLoading && (
                <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                  Добавьте ресурсы для отображения расписания
                </div>
              )}
            </div>
          </div>

          {/* Time Grid */}
          <div className="flex-1 overflow-y-auto glass-card">
            {bookingsLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
              </div>
            ) : (
              <div className="flex">
                {/* Time column */}
                <div className="w-16 shrink-0 border-r border-white/5">
                  {timeSlots.map((time) => (
                    <div
                      key={time}
                      className="h-16 flex items-start justify-end pr-2 pt-1 text-xs text-gray-400 border-b border-white/5"
                    >
                      {time}
                    </div>
                  ))}
                </div>

                {/* Resource columns */}
                <div className="flex-1 flex">
                  {filteredResources.map((resource: Resource) => (
                    <div key={resource.id} className="flex-1 border-r border-white/5 relative">
                      {timeSlots.map((time, index) => {
                        const hour = 7 + index;
                        return (
                          <div
                            key={time}
                            onClick={() => handleOpenNewBooking(resource.id, hour)}
                            className="h-16 border-b border-white/5 hover:bg-violet-500/10 cursor-pointer transition-colors"
                            title={`Создать запись на ${time}`}
                          />
                        );
                      })}

                      {/* Bookings */}
                      {getBookingsForResource(resource.id).map((booking: Booking) => {
                        const { hours: startHour, minutes: startMinute } = parseTime(booking.startTime);
                        const { hours: endHour, minutes: endMinute } = parseTime(booking.endTime);

                        const top = (startHour - 7) * 64 + (startMinute / 60) * 64;
                        const durationMinutes = (endHour - startHour) * 60 + (endMinute - startMinute);
                        const height = (durationMinutes / 60) * 64;

                        return (
                          <div
                            key={booking.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditBooking(booking);
                            }}
                            className={cn(
                              "absolute left-1 right-1 rounded-lg p-2 cursor-pointer hover:opacity-90 hover:shadow-lg transition-all",
                              booking.status === "CANCELLED" && "opacity-50 line-through",
                              booking.status === "NO_SHOW" && "opacity-50"
                            )}
                            style={{
                              top: `${top}px`,
                              height: `${Math.max(height, 32)}px`,
                              backgroundColor: getBookingColor(booking),
                            }}
                            title="Нажмите для редактирования"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="text-white text-xs font-semibold truncate">{getBookingTitle(booking)}</p>
                                {getClientName(booking) && (
                                  <p className="text-white/80 text-xs truncate">{getClientName(booking)}</p>
                                )}
                                <p className="text-white/70 text-xs">{formatTime(booking.startTime)} - {formatTime(booking.endTime)}</p>
                              </div>
                              {booking.status === "PENDING" && (
                                <Clock className="w-3 h-3 text-white/70 shrink-0" />
                              )}
                              {booking.status === "CONFIRMED" && (
                                <Check className="w-3 h-3 text-white/70 shrink-0" />
                              )}
                              {booking.status === "CANCELLED" && (
                                <XCircle className="w-3 h-3 text-white/70 shrink-0" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Zoom controls */}
          <div className="glass-card border-t border-white/10 px-4 py-2 flex items-center gap-4">
            <button
              onClick={() => setZoomLevel(100)}
              className="text-sm text-violet-500 hover:underline"
            >
              Показать всё
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoomLevel(Math.max(50, zoomLevel - 25))}
                className="p-1 hover:bg-white/5 rounded text-gray-400 hover:text-white"
                disabled={zoomLevel <= 50}
              >
                −
              </button>
              <span className="text-sm text-gray-400 w-12 text-center">{zoomLevel}%</span>
              <button
                onClick={() => setZoomLevel(Math.min(200, zoomLevel + 25))}
                className="p-1 hover:bg-white/5 rounded text-gray-400 hover:text-white"
                disabled={zoomLevel >= 200}
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel - Calendar & Waiting List */}
        <div className="w-80 glass-card border-l border-white/10 flex flex-col">
          {/* Mini Calendar */}
          <div className="p-4 border-b border-white/5">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => changeMonth(-1)}
                className="p-1.5 hover:bg-white/5 rounded-lg"
              >
                <ChevronLeft className="w-4 h-4 text-gray-400" />
              </button>
              <span className="text-sm font-semibold text-white capitalize">
                {formatMonthYear(selectedDate)}
              </span>
              <button
                onClick={() => changeMonth(1)}
                className="p-1.5 hover:bg-white/5 rounded-lg"
              >
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Days of week */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {daysOfWeek.map((day) => (
                <div key={day} className="text-center text-xs font-medium text-gray-400 py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1">
              {getCalendarDays().map((day, index) => (
                <button
                  key={index}
                  onClick={() => selectDay(day)}
                  disabled={!day}
                  className={cn(
                    "h-8 w-8 rounded-full text-sm font-medium",
                    day ? "hover:bg-white/5" : "",
                    isToday(day) && !isSelected(day) && "bg-violet-500/20 text-violet-400",
                    isSelected(day) && "bg-violet-500 text-white",
                    !day && "invisible",
                    day && !isToday(day) && !isSelected(day) && "text-gray-300",
                    day && (index % 7 === 5 || index % 7 === 6) && !isSelected(day) && !isToday(day) && "text-red-400"
                  )}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {/* Waiting List */}
          <div className="flex-1 flex flex-col">
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
              <span className="text-sm font-semibold text-white">Лист ожидания</span>
              <div className="flex items-center gap-2">
                <button className="text-sm text-violet-500 hover:underline flex items-center gap-1">
                  <Plus className="w-4 h-4" />
                  Добавить
                </button>
                <button className="p-1 hover:bg-white/5 rounded">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>

            {waitingList.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <ListTodo className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-300 mb-1">Лист ожидания</p>
                <p className="text-xs text-gray-400 mb-3">
                  Перетащите сюда запись из расписания или добавьте новую
                </p>
                <button className="text-xs text-violet-500 hover:underline">
                  Как это работает
                </button>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {waitingList.map((item: WaitingListItem) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer"
                  >
                    <p className="text-sm font-medium text-white">
                      {item.clientName || (item.contact && `${item.contact.firstName} ${item.contact.lastName || ""}`.trim())}
                    </p>
                    {item.service && (
                      <p className="text-xs text-gray-400">{item.service.name}</p>
                    )}
                    {item.preferredDate && (
                      <p className="text-xs text-gray-500 mt-1">
                        Желаемая дата: {new Date(item.preferredDate).toLocaleDateString("ru-RU")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Resource Modal */}
      {showNewResourceModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl w-full max-w-lg shadow-xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h2 className="text-xl font-bold text-white">
                {showNewResourceForm ? "Создать ресурс" : "Новый ресурс"}
              </h2>
              <button
                onClick={() => {
                  setShowNewResourceModal(false);
                  setShowNewResourceForm(false);
                  setSelectedCategory(null);
                  setNewResourceName("");
                }}
                className="p-2 hover:bg-white/5 rounded-xl"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {showNewResourceForm ? (
                // Resource Form
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Название ресурса
                    </label>
                    <input
                      type="text"
                      value={newResourceName}
                      onChange={(e) => setNewResourceName(e.target.value)}
                      placeholder="Например: Анна Иванова"
                      className="w-full px-4 py-3 bg-white/5 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-violet-500 focus:bg-white/10 border-0"
                      autoFocus
                    />
                  </div>

                  {selectedCategory && (
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${selectedCategory.color}15` }}
                      >
                        <selectedCategory.icon className="w-5 h-5" style={{ color: selectedCategory.color }} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{selectedCategory.name}</p>
                        <p className="text-xs text-gray-400">Тип: {selectedCategory.type}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => {
                        setShowNewResourceForm(false);
                        setSelectedCategory(null);
                        setNewResourceName("");
                      }}
                      className="flex-1 px-4 py-3 text-gray-300 hover:bg-white/5 rounded-xl font-medium"
                    >
                      Назад
                    </button>
                    <button
                      onClick={handleCreateResource}
                      disabled={!newResourceName.trim() || isCreatingResource}
                      className="flex-1 px-4 py-3 bg-violet-500 text-white rounded-xl font-medium hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isCreatingResource ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Создание...
                        </>
                      ) : (
                        "Создать"
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                // Category Selection
                <>
                  <div className="mb-6">
                    <h3 className="text-base font-semibold text-white mb-2">
                      Выберите сферу деятельности вашей компании
                    </h3>
                    <p className="text-sm text-gray-400">
                      При создании тип ресурса выберется автоматически, но вы можете его изменить.{" "}
                      <button className="text-violet-500 hover:underline">Как настроить ресурсы</button>
                    </p>
                  </div>

                  <div className="space-y-2">
                    {businessCategories.map((category) => {
                      const Icon = category.icon;
                      return (
                        <button
                          key={category.id}
                          className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 text-left group"
                          onClick={() => {
                            setSelectedCategory(category);
                            setShowNewResourceForm(true);
                          }}
                        >
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: `${category.color}15` }}
                          >
                            <Icon className="w-6 h-6" style={{ color: category.color }} />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-white">{category.name}</p>
                            <p className="text-sm text-gray-400">{category.description}</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-gray-400" />
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h2 className="text-xl font-bold text-white">
                {editingBooking ? 'Редактировать запись' : 'Новая запись'}
              </h2>
              <button
                onClick={() => setShowBookingModal(false)}
                className="p-2 hover:bg-white/5 rounded-xl"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              {/* Status badge for editing */}
              {editingBooking && (
                <div className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium",
                  editingBooking.status === 'PENDING' && 'bg-orange-500/20 text-orange-400',
                  editingBooking.status === 'CONFIRMED' && 'bg-green-500/20 text-green-400',
                  editingBooking.status === 'CANCELLED' && 'bg-red-500/20 text-red-400',
                  editingBooking.status === 'COMPLETED' && 'bg-blue-500/20 text-blue-400',
                  editingBooking.status === 'NO_SHOW' && 'bg-gray-500/20 text-gray-400'
                )}>
                  {editingBooking.status === 'PENDING' && <Clock className="w-3 h-3" />}
                  {editingBooking.status === 'CONFIRMED' && <Check className="w-3 h-3" />}
                  {editingBooking.status === 'CANCELLED' && <XCircle className="w-3 h-3" />}
                  {editingBooking.status === 'PENDING' && 'Ожидает подтверждения'}
                  {editingBooking.status === 'CONFIRMED' && 'Подтверждено'}
                  {editingBooking.status === 'CANCELLED' && 'Отменено'}
                  {editingBooking.status === 'COMPLETED' && 'Завершено'}
                  {editingBooking.status === 'NO_SHOW' && 'Неявка'}
                </div>
              )}

              {/* Resource selection */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Ресурс *</label>
                <select
                  value={bookingForm.resourceId}
                  onChange={(e) => setBookingForm({ ...bookingForm, resourceId: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/5 rounded-xl text-sm text-white border-0 focus:ring-2 focus:ring-violet-500 focus:bg-white/10"
                >
                  <option value="" className="bg-gray-800">Выберите ресурс</option>
                  {resources.map((resource: Resource) => (
                    <option key={resource.id} value={resource.id} className="bg-gray-800">
                      {resource.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Service selection */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Услуга</label>
                <select
                  value={bookingForm.serviceId}
                  onChange={(e) => setBookingForm({ ...bookingForm, serviceId: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/5 rounded-xl text-sm text-white border-0 focus:ring-2 focus:ring-violet-500 focus:bg-white/10"
                >
                  <option value="" className="bg-gray-800">Без услуги</option>
                  {Array.isArray(services) && services.map((service: any) => (
                    <option key={service.id} value={service.id} className="bg-gray-800">
                      {service.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Название</label>
                <input
                  type="text"
                  value={bookingForm.title}
                  onChange={(e) => setBookingForm({ ...bookingForm, title: e.target.value })}
                  placeholder="Название записи"
                  className="w-full px-4 py-2.5 bg-white/5 rounded-xl text-sm text-white border-0 focus:ring-2 focus:ring-violet-500 focus:bg-white/10 placeholder:text-gray-500"
                />
              </div>

              {/* Client name */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Имя клиента</label>
                <input
                  type="text"
                  value={bookingForm.clientName}
                  onChange={(e) => setBookingForm({ ...bookingForm, clientName: e.target.value })}
                  placeholder="Иван Иванов"
                  className="w-full px-4 py-2.5 bg-white/5 rounded-xl text-sm text-white border-0 focus:ring-2 focus:ring-violet-500 focus:bg-white/10 placeholder:text-gray-500"
                />
              </div>

              {/* Client phone */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Телефон клиента</label>
                <input
                  type="tel"
                  value={bookingForm.clientPhone}
                  onChange={(e) => setBookingForm({ ...bookingForm, clientPhone: e.target.value })}
                  placeholder="+7 (999) 123-45-67"
                  className="w-full px-4 py-2.5 bg-white/5 rounded-xl text-sm text-white border-0 focus:ring-2 focus:ring-violet-500 focus:bg-white/10 placeholder:text-gray-500"
                />
              </div>

              {/* Time range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Начало *</label>
                  <input
                    type="datetime-local"
                    value={bookingForm.startTime}
                    onChange={(e) => setBookingForm({ ...bookingForm, startTime: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/5 rounded-xl text-sm text-white border-0 focus:ring-2 focus:ring-violet-500 focus:bg-white/10"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Окончание *</label>
                  <input
                    type="datetime-local"
                    value={bookingForm.endTime}
                    onChange={(e) => setBookingForm({ ...bookingForm, endTime: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/5 rounded-xl text-sm text-white border-0 focus:ring-2 focus:ring-violet-500 focus:bg-white/10"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Заметки</label>
                <textarea
                  value={bookingForm.notes}
                  onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                  placeholder="Дополнительная информация..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-white/5 rounded-xl text-sm text-white border-0 focus:ring-2 focus:ring-violet-500 focus:bg-white/10 placeholder:text-gray-500 resize-none"
                />
              </div>

              {/* Error message */}
              {bookingError && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {bookingError}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-white/5 space-y-3">
              {/* Status actions for editing */}
              {editingBooking && editingBooking.status === 'PENDING' && (
                <div className="flex gap-2">
                  <button
                    onClick={handleConfirmBooking}
                    className="flex-1 py-2.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 font-medium rounded-xl text-sm flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Подтвердить
                  </button>
                  <button
                    onClick={handleCancelBooking}
                    className="flex-1 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-medium rounded-xl text-sm flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Отменить
                  </button>
                </div>
              )}

              <div className="flex gap-3">
                {editingBooking && (
                  <button
                    onClick={handleDeleteBooking}
                    className="px-4 py-2.5 text-red-400 hover:bg-red-500/10 rounded-xl font-medium text-sm flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Удалить
                  </button>
                )}
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="flex-1 px-4 py-2.5 text-gray-300 hover:bg-white/5 rounded-xl font-medium"
                >
                  Отмена
                </button>
                <button
                  onClick={handleSaveBooking}
                  disabled={isSavingBooking}
                  className="flex-1 px-4 py-2.5 bg-violet-500 text-white rounded-xl font-medium hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSavingBooking ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Сохранение...
                    </>
                  ) : (
                    editingBooking ? 'Сохранить' : 'Создать запись'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
