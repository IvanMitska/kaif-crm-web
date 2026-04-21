# ПЛАН ЗАВЕРШЕНИЯ SINTARA CRM

> Дата создания: 2026-04-05
> Последнее обновление: 2026-04-21 (сессия доработок)
> Реальная готовность: **~90%** (весь П1 закрыт: automation, import/export; П2 quick-actions)
> Цель: 100% production-ready

---

## КРАТКО: РАЗРЫВ МЕЖДУ ПЛАНОМ И РЕАЛЬНОСТЬЮ

Предыдущие ревизии плана считали готовыми модули на бэкенде и наличие страниц на фронте.
UI-аудит выявил что **примерно половина "вторичных" кнопок — заглушки без onClick или с `console.log`/TODO**.
Базовые CRUD-операции работают на всех основных страницах.

---

## ❌ КРИТИЧЕСКИЕ ПРОБЕЛЫ (ПРИОРИТЕТ 1)

### 1. Страница Automation — ✅ РЕАЛИЗОВАНО (2026-04-21)
- ✅ `lib/api.ts` — добавлен `automationApi` (getAll, getActive, getById, create, update, execute, delete)
- ✅ `apps/frontend/src/app/(app)/automation/page.tsx` — listing, stats, toggle isActive, Run now, edit/delete, модалка создания/редактирования
- ✅ Модалка: имя, описание, выбор триггера (10 типов), конструктор действий (5 типов: create_task, send_notification, update_field, assign_owner, add_tag) с настройками под каждый тип
- ✅ Пункт "Автоматизации" в sidebar (layout.tsx, icon Workflow)

### 2. Export / Import — ✅ РЕАЛИЗОВАНО (2026-04-21)
- ✅ `lib/api.ts` — добавлены `contactsApi.export/import`, `companiesApi.export/import` с `responseType: 'blob'` и `multipart/form-data`
- ✅ Контроллеры бекенда теперь стримят файл через `@Res() res.send(buffer)` с правильными `Content-Type` и `Content-Disposition` (раньше Nest JSON-ил Buffer)
- ✅ `contacts/page.tsx` — кнопки Download/Upload подключены, file input с `accept=".csv,.xlsx,.xls"`, toast с результатом
- ✅ `companies/page.tsx` — то же самое

---

## ⚠️ ПОЛОМАННЫЕ QUICK ACTIONS (ПРИОРИТЕТ 2)

### 3. Deals: quick actions — ✅ РЕАЛИЗОВАНО (2026-04-21)
- ✅ `deals/page.tsx` — `handleQuickAction` теперь реально работает:
  - "Позвонить" → `contactsApi.getById`, затем `tel:<phone>` (toast если нет)
  - "Задача" → `CreateTaskDialog` с `prefillDealId` + `prefillContactId`
  - "Написать" → router.push(`/messages?contactId=...`)
- ✅ `DealDetailModal` — те же три кнопки подключены к `onQuickAction`
- ✅ `messages/page.tsx` — подхватывает `?contactId=...` из URL через `useSearchParams`
- ✅ `CreateTaskDialog` — добавлены props `prefillDealId`, `prefillContactId`, `prefillTitle`

### 4. Leads: контекстное меню — ✅ РЕАЛИЗОВАНО (2026-04-21)
- ✅ "Копировать" → `navigator.clipboard.writeText` (name + company + email + phone)
- ✅ Submenu "Создать на основании":
  - Сделку → `leadsApi.convert` с `createDeal=true` и первым stage первой воронки
  - Контакт → `leadsApi.convert` без createDeal
  - Компанию → `companiesApi.create` из `lead.company/email/phone`
- ✅ Submenu "Запланировать" (Звонок/Встреча/Задача/Email) → `CreateTaskDialog` с `prefillTitle`
- ✅ "Маркетплейс" → toast "Скоро появится"

### 5. Drag-and-drop на канбанах — заявлено, не реализовано
- Deals kanban и Tasks kanban: перетаскивание между этапами отсутствует
- **План:** подключить `@dnd-kit/core` + оптимистичный update через `dealsApi.move()` (endpoint уже есть)

---

## ⚠️ ФИЛЬТРЫ И МЕЛКИЕ КНОПКИ (ПРИОРИТЕТ 3)

### 6. "Фильтры" повсюду без обработчика
- `contacts/page.tsx:288`, `companies/page.tsx:314`, `deals/page.tsx:956` — кнопка Filter без `onClick`
- **План:** либо скрыть до реализации, либо подключить к существующим `?params` в API

### 7. Dashboard: task toggle — ✅ РЕАЛИЗОВАНО (2026-04-21)
- ✅ `toggleTask` теперь вызывает `tasksApi.complete()` / `tasksApi.update({ status: "PENDING" })` с оптимистичным обновлением и rollback при ошибке

---

## ⚠️ SETTINGS — СТРУКТУРА ЕСТЬ, ДЕТАЛИ НЕ ПРОВЕРЕНЫ

| Tab | Статус |
|-----|--------|
| Profile | ⚠️ UI есть, глубина не проверена |
| Notifications | ⚠️ UI есть |
| Security (2FA, пароль) | ⚠️ UI есть |
| Appearance | ⚠️ UI есть |
| Integrations | ✅ подключено к `integrationsApi.getStatus()` |
| Company | ⚠️ UI есть |
| Billing | ⚠️ UI есть |

