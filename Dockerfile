# Базовый образ
FROM node:22-alpine AS build

# Директория внутри контейнера
WORKDIR /app

# Копируем package.json и package-lock.json для кэширования зависимостей
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install --legacy-peer-deps

# Копирование файлов
COPY . .

ARG VITE_API_URL

# Собираем приложение для продакшена
RUN npm run build

# Stage 2: Production stage с nginx
FROM nginx:alpine

# Копируем собранное приложение из build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Копируем конфигурацию nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Открываем порт 80
EXPOSE 80

# Запускаем nginx
CMD ["nginx", "-g", "daemon off;"]
