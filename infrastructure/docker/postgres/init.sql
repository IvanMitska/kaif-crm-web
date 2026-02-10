-- Создание расширений
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Настройка прав доступа
GRANT ALL PRIVILEGES ON DATABASE kaifcrm TO kaifcrm;
GRANT ALL ON SCHEMA public TO kaifcrm;

-- Создание индексов для оптимизации
-- Эти индексы будут созданы после миграции Prisma