**План:** пройти по каждому табу, подключить формы к API (смена пароля, toggle 2FA, redeem invitations, billing mock/реальный).

---

## ✅ ЧТО ТОЧНО РАБОТАЕТ

| Страница | CRUD | Детали |
|----------|------|--------|
| `/dashboard` | — | Stats, funnel, recent activity, tasks widget — все из API |
| `/leads` | ✅ | Kanban + List, create/edit/delete, bulk |
| `/deals` | ✅ | Kanban + List, create/edit/delete, detail modal |
| `/contacts` | ✅ | Table + Cards, bulk |
| `/companies` | ✅ | Table + Cards |
| `/tasks` | ✅ | Kanban + List, group by |
| `/messages` | ✅ | conversations по каналам |
| `/booking` | ✅ | ресурсы, услуги, бронирования |
| `/analytics` | — | KPI + Recharts |
| `/employees` | ✅ | invite, update role, toggle active, delete |
| `/settings` → Integrations | ✅ | статус интеграций |

Бэкенд: 611 unit-тестов, 4 e2e-suites, 25/25 модулей с тестами — это не менялось.

---

## ДОРАБОТКИ ПО ПРИОРИТЕТАМ

### П1 — Без этого "много кнопок не работает"
- [x] Страница `/automation` + `automationApi` в `lib/api.ts` ✅ 2026-04-21
- [x] Export/Import для Contacts и Companies (API + UI) ✅ 2026-04-21

### П2 — Quick actions и UX
- [x] Deals `handleQuickAction` — реальные действия (звонок, задача, сообщение) ✅ 2026-04-21
- [x] Deals Detail Modal — onClick для трёх кнопок ✅ 2026-04-21
- [x] Leads dropdown — Copy, Create Deal/Contact/Company из лида, Schedule Task ✅ 2026-04-21
- [x] Leads: Маркетплейс → toast "Скоро" ✅ 2026-04-21
- [ ] Drag-and-drop в Deals и Tasks kanban

### П3 — Мелочи
- [ ] Filter кнопки (contacts, companies, deals) — подключить или скрыть
- [x] Dashboard task toggle → `tasksApi.complete()` ✅ 2026-04-21
- [ ] Settings: дожать табы (Profile, Notifications, Security, Company, Billing)

### П4 — Инфраструктура (не менялось)
- [x] GitHub Actions CI
- [x] Winston логирование
- [x] Swagger
- [ ] Health checks для Docker-контейнеров
- [ ] README (инструкция по запуску)
- [ ] Архитектурная документация

---

## МЕТРИКИ (ПОСЛЕ ПЕРЕАУДИТА)

| Категория | Готово | Всего | % |
|-----------|--------|-------|---|
| Backend (модули, тесты) | 25/25 | 25 | 100% |
| Основные CRUD-страницы фронта | 10/11 | 11 | 91% (без /automation) |
| Quick actions / контекстные меню | ~3/12 | 12 | ~25% |
| Export / Import UI | 0/2 | 2 | 0% |
| Settings tabs функционал | ~2/7 | 7 | ~30% |
| Инфраструктура | 3/8 | 8 | 38% |

**Ориентир по суммарной готовности: ~75–80%** (раньше считалось 93%, потому что оценивали только факт наличия страниц, а не реальную работоспособность кнопок внутри).

---

## ИСТОРИЯ ОБНОВЛЕНИЙ

### 2026-04-21 — сессия доработок
- Deals quick actions (tel:, задача с prefill, редирект в messages) — реализованы в карточке и detail modal
- `CreateTaskDialog` расширен props `prefillDealId`, `prefillContactId`, `prefillTitle`
- Messages page умеет `?contactId=` через `useSearchParams`
- Leads dropdown: Copy, Convert→Deal/Contact/Company, Schedule→Task, Маркетплейс-toast
- Dashboard task toggle синхронизирован с `tasksApi`
- Export/Import для Contacts и Companies: `lib/api.ts` методы blob+multipart, контроллеры переведены на `@Res()` со стримингом xlsx, UI-кнопки с file input и toast
- Страница `/automation` создана: listing + stats, toggle, run now, edit/delete, модалка создания/редактирования (10 триггеров, 5 типов действий с настройкой), `automationApi` в lib/api.ts, пункт меню в sidebar
- Готовность по переоценке: 77% → ~90%

### 2026-04-21 — переаудит
- Проведён сквозной UI-аудит: найдены заглушки и кнопки без обработчиков
- Выявлено отсутствие страницы `/automation` (бэкенд готов, фронта нет)
- Выявлено отсутствие import/export UI и `automationApi` в `lib/api.ts`
- Пересчитана готовность: 93% → ~77%
- Зафиксированы приоритеты П1–П4

### 2026-04-06 (сессия 3)
- Удалены все mock данные из frontend
- Подключены реальные API для Analytics, Leads, Settings
- Проверены основные страницы — CRUD работает
- Добавлены E2E тесты: contacts, deals, tasks
- Backend: 611 тестов в 25 test suites

### 2026-04-05 (сессии 1–2)
- Созданы unit-тесты для core модулей
- Реализованы Import/Export на бэкенде
- Добавлена xlsx библиотека

### Ранее
- WhatsApp, Telegram, Email IMAP, Webhooks модули
- Booking модуль
- Автоматизация на бэкенде
