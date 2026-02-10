"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ContactsPage() {
  const contacts = [
    { id: 1, name: "Иван Иванов", company: "ООО Технологии", email: "ivan@tech.ru", phone: "+7 999 123-45-67" },
    { id: 2, name: "Петр Петров", company: "ИП Петров", email: "petr@business.ru", phone: "+7 999 234-56-78" },
    { id: 3, name: "Сергей Сергеев", company: "ООО Сервис", email: "sergey@service.ru", phone: "+7 999 345-67-89" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Контакты</h1>
        <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
          Новый контакт
        </button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Все контакты</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50">
                  <th className="h-12 px-4 text-left align-middle font-medium">Имя</th>
                  <th className="h-12 px-4 text-left align-middle font-medium">Компания</th>
                  <th className="h-12 px-4 text-left align-middle font-medium">Email</th>
                  <th className="h-12 px-4 text-left align-middle font-medium">Телефон</th>
                  <th className="h-12 px-4 text-left align-middle font-medium">Действия</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {contacts.map((contact) => (
                  <tr key={contact.id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-4 align-middle">{contact.name}</td>
                    <td className="p-4 align-middle">{contact.company}</td>
                    <td className="p-4 align-middle">{contact.email}</td>
                    <td className="p-4 align-middle">{contact.phone}</td>
                    <td className="p-4 align-middle">
                      <button className="text-sm text-primary hover:underline">Редактировать</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}