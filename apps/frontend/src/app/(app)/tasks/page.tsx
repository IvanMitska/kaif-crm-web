"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TasksPage() {
  const tasks = [
    { id: 1, title: "Позвонить клиенту", priority: "HIGH", dueDate: "10:00", status: "PENDING" },
    { id: 2, title: "Отправить договор", priority: "MEDIUM", dueDate: "14:00", status: "PENDING" },
    { id: 3, title: "Встреча в офисе", priority: "LOW", dueDate: "16:00", status: "PENDING" },
    { id: 4, title: "Подготовить презентацию", priority: "HIGH", dueDate: "Завтра", status: "IN_PROGRESS" },
  ];

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case "HIGH": return "text-red-500";
      case "MEDIUM": return "text-yellow-500";
      case "LOW": return "text-green-500";
      default: return "text-gray-500";
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "PENDING": return "bg-yellow-100 text-yellow-800";
      case "IN_PROGRESS": return "bg-blue-100 text-blue-800";
      case "COMPLETED": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Задачи</h1>
        <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
          Новая задача
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Сегодня</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tasks.filter(t => t.dueDate !== "Завтра").map((task) => (
                <div key={task.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" className="h-4 w-4 rounded border-gray-300" />
                    <div>
                      <p className="font-medium">{task.title}</p>
                      <div className="flex items-center gap-2 text-sm">
                        <span className={getPriorityColor(task.priority)}>
                          {task.priority === "HIGH" ? "Высокий" : task.priority === "MEDIUM" ? "Средний" : "Низкий"}
                        </span>
                        <span className="text-muted-foreground">• {task.dueDate}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusBadge(task.status)}`}>
                    {task.status === "PENDING" ? "Ожидает" : task.status === "IN_PROGRESS" ? "В работе" : "Выполнена"}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Предстоящие</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tasks.filter(t => t.dueDate === "Завтра").map((task) => (
                <div key={task.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" className="h-4 w-4 rounded border-gray-300" />
                    <div>
                      <p className="font-medium">{task.title}</p>
                      <div className="flex items-center gap-2 text-sm">
                        <span className={getPriorityColor(task.priority)}>
                          {task.priority === "HIGH" ? "Высокий" : task.priority === "MEDIUM" ? "Средний" : "Низкий"}
                        </span>
                        <span className="text-muted-foreground">• {task.dueDate}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusBadge(task.status)}`}>
                    {task.status === "PENDING" ? "Ожидает" : task.status === "IN_PROGRESS" ? "В работе" : "Выполнена"}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}