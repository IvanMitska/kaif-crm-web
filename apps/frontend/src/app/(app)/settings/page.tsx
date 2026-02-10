"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  Smartphone,
  CreditCard,
  Users,
  Building,
  Key,
  Mail,
  Phone,
  Save,
  Upload,
  Check,
  X,
} from "lucide-react";
import { useAuthStore } from "@/store/auth";

const tabs = [
  { id: "profile", name: "Профиль", icon: User },
  { id: "notifications", name: "Уведомления", icon: Bell },
  { id: "security", name: "Безопасность", icon: Shield },
  { id: "appearance", name: "Внешний вид", icon: Palette },
  { id: "integrations", name: "Интеграции", icon: Globe },
  { id: "team", name: "Команда", icon: Users },
  { id: "company", name: "Компания", icon: Building },
  { id: "billing", name: "Тарифы", icon: CreditCard },
];

const integrations = [
  { id: "whatsapp", name: "WhatsApp", status: "connected", icon: "💬" },
  { id: "telegram", name: "Telegram", status: "connected", icon: "✈️" },
  { id: "instagram", name: "Instagram", status: "disconnected", icon: "📷" },
  { id: "vk", name: "ВКонтакте", status: "disconnected", icon: "📱" },
  { id: "email", name: "Email", status: "connected", icon: "✉️" },
];

const teamMembers = [
  { id: 1, name: "Админ Системы", email: "admin@kaifcrm.ru", role: "Администратор", status: "online" },
  { id: 2, name: "Иван Менеджеров", email: "manager@kaifcrm.ru", role: "Менеджер", status: "online" },
  { id: 3, name: "Петр Продажников", email: "petr@kaifcrm.ru", role: "Менеджер", status: "offline" },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const user = useAuthStore((state) => state.user);

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-6">
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-semibold">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              <div>
                <Button variant="outline" size="sm">
                  <Upload size={16} className="mr-2" />
                  Загрузить фото
                </Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">Имя</Label>
                <Input id="firstName" defaultValue={user?.firstName} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Фамилия</Label>
                <Input id="lastName" defaultValue={user?.lastName} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue={user?.email} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Телефон</Label>
                <Input id="phone" type="tel" placeholder="+7 (999) 123-45-67" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">Должность</Label>
                <Input id="position" placeholder="Менеджер по продажам" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Часовой пояс</Label>
                <select id="timezone" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option>UTC+3 (Москва)</option>
                  <option>UTC+5 (Екатеринбург)</option>
                  <option>UTC+7 (Новосибирск)</option>
                </select>
              </div>
            </div>

            <Button className="w-full md:w-auto">
              <Save size={16} className="mr-2" />
              Сохранить изменения
            </Button>
          </div>
        );

      case "notifications":
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email уведомления</p>
                  <p className="text-sm text-gray-500">Получать уведомления на почту</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Push уведомления</p>
                  <p className="text-sm text-gray-500">Уведомления в браузере</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">SMS уведомления</p>
                  <p className="text-sm text-gray-500">Важные уведомления по SMS</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="font-semibold mb-4">Типы уведомлений</h3>
              <div className="space-y-3">
                {["Новые сделки", "Новые сообщения", "Изменения в задачах", "Напоминания", "Системные уведомления"].map((item) => (
                  <label key={item} className="flex items-center gap-3">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm">{item}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case "integrations":
        return (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              {integrations.map((integration) => (
                <Card key={integration.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{integration.icon}</span>
                        <div>
                          <CardTitle className="text-base">{integration.name}</CardTitle>
                          <Badge
                            variant={integration.status === "connected" ? "default" : "secondary"}
                            className="mt-1"
                          >
                            {integration.status === "connected" ? "Подключено" : "Отключено"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant={integration.status === "connected" ? "outline" : "default"}
                      size="sm"
                      className="w-full"
                    >
                      {integration.status === "connected" ? "Настроить" : "Подключить"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case "team":
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500">3 пользователя из 10</p>
              <Button>
                <Users size={16} className="mr-2" />
                Пригласить
              </Button>
            </div>

            <div className="space-y-4">
              {teamMembers.map((member) => (
                <Card key={member.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                        {member.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-gray-500">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline">{member.role}</Badge>
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${member.status === "online" ? "bg-green-500" : "bg-gray-400"}`} />
                        <span className="text-sm text-gray-500">
                          {member.status === "online" ? "В сети" : "Не в сети"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">Раздел в разработке</p>
          </div>
        );
    }
  };

  return (
    <div className="flex gap-6">
      {/* Sidebar */}
      <div className="w-64">
        <nav className="space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              <tab.icon size={18} />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <Card className="flex-1">
        <CardHeader>
          <CardTitle>{tabs.find(t => t.id === activeTab)?.name}</CardTitle>
        </CardHeader>
        <CardContent>{renderContent()}</CardContent>
      </Card>
    </div>
  );
}