"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Phone,
  Video,
  Paperclip,
  Smile,
  MoreVertical,
  Search,
  Filter,
  MessageSquare,
  Mail,
  PhoneCall,
} from "lucide-react";
import { cn } from "@/lib/utils";

const channels = [
  { id: "whatsapp", name: "WhatsApp", icon: MessageSquare, count: 12, color: "bg-green-500" },
  { id: "telegram", name: "Telegram", icon: Send, count: 8, color: "bg-blue-500" },
  { id: "instagram", name: "Instagram", icon: MessageSquare, count: 5, color: "bg-purple-500" },
  { id: "vk", name: "ВКонтакте", icon: MessageSquare, count: 3, color: "bg-blue-600" },
  { id: "email", name: "Email", icon: Mail, count: 15, color: "bg-red-500" },
  { id: "phone", name: "Телефон", icon: PhoneCall, count: 7, color: "bg-gray-500" },
];

const conversations = [
  {
    id: 1,
    name: "Иван Иванов",
    avatar: "II",
    lastMessage: "Добрый день! Интересует стоимость...",
    time: "10:30",
    unread: 2,
    channel: "whatsapp",
    online: true,
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
  },
];

const messages = [
  {
    id: 1,
    sender: "Иван Иванов",
    content: "Добрый день! Интересует стоимость вашего продукта для компании из 50 человек.",
    time: "10:28",
    isMe: false,
  },
  {
    id: 2,
    sender: "Вы",
    content: "Здравствуйте, Иван! Для компании вашего размера у нас есть специальное предложение. Могу выслать подробную презентацию?",
    time: "10:29",
    isMe: true,
  },
  {
    id: 3,
    sender: "Иван Иванов",
    content: "Да, было бы отлично. Также интересует возможность интеграции с нашей текущей системой.",
    time: "10:30",
    isMe: false,
  },
];

export default function MessagesPage() {
  const [selectedChannel, setSelectedChannel] = useState("all");
  const [selectedConversation, setSelectedConversation] = useState(1);
  const [message, setMessage] = useState("");

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Channels Sidebar */}
      <div className="w-20 space-y-2">
        <button
          onClick={() => setSelectedChannel("all")}
          className={cn(
            "w-full rounded-lg p-3 flex flex-col items-center gap-1",
            selectedChannel === "all"
              ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20"
              : "hover:bg-gray-100 dark:hover:bg-gray-700"
          )}
        >
          <MessageSquare size={24} />
          <span className="text-xs">Все</span>
        </button>
        {channels.map((channel) => (
          <button
            key={channel.id}
            onClick={() => setSelectedChannel(channel.id)}
            className={cn(
              "w-full rounded-lg p-3 flex flex-col items-center gap-1 relative",
              selectedChannel === channel.id
                ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20"
                : "hover:bg-gray-100 dark:hover:bg-gray-700"
            )}
          >
            <channel.icon size={24} />
            <span className="text-xs">{channel.name.slice(0, 3)}</span>
            {channel.count > 0 && (
              <span className={cn(
                "absolute -top-1 -right-1 h-5 w-5 rounded-full text-xs text-white flex items-center justify-center",
                channel.color
              )}>
                {channel.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Conversations List */}
      <Card className="w-80">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="search"
                placeholder="Поиск..."
                className="pl-9 h-9"
              />
            </div>
            <Button size="sm" variant="ghost" className="h-9 w-9 p-0">
              <Filter size={16} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-0">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConversation(conv.id)}
                className={cn(
                  "w-full p-4 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors",
                  selectedConversation === conv.id && "bg-gray-50 dark:bg-gray-800"
                )}
              >
                <div className="relative">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                    {conv.avatar}
                  </div>
                  {conv.online && (
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white" />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">{conv.name}</p>
                    <span className="text-xs text-gray-500">{conv.time}</span>
                  </div>
                  <p className="text-sm text-gray-600 truncate">{conv.lastMessage}</p>
                </div>
                {conv.unread > 0 && (
                  <Badge className="bg-red-500 text-white">
                    {conv.unread}
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                ИИ
              </div>
              <div>
                <h3 className="font-semibold">Иван Иванов</h3>
                <p className="text-sm text-gray-500">WhatsApp • Онлайн</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" className="h-9 w-9 p-0">
                <Phone size={18} />
              </Button>
              <Button size="sm" variant="ghost" className="h-9 w-9 p-0">
                <Video size={18} />
              </Button>
              <Button size="sm" variant="ghost" className="h-9 w-9 p-0">
                <MoreVertical size={18} />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-3",
                  msg.isMe && "flex-row-reverse"
                )}
              >
                {!msg.isMe && (
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                    ИИ
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-md rounded-lg px-4 py-2",
                    msg.isMe
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 dark:bg-gray-800"
                  )}
                >
                  <p className="text-sm">{msg.content}</p>
                  <p className={cn(
                    "text-xs mt-1",
                    msg.isMe ? "text-blue-100" : "text-gray-500"
                  )}>
                    {msg.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        
        <div className="border-t p-4">
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" className="h-9 w-9 p-0">
              <Paperclip size={18} />
            </Button>
            <Input
              placeholder="Введите сообщение..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && message) {
                  // Send message
                  setMessage("");
                }
              }}
              className="flex-1"
            />
            <Button size="sm" variant="ghost" className="h-9 w-9 p-0">
              <Smile size={18} />
            </Button>
            <Button size="sm" className="h-9 px-4">
              <Send size={16} className="mr-1" />
              Отправить
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}