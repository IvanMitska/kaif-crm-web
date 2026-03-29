"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Phone,
  Video,
  Paperclip,
  Smile,
  MoreHorizontal,
  Search,
  MessageSquare,
  Mail,
  PhoneCall,
  Check,
  CheckCheck,
  Image,
  Mic,
  Pin,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Channel icons (simplified)
const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const TelegramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.757-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/>
  </svg>
);

const channels = [
  { id: "all", name: "Все", icon: MessageSquare, count: 50, color: "bg-gray-500" },
  { id: "whatsapp", name: "WhatsApp", icon: WhatsAppIcon, count: 12, color: "bg-green-500" },
  { id: "telegram", name: "Telegram", icon: TelegramIcon, count: 8, color: "bg-blue-500" },
  { id: "instagram", name: "Instagram", icon: InstagramIcon, count: 5, color: "bg-gradient-to-br from-purple-500 to-pink-500" },
  { id: "email", name: "Email", icon: Mail, count: 15, color: "bg-red-500" },
  { id: "phone", name: "Звонки", icon: PhoneCall, count: 7, color: "bg-amber-500" },
];

const conversations = [
  {
    id: 1,
    name: "Иван Иванов",
    avatar: "ИИ",
    lastMessage: "Добрый день! Интересует стоимость...",
    time: "10:30",
    unread: 2,
    channel: "whatsapp",
    online: true,
    pinned: true,
  },
  {
    id: 2,
    name: "ООО Технологии",
    avatar: "ОТ",
    lastMessage: "Спасибо за предложение, рассмотрим",
    time: "09:15",
    unread: 0,
    channel: "telegram",
    online: false,
    pinned: true,
  },
  {
    id: 3,
    name: "Петр Петров",
    avatar: "ПП",
    lastMessage: "Когда можем встретиться?",
    time: "Вчера",
    unread: 1,
    channel: "email",
    online: true,
    pinned: false,
  },
  {
    id: 4,
    name: "Анна Сидорова",
    avatar: "АС",
    lastMessage: "Отправила документы на почту",
    time: "Вчера",
    unread: 0,
    channel: "instagram",
    online: false,
    pinned: false,
  },
  {
    id: 5,
    name: "Дмитрий Козлов",
    avatar: "ДК",
    lastMessage: "Договорились, жду звонка",
    time: "Пн",
    unread: 0,
    channel: "whatsapp",
    online: true,
    pinned: false,
  },
  {
    id: 6,
    name: "Елена Новикова",
    avatar: "ЕН",
    lastMessage: "Отлично, спасибо за информацию!",
    time: "Пн",
    unread: 0,
    channel: "telegram",
    online: false,
    pinned: false,
  },
];

const messages = [
  {
    id: 1,
    sender: "Иван Иванов",
    content: "Добрый день!",
    time: "10:25",
    isMe: false,
    status: "read",
  },
  {
    id: 2,
    sender: "Иван Иванов",
    content: "Интересует стоимость вашего продукта для компании из 50 человек.",
    time: "10:28",
    isMe: false,
    status: "read",
  },
  {
    id: 3,
    sender: "Вы",
    content: "Здравствуйте, Иван! Для компании вашего размера у нас есть специальное предложение. Могу выслать подробную презентацию?",
    time: "10:29",
    isMe: true,
    status: "read",
  },
  {
    id: 4,
    sender: "Иван Иванов",
    content: "Да, было бы отлично. Также интересует возможность интеграции с нашей текущей системой.",
    time: "10:30",
    isMe: false,
    status: "read",
  },
  {
    id: 5,
    sender: "Вы",
    content: "Конечно! У нас есть готовые интеграции с большинством популярных систем. Какую именно вы используете?",
    time: "10:31",
    isMe: true,
    status: "delivered",
  },
];

const getChannelColor = (channelId: string) => {
  const channel = channels.find(c => c.id === channelId);
  return channel?.color || "bg-gray-500";
};

const getChannelIcon = (channelId: string) => {
  switch (channelId) {
    case "whatsapp": return <WhatsAppIcon />;
    case "telegram": return <TelegramIcon />;
    case "instagram": return <InstagramIcon />;
    case "email": return <Mail className="w-4 h-4" />;
    case "phone": return <PhoneCall className="w-4 h-4" />;
    default: return <MessageSquare className="w-4 h-4" />;
  }
};

