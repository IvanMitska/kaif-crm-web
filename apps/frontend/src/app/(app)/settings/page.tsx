"use client";

import { useState, useEffect } from "react";
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
  ExternalLink,
  Crown,
  Zap,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";
import { integrationsApi, organizationsApi, usersApi } from "@/lib/api";
import { CURRENCY_OPTIONS, CurrencyCode, getCurrencySymbol } from "@/lib/currency";

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

const tabs = [
  { id: "profile", name: "Профиль", icon: User },
  { id: "notifications", name: "Уведомления", icon: Bell },
  { id: "security", name: "Безопасность", icon: Shield },
  { id: "appearance", name: "Внешний вид", icon: Palette },
  { id: "integrations", name: "Интеграции", icon: Globe },
  { id: "company", name: "Компания", icon: Building },
  { id: "billing", name: "Тарифы", icon: CreditCard },
];

// Integration configurations (UI config)
const integrationConfigs: Record<string, { name: string; description: string; icon: any; color: string }> = {
  whatsapp: { name: "WhatsApp Business", description: "Связь с клиентами через WhatsApp", icon: WhatsAppIcon, color: "bg-green-500" },
  telegram: { name: "Telegram Bot", description: "Автоматизация через Telegram", icon: TelegramIcon, color: "bg-blue-500" },
  instagram: { name: "Instagram Direct", description: "Сообщения из Instagram", icon: InstagramIcon, color: "bg-gradient-to-br from-purple-500 to-pink-500" },
  email: { name: "Email IMAP/SMTP", description: "Почтовые ящики", icon: Mail, color: "bg-red-500" },
  phone: { name: "IP-телефония", description: "Звонки и записи разговоров", icon: Phone, color: "bg-amber-500" },
};

