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
  Edit,
  MoreVertical,
  Activity,
  Send,
  Plus,
  CheckSquare,
  Paperclip,
  FileText,
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

  const priorityColors: Record<string, string> = {
    low: "bg-white/10 text-gray-400",
    medium: "bg-yellow-500/20 text-yellow-400",
    high: "bg-red-500/20 text-red-400",
  };

  const priorityLabels: Record<string, string> = {
    low: "Низкий",
    medium: "Средний",
    high: "Высокий",
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto bg-[#0d0d14] border-white/10">
        <SheetHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <SheetTitle className="text-xl text-white">{deal.title}</SheetTitle>
              <SheetDescription className="flex items-center gap-2 text-gray-400">
                <Building2 size={14} />
                {deal.company}
              </SheetDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={onEdit} className="border-white/10 text-gray-400 hover:bg-white/5 hover:text-white">
                <Edit size={16} className="mr-2" />
                Редактировать
              </Button>
              <Button size="sm" variant="ghost" className="text-gray-400 hover:bg-white/5 hover:text-white">
                <MoreVertical size={16} />
              </Button>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Key Info */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="glass-card border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Сумма сделки</p>
                    <p className="text-2xl font-bold text-white">
                      {deal.amount.toLocaleString()} ₽
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Приоритет</p>
                    <Badge className={`${priorityColors[deal.priority]} mt-1`} variant="secondary">
                      {priorityLabels[deal.priority]}
                    </Badge>
                  </div>
                  <Activity className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Info */}
          <Card className="glass-card border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-white">Контактная информация</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <User size={16} className="text-gray-400" />
                <span className="text-sm text-white">{deal.contact}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-gray-400" />
                <span className="text-sm text-white">{deal.phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-gray-400" />
                <span className="text-sm text-white">{deal.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar size={16} className="text-gray-400" />
                <span className="text-sm text-white">
                  Создано: {new Date(deal.createdAt).toLocaleDateString("ru-RU")}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          {deal.tags && deal.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {deal.tags.map((tag: string) => (
                <Badge key={tag} variant="outline" className="border-white/10 text-gray-400">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 bg-white/5 border border-white/10">
              <TabsTrigger value="overview" className="data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-400 text-gray-400">Обзор</TabsTrigger>
              <TabsTrigger value="tasks" className="data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-400 text-gray-400">Задачи</TabsTrigger>
              <TabsTrigger value="files" className="data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-400 text-gray-400">Файлы</TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-400 text-gray-400">История</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card className="glass-card border-white/10">
                <CardHeader>
                  <CardTitle className="text-base text-white">Комментарии</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 flex items-center justify-center text-white text-sm">
                      АИ
                    </div>
                    <div className="flex-1">
                      <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                        <p className="text-sm text-white">Клиент заинтересован в нашем предложении. Ждем ответа на КП.</p>
                        <p className="text-xs text-gray-400 mt-1">2 часа назад</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Textarea
                      placeholder="Добавить комментарий..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={3}
                      className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                    />
                    <Button size="sm" className="self-end bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600">
                      <Send size={16} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tasks" className="space-y-4">
              <Card className="glass-card border-white/10">
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between text-white">
                    Задачи
                    <Button size="sm" className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600">
                      <Plus size={16} className="mr-1" />
                      Добавить
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                    <CheckSquare size={16} className="text-yellow-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">Отправить КП</p>
                      <p className="text-xs text-gray-400">Срок: завтра</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                    <CheckSquare size={16} className="text-green-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium line-through text-gray-400">Первичный контакт</p>
                      <p className="text-xs text-gray-400">Выполнено вчера</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="files" className="space-y-4">
              <Card className="glass-card border-white/10">
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between text-white">
                    Файлы
                    <Button size="sm" className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600">
                      <Paperclip size={16} className="mr-1" />
                      Загрузить
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3 p-3 border border-white/10 rounded-lg hover:bg-white/5 ">
                    <FileText size={20} className="text-violet-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">Коммерческое предложение.pdf</p>
                      <p className="text-xs text-gray-400">2.3 MB - 2 дня назад</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 border border-white/10 rounded-lg hover:bg-white/5 ">
                    <FileText size={20} className="text-violet-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">Договор_черновик.docx</p>
                      <p className="text-xs text-gray-400">156 KB - 5 дней назад</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <Card className="glass-card border-white/10">
                <CardHeader>
                  <CardTitle className="text-base text-white">История изменений</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-violet-500 mt-1.5"></div>
                      <div className="flex-1">
                        <p className="text-sm text-white">Сделка перемещена в "Переговоры"</p>
                        <p className="text-xs text-gray-400">Сегодня, 14:30</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5"></div>
                      <div className="flex-1">
                        <p className="text-sm text-white">Добавлен контакт: {deal.contact}</p>
                        <p className="text-xs text-gray-400">Вчера, 10:15</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-gray-400 mt-1.5"></div>
                      <div className="flex-1">
                        <p className="text-sm text-white">Сделка создана</p>
                        <p className="text-xs text-gray-400">
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
