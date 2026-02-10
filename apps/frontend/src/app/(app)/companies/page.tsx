"use client";

import { useState } from "react";
import { Plus, Search, Building2, Users, DollarSign, Phone, Mail, Globe } from "lucide-react";

const companies = [
  {
    id: 1,
    name: "ООО Технологии",
    inn: "1234567890",
    revenue: 5000000,
    employees: 50,
    phone: "+7 (495) 123-45-67",
    email: "info@tech.ru",
    website: "tech.ru",
    address: "Москва, ул. Технологическая, 10",
    status: "active",
  },
  {
    id: 2,
    name: "ИП Петров",
    inn: "0987654321",
    revenue: 1500000,
    employees: 5,
    phone: "+7 (495) 234-56-78",
    email: "petrov@mail.ru",
    website: "petrov.ru",
    address: "Москва, ул. Садовая, 5",
    status: "active",
  },
  {
    id: 3,
    name: "ООО Сервис",
    inn: "1122334455",
    revenue: 3000000,
    employees: 25,
    phone: "+7 (495) 345-67-89",
    email: "service@corp.ru",
    website: "service.ru",
    address: "Санкт-Петербург, пр. Невский, 100",
    status: "active",
  },
  {
    id: 4,
    name: "СтройПроект",
    inn: "5544332211",
    revenue: 8000000,
    employees: 120,
    phone: "+7 (495) 456-78-90",
    email: "info@stroy.ru",
    website: "stroyproject.ru",
    address: "Москва, ул. Строителей, 25",
    status: "active",
  },
  {
    id: 5,
    name: "МедиаГрупп",
    inn: "9988776655",
    revenue: 4500000,
    employees: 35,
    phone: "+7 (495) 567-89-01",
    email: "media@group.ru",
    website: "mediagroup.ru",
    address: "Москва, ул. Тверская, 12",
    status: "inactive",
  },
  {
    id: 6,
    name: "КорпСервис",
    inn: "6677889900",
    revenue: 12000000,
    employees: 200,
    phone: "+7 (495) 678-90-12",
    email: "corp@service.ru",
    website: "corpservice.ru",
    address: "Москва, Бизнес-центр Империя",
    status: "active",
  },
];

export default function CompaniesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.inn.includes(searchQuery)
  );

  const totalRevenue = companies.reduce((sum, c) => sum + c.revenue, 0);
  const totalEmployees = companies.reduce((sum, c) => sum + c.employees, 0);
  const activeCompanies = companies.filter(c => c.status === "active").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Компании</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Управление компаниями и партнерами
          </p>
        </div>
        <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2">
          <Plus size={20} />
          Новая компания
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Всего компаний
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {companies.length}
              </p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-blue-500" />
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Общая выручка
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                ₽{(totalRevenue / 1000000).toFixed(1)}М
              </p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-green-500/10 dark:bg-green-500/20 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-green-500" />
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Всего сотрудников
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {totalEmployees}
              </p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center">
              <Users className="h-6 w-6 text-purple-500" />
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Активные
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {activeCompanies}
              </p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-orange-500/10 dark:bg-orange-500/20 flex items-center justify-center">
              <div className="h-3 w-3 rounded-full bg-orange-500 animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="search"
            placeholder="Поиск по названию или ИНН..."
            className="glass-input w-full rounded-lg pl-10 pr-4 py-2 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button
          onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
          className="px-4 py-2 glass-button rounded-lg"
        >
          {viewMode === "grid" ? "Список" : "Карточки"}
        </button>
      </div>

      {/* Companies Grid/List */}
      {viewMode === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCompanies.map((company) => (
            <div key={company.id} className="glass-card rounded-xl p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {company.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      ИНН: {company.inn}
                    </span>
                    {company.status === "active" ? (
                      <span className="px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full">
                        Активная
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full">
                        Неактивная
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Выручка:</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    ₽{company.revenue.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Сотрудников:</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {company.employees}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Phone size={14} />
                  <span>{company.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Mail size={14} />
                  <span>{company.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Globe size={14} />
                  <span>{company.website}</span>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button className="flex-1 px-3 py-1.5 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                  Подробнее
                </button>
                <button className="flex-1 px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  Редактировать
                </button>
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
                  Компания
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  ИНН
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Выручка
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Сотрудники
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Контакты
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Статус
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredCompanies.map((company) => (
                <tr key={company.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {company.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {company.address}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {company.inn}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                    ₽{company.revenue.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {company.employees}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      <div>{company.phone}</div>
                      <div className="text-xs">{company.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {company.status === "active" ? (
                      <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full">
                        Активная
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full">
                        Неактивная
                      </span>
                    )}
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