interface IntegrationStatus {
  id: string;
  status: "connected" | "disconnected";
}


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
  const organization = useAuthStore((state) => state.organization);
  const updateOrganization = useAuthStore((state) => state.updateOrganization);
  const updateUser = useAuthStore((state) => state.updateUser);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: '',
    position: '',
    timezone: 'UTC+3',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Company form state
  const [companyForm, setCompanyForm] = useState({
    name: organization?.name || 'Sintara CRM',
    inn: '',
    address: '',
    phone: '',
    email: '',
  });
  const [savingCompany, setSavingCompany] = useState(false);
  const [companySaved, setCompanySaved] = useState(false);

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // State for currency
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>(
    (organization?.currency as CurrencyCode) || 'THB'
  );
  const [savingCurrency, setSavingCurrency] = useState(false);

  // Initialize forms when user/org data loads
  useEffect(() => {
    if (user) {
      setProfileForm(prev => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
      }));
    }
  }, [user]);

  useEffect(() => {
    if (organization) {
      setCompanyForm(prev => ({
        ...prev,
        name: organization.name || '',
      }));
      setSelectedCurrency((organization.currency as CurrencyCode) || 'THB');
    }
  }, [organization]);

  // Save profile handler
  const handleSaveProfile = async () => {
    if (!user?.id) return;

    setSavingProfile(true);
    setProfileError(null);
    setProfileSaved(false);

    try {
      await usersApi.update(user.id, {
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
      });
      updateUser({
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
      });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (error: any) {
      console.error('Failed to save profile:', error);
      setProfileError(error.response?.data?.message || 'Ошибка сохранения профиля');
    } finally {
      setSavingProfile(false);
    }
  };

  // Save company handler
  const handleSaveCompany = async () => {
    setSavingCompany(true);
    setCompanySaved(false);

    try {
      await organizationsApi.updateCurrent({ name: companyForm.name });
      updateOrganization({ name: companyForm.name });
      setCompanySaved(true);
      setTimeout(() => setCompanySaved(false), 3000);
    } catch (error) {
      console.error('Failed to save company:', error);
    } finally {
      setSavingCompany(false);
    }
  };

  // Save currency handler
  const handleSaveCurrency = async () => {
    setSavingCurrency(true);
    try {
      await organizationsApi.updateCurrent({ currency: selectedCurrency });
      updateOrganization({ currency: selectedCurrency });
    } catch (error) {
      console.error('Failed to save currency:', error);
    } finally {
      setSavingCurrency(false);
    }
  };

  // Change password handler
  const handleChangePassword = async () => {
    if (passwordForm.new !== passwordForm.confirm) {
      setPasswordError('Пароли не совпадают');
      return;
    }
    if (passwordForm.new.length < 6) {
      setPasswordError('Пароль должен быть не менее 6 символов');
      return;
    }

    setSavingPassword(true);
    setPasswordError(null);
    setPasswordSuccess(false);

    try {
      await usersApi.changePassword({
        currentPassword: passwordForm.current,
        newPassword: passwordForm.new,
      });
      setPasswordSuccess(true);
      setPasswordForm({ current: '', new: '', confirm: '' });
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (error: any) {
      console.error('Failed to change password:', error);
      setPasswordError(error.response?.data?.message || 'Неверный текущий пароль');
    } finally {
      setSavingPassword(false);
    }
  };

  // State for toggles
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [notificationTypes, setNotificationTypes] = useState({
    newDeals: true,
    newMessages: true,
    taskChanges: true,
    reminders: true,
    system: false,
    quietMode: false,
  });
  const [theme, setTheme] = useState<"light" | "dark" | "system">("dark");
  const [showPassword, setShowPassword] = useState(false);

  // State for integrations
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([]);
  const [integrationsLoading, setIntegrationsLoading] = useState(false);

  useEffect(() => {
    if (activeTab === "integrations") {
      fetchIntegrations();
    }
  }, [activeTab]);

  const fetchIntegrations = async () => {
    try {
      setIntegrationsLoading(true);
      const response = await integrationsApi.getStatus();
      const data = response.data;

      // Map API response to integration statuses
      const statuses: IntegrationStatus[] = Object.keys(integrationConfigs).map(id => ({
        id,
        status: data[id]?.connected ? "connected" : "disconnected"
      }));

      setIntegrations(statuses);
    } catch (err) {
      console.error("Failed to fetch integrations:", err);
      // Fallback to all disconnected
      const statuses: IntegrationStatus[] = Object.keys(integrationConfigs).map(id => ({
        id,
        status: "disconnected"
      }));
      setIntegrations(statuses);
    } finally {
      setIntegrationsLoading(false);
    }
  };

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
                  <button
                    className="absolute bottom-0 right-0 w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-white/50 shadow-lg cursor-not-allowed"
                    title="Загрузка аватара скоро будет доступна"
                    disabled
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{user?.firstName} {user?.lastName}</h3>
                  <p className="text-sm text-gray-400">{user?.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 bg-violet-500/20 text-violet-400 text-xs font-medium rounded">
                    {user?.role === 'ADMIN' ? 'Администратор' : user?.role === 'MANAGER' ? 'Менеджер' : 'Пользователь'}
                  </span>
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
                      value={profileForm.firstName}
                      onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white/5 rounded-xl text-sm text-white border-0 focus:ring-2 focus:ring-violet-500 focus:bg-white/10"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Фамилия</label>
                    <input
                      type="text"
                      value={profileForm.lastName}
                      onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white/5 rounded-xl text-sm text-white border-0 focus:ring-2 focus:ring-violet-500 focus:bg-white/10"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    disabled
                    className="w-full px-4 py-2.5 bg-white/5 rounded-xl text-sm text-white/50 border-0 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email нельзя изменить</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Телефон</label>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    placeholder="+7 (999) 123-45-67"
                    className="w-full px-4 py-2.5 bg-white/5 rounded-xl text-sm text-white border-0 focus:ring-2 focus:ring-violet-500 focus:bg-white/10 placeholder:text-gray-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Должность</label>
                    <input
                      type="text"
                      value={profileForm.position}
                      onChange={(e) => setProfileForm({ ...profileForm, position: e.target.value })}
                      placeholder="Менеджер по продажам"
                      className="w-full px-4 py-2.5 bg-white/5 rounded-xl text-sm text-white border-0 focus:ring-2 focus:ring-violet-500 focus:bg-white/10 placeholder:text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Часовой пояс</label>
                    <select
                      value={profileForm.timezone}
                      onChange={(e) => setProfileForm({ ...profileForm, timezone: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white/5 rounded-xl text-sm text-white border-0 focus:ring-2 focus:ring-violet-500 focus:bg-white/10 appearance-none cursor-pointer"
                    >
                      <option value="UTC+3" className="bg-gray-800">UTC+3 (Москва)</option>
                      <option value="UTC+5" className="bg-gray-800">UTC+5 (Екатеринбург)</option>
                      <option value="UTC+7" className="bg-gray-800">UTC+7 (Новосибирск/Бангкок)</option>
                    </select>
                  </div>
                </div>
              </div>
            </Section>

            {/* Error/Success Messages */}
            {profileError && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                {profileError}
              </div>
            )}

            {profileSaved && (
              <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm">
                <Check className="w-4 h-4" />
                Профиль успешно сохранён
              </div>
            )}

            {/* Save Button */}
            <button
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="w-full py-3 bg-violet-500 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl flex items-center justify-center gap-2"
            >
              {savingProfile && <Loader2 className="w-4 h-4 animate-spin" />}
              {savingProfile ? 'Сохранение...' : 'Сохранить изменения'}
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
              <SettingsRow
                title="Новые сделки"
                action={
                  <Toggle
                    checked={notificationTypes.newDeals}
                    onChange={(val) => setNotificationTypes({ ...notificationTypes, newDeals: val })}
                  />
                }
              />
              <SettingsRow
                title="Новые сообщения"
                action={
                  <Toggle
                    checked={notificationTypes.newMessages}
                    onChange={(val) => setNotificationTypes({ ...notificationTypes, newMessages: val })}
                  />
                }
              />
              <SettingsRow
                title="Изменения в задачах"
                action={
                  <Toggle
                    checked={notificationTypes.taskChanges}
                    onChange={(val) => setNotificationTypes({ ...notificationTypes, taskChanges: val })}
                  />
                }
              />
              <SettingsRow
                title="Напоминания"
                action={
                  <Toggle
                    checked={notificationTypes.reminders}
                    onChange={(val) => setNotificationTypes({ ...notificationTypes, reminders: val })}
                  />
                }
              />
              <SettingsRow
                title="Системные уведомления"
                action={
                  <Toggle
                    checked={notificationTypes.system}
                    onChange={(val) => setNotificationTypes({ ...notificationTypes, system: val })}
                  />
                }
              />
            </Section>

            <Section title="Расписание">
              <SettingsRow
                title="Тихий режим"
                description="Не беспокоить с 22:00 до 08:00"
                action={
                  <Toggle
                    checked={notificationTypes.quietMode}
                    onChange={(val) => setNotificationTypes({ ...notificationTypes, quietMode: val })}
                  />
                }
              />
            </Section>

            <p className="text-xs text-gray-500 text-center">
              Настройки уведомлений сохраняются автоматически
            </p>
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
                      value={passwordForm.current}
                      onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 bg-white/5 rounded-xl text-sm text-white border-0 focus:ring-2 focus:ring-violet-500 focus:bg-white/10 pr-12 placeholder:text-gray-500"
                    />
                    <button
                      type="button"
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
                    value={passwordForm.new}
                    onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 bg-white/5 rounded-xl text-sm text-white border-0 focus:ring-2 focus:ring-violet-500 focus:bg-white/10 placeholder:text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Подтверждение пароля</label>
                  <input
                    type="password"
                    value={passwordForm.confirm}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 bg-white/5 rounded-xl text-sm text-white border-0 focus:ring-2 focus:ring-violet-500 focus:bg-white/10 placeholder:text-gray-500"
                  />
                </div>

                {passwordError && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {passwordError}
                  </div>
                )}

                {passwordSuccess && (
                  <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm">
                    <Check className="w-4 h-4" />
                    Пароль успешно изменён
                  </div>
                )}

                <button
                  onClick={handleChangePassword}
                  disabled={savingPassword || !passwordForm.current || !passwordForm.new || !passwordForm.confirm}
                  className="w-full py-2.5 bg-violet-500 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl text-sm flex items-center justify-center gap-2"
                >
                  {savingPassword && <Loader2 className="w-4 h-4 animate-spin" />}
                  {savingPassword ? 'Изменение...' : 'Изменить пароль'}
                </button>
              </div>
            </Section>

            <Section title="Двухфакторная аутентификация">
              <div className="p-4">
                <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
                  <Shield className="w-8 h-8 text-gray-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-300">Двухфакторная аутентификация</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Функция находится в разработке и скоро будет доступна
                    </p>
                  </div>
                  <span className="px-2 py-1 bg-violet-500/20 text-violet-400 text-xs font-medium rounded-lg">
                    Скоро
                  </span>
                </div>
              </div>
            </Section>

            <Section title="Текущая сессия">
              <div className="p-4">
                <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-xl">
                  <Monitor className="w-5 h-5 text-green-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">Текущий браузер</p>
                    <p className="text-xs text-gray-400">Вы вошли в систему</p>
                  </div>
                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                </div>
                <p className="text-xs text-gray-500 mt-3 text-center">
                  Управление сессиями будет доступно в следующих версиях
                </p>
              </div>
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
                    { id: "light", icon: Sun, name: "Светлая", disabled: true },
                    { id: "dark", icon: Moon, name: "Тёмная", disabled: false },
                    { id: "system", icon: Monitor, name: "Системная", disabled: true },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => !t.disabled && setTheme(t.id as any)}
                      disabled={t.disabled}
                      className={cn(
                        "flex flex-col items-center gap-2 p-4 rounded-xl border-2 relative",
                        theme === t.id
                          ? "border-violet-500 bg-violet-500/10"
                          : "border-white/10",
                        t.disabled ? "opacity-50 cursor-not-allowed" : "hover:border-white/20"
                      )}
                    >
                      <t.icon className={cn("w-6 h-6", theme === t.id ? "text-violet-400" : "text-gray-400")} />
                      <span className={cn("text-sm font-medium", theme === t.id ? "text-violet-400" : "text-gray-400")}>
                        {t.name}
                      </span>
                      {theme === t.id && <Check className="w-4 h-4 text-violet-400" />}
                      {t.disabled && (
                        <span className="absolute -top-2 -right-2 px-1.5 py-0.5 bg-violet-500/20 text-violet-400 text-[10px] font-medium rounded">
                          Скоро
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-3 text-center">
                  Сейчас доступна только тёмная тема. Светлая тема в разработке.
                </p>
              </div>
            </Section>

            <Section title="Язык и регион">
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                  <Languages className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">Язык интерфейса</p>
                    <p className="text-xs text-gray-400">Русский</p>
                  </div>
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-lg">
                    Активен
                  </span>
                </div>
                <p className="text-xs text-gray-500 text-center">
                  Дополнительные языки будут добавлены в будущих версиях
                </p>
              </div>
            </Section>

            <Section title="Отображение">
              <div className="p-4">
                <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
                  <Palette className="w-8 h-8 text-gray-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-300">Настройки отображения</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Компактный режим, анимации и другие настройки
                    </p>
                  </div>
                  <span className="px-2 py-1 bg-violet-500/20 text-violet-400 text-xs font-medium rounded-lg">
                    Скоро
                  </span>
                </div>
              </div>
            </Section>
          </div>
        );

      case "integrations":
        return (
          <div className="space-y-6">
            <Section title="Подключенные интеграции">
              {integrationsLoading ? (
                <div className="p-8 flex justify-center">
                  <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
                </div>
              ) : (
                <div className="p-4 grid grid-cols-2 gap-4">
                  {integrations.map((integration) => {
                    const config = integrationConfigs[integration.id];
                    if (!config) return null;

                    const Icon = config.icon;
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
                          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white", config.color)}>
                            {typeof Icon === 'function' && Icon.length === 0 ? <Icon /> : <Icon className="w-6 h-6" />}
                          </div>
                          {isConnected && <Check className="w-5 h-5 text-green-400" />}
                        </div>
                        <h4 className="font-semibold text-sm text-white">{config.name}</h4>
                        <p className="text-xs text-gray-400 mt-1 mb-3">{config.description}</p>
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
              )}
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
                  <h3 className="text-lg font-semibold text-white">{companyForm.name || 'Sintara CRM'}</h3>
                  <p className="text-sm text-gray-400">{organization?.slug}.sintara-crm.com</p>
                  <button className="text-sm text-violet-400 font-medium mt-1 opacity-50 cursor-not-allowed">
                    Изменить логотип (скоро)
                  </button>
                </div>
              </div>
            </Section>

            <Section title="Информация о компании">
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Название компании</label>
                  <input
                    type="text"
                    value={companyForm.name}
                    onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/5 rounded-xl text-sm text-white border-0 focus:ring-2 focus:ring-violet-500 focus:bg-white/10"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">ИНН</label>
                  <input
                    type="text"
                    value={companyForm.inn}
                    onChange={(e) => setCompanyForm({ ...companyForm, inn: e.target.value })}
                    placeholder="1234567890"
                    className="w-full px-4 py-2.5 bg-white/5 rounded-xl text-sm text-white border-0 focus:ring-2 focus:ring-violet-500 focus:bg-white/10 placeholder:text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Юридический адрес</label>
                  <input
                    type="text"
                    value={companyForm.address}
                    onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                    placeholder="г. Москва, ул. Примерная, д. 1"
                    className="w-full px-4 py-2.5 bg-white/5 rounded-xl text-sm text-white border-0 focus:ring-2 focus:ring-violet-500 focus:bg-white/10 placeholder:text-gray-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Телефон</label>
                    <input
                      type="tel"
                      value={companyForm.phone}
                      onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                      placeholder="+7 (495) 123-45-67"
                      className="w-full px-4 py-2.5 bg-white/5 rounded-xl text-sm text-white border-0 focus:ring-2 focus:ring-violet-500 focus:bg-white/10 placeholder:text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
                    <input
                      type="email"
                      value={companyForm.email}
                      onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                      placeholder="info@company.ru"
                      className="w-full px-4 py-2.5 bg-white/5 rounded-xl text-sm text-white border-0 focus:ring-2 focus:ring-violet-500 focus:bg-white/10 placeholder:text-gray-500"
                    />
                  </div>
                </div>
              </div>
            </Section>

            <Section title="Валюта">
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Валюта для отображения сумм</label>
                  <select
                    value={selectedCurrency}
                    onChange={(e) => setSelectedCurrency(e.target.value as CurrencyCode)}
                    className="w-full px-4 py-2.5 bg-white/5 rounded-xl text-sm text-white border-0 focus:ring-2 focus:ring-violet-500 focus:bg-white/10 appearance-none cursor-pointer"
                  >
                    {CURRENCY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value} className="bg-gray-800 text-white">
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1.5">
                    Выбранная валюта будет использоваться для отображения всех сумм в CRM
                  </p>
                </div>
                <button
                  onClick={handleSaveCurrency}
                  disabled={savingCurrency || selectedCurrency === organization?.currency}
                  className="w-full py-2.5 bg-violet-500 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl flex items-center justify-center gap-2"
                >
                  {savingCurrency && <Loader2 className="w-4 h-4 animate-spin" />}
                  {savingCurrency ? 'Сохранение...' : 'Сохранить валюту'}
                </button>
              </div>
            </Section>

            {companySaved && (
              <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm">
                <Check className="w-4 h-4" />
                Данные компании успешно сохранены
              </div>
            )}

            <button
              onClick={handleSaveCompany}
              disabled={savingCompany}
              className="w-full py-3 bg-violet-500 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl flex items-center justify-center gap-2"
            >
              {savingCompany && <Loader2 className="w-4 h-4 animate-spin" />}
              {savingCompany ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
          </div>
        );

      case "billing":
        const currencySymbol = getCurrencySymbol((organization?.currency as CurrencyCode) || 'THB');
        return (
          <div className="space-y-6">
            {/* Current Plan */}
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5" />
                <span className="text-sm font-medium opacity-90">Текущий тариф</span>
              </div>
              <h3 className="text-2xl font-bold mb-1">Бесплатный</h3>
              <p className="text-sm opacity-80 mb-4">Все функции доступны • Без ограничений</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">{currencySymbol}0</span>
                <span className="text-sm opacity-80">/ месяц</span>
              </div>
            </div>

            <Section title="О тарифах">
              <div className="p-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-violet-500/20 flex items-center justify-center mx-auto mb-4">
                  <Crown className="w-8 h-8 text-violet-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Платные тарифы скоро</h3>
                <p className="text-sm text-gray-400 max-w-md mx-auto">
                  В данный момент все функции Sintara CRM доступны бесплатно.
                  Платные тарифы с расширенными возможностями будут добавлены позже.
                </p>
              </div>
            </Section>

            <Section title="Что входит в бесплатный план">
              <div className="p-4 space-y-3">
                {[
                  "Неограниченное количество сделок",
                  "Неограниченное количество контактов",
                  "Все интеграции",
                  "Онлайн-запись",
                  "Аналитика и отчёты",
                  "Telegram бот",
                ].map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Check className="w-3 h-3 text-green-400" />
                    </div>
                    <span className="text-sm text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>
            </Section>

            <Section>
              <div className="p-4">
                <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
                  <CreditCard className="w-8 h-8 text-gray-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-300">Способы оплаты</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Будут доступны при запуске платных тарифов
                    </p>
                  </div>
                  <span className="px-2 py-1 bg-violet-500/20 text-violet-400 text-xs font-medium rounded-lg">
                    Скоро
                  </span>
                </div>
              </div>
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