export default function MessagesPage() {
  const [selectedChannel, setSelectedChannel] = useState("all");
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const filteredConversations = conversations.filter(conv => {
    if (selectedChannel !== "all" && conv.channel !== selectedChannel) return false;
    if (searchQuery && !conv.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const pinnedConversations = filteredConversations.filter(c => c.pinned);
  const otherConversations = filteredConversations.filter(c => !c.pinned);

  const selectedConv = conversations.find(c => c.id === selectedConversation);

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread, 0);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="h-full min-h-full flex">
      {/* Channels Sidebar - hidden on mobile */}
      <div className="hidden md:flex w-20 glass-card border-r border-white/5 flex-col py-4">
        {channels.map((channel) => {
          const Icon = channel.icon;
          const isActive = selectedChannel === channel.id;
          const unreadCount = channel.id === "all"
            ? totalUnread
            : conversations.filter(c => c.channel === channel.id).reduce((sum, c) => sum + c.unread, 0);

          return (
            <button
              key={channel.id}
              onClick={() => setSelectedChannel(channel.id)}
              className={cn(
                "relative flex flex-col items-center gap-1.5 py-3 mx-2 rounded-xl",
                isActive
                  ? "bg-violet-500/20 text-violet-400"
                  : "text-gray-400 hover:bg-white/5 hover:text-gray-300"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                isActive ? "bg-violet-500 text-white" : "bg-white/5"
              )}>
                {typeof Icon === 'function' && Icon.length === 0 ? <Icon /> : <Icon className="w-5 h-5" />}
              </div>
              <span className="text-[10px] font-medium">{channel.name}</span>
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Conversations List - full width on mobile, hidden when chat open */}
      <div className={cn(
        "glass-card border-r border-white/5 flex flex-col",
        "w-full md:w-80",
        selectedConversation ? "hidden md:flex" : "flex"
      )}>
        {/* Header */}
        <div className="p-4 border-b border-white/5">
          <h2 className="text-lg font-bold text-white mb-3">Сообщения</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск диалогов..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 rounded-xl text-sm border-0 focus:ring-2 focus:ring-violet-500 focus:bg-white/10 text-white placeholder-gray-400"
            />
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {pinnedConversations.length > 0 && (
            <>
              <div className="px-4 py-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Закреплённые</span>
              </div>
              {pinnedConversations.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conversation={conv}
                  isSelected={selectedConversation === conv.id}
                  onClick={() => setSelectedConversation(conv.id)}
                />
              ))}
            </>
          )}

          {otherConversations.length > 0 && (
            <>
              <div className="px-4 py-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Все диалоги</span>
              </div>
              {otherConversations.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conversation={conv}
                  isSelected={selectedConversation === conv.id}
                  onClick={() => setSelectedConversation(conv.id)}
                />
              ))}
            </>
          )}

          {filteredConversations.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <MessageSquare className="w-12 h-12 mb-3 text-gray-500" />
              <p className="text-sm font-medium">Диалоги не найдены</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      {selectedConv ? (
        <div className={cn(
          "flex-1 flex flex-col glass-card",
          selectedConversation ? "flex" : "hidden md:flex"
        )}>
          {/* Chat Header */}
          <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-white/5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Mobile back button */}
              <button
                onClick={() => setSelectedConversation(null)}
                className="md:hidden p-2 hover:bg-white/5 rounded-xl"
              >
                <ChevronLeft className="w-5 h-5 text-gray-400" />
              </button>
              <div className="relative">
                <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm sm:text-base">
                  {selectedConv.avatar}
                </div>
                {selectedConv.online && (
                  <span className="absolute bottom-0 right-0 w-3 sm:w-3.5 h-3 sm:h-3.5 bg-green-500 border-2 border-[#0a0a1a] rounded-full" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm sm:text-base">{selectedConv.name}</h3>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400">
                  <span className={cn(
                    "w-4 h-4 rounded flex items-center justify-center text-white",
                    getChannelColor(selectedConv.channel)
                  )}>
                    {getChannelIcon(selectedConv.channel)}
                  </span>
                  <span className="hidden sm:inline">{selectedConv.online ? "Онлайн" : "Был(а) недавно"}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-0.5 sm:gap-1">
              <button className="hidden sm:block p-2.5 hover:bg-white/5 rounded-xl">
                <Phone className="w-5 h-5 text-gray-400" />
              </button>
              <button className="hidden sm:block p-2.5 hover:bg-white/5 rounded-xl">
                <Video className="w-5 h-5 text-gray-400" />
              </button>
              <button className="p-2.5 hover:bg-white/5 rounded-xl">
                <Search className="w-5 h-5 text-gray-400" />
              </button>
              <button className="p-2.5 hover:bg-white/5 rounded-xl">
                <MoreHorizontal className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-6">
            <div className="max-w-3xl mx-auto space-y-3 sm:space-y-4">
              {/* Date separator */}
              <div className="flex items-center justify-center">
                <span className="px-3 py-1 bg-white/10 rounded-full text-xs text-gray-400 shadow-sm">
                  Сегодня
                </span>
              </div>

              {messages.map((msg, index) => {
                const showAvatar = !msg.isMe && (index === 0 || messages[index - 1]?.isMe);

                return (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex gap-3",
                      msg.isMe ? "justify-end" : "justify-start"
                    )}
                  >
                    {!msg.isMe && (
                      <div className="w-8 h-8 shrink-0">
                        {showAvatar && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                            {selectedConv.avatar}
                          </div>
                        )}
                      </div>
                    )}

                    <div
                      className={cn(
                        "max-w-md rounded-2xl px-4 py-2.5 shadow-sm",
                        msg.isMe
                          ? "bg-violet-500 text-white rounded-br-md"
                          : "bg-white/10 text-white rounded-bl-md"
                      )}
                    >
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                      <div className={cn(
                        "flex items-center justify-end gap-1 mt-1",
                        msg.isMe ? "text-violet-200" : "text-gray-400"
                      )}>
                        <span className="text-[10px]">{msg.time}</span>
                        {msg.isMe && (
                          msg.status === "read"
                            ? <CheckCheck className="w-3.5 h-3.5" />
                            : <Check className="w-3.5 h-3.5" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className="px-3 sm:px-6 py-3 sm:py-4 border-t border-white/5">
            <div className="flex items-end gap-2 sm:gap-3">
              <div className="hidden sm:flex gap-1">
                <button className="p-2.5 hover:bg-white/5 rounded-xl">
                  <Paperclip className="w-5 h-5 text-gray-400" />
                </button>
                <button className="p-2.5 hover:bg-white/5 rounded-xl">
                  <Image className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="flex-1 relative">
                <textarea
                  placeholder="Введите сообщение..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && message.trim()) {
                      e.preventDefault();
                      // Send message
                      setMessage("");
                    }
                  }}
                  rows={1}
                  className="w-full px-4 py-3 bg-white/5 rounded-2xl text-sm border-0 focus:ring-2 focus:ring-violet-500 focus:bg-white/10 resize-none text-white placeholder-gray-400"
                  style={{ minHeight: "48px", maxHeight: "120px" }}
                />
              </div>

              <div className="flex gap-1">
                <button className="p-2.5 hover:bg-white/5 rounded-xl">
                  <Smile className="w-5 h-5 text-gray-400" />
                </button>
                {message.trim() ? (
                  <button className="p-2.5 bg-violet-500 hover:bg-purple-500 rounded-xl">
                    <Send className="w-5 h-5 text-white" />
                  </button>
                ) : (
                  <button className="p-2.5 hover:bg-white/5 rounded-xl">
                    <Mic className="w-5 h-5 text-gray-400" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center glass-card">
          <div className="text-center">
            <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-10 h-10 text-gray-500" />
            </div>
            <p className="text-lg font-semibold text-gray-300">Выберите диалог</p>
            <p className="text-sm text-gray-400 mt-1">Чтобы начать общение</p>
          </div>
        </div>
      )}
    </div>
  );
}

function ConversationItem({
  conversation,
  isSelected,
  onClick
}: {
  conversation: typeof conversations[0];
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full px-4 py-3 flex items-start gap-3",
        isSelected
          ? "bg-violet-500/20"
          : "hover:bg-white/5"
      )}
    >
      <div className="relative shrink-0">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
          {conversation.avatar}
        </div>
        {conversation.online && (
          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-[#0a0a1a] rounded-full" />
        )}
        <span className={cn(
          "absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center text-white",
          getChannelColor(conversation.channel)
        )}>
          {getChannelIcon(conversation.channel)}
        </span>
      </div>

      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center justify-between mb-0.5">
          <div className="flex items-center gap-1.5">
            {conversation.pinned && (
              <Pin className="w-3 h-3 text-gray-400" />
            )}
            <span className={cn(
              "font-semibold text-sm truncate",
              isSelected ? "text-violet-400" : "text-white"
            )}>
              {conversation.name}
            </span>
          </div>
          <span className="text-xs text-gray-400 shrink-0">{conversation.time}</span>
        </div>
        <p className="text-sm text-gray-400 truncate">{conversation.lastMessage}</p>
      </div>

      {conversation.unread > 0 && (
        <span className="shrink-0 min-w-[20px] h-5 rounded-full bg-violet-500 text-white text-xs font-bold flex items-center justify-center px-1.5">
          {conversation.unread}
        </span>
      )}
    </button>
  );
}
