.PHONY: help install dev build start stop restart logs clean reset db-migrate db-seed test lint

help: ## Показать справку
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

install: ## Установить зависимости
	pnpm install

dev: ## Запустить в режиме разработки
	docker-compose up -d postgres redis minio
	pnpm dev

docker-dev: ## Запустить все сервисы в Docker (dev режим)
	docker-compose up -d

docker-build: ## Собрать Docker образы
	docker-compose build

docker-up: ## Запустить Docker контейнеры
	docker-compose up -d

docker-down: ## Остановить Docker контейнеры
	docker-compose down

docker-restart: ## Перезапустить Docker контейнеры
	docker-compose restart

docker-logs: ## Показать логи Docker контейнеров
	docker-compose logs -f

docker-logs-backend: ## Показать логи backend
	docker-compose logs -f backend

docker-logs-frontend: ## Показать логи frontend
	docker-compose logs -f frontend

docker-clean: ## Очистить Docker контейнеры и volumes
	docker-compose down -v

docker-reset: docker-clean docker-build docker-up db-migrate db-seed ## Полный сброс и перезапуск

db-migrate: ## Выполнить миграции базы данных
	docker-compose exec backend pnpm prisma migrate dev

db-migrate-prod: ## Выполнить production миграции
	docker-compose exec backend pnpm prisma migrate deploy

db-seed: ## Заполнить базу данных тестовыми данными
	docker-compose exec backend pnpm db:seed

db-studio: ## Открыть Prisma Studio
	docker-compose exec backend pnpm prisma studio

test: ## Запустить тесты
	pnpm test

test-e2e: ## Запустить E2E тесты
	pnpm test:e2e

lint: ## Проверить код линтером
	pnpm lint

format: ## Форматировать код
	pnpm format

build: ## Собрать production версию
	pnpm build

clean: ## Очистить кеш и node_modules
	pnpm clean
	rm -rf node_modules
	rm -rf apps/*/node_modules
	rm -rf packages/*/node_modules

setup: install docker-build docker-up db-migrate db-seed ## Полная установка проекта
	@echo "✅ Проект успешно установлен!"
	@echo "📱 Frontend: http://localhost:3000"
	@echo "🚀 Backend: http://localhost:3001"
	@echo "📚 API Docs: http://localhost:3001/api/docs"
	@echo "🗄️ MinIO: http://localhost:9001 (minioadmin/minioadmin)"