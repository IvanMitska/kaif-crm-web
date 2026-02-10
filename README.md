# KAIF CRM

Современная CRM-система с омниканальной коммуникацией, автоматизацией продаж и удобным интерфейсом на русском языке.

## 🚀 Технологический стек

### Backend
- **Node.js** (v20+) с TypeScript
- **NestJS** - фреймворк для построения масштабируемых приложений
- **PostgreSQL** - основная база данных
- **Prisma** - ORM для работы с БД
- **Redis** - кеширование и очереди
- **GraphQL** + REST API
- **JWT** - авторизация
- **Socket.io** - real-time обновления

### Frontend
- **Next.js 14** - React фреймворк с App Router
- **TypeScript** - типизация
- **shadcn/ui** - компоненты UI
- **Tailwind CSS** - стилизация
- **Zustand** - управление состоянием
- **TanStack Query** - работа с API
- **React Hook Form** + Zod - формы и валидация

### Инфраструктура
- **Docker** & **Docker Compose** - контейнеризация
- **Nginx** - reverse proxy
- **MinIO** - S3-совместимое хранилище файлов

## 📋 Требования

- Node.js 20+
- pnpm 8.15+
- Docker и Docker Compose
- PostgreSQL 15+ (если запускаете без Docker)
- Redis 7+ (если запускаете без Docker)

## 🛠 Установка и запуск

### Быстрый старт с Docker

1. Клонируйте репозиторий:
```bash
git clone https://github.com/your-org/kaif-crm.git
cd kaif-crm
```

2. Скопируйте файлы окружения:
```bash
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
```

3. Запустите проект:
```bash
make setup
```

Эта команда выполнит:
- Установку зависимостей
- Сборку Docker образов
- Запуск всех сервисов
- Миграцию базы данных
- Заполнение тестовыми данными

### Локальная разработка

1. Установите зависимости:
```bash
pnpm install
```

2. Запустите базу данных и Redis:
```bash
docker-compose up -d postgres redis minio
```

3. Выполните миграции:
```bash
cd apps/backend
pnpm prisma migrate dev
```

4. Запустите приложение:
```bash
pnpm dev
```

## 🔗 Доступные URL

После запуска проект будет доступен по следующим адресам:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api/docs
- **GraphQL Playground**: http://localhost:3001/graphql
- **MinIO Console**: http://localhost:9001 (minioadmin/minioadmin)
- **Prisma Studio**: `pnpm --filter @kaif-crm/backend prisma studio`

## 📁 Структура проекта

```
kaif-crm/
├── apps/
│   ├── backend/          # NestJS backend приложение
│   │   ├── src/
│   │   │   ├── modules/  # Функциональные модули
│   │   │   ├── prisma/   # Prisma сервис
│   │   │   └── main.ts   # Точка входа
│   │   └── prisma/       # Схема БД и миграции
│   └── frontend/         # Next.js frontend приложение
│       └── src/
│           ├── app/      # App Router страницы
│           ├── components/ # React компоненты
│           ├── lib/      # Утилиты
│           └── store/    # Zustand stores
├── packages/
│   ├── shared/          # Общие типы и утилиты
│   ├── ui/              # Общие UI компоненты
│   └── integrations/    # Пакеты интеграций
├── infrastructure/
│   ├── docker/          # Docker конфигурации
│   ├── kubernetes/      # K8s манифесты
│   └── terraform/       # IaC конфигурации
└── docs/                # Документация
```

## 🧪 Тестирование

```bash
# Запустить все тесты
pnpm test

# Запустить тесты backend
pnpm --filter @kaif-crm/backend test

# Запустить тесты frontend
pnpm --filter @kaif-crm/frontend test

# E2E тесты
pnpm test:e2e
```

## 📝 Полезные команды

```bash
# Показать все доступные команды
make help

# Запустить в режиме разработки
make dev

# Docker команды
make docker-up        # Запустить контейнеры
make docker-down      # Остановить контейнеры
make docker-logs      # Показать логи
make docker-reset     # Полный сброс и перезапуск

# База данных
make db-migrate       # Выполнить миграции
make db-seed          # Заполнить тестовыми данными
make db-studio        # Открыть Prisma Studio

# Код
make lint            # Проверить линтером
make format          # Форматировать код
make build           # Собрать production версию
```

## 🔐 Авторизация

Система использует JWT токены для авторизации. Поддерживается:
- Регистрация/вход через email и пароль
- Двухфакторная аутентификация (2FA)
- Refresh токены
- Ролевая модель доступа (RBAC)

### Роли пользователей:
- **ADMIN** - полный доступ ко всем функциям
- **SUPERVISOR** - управление командой, доступ к аналитике
- **MANAGER** - работа с клиентами и сделками
- **OPERATOR** - базовые операции, общение с клиентами

## 🚦 API

### REST API
Документация доступна по адресу: http://localhost:3001/api/docs

### GraphQL
Playground доступен по адресу: http://localhost:3001/graphql

### WebSocket
Для real-time обновлений используется Socket.io на порту 3001.

## 🔄 Миграции базы данных

```bash
# Создать новую миграцию
cd apps/backend
pnpm prisma migrate dev --name migration_name

# Применить миграции в production
pnpm prisma migrate deploy

# Сбросить базу данных (осторожно!)
pnpm prisma migrate reset
```

## 🐛 Отладка

### Backend
1. Запустите в режиме отладки:
```bash
pnpm --filter @kaif-crm/backend start:debug
```

2. Подключитесь отладчиком к порту 9229

### Frontend
Next.js dev сервер автоматически поддерживает отладку через Chrome DevTools.

## 📊 Мониторинг

В production используется:
- **Prometheus** - сбор метрик
- **Grafana** - визуализация
- **ELK Stack** - логирование

## 🤝 Вклад в проект

1. Форкните репозиторий
2. Создайте ветку для фичи (`git checkout -b feature/AmazingFeature`)
3. Закоммитьте изменения (`git commit -m 'Add some AmazingFeature'`)
4. Запушьте в ветку (`git push origin feature/AmazingFeature`)
5. Откройте Pull Request

## 📄 Лицензия

Proprietary - Все права защищены

## 👥 Команда

- Backend разработка
- Frontend разработка
- UI/UX дизайн
- DevOps

## 📞 Поддержка

- Email: support@kaifcrm.ru
- Telegram: @kaifcrm_support

---

Разработано с ❤️ командой KAIF CRM