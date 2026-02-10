"use client";

import { useState } from "react";
import { MoreVertical, Plus, Search, Filter, ChevronRight } from "lucide-react";

const stages = [
  { id: 1, name: "Новые", count: 2, color: "bg-blue-500" },
  { id: 2, name: "Квалификация", count: 1, color: "bg-yellow-500" },
  { id: 3, name: "Предложение", count: 1, color: "bg-purple-500" },
  { id: 4, name: "Переговоры", count: 1, color: "bg-orange-500" },
  { id: 5, name: "Успешно закрыто", count: 1, color: "bg-green-500" },
];

const deals = [
  {
    id: 1,
    title: "Поставка оборудования",
    company: "ООО Технологии",
    amount: 450000,
    manager: "Иван Иванов",
    date: "15.01.2024",
    stage: 1,
    tags: ["Оборудование", "B2B"],
    status: "Высокий",
  },
  {
    id: 2,
    title: "Разработка ПО",
    company: "Startup Inc",
    amount: 800000,
    manager: "Анна Сидорова",
    date: "13.01.2024",
    stage: 2,
    tags: ["IT", "Разработка"],
    status: "Высокий",
  },
  {
    id: 3,
    title: "Маркетинговая кампания",
    company: "МедиаГрупп",
    amount: 320000,
    manager: "Елена Козлова",
    date: "12.01.2024",
    stage: 3,
    tags: ["Маркетинг"],
    status: "Средний",
  },
  {
    id: 4,
    title: "Годовой контракт",
    company: "КорпСервис",
    amount: 1200000,
    manager: "Михаил Волков",
    date: "10.01.2024",
    stage: 4,
    tags: ["Долгосрочный", "VIP"],
    status: "Высокий",
  },
  {
    id: 5,
    title: "Поставка материалов",
    company: "СтройПроект",
    amount: 650000,
    manager: "Дмитрий Новиков",
    date: "08.01.2024",
    stage: 5,
    tags: ["Строительство"],
    status: "Завершен",
  },
  {
    id: 6,
    title: "Консалтинг услуги",
    company: "ИП Петров",
    amount: 150000,
    manager: "Петр Петров",
    date: "14.01.2024",
    stage: 3,
    tags: ["Услуги"],
    status: "Средний",
  },
];

const stats = [
  { label: "Всего сделок", value: 6, icon: "📊" },
  { label: "Общая сумма", value: "₽3 570 000", icon: "💰" },
  { label: "Конверсия", value: "17%", icon: "📈" },
  { label: "Выиграно/Проиграно", value: "1 / 0", icon: "🎯" },
];

export default function DealsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStage, setSelectedStage] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");

  const filteredDeals = deals.filter(deal => {
    if (selectedStage && deal.stage !== selectedStage) return false;
    if (searchQuery && !deal.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Сделки</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Управление сделками и воронкой продаж
          </p>
        </div>
        <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2">
          <Plus size={20} />
          Новая сделка
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <div key={index} className="glass-card rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {stat.label}
                </p>
                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
              </div>
              <div className="text-3xl">{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="search"
            placeholder="Поиск по сделкам..."
            className="glass-input w-full rounded-lg pl-10 pr-4 py-2 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="px-4 py-2 glass-button rounded-lg flex items-center gap-2">
          <Filter size={16} />
          Фильтры
        </button>
        <button
          onClick={() => setViewMode(viewMode === "kanban" ? "list" : "kanban")}
          className="px-4 py-2 glass-button rounded-lg"
        >
          Представление
        </button>
      </div>

      {/* Pipeline Stages */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {stages.map((stage, index) => (
          <div key={stage.id} className="flex items-center">
            <button
              onClick={() => setSelectedStage(selectedStage === stage.id ? null : stage.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                selectedStage === stage.id
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                  : "glass-button"
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${stage.color}`} />
              <span className="font-medium">{stage.name}</span>
              <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 rounded-full">
                {stage.count}
              </span>
            </button>
            {index < stages.length - 1 && (
              <ChevronRight size={16} className="text-gray-400 mx-2" />
            )}
          </div>
        ))}
      </div>

      {/* Deals Grid */}
      {viewMode === "kanban" ? (
        <div className="grid gap-4 overflow-x-auto" style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(300px, 1fr))` }}>
          {stages.map((stage) => (
            <div key={stage.id} className="glass-card rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                  <h3 className="font-semibold text-gray-900 dark:text-white">{stage.name}</h3>
                  <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 rounded-full">
                    {stage.count}
                  </span>
                </div>
                <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                  <Plus size={16} className="text-gray-500" />
                </button>
              </div>
              <div className="space-y-3">
                {filteredDeals
                  .filter((deal) => deal.stage === stage.id)
                  .map((deal) => (
                    <div
                      key={deal.id}
                      className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                          {deal.title}
                        </h4>
                        <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                          <MoreVertical size={14} className="text-gray-400" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        {deal.company}
                      </p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                        ₽{deal.amount.toLocaleString()}
                      </p>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-[10px] font-semibold">
                            {deal.manager.split(" ").map(n => n[0]).join("")}
                          </div>
                          <span className="text-gray-600 dark:text-gray-400">{deal.manager.split(" ")[0]}</span>
                        </div>
                        <span className="text-gray-500 dark:text-gray-400">{deal.date}</span>
                      </div>
                      {deal.tags.length > 0 && (
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {deal.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-0.5 text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      {deal.status === "Высокий" && (
                        <div className="mt-2 px-2 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-medium rounded">
                          Высокий приоритет
                        </div>
                      )}
                      {deal.status === "Средний" && (
                        <div className="mt-2 px-2 py-1 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 text-xs font-medium rounded">
                          Средний приоритет
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Название
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Компания
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Сумма
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Стадия
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Менеджер
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Дата
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredDeals.map((deal) => (
                <tr key={deal.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {deal.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {deal.company}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                    ₽{deal.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      stages.find(s => s.id === deal.stage)?.color.replace('bg-', 'bg-opacity-10 text-')
                    }`}>
                      {stages.find(s => s.id === deal.stage)?.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {deal.manager}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {deal.date}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}