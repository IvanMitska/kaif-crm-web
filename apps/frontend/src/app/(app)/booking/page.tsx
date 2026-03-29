"use client";

import { useState } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock data for resources
const mockResources = [
  { id: "1", name: "Анна Иванова", type: "specialist", color: "#3B82F6", avatar: "А" },
  { id: "2", name: "Кабинет 1", type: "room", color: "#10B981", avatar: "К1" },
  { id: "3", name: "Оборудование А", type: "equipment", color: "#F59E0B", avatar: "О" },
];

// Mock bookings
const mockBookings = [
  { id: "1", resourceId: "1", title: "Консультация", client: "Петров И.", startTime: "09:00", endTime: "10:00", color: "#3B82F6" },
  { id: "2", resourceId: "1", title: "Процедура", client: "Сидорова М.", startTime: "11:00", endTime: "12:30", color: "#8B5CF6" },
  { id: "3", resourceId: "2", title: "Аренда", client: "Компания А", startTime: "14:00", endTime: "16:00", color: "#10B981" },
];

// Business categories for new resource modal
const businessCategories = [
  { id: "medical", name: "Медицинские услуги", description: "Врачи, косметологи, диагностика", icon: Stethoscope, color: "#3B82F6" },
  { id: "equipment", name: "Аренда оборудования", description: "Строительная техника, электроинструмент", icon: Wrench, color: "#F59E0B" },
  { id: "specialist", name: "Услуги специалистов", description: "Консалтинг, ремонт, бьюти-индустрия, фитнес", icon: Users, color: "#8B5CF6" },
  { id: "cars", name: "Аренда автомобилей", description: "Легковые и грузовые автомобили, мототехника", icon: Car, color: "#10B981" },
  { id: "rooms", name: "Аренда помещений", description: "Банкетные залы, квартиры и дома, фотостудии", icon: Building, color: "#EC4899" },
  { id: "other", name: "Другое", description: "Прочие услуги и ресурсы", icon: MoreHorizontal, color: "#6B7280" },
];

// Time slots
const timeSlots = Array.from({ length: 15 }, (_, i) => {
  const hour = 7 + i;
  return `${hour.toString().padStart(2, "0")}:00`;
});

// Days of week
const daysOfWeek = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export default function BookingPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showNewResourceModal, setShowNewResourceModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"schedule" | "services">("schedule");
  const [resources] = useState(mockResources);
  const [showResourcePanel, setShowResourcePanel] = useState(true);

  // Get current month calendar
  const getCalendarDays = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

    const days: (number | null)[] = [];

    // Previous month days
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }

    // Current month days
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
    return mockBookings.filter(b => b.resourceId === resourceId);
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
                <span>+0 клиентов</span>
                <span className="text-gray-600">|</span>
                <span>+$0</span>
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
                className="w-64 pl-10 pr-4 py-2.5 bg-white/5 rounded-xl text-sm border-0 focus:ring-2 focus:ring-violet-500 focus:bg-white/10 text-white placeholder-gray-400"
              />
            </div>

            {/* Status indicators */}
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-orange-500" />
                <span className="text-gray-400">0 Ожидают подтверждения</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-gray-400">0 Опаздывают</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Resources */}
        <div className={cn(
          "glass-card border-r border-white/10 flex flex-col",
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

                <div className="mt-4 space-y-1">
                  {resources.map((resource) => (
                    <div
                      key={resource.id}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 cursor-pointer group"
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                        style={{ backgroundColor: resource.color }}
                      >
                        {resource.avatar}
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
              {resources.map((resource) => (
                <div
                  key={resource.id}
                  className="flex-1 flex items-center justify-center gap-2 py-2"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                    style={{ backgroundColor: resource.color }}
                  >
                    {resource.avatar}
                  </div>
                  <span className="text-sm font-medium text-gray-300">{resource.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Time Grid */}
          <div className="flex-1 overflow-y-auto glass-card">
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
                {resources.map((resource) => (
                  <div key={resource.id} className="flex-1 border-r border-white/5 relative">
                    {timeSlots.map((time) => (
                      <div
                        key={time}
                        className="h-16 border-b border-white/5 hover:bg-violet-500/10 cursor-pointer"
                      />
                    ))}

                    {/* Bookings */}
                    {getBookingsForResource(resource.id).map((booking) => {
                      const startHour = parseInt(booking.startTime.split(":")[0]);
                      const endHour = parseInt(booking.endTime.split(":")[0]);
                      const startMinute = parseInt(booking.startTime.split(":")[1]);
                      const endMinute = parseInt(booking.endTime.split(":")[1]);

                      const top = (startHour - 7) * 64 + (startMinute / 60) * 64;
                      const height = ((endHour - startHour) * 60 + (endMinute - startMinute)) / 60 * 64;

                      return (
                        <div
                          key={booking.id}
                          className="absolute left-1 right-1 rounded-lg p-2 cursor-pointer hover:opacity-90"
                          style={{
                            top: `${top}px`,
                            height: `${height}px`,
                            backgroundColor: booking.color,
                          }}
                        >
                          <p className="text-white text-xs font-semibold truncate">{booking.title}</p>
                          <p className="text-white/80 text-xs truncate">{booking.client}</p>
                          <p className="text-white/70 text-xs">{booking.startTime} - {booking.endTime}</p>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Zoom controls */}
          <div className="glass-card border-t border-white/10 px-4 py-2 flex items-center gap-4">
            <button className="text-sm text-violet-500 hover:underline">Показать всё</button>
            <div className="flex items-center gap-2">
              <button className="p-1 hover:bg-white/5 rounded">−</button>
              <span className="text-sm text-gray-400">100%</span>
              <button className="p-1 hover:bg-white/5 rounded">+</button>
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
                    // Weekend colors
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
          </div>
        </div>
      </div>

      {/* New Resource Modal */}
      {showNewResourceModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl w-full max-w-lg shadow-xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h2 className="text-xl font-bold text-white">Новый ресурс</h2>
              <button
                onClick={() => setShowNewResourceModal(false)}
                className="p-2 hover:bg-white/5 rounded-xl"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
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
                        // Handle category selection
                        setShowNewResourceModal(false);
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
