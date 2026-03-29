<p align="center">
  <h1 align="center">KAIF CRM</h1>
  <p align="center">
    <strong>Отчет о проделанной работе</strong>
    <br />
    <em>Система управления взаимоотношениями с клиентами</em>
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/Next.js_14-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis" />
  <img src="https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
</p>

---

## Содержание

- [Обзор проекта](#-обзор-проекта)
- [Архитектура](#-архитектура)
- [Backend модули](#-backend-модули)
- [Frontend страницы](#-frontend-страницы)
- [База данных](#-база-данных)
- [Безопасность](#-безопасность)
- [Инфраструктура](#-инфраструктура)
- [Выжимка](#-выжимка)

---

## Обзор проекта

**KAIF CRM** — полнофункциональная CRM-система корпоративного уровня, разработанная с использованием современного технологического стека. Система предназначена для управления продажами, клиентами, задачами и омниканальными коммуникациями.

### Ключевые возможности

| Функционал | Описание |
|:-----------|:---------|
| **Управление контактами** | Полный CRUD, дедупликация, импорт/экспорт |
| **Воронка продаж** | Kanban-доска, настраиваемые этапы, аналитика |
| **Задачи** | Списки, Kanban, календарь, повторяющиеся задачи |
| **Омниканальность** | Email, WhatsApp, Telegram, Instagram, VK |
| **Аналитика** | Дашборды, KPI, воронки конверсии |
| **Автоматизация** | Триггеры, условия, автодействия |
| **Real-time** | WebSocket уведомления, присутствие |

---

## Архитектура

```
┌─────────────────────────────────────────────────────────────────┐
│                         KAIF CRM                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────┐           ┌─────────────────┐            │
│   │    Frontend     │◄─────────►│     Backend     │            │
│   │   Next.js 14    │   REST    │     NestJS      │            │
│   │   Port: 3000    │  GraphQL  │   Port: 3001    │            │
│   │                 │  Socket   │                 │            │
│   └─────────────────┘           └────────┬────────┘            │
│                                          │                      │
│   ┌──────────────────────────────────────┼──────────────────┐  │
│   │                    Data Layer        │                  │  │
│   │  ┌──────────┐  ┌──────────┐  ┌──────┴─────┐            │  │
│   │  │PostgreSQL│  │  Redis   │  │   MinIO    │            │  │
│   │  │  :5434   │  │  :6379   │  │ :9000/9001 │            │  │
│   │  └──────────┘  └──────────┘  └────────────┘            │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Стек технологий

<table>
<tr>
<td width="50%" valign="top">

#### Backend
- **Runtime:** Node.js 20+
- **Framework:** NestJS 10.3
- **ORM:** Prisma
- **API:** REST + GraphQL
- **Auth:** JWT + 2FA (TOTP)
- **Cache:** Redis
- **Queue:** Bull
- **Storage:** MinIO (S3)
- **Docs:** Swagger

</td>
<td width="50%" valign="top">

#### Frontend
- **Framework:** Next.js 14
- **UI:** shadcn/ui + Radix
- **Styling:** Tailwind CSS
- **State:** Zustand
- **Fetching:** React Query
- **Forms:** React Hook Form
- **Charts:** Recharts
- **DnD:** dnd-kit

</td>
</tr>
</table>

---

## Backend модули

### Статус реализации

| Модуль | Статус | Эндпоинты | Описание |
|:-------|:------:|:---------:|:---------|
| Auth | ✅ | 8 | JWT, refresh tokens, 2FA, RBAC |
| Contacts | ✅ | 11 | CRUD, дубликаты, импорт/экспорт |
| Companies | ✅ | 11 | CRUD, ИНН/КПП, слияние |
| Deals | ✅ | 13 | Воронка, этапы, продукты |
| Tasks | ✅ | 9 | Статусы, приоритеты, повторения |
| Messages | ✅ | 6 | Омниканальность |
| Analytics | ✅ | 5 | KPI, воронки, отчеты |
| Users | ✅ | 8 | Роли, команды |
| Notifications | ✅ | 6 | In-app уведомления |
| Automation | ✅ | 5 | Триггеры, действия |
| WebSockets | ✅ | 10+ | Real-time события |
| Pipelines | ✅ | 9 | Воронки и этапы |

**Всего: ~91 API эндпоинт**

---

### Детализация по модулям

<details>
<summary><b>Auth — Аутентификация</b></summary>

```
POST /api/auth/register     — Регистрация пользователя
POST /api/auth/login        — Вход (+ опционально 2FA)
POST /api/auth/logout       — Выход
POST /api/auth/refresh      — Обновление токенов
GET  /api/auth/me           — Текущий пользователь
POST /api/auth/2fa/enable   — Включение 2FA
POST /api/auth/2fa/verify   — Верификация 2FA
POST /api/auth/2fa/disable  — Отключение 2FA
```

**Особенности:**
- Ротация refresh токенов
- TOTP с QR-кодами
- Argon2 хеширование паролей
</details>

<details>
<summary><b>Contacts — Контакты</b></summary>

```
GET    /api/contacts              — Список контактов
POST   /api/contacts              — Создание
GET    /api/contacts/:id          — Получение
PATCH  /api/contacts/:id          — Обновление
DELETE /api/contacts/:id          — Удаление
GET    /api/contacts/duplicates   — Поиск дубликатов
POST   /api/contacts/merge        — Слияние дубликатов
POST   /api/contacts/import       — Импорт (CSV/XLSX)
GET    /api/contacts/export       — Экспорт
GET    /api/contacts/stats        — Статистика
```
</details>

<details>
<summary><b>Deals — Сделки</b></summary>

```
GET    /api/deals                      — Список сделок
POST   /api/deals                      — Создание
GET    /api/deals/:id                  — Получение
PATCH  /api/deals/:id                  — Обновление
DELETE /api/deals/:id                  — Удаление
GET    /api/deals/pipeline/:id         — Сделки по воронке
PATCH  /api/deals/:id/move             — Перемещение этапа
POST   /api/deals/:id/won              — Закрыто успешно
POST   /api/deals/:id/lost             — Закрыто неудачно
POST   /api/deals/:id/duplicate        — Дублирование
```
</details>

<details>
<summary><b>Tasks — Задачи</b></summary>

```
GET    /api/tasks                — Список задач
POST   /api/tasks                — Создание
PATCH  /api/tasks/:id            — Обновление
DELETE /api/tasks/:id            — Удаление
POST   /api/tasks/:id/complete   — Завершение
POST   /api/tasks/recurring      — Повторяющаяся задача
GET    /api/tasks/calendar       — Календарь
GET    /api/tasks/stats          — Статистика
```
</details>

<details>
<summary><b>Analytics — Аналитика</b></summary>

```
GET /api/analytics/dashboard    — Основные KPI
GET /api/analytics/today-tasks  — Задачи на сегодня
GET /api/analytics/sales        — Метрики продаж
GET /api/analytics/activity     — Активность по дням
GET /api/analytics/funnel       — Воронка конверсии
```
</details>

---

## Frontend страницы

### Карта приложения

```
/
├── (auth)
│   └── /login                 ✅ Вход с 2FA
│
└── (app)
    ├── /dashboard             ✅ Главная панель
    ├── /leads                 ✅ Лиды
    ├── /contacts              ✅ Контакты
    ├── /companies             ✅ Компании
    ├── /deals                 ✅ Сделки (Kanban)
    ├── /tasks                 ✅ Задачи (List/Kanban/Calendar)
    ├── /messages              ✅ Сообщения
    ├── /analytics             ✅ Аналитика
    └── /settings              ✅ Настройки
```

### Детали страниц

| Страница | Компоненты | Функционал |
|:---------|:-----------|:-----------|
| **Dashboard** | KPI Cards, Activity Feed, Funnel Chart | Обзор метрик, быстрые действия |
| **Deals** | Kanban Board, Deal Cards, Filters | Drag-n-drop, поиск, статистика |
| **Tasks** | TaskKanban, TaskList, Calendar, Filters | 3 режима просмотра, группировка, экспорт |
| **Analytics** | Line Charts, Pie Charts, KPI Trends | Периоды, воронки, источники |
| **Contacts** | Data Table, Search, Actions | Сортировка, фильтрация |

### UI Компоненты

<table>
<tr>
<td>

**Базовые (shadcn/ui)**
- Button, Card, Dialog
- Input, Textarea, Form
- Select, Dropdown Menu
- Avatar, Badge, Tabs
- Toast, Tooltip, Popover
- Sheet, Accordion
- Scroll Area, Separator

</td>
<td>

**Кастомные**
- TaskCard
- TaskKanban
- TaskListView
- TaskDetailSheet
- TaskFilters
- TaskStats
- CreateTaskDialog
- DealModal
- DealDetails

</td>
</tr>
</table>

---

## База данных

### ER-диаграмма (упрощенная)

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│   User   │────►│   Team   │◄────│TeamMember│
└────┬─────┘     └──────────┘     └──────────┘
     │
     │ owns/creates
     ▼
┌──────────┐     ┌──────────┐     ┌──────────┐
│ Contact  │────►│ Company  │◄────│   Deal   │
└────┬─────┘     └──────────┘     └────┬─────┘
     │                                 │
     │                                 │
     ▼                                 ▼
┌──────────┐     ┌──────────┐     ┌──────────┐
│ Message  │     │   Task   │     │  Stage   │
└──────────┘     └──────────┘     └────┬─────┘
                                       │
                                       ▼
                                  ┌──────────┐
                                  │ Pipeline │
                                  └──────────┘
```

### Модели Prisma

| Модель | Поля | Связи |
|:-------|:-----|:------|
| **User** | id, email, password, role, 2fa | Teams, Contacts, Deals, Tasks |
| **Contact** | name, email, phone, source | Company, Messages, Deals, Tasks |
| **Company** | name, inn, kpp, industry | Contacts, Deals |
| **Pipeline** | name, isDefault | Stages |
| **Stage** | name, order, color | Deals |
| **Deal** | title, amount, probability | Contact, Company, Stage, Products |
| **Task** | title, status, priority, dueDate | Assignee, Contact, Deal |
| **Message** | content, channel, direction | Contact, User |
| **Notification** | title, type, isRead | User |
| **Automation** | name, triggers, actions | User |

### Enums

```typescript
enum UserRole      { ADMIN | MANAGER | OPERATOR | SUPERVISOR }
enum ContactSource { WEBSITE | PHONE | EMAIL | WHATSAPP | TELEGRAM | VK | ... }
enum DealStatus    { NEW | QUALIFICATION | PROPOSAL | NEGOTIATION | ... }
enum TaskStatus    { PENDING | IN_PROGRESS | COMPLETED | CANCELLED }
enum TaskPriority  { LOW | MEDIUM | HIGH | URGENT }
```

---

## Безопасность

### Реализованные меры

| Уровень | Механизм | Статус |
|:--------|:---------|:------:|
| **Аутентификация** | JWT Access + Refresh Tokens | ✅ |
| **2FA** | TOTP (Google Authenticator) | ✅ |
| **Авторизация** | Role-Based Access Control | ✅ |
| **Пароли** | Argon2 хеширование | ✅ |
| **HTTP** | Helmet security headers | ✅ |
| **CORS** | Whitelist origins | ✅ |
| **Rate Limit** | 100 req / 60 sec | ✅ |
| **Validation** | class-validator DTOs | ✅ |

---

## Инфраструктура

### Docker Compose

| Сервис | Образ | Порты | Назначение |
|:-------|:------|:------|:-----------|
| **postgres** | postgres:15 | 5434 | База данных |
| **redis** | redis:7 | 6379 | Кеш + очереди |
| **minio** | minio/minio | 9000, 9001 | Файловое хранилище |
| **backend** | node:20 | 3001 | API сервер |
| **frontend** | node:20 | 3000 | Web приложение |
| **nginx** | nginx:alpine | 80, 443 | Reverse proxy |

### Команды разработки

```bash
# Запуск
pnpm dev              # Все сервисы
pnpm backend:dev      # Только backend
pnpm frontend:dev     # Только frontend

# Docker
pnpm docker:up        # Поднять контейнеры
pnpm docker:down      # Остановить
pnpm docker:logs      # Логи

# База данных
pnpm db:migrate       # Миграции
pnpm db:seed          # Сидирование
```

### Точки доступа

| Ресурс | URL |
|:-------|:----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:3001 |
| Swagger Docs | http://localhost:3001/api/docs |
| GraphQL | http://localhost:3001/graphql |
| MinIO Console | http://localhost:9001 |

---

## Выжимка

<table>
<tr>
<td width="60%" valign="top">

### Что сделано

| Метрика | Значение |
|:--------|:--------:|
| Backend модулей | **11** |
| API эндпоинтов | **~91** |
| Frontend страниц | **9** |
| UI компонентов | **25+** |
| Моделей БД | **14** |
| Docker сервисов | **6** |

### Ключевые фичи
- JWT + 2FA аутентификация
- Полноценная воронка продаж
- Kanban-доски (сделки, задачи)
- Омниканальные коммуникации
- Real-time через WebSocket
- Аналитика и дашборды
- Импорт/экспорт данных
- Автоматизации

</td>
<td width="40%" valign="top">

### Готовность

```
████████████████░░░░ 85%
```

### В работе (git status)
- `layout.tsx`
- `messages/page.tsx`
- `settings/page.tsx`
- `tasks/page.tsx`
- `DealDetails.tsx`
- `DealModal.tsx`
- `tasks/*` (новые)
- `dropdown-menu.tsx`

### Рекомендации
1. Завершить интеграцию Tasks
2. Страница регистрации
3. Восстановление пароля
4. CI/CD pipeline
5. Unit/E2E тесты
6. Production deploy

</td>
</tr>
</table>

---

<p align="center">
  <strong>KAIF CRM</strong> — современная CRM-система<br/>
  <em>Разработка продолжается</em>
</p>

<p align="center">
  <sub>Отчет сгенерирован: 18 февраля 2026</sub>
</p>
