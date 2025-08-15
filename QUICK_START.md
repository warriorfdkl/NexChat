# Nexus Chat - Быстрый запуск

## 🚀 Быстрый старт

### Вариант 1: Автоматический запуск (Windows)

1. Убедитесь, что установлены:
   - Node.js 16+ (https://nodejs.org/)
   - MongoDB 5+ (https://www.mongodb.com/try/download/community)

2. Запустите MongoDB:
   ```bash
   mongod
   ```

3. Дважды кликните на файл `start.bat` или выполните:
   ```bash
   start.bat
   ```

4. Откройте браузер и перейдите на http://localhost:3000

### Вариант 2: Ручной запуск

1. Установите зависимости:
   ```bash
   npm install
   cd client
   npm install
   cd ..
   ```

2. Настройте файл `.env` (скопируйте из примера и отредактируйте):
   ```bash
   copy .env .env.local
   ```

3. Запустите в двух терминалах:
   ```bash
   # Терминал 1 - Сервер
   npm run dev
   
   # Терминал 2 - Клиент
   npm run client
   ```

### Вариант 3: Docker (рекомендуется для продакшена)

1. Установите Docker и Docker Compose

2. Запустите:
   ```bash
   docker-compose up -d
   ```

3. Откройте http://localhost:5000

## ⚙️ Настройка VitroCAD

1. Отредактируйте файл `.env`:
   ```env
   VITROCAD_BASE_URL=https://your-vitrocad-server.com
   VITROCAD_API_PATH=/api
   ```

2. Настройте webhook в VitroCAD:
   - URL: `http://your-server.com/api/vitrocad/webhook/file-uploaded`
   - Метод: POST

## 🔐 Первый вход

1. Откройте приложение в браузере
2. Введите логин и пароль от VitroCAD
3. После входа вы увидите главный экран мессенджера

## 📁 Создание чатов

- Чаты создаются автоматически при загрузке файлов в VitroCAD
- Можно добавлять участников через поиск пользователей
- Поддерживается real-time обмен сообщениями

## 🆘 Решение проблем

### Ошибка подключения к MongoDB
```bash
# Запустите MongoDB
mongod --dbpath C:\data\db
```

### Ошибка портов
- Сервер: http://localhost:5000
- Клиент: http://localhost:3000
- MongoDB: localhost:27017

### Ошибка VitroCAD API
Проверьте настройки в файле `.env`:
- VITROCAD_BASE_URL
- Доступность VitroCAD сервера

## 📞 Поддержка

Если возникли проблемы:
1. Проверьте логи в консоли
2. Убедитесь, что все сервисы запущены
3. Проверьте настройки в `.env`

---

**Готово!** Теперь вы можете использовать Nexus Chat для командной работы с интеграцией VitroCAD.