"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Phone,
  Mail,
  Building2,
  Calendar,
  DollarSign,
  User,
  Clock,
  Edit,
  MoreVertical,
  MessageSquare,
  FileText,
  CheckSquare,
  Activity,
  Paperclip,
  Send,
  Plus,
} from "lucide-react";

interface DealDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  deal: any;
  onEdit: () => void;
}

export function DealDetails({ isOpen, onClose, deal, onEdit }: DealDetailsProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [comment, setComment] = useState("");

  if (!deal) return null;

  const priorityColors = {
    low: "bg-gray-100 text-gray-600",
    medium: "bg-yellow-100 text-yellow-700",
    high: "bg-red-100 text-red-700",
  };

  const priorityLabels = {
    low: "Низкий",
    medium: "Средний",
    high: "Высокий",
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <SheetTitle className="text-xl">{deal.title}</SheetTitle>
              <SheetDescription className="flex items-center gap-2">
                <Building2 size={14} />
                {deal.company}
              </SheetDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={onEdit}>
                <Edit size={16} className="mr-2" />
                Редактировать
              </Button>
              <Button size="sm" variant="ghost">
                <MoreVertical size={16} />
              </Button>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Key Info */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Сумма сделки</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ₽{deal.amount.toLocaleString()}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Приоритет</p>
                    <Badge className={`${priorityColors[deal.priority]} mt-1`} variant="secondary">
                      {priorityLabels[deal.priority]}
                    </Badge>
                  </div>
                  <Activity className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Контактная информация</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <User size={16} className="text-gray-400" />
                <span className="text-sm">{deal.contact}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-gray-400" />
                <span className="text-sm">{deal.phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-gray-400" />
                <span className="text-sm">{deal.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar size={16} className="text-gray-400" />
                <span className="text-sm">
                  Создано: {new Date(deal.createdAt).toLocaleDateString("ru-RU")}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          {deal.tags && deal.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {deal.tags.map((tag: string) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Обзор</TabsTrigger>
              <TabsTrigger value="tasks">Задачи</TabsTrigger>
              <TabsTrigger value="files">Файлы</TabsTrigger>
              <TabsTrigger value="history">История</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Комментарии</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm">
                      АИ
                    </div>
                    <div className="flex-1">
                      <div className="bg-gray-100 rounded-lg p-3">
                        <p className="text-sm">Клиент заинтересован в нашем предложении. Ждем ответа на КП.</p>
                        <p className="text-xs text-gray-500 mt-1">2 часа назад</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Textarea
                      placeholder="Добавить комментарий..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={3}
                      className="flex-1"
                    />
                    <Button size="sm" className="self-end">
                      <Send size={16} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tasks" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between">
                    Задачи
                    <Button size="sm">
                      <Plus size={16} className="mr-1" />
                      Добавить
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                    <CheckSquare size={16} className="text-yellow-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Отправить КП</p>
                      <p className="text-xs text-gray-600">Срок: завтра</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                    <CheckSquare size={16} className="text-green-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium line-through">Первичный контакт</p>
                      <p className="text-xs text-gray-600">Выполнено вчера</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="files" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between">
                    Файлы
                    <Button size="sm">
                      <Paperclip size={16} className="mr-1" />
                      Загрузить
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
                    <FileText size={20} className="text-blue-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Коммерческое предложение.pdf</p>
                      <p className="text-xs text-gray-500">2.3 MB • 2 дня назад</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
                    <FileText size={20} className="text-blue-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Договор_черновик.docx</p>
                      <p className="text-xs text-gray-500">156 KB • 5 дней назад</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">История изменений</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5"></div>
                      <div className="flex-1">
                        <p className="text-sm">Сделка перемещена в "Переговоры"</p>
                        <p className="text-xs text-gray-500">Сегодня, 14:30</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-600 mt-1.5"></div>
                      <div className="flex-1">
                        <p className="text-sm">Добавлен контакт: {deal.contact}</p>
                        <p className="text-xs text-gray-500">Вчера, 10:15</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-gray-400 mt-1.5"></div>
                      <div className="flex-1">
                        <p className="text-sm">Сделка создана</p>
                        <p className="text-xs text-gray-500">
                          {new Date(deal.createdAt).toLocaleDateString("ru-RU")}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}