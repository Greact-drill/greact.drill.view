# Базовый образ
FROM node:22-alpine AS build

# Директория внутри контейнера
WORKDIR /usr/src/cloud-frontend

# Копируем package.json и package-lock.json для кэширования зависимостей
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install --legacy-peer-deps

# Копирование файлов
COPY . .

ARG VITE_API_URL

# Генерация клиента prisma и инициализация базы данных
RUN npm run build

# Открываем 4000 порт
EXPOSE 80

# Запуск приложения при запуске контейнера
CMD ["sh", "/usr/src/cloud-frontend/scripts/start.sh"]
