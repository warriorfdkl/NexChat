# Используем официальный образ Node.js
FROM node:18-alpine AS base

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci --only=production

# Этап сборки клиента
FROM node:18-alpine AS client-build

WORKDIR /app/client

# Копируем package.json клиента
COPY client/package*.json ./

# Устанавливаем зависимости клиента
    RUN npm ci --legacy-peer-deps

# Копируем исходный код клиента
COPY client/ ./

# Собираем клиент для продакшена
RUN npm run build

# Финальный этап
FROM node:18-alpine AS production

# Создаем пользователя для безопасности
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nexuschat -u 1001

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем зависимости из базового образа
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package*.json ./

# Копируем серверный код
COPY --chown=nexuschat:nodejs . .

# Копируем собранный клиент
COPY --from=client-build --chown=nexuschat:nodejs /app/client/build ./client/build

# Создаем директорию для загрузок
RUN mkdir -p uploads && chown nexuschat:nodejs uploads

# Устанавливаем переменные окружения
ENV NODE_ENV=production
ENV PORT=8765

# Открываем порт
EXPOSE 8765

# Переключаемся на пользователя nexuschat
USER nexuschat

# Проверка здоровья контейнера
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Запускаем приложение
CMD ["npm", "start"]