"use client";

import { useState } from "react";
import Image from "next/image";
import {
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  CreditCard,
  Building,
  Camera,
  Check,
  ChevronRight,
  Mail,
  Phone,
  Eye,
  EyeOff,
  Smartphone,
  Moon,
  Sun,
  Monitor,
  Languages,
  Plus,
  LogOut,
  ExternalLink,
  Crown,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";

// Custom icons for integrations
const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const TelegramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.757-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/>
  </svg>
);

const VKIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.391 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.12-5.339-3.202-2.17-3.042-2.763-5.32-2.763-5.795 0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.677.863 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.203.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.254-1.406 2.151-3.574 2.151-3.574.119-.254.322-.491.763-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.05.17.49-.085.744-.576.744z"/>
  </svg>
);

const tabs = [
  { id: "profile", name: "Профиль", icon: User },
  { id: "notifications", name: "Уведомления", icon: Bell },
  { id: "security", name: "Безопасность", icon: Shield },
  { id: "appearance", name: "Внешний вид", icon: Palette },
  { id: "integrations", name: "Интеграции", icon: Globe },
  { id: "company", name: "Компания", icon: Building },
  { id: "billing", name: "Тарифы", icon: CreditCard },
];

const integrations = [
  { id: "whatsapp", name: "WhatsApp Business", description: "Связь с клиентами через WhatsApp", icon: WhatsAppIcon, status: "connected", color: "bg-green-500" },
  { id: "telegram", name: "Telegram Bot", description: "Автоматизация через Telegram", icon: TelegramIcon, status: "connected", color: "bg-blue-500" },
  { id: "instagram", name: "Instagram Direct", description: "Сообщения из Instagram", icon: InstagramIcon, status: "disconnected", color: "bg-gradient-to-br from-purple-500 to-pink-500" },
  { id: "vk", name: "ВКонтакте", description: "Сообщения из ВК", icon: VKIcon, status: "disconnected", color: "bg-blue-600" },
  { id: "email", name: "Email IMAP/SMTP", description: "Почтовые ящики", icon: Mail, status: "connected", color: "bg-red-500" },
  { id: "phone", name: "IP-телефония", description: "Звонки и записи разговоров", icon: Phone, status: "disconnected", color: "bg-amber-500" },
];


// Toggle Switch Component
function Toggle({ checked, onChange, disabled = false }: { checked: boolean; onChange: (val: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        "relative w-12 h-7 rounded-full",
        checked ? "bg-violet-500" : "bg-white/10",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-sm",
          checked && "translate-x-5"
        )}
      />
    </button>
  );
}

