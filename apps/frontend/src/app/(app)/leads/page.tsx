"use client";

import { useState } from "react";
import {
  Search,
  Filter,
  Send,
  Paperclip,
  MoreHorizontal,
  Phone,
  Archive,
  CheckCircle2,
  Plus,
  ChevronDown,
  Clock,
  Circle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Lead = {
  id: string;
  leadNumber: string;
  name?: string;
  lastMessage: string;
  time: string;
  isOnline?: boolean;
  status: string;
  channel?: string;
};

type Message = {
  id: string;
  text: string;
  time: string;
  sender: "user" | "lead";
};

const leads: Lead[] = [
  { id: "1", leadNumber: "41425147", name: "Poliza", lastMessage: "/start", time: "03:00", status: "new", isOnline: true, channel: "WhatsApp" },
  { id: "2", leadNumber: "41329355", lastMessage: "Сообщение не отправлено", time: "10:57", status: "pending", channel: "Telegram" },
  { id: "3", leadNumber: "41403183", lastMessage: "В стоимость абонемента входит...", time: "19:54", status: "qualified", channel: "WhatsApp" },
  { id: "4", leadNumber: "41079527", lastMessage: "Давайте переведем вас к менеджеру", time: "15:43", status: "in_progress", channel: "Instagram" },
  { id: "5", leadNumber: "41399689", lastMessage: "Yes. How can we help you?", time: "15:41", status: "new", channel: "WhatsApp" },
  { id: "6", leadNumber: "41401137", name: "Анастасия Венская", lastMessage: "Извиняюсь забыла добавить", time: "15:41", status: "qualified", channel: "Telegram" },
  { id: "7", leadNumber: "41324503", name: "Eve", lastMessage: "We offer for you buy membership", time: "14:44", status: "closed", channel: "Email" },
  { id: "8", leadNumber: "41395757", name: "Parv", lastMessage: "Ok no problem. I will be there", time: "13:18", status: "qualified", channel: "WhatsApp" },
];

const messages: Message[] = [
  { id: "1", text: "Poliza :3", time: "03:00", sender: "lead" },
  { id: "2", text: "/start", time: "03:00", sender: "lead" },
];

const statusMap: Record<string, { label: string; color: string }> = {
  new: { label: "Новый", color: "bg-blue-100 text-blue-700" },
  pending: { label: "Ожидание", color: "bg-yellow-100 text-yellow-700" },
  in_progress: { label: "В работе", color: "bg-purple-100 text-purple-700" },
  qualified: { label: "Квалифицирован", color: "bg-green-100 text-green-700" },
  closed: { label: "Закрыт", color: "bg-gray-100 text-gray-600" },
};

export default function LeadsPage() {
  const [selectedLead, setSelectedLead] = useState<Lead>(leads[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState("");

  const filteredLeads = leads.filter(
    (lead) =>
      lead.leadNumber.includes(searchQuery) ||
      lead.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const status = statusMap[selectedLead?.status || "new"];

  return (
    <div className="flex h-full gap-4 p-4">
      {/* Список лидов */}
      <div className="w-80 bg-white rounded-xl shadow-sm flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">Лиды</h2>
            <span className="text-sm text-gray-500">{leads.length}</span>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Поиск..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 rounded-lg border border-gray-200 focus:border-gray-300 focus:ring-0 placeholder:text-gray-400"
            />
          </div>

          <div className="flex gap-2 mt-3">
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              <Filter size={12} />
              Фильтр
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              Статус
              <ChevronDown size={12} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredLeads.map((lead) => {
            const leadStatus = statusMap[lead.status];
            return (
              <button
                key={lead.id}
                onClick={() => setSelectedLead(lead)}
                className={cn(
                  "w-full px-4 py-3.5 text-left transition-colors border-b border-gray-50",
                  selectedLead?.id === lead.id
                    ? "bg-gray-900"
                    : "hover:bg-gray-50"
                )}
              >
                <div className="flex gap-3">
                  <div className="relative flex-shrink-0">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold",
                      selectedLead?.id === lead.id
                        ? "bg-gray-700 text-white"
                        : "bg-gray-100 text-gray-600"
                    )}>
                      {lead.name?.[0]?.toUpperCase() || "#"}
                    </div>
                    {lead.isOnline && (
                      <div className={cn(
                        "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2",
                        selectedLead?.id === lead.id
                          ? "bg-green-400 border-gray-900"
                          : "bg-green-500 border-white"
                      )} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className={cn(
                        "font-medium truncate",
                        selectedLead?.id === lead.id ? "text-white" : "text-gray-900"
                      )}>
                        {lead.name || `#${lead.leadNumber}`}
                      </span>
                      <span className={cn(
                        "text-xs flex-shrink-0 ml-2",
                        selectedLead?.id === lead.id ? "text-gray-400" : "text-gray-500"
                      )}>
                        {lead.time}
                      </span>
                    </div>

                    <p className={cn(
                      "text-sm truncate",
                      selectedLead?.id === lead.id ? "text-gray-400" : "text-gray-500"
                    )}>
                      {lead.lastMessage}
                    </p>

                    <span className={cn(
                      "inline-block mt-2 text-xs px-2 py-0.5 rounded-full font-medium",
                      selectedLead?.id === lead.id
                        ? "bg-gray-700 text-gray-300"
                        : leadStatus.color
                    )}>
                      {leadStatus.label}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Чат */}
      <div className="flex-1 bg-white rounded-xl shadow-sm flex flex-col min-w-0">
        {/* Хедер */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-600">
              {selectedLead?.name?.[0]?.toUpperCase() || "#"}
            </div>
            <div>
              <div className="font-medium text-gray-900">
                {selectedLead?.name || `Лид #${selectedLead?.leadNumber}`}
              </div>
              <div className="text-sm text-gray-500">#{selectedLead?.leadNumber}</div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Phone size={18} className="text-gray-500" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Archive size={18} className="text-gray-500" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <MoreHorizontal size={18} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Инфо-бар */}
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>27.08.2025</span>
            <span className="flex items-center gap-1.5">
              <Clock size={14} />
              3 дня без ответа
            </span>
          </div>
          <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium", status.color)}>
            {status.label}
          </span>
        </div>

        {/* Задачи */}
        <div className="mx-5 mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Circle size={14} className="text-gray-400" />
            Нет запланированных задач
          </div>
          <button className="flex items-center gap-1 text-sm font-medium text-gray-900 hover:text-gray-600 transition-colors">
            <Plus size={14} />
            Добавить
          </button>
        </div>

        {/* Сообщения */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className={cn("flex", msg.sender === "user" ? "justify-end" : "justify-start")}>
                {msg.sender === "lead" && (
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600 mr-2 flex-shrink-0">
                    {selectedLead?.name?.[0]?.toUpperCase() || "#"}
                  </div>
                )}
                <div className={cn(
                  "max-w-[60%] px-4 py-2.5 rounded-2xl",
                  msg.sender === "user"
                    ? "bg-gray-900 text-white rounded-br-md"
                    : "bg-gray-100 text-gray-900 rounded-bl-md"
                )}>
                  <p className="text-sm">{msg.text}</p>
                  <p className={cn(
                    "text-xs mt-1",
                    msg.sender === "user" ? "text-gray-400" : "text-gray-500"
                  )}>
                    {msg.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ввод сообщения */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Paperclip size={20} className="text-gray-500" />
            </button>
            <input
              type="text"
              placeholder="Написать сообщение..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1 px-4 py-2.5 text-sm bg-gray-50 rounded-lg border border-gray-200 focus:border-gray-300 focus:ring-0 placeholder:text-gray-400"
            />
            <button
              disabled={!message.trim()}
              className={cn(
                "p-2.5 rounded-lg transition-colors",
                message.trim()
                  ? "bg-gray-900 text-white hover:bg-gray-800"
                  : "bg-gray-100 text-gray-400"
              )}
            >
              <Send size={18} />
            </button>
          </div>
          <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
            <span>Диалог #{selectedLead?.leadNumber}</span>
            <div className="flex gap-3">
              <button className="hover:text-gray-700 transition-colors">Закрыть диалог</button>
              <span>·</span>
              <button className="hover:text-gray-700 transition-colors">Отметить отвеченным</button>
            </div>
          </div>
        </div>
      </div>

      {/* Правая панель */}
      <div className="w-72 bg-white rounded-xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-gray-900">Информация</h3>
          <button className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
            Изменить
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Имя</label>
            <p className="text-sm text-gray-900 mt-1">{selectedLead?.name || "Не указано"}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">ID лида</label>
            <p className="text-sm text-gray-900 mt-1">#{selectedLead?.leadNumber}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Статус</label>
            <div className="mt-1">
              <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium", status.color)}>
                {status.label}
              </span>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Канал</label>
            <p className="text-sm text-gray-900 mt-1">{selectedLead?.channel || "—"}</p>
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-gray-100">
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Действия</h4>
          <div className="space-y-1">
            <button className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
              <CheckCircle2 size={16} />
              Квалифицировать
            </button>
            <button className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
              <Plus size={16} />
              Создать сделку
            </button>
            <button className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
              <Archive size={16} />
              В архив
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