// Settings Row Component
function SettingsRow({
  icon: Icon,
  title,
  description,
  action,
  onClick,
  danger = false
}: {
  icon?: any;
  title: string;
  description?: string;
  action?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 px-4 py-3",
        onClick && "cursor-pointer hover:bg-white/5 active:bg-white/10"
      )}
      onClick={onClick}
    >
      {Icon && (
        <div className={cn(
          "w-9 h-9 rounded-lg flex items-center justify-center",
          danger ? "bg-red-500/20 text-red-400" : "bg-white/10 text-gray-400"
        )}>
          <Icon className="w-5 h-5" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className={cn("font-medium text-sm text-white", danger && "text-red-400")}>{title}</p>
        {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
      </div>
      {action}
      {onClick && !action && <ChevronRight className="w-5 h-5 text-gray-400" />}
    </div>
  );
}

// Section Component
function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="glass-card rounded-xl overflow-hidden">
      {title && (
        <div className="px-4 py-2 border-b border-white/5">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</span>
        </div>
      )}
      <div className="divide-y divide-white/5">
        {children}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const user = useAuthStore((state) => state.user);

  // State for toggles
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [showPassword, setShowPassword] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <div className="space-y-6">
            {/* Avatar Section */}
            <Section>
              <div className="p-6 flex items-center gap-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </div>
                  <button className="absolute bottom-0 right-0 w-8 h-8 bg-violet-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-purple-500">
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{user?.firstName} {user?.lastName}</h3>
                  <p className="text-sm text-gray-400">{user?.email}</p>
                  <p className="text-xs text-gray-400 mt-1">Менеджер по продажам</p>
                </div>
              </div>
            </Section>

            {/* Personal Info */}
            <Section title="Личные данные">
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Имя</label>
                    <input
                      type="text"
                      defaultValue={user?.firstName}
                      className="w-full px-4 py-2.5 bg-white/5 rounded-xl text-sm text-white border-0 focus:ring-2 focus:ring-violet-500 focus:bg-white/10"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Фамилия</label>
                    <input
                      type="text"
                      defaultValue={user?.lastName}
                      className="w-full px-4 py-2.5 bg-white/5 rounded-xl text-sm text-white border-0 focus:ring-2 focus:ring-violet-500 focus:bg-white/10"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
                  <input
                    type="email"
                    defaultValue={user?.email}
                    className="w-full px-4 py-2.5 bg-white/5 rounded-xl text-sm text-white border-0 focus:ring-2 focus:ring-violet-500 focus:bg-white/10"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Телефон</label>
                  <input
                    type="tel"
                    placeholder="+7 (999) 123-45-67"
                    className="w-full px-4 py-2.5 bg-white/5 rounded-xl text-sm text-white border-0 focus:ring-2 focus:ring-violet-500 focus:bg-white/10 placeholder:text-gray-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Должность</label>
                    <input
                      type="text"
                      placeholder="Менеджер по продажам"
                      className="w-full px-4 py-2.5 bg-white/5 rounded-xl text-sm text-white border-0 focus:ring-2 focus:ring-violet-500 focus:bg-white/10 placeholder:text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Часовой пояс</label>
                    <select className="w-full px-4 py-2.5 bg-white/5 rounded-xl text-sm text-white border-0 focus:ring-2 focus:ring-violet-500 focus:bg-white/10 appearance-none cursor-pointer">
                      <option>UTC+3 (Москва)</option>
                      <option>UTC+5 (Екатеринбург)</option>
                      <option>UTC+7 (Новосибирск)</option>
                    </select>
                  </div>
                </div>
              </div>
            </Section>

            {/* Save Button */}
            <button className="w-full py-3 bg-violet-500 hover:bg-purple-500 text-white font-semibold rounded-xl">
              Сохранить изменения
            </button>
          </div>
        );

      case "notifications":
        return (
          <div className="space-y-6">
            <Section title="Каналы уведомлений">
              <SettingsRow
                icon={Mail}
                title="Email уведомления"
                description="Получать уведомления на почту"
                action={<Toggle checked={emailNotifications} onChange={setEmailNotifications} />}
              />
              <SettingsRow
                icon={Bell}
                title="Push уведомления"
                description="Уведомления в браузере"
                action={<Toggle checked={pushNotifications} onChange={setPushNotifications} />}
              />
              <SettingsRow
                icon={Smartphone}
                title="SMS уведомления"
                description="Важные уведомления по SMS"
                action={<Toggle checked={smsNotifications} onChange={setSmsNotifications} />}
              />
            </Section>

            <Section title="Типы уведомлений">
              <SettingsRow title="Новые сделки" action={<Toggle checked={true} onChange={() => {}} />} />
              <SettingsRow title="Новые сообщения" action={<Toggle checked={true} onChange={() => {}} />} />
              <SettingsRow title="Изменения в задачах" action={<Toggle checked={true} onChange={() => {}} />} />
              <SettingsRow title="Напоминания" action={<Toggle checked={true} onChange={() => {}} />} />
              <SettingsRow title="Системные уведомления" action={<Toggle checked={false} onChange={() => {}} />} />
            </Section>

            <Section title="Расписание">
              <SettingsRow
                title="Тихий режим"
                description="Не беспокоить с 22:00 до 08:00"
                action={<Toggle checked={false} onChange={() => {}} />}
              />
            </Section>
          </div>
        );

      case "security":
        return (
          <div className="space-y-6">
            <Section title="Пароль">
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Текущий пароль</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 bg-white/5 rounded-xl text-sm text-white border-0 focus:ring-2 focus:ring-violet-500 focus:bg-white/10 pr-12 placeholder:text-gray-500"
                    />
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Новый пароль</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 bg-white/5 rounded-xl text-sm text-white border-0 focus:ring-2 focus:ring-violet-500 focus:bg-white/10 placeholder:text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Подтверждение пароля</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 bg-white/5 rounded-xl text-sm text-white border-0 focus:ring-2 focus:ring-violet-500 focus:bg-white/10 placeholder:text-gray-500"
                  />
                </div>
                <button className="w-full py-2.5 bg-violet-500 hover:bg-purple-500 text-white font-medium rounded-xl text-sm">
                  Изменить пароль
                </button>
              </div>
            </Section>

            <Section title="Двухфакторная аутентификация">
              <SettingsRow
                icon={Shield}
                title="2FA через приложение"
                description="Google Authenticator или аналоги"
                action={<Toggle checked={twoFactor} onChange={setTwoFactor} />}
              />
              <SettingsRow
                icon={Smartphone}
                title="2FA через SMS"
                description="Код подтверждения на телефон"
                action={<Toggle checked={false} onChange={() => {}} />}
              />
            </Section>

            <Section title="Активные сессии">
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-xl">
                  <Monitor className="w-5 h-5 text-green-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">MacBook Pro — Chrome</p>
                    <p className="text-xs text-gray-400">Москва, Россия • Текущая сессия</p>
                  </div>
                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                </div>
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                  <Smartphone className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">iPhone 14 Pro — Safari</p>
                    <p className="text-xs text-gray-400">Москва, Россия • 2 часа назад</p>
                  </div>
                  <button className="text-xs text-red-400 font-medium">Завершить</button>
                </div>
              </div>
            </Section>

            <Section>
              <SettingsRow
                icon={LogOut}
                title="Выйти со всех устройств"
                description="Кроме текущего"
                onClick={() => {}}
                danger
              />
            </Section>
          </div>
        );

      case "appearance":
        return (
          <div className="space-y-6">
            <Section title="Тема">
              <div className="p-4">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "light", icon: Sun, name: "Светлая" },
                    { id: "dark", icon: Moon, name: "Тёмная" },
                    { id: "system", icon: Monitor, name: "Системная" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id as any)}
                      className={cn(
                        "flex flex-col items-center gap-2 p-4 rounded-xl border-2",
                        theme === t.id
                          ? "border-violet-500 bg-violet-500/10"
                          : "border-white/10 hover:border-white/20"
                      )}
                    >
                      <t.icon className={cn("w-6 h-6", theme === t.id ? "text-violet-400" : "text-gray-400")} />
                      <span className={cn("text-sm font-medium", theme === t.id ? "text-violet-400" : "text-gray-400")}>
                        {t.name}
                      </span>
                      {theme === t.id && <Check className="w-4 h-4 text-violet-400" />}
                    </button>
                  ))}
                </div>
              </div>
            </Section>

            <Section title="Язык">
              <SettingsRow
                icon={Languages}
                title="Язык интерфейса"
                description="Русский"
                onClick={() => {}}
              />
              <SettingsRow
                icon={Globe}
                title="Региональные настройки"
                description="Россия"
                onClick={() => {}}
              />
            </Section>

            <Section title="Отображение">
              <SettingsRow
                title="Компактный режим"
                description="Уменьшенные отступы и шрифты"
                action={<Toggle checked={false} onChange={() => {}} />}
              />
              <SettingsRow
                title="Анимации"
                description="Плавные переходы в интерфейсе"
                action={<Toggle checked={true} onChange={() => {}} />}
              />
            </Section>
          </div>
        );

      case "integrations":
        return (
          <div className="space-y-6">
            <Section title="Подключенные интеграции">
              <div className="p-4 grid grid-cols-2 gap-4">
                {integrations.map((integration) => {
                  const Icon = integration.icon;
                  const isConnected = integration.status === "connected";

                  return (
                    <div
                      key={integration.id}
                      className={cn(
                        "p-4 rounded-xl border-2",
                        isConnected ? "border-green-500/30 bg-green-500/5" : "border-white/10"
                      )}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white", integration.color)}>
                          {typeof Icon === 'function' && Icon.length === 0 ? <Icon /> : <Icon className="w-6 h-6" />}
                        </div>
                        {isConnected && <Check className="w-5 h-5 text-green-400" />}
                      </div>
                      <h4 className="font-semibold text-sm text-white">{integration.name}</h4>
                      <p className="text-xs text-gray-400 mt-1 mb-3">{integration.description}</p>
                      <button
                        className={cn(
                          "w-full py-2 rounded-lg text-sm font-medium",
                          isConnected
                            ? "bg-white/10 text-gray-300 hover:bg-white/15"
                            : "bg-violet-500 text-white hover:bg-purple-500"
                        )}
                      >
                        {isConnected ? "Настроить" : "Подключить"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </Section>

            <Section>
              <SettingsRow
                icon={ExternalLink}
                title="API и Webhooks"
                description="Настройка внешних интеграций"
                onClick={() => {}}
              />
            </Section>
          </div>
        );

      case "company":
        return (
          <div className="space-y-6">
            <Section>
              <div className="p-6 flex items-center gap-6">
                <Image
                  src="/logo-icon.png"
                  alt="Sintara CRM"
                  width={80}
                  height={80}
                  className="rounded-2xl"
                />
                <div>
                  <h3 className="text-lg font-semibold text-white">Sintara CRM</h3>
                  <p className="text-sm text-gray-400">sintara-crm.com</p>
                  <button className="text-sm text-violet-400 font-medium mt-1">Изменить логотип</button>
                </div>
              </div>
            </Section>

            <Section title="Информация о компании">
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Название компании</label>
                  <input
                    type="text"
                    defaultValue="Sintara CRM"
                    className="w-full px-4 py-2.5 bg-white/5 rounded-xl text-sm text-white border-0 focus:ring-2 focus:ring-violet-500 focus:bg-white/10"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">ИНН</label>
                  <input
                    type="text"
                    placeholder="1234567890"
                    className="w-full px-4 py-2.5 bg-white/5 rounded-xl text-sm text-white border-0 focus:ring-2 focus:ring-violet-500 focus:bg-white/10 placeholder:text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Юридический адрес</label>
                  <input
                    type="text"
                    placeholder="г. Москва, ул. Примерная, д. 1"
                    className="w-full px-4 py-2.5 bg-white/5 rounded-xl text-sm text-white border-0 focus:ring-2 focus:ring-violet-500 focus:bg-white/10 placeholder:text-gray-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Телефон</label>
                    <input
                      type="tel"
                      placeholder="+7 (495) 123-45-67"
                      className="w-full px-4 py-2.5 bg-white/5 rounded-xl text-sm text-white border-0 focus:ring-2 focus:ring-violet-500 focus:bg-white/10 placeholder:text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
                    <input
                      type="email"
                      placeholder="info@company.ru"
                      className="w-full px-4 py-2.5 bg-white/5 rounded-xl text-sm text-white border-0 focus:ring-2 focus:ring-violet-500 focus:bg-white/10 placeholder:text-gray-500"
                    />
                  </div>
                </div>
              </div>
            </Section>

            <button className="w-full py-3 bg-violet-500 hover:bg-purple-500 text-white font-semibold rounded-xl">
              Сохранить изменения
            </button>
          </div>
        );

      case "billing":
        return (
          <div className="space-y-6">
            {/* Current Plan */}
            <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-6 text-white">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-5 h-5" />
                <span className="text-sm font-medium opacity-90">Текущий тариф</span>
              </div>
              <h3 className="text-2xl font-bold mb-1">Профессиональный</h3>
              <p className="text-sm opacity-80 mb-4">10 пользователей • Все интеграции • Приоритетная поддержка</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">₽2,990</span>
                <span className="text-sm opacity-80">/ месяц</span>
              </div>
              <p className="text-xs opacity-70 mt-2">Следующее списание: 15 марта 2026</p>
            </div>

            <Section title="Доступные тарифы">
              <div className="p-4 space-y-3">
                {[
                  { name: "Стартовый", price: "₽990", users: "3 пользователя", current: false },
                  { name: "Профессиональный", price: "₽2,990", users: "10 пользователей", current: true },
                  { name: "Корпоративный", price: "₽9,990", users: "Безлимит", current: false },
                ].map((plan) => (
                  <div
                    key={plan.name}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-xl border-2",
                      plan.current ? "border-violet-500 bg-violet-500/10" : "border-white/10"
                    )}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-white">{plan.name}</p>
                        {plan.current && (
                          <span className="px-2 py-0.5 bg-violet-500 text-white text-xs font-medium rounded-full">
                            Текущий
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400">{plan.users}</p>
                    </div>
                    <p className="font-bold text-white">{plan.price}<span className="text-sm font-normal text-gray-400">/мес</span></p>
                    {!plan.current && (
                      <button className="px-4 py-2 bg-white/10 hover:bg-white/15 text-gray-300 text-sm font-medium rounded-lg">
                        Выбрать
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Способ оплаты">
              <SettingsRow
                icon={CreditCard}
                title="Visa •••• 4242"
                description="Истекает 12/27"
                onClick={() => {}}
              />
              <SettingsRow
                icon={Plus}
                title="Добавить карту"
                onClick={() => {}}
              />
            </Section>

            <Section>
              <SettingsRow
                icon={Zap}
                title="История платежей"
                description="Посмотреть все транзакции"
                onClick={() => {}}
              />
            </Section>
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-4">
              <Building className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-400 font-medium">Раздел в разработке</p>
          </div>
        );
    }
  };

  return (
    <div className="h-full min-h-full flex">
      {/* Sidebar */}
      <div className="w-64 glass-card border-r border-white/5 p-4">
        <h1 className="text-xl font-bold text-white mb-6 px-3">Настройки</h1>
        <nav className="space-y-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
                  isActive
                    ? "bg-violet-500 text-white shadow-sm"
                    : "text-gray-400 hover:bg-white/5"
                )}
              >
                <tab.icon className="w-5 h-5" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold text-white mb-6">
            {tabs.find(t => t.id === activeTab)?.name}
          </h2>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
