# Nexus Chat

Современный мессенджер с интеграцией VitroCAD для командной работы и обсуждения проектов.

## Возможности

- 🔐 **Автоматическая авторизация** через учетные данные VitroCAD
- 💬 **Автоматическое создание чатов** при загрузке файлов в VitroCAD
- 👥 **Добавление участников** из базы данных VitroCAD
- ⚡ **Real-time обмен сообщениями** через WebSocket
- 📱 **Адаптивный дизайн** в стиле Telegram
- 🌙 **Темная и светлая темы**
- 🔔 **Система уведомлений**
- 📁 **Интеграция с файловой системой VitroCAD**

## Архитектура

### Backend (Node.js + Express)
- **Express.js** - веб-сервер и API
- **Socket.io** - WebSocket соединения для real-time чата
- **MongoDB** - база данных для чатов и сообщений
- **Mongoose** - ODM для MongoDB
- **JWT** - аутентификация
- **Axios** - HTTP клиент для VitroCAD API

### Frontend (React)
- **React 18** - пользовательский интерфейс
- **Styled Components** - стилизация компонентов
- **Socket.io Client** - WebSocket клиент
- **React Router** - маршрутизация
- **Context API** - управление состоянием

## Установка и настройка

### Предварительные требования

- Node.js 16+ 
- MongoDB 5+
- Доступ к серверу VitroCAD с API

### 1. Клонирование репозитория

```bash
git clone <repository-url>
cd NexusChat1
```

### 2. Установка зависимостей

```bash
# Установка серверных зависимостей
npm install

# Установка клиентских зависимостей
cd client
npm install
cd ..
```

### 3. Настройка окружения

Создайте файл `.env` в корневой директории:

```env
# Настройки сервера
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# База данных
MONGODB_URI=mongodb://localhost:27017/nexuschat

# VitroCAD API настройки
VITROCAD_BASE_URL=https://your-vitrocad-server.com
VITROCAD_API_PATH=/api

# JWT секретный ключ
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# Настройки файлов
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Настройки чатов
MAX_CHAT_MEMBERS=100
MAX_MESSAGE_LENGTH=4000

# Настройки уведомлений
ENABLE_NOTIFICATIONS=true
NOTIFICATION_SOUND=true
```

### 4. Настройка MongoDB

Убедитесь, что MongoDB запущена и доступна по адресу из `MONGODB_URI`.

### 5. Настройка VitroCAD интеграции

1. Обновите `VITROCAD_BASE_URL` в `.env` файле
2. Убедитесь, что VitroCAD API доступен
3. Настройте webhook в VitroCAD для уведомления о загрузке файлов:
   - URL: `http://your-server.com/api/vitrocad/webhook/file-uploaded`
   - Метод: POST

### 6. Запуск приложения

#### Режим разработки

```bash
# Запуск сервера (терминал 1)
npm run dev

# Запуск клиента (терминал 2)
npm run client
```

#### Режим продакшена

```bash
# Сборка клиента
npm run build

# Запуск сервера
npm start
```

## Использование

### 1. Вход в систему

- Откройте приложение в браузере
- Введите логин и пароль от VitroCAD
- После успешной авторизации вы попадете в главный интерфейс

### 2. Автоматическое создание чатов

- Загрузите файл в VitroCAD
- Автоматически создастся чат с названием файла
- Вы станете администратором этого чата

### 3. Добавление участников

- Откройте чат
- Нажмите на кнопку "Добавить участника"
- Найдите пользователя из базы VitroCAD
- Добавьте его в чат

### 4. Обмен сообщениями

- Отправляйте текстовые сообщения
- Прикрепляйте файлы
- Отвечайте на сообщения
- Редактируйте и удаляйте свои сообщения

## API Endpoints

### Аутентификация
- `POST /api/auth/login` - Вход в систему
- `POST /api/auth/logout` - Выход из системы
- `GET /api/auth/me` - Получение информации о пользователе
- `PUT /api/auth/settings` - Обновление настроек
- `PUT /api/auth/status` - Обновление статуса

### Чаты
- `GET /api/chat/list` - Список чатов пользователя
- `POST /api/chat/create-file-chat` - Создание чата для файла
- `GET /api/chat/:chatId` - Информация о чате
- `POST /api/chat/:chatId/add-member` - Добавление участника
- `POST /api/chat/:chatId/remove-member` - Удаление участника
- `GET /api/chat/:chatId/messages` - Сообщения чата
- `POST /api/chat/:chatId/mark-read` - Отметка как прочитанное

### VitroCAD интеграция
- `GET /api/vitrocad/users/:listId` - Пользователи из VitroCAD
- `GET /api/vitrocad/file/:fileId` - Информация о файле
- `POST /api/vitrocad/webhook/file-uploaded` - Webhook загрузки файла
- `GET /api/vitrocad/search-users` - Поиск пользователей
- `POST /api/vitrocad/sync-user` - Синхронизация пользователя

## WebSocket Events

### Клиент → Сервер
- `join_chats` - Присоединение к чатам
- `join_chat` - Присоединение к чату
- `leave_chat` - Покидание чата
- `send_message` - Отправка сообщения
- `edit_message` - Редактирование сообщения
- `delete_message` - Удаление сообщения
- `typing_start` - Начало набора
- `typing_stop` - Окончание набора
- `update_status` - Обновление статуса

### Сервер → Клиент
- `new_message` - Новое сообщение
- `message_edited` - Сообщение отредактировано
- `message_deleted` - Сообщение удалено
- `messages_read` - Сообщения прочитаны
- `user_typing` - Пользователь печатает
- `user_stopped_typing` - Пользователь перестал печатать
- `user_status_changed` - Статус пользователя изменен
- `notification` - Уведомление

## Структура проекта

```
NexusChat1/
├── client/                 # React фронтенд
│   ├── public/
│   ├── src/
│   │   ├── components/     # React компоненты
│   │   ├── context/        # Context API
│   │   ├── services/       # API сервисы
│   │   └── ...
│   └── package.json
├── models/                 # Mongoose модели
│   ├── User.js
│   ├── Chat.js
│   └── Message.js
├── routes/                 # Express маршруты
│   ├── auth.js
│   ├── chat.js
│   └── vitrocad.js
├── services/               # Бизнес-логика
│   └── vitrocadService.js
├── socket/                 # WebSocket обработчики
│   └── socketHandler.js
├── server.js               # Главный серверный файл
├── package.json
├── .env                    # Переменные окружения
└── README.md
```

## Развертывание

### Docker (рекомендуется)

```bash
# Создание Docker образа
docker build -t nexus-chat .

# Запуск контейнера
docker run -p 5000:5000 --env-file .env nexus-chat
```

### Традиционное развертывание

1. Установите Node.js и MongoDB на сервер
2. Клонируйте репозиторий
3. Установите зависимости
4. Настройте `.env` файл
5. Соберите клиент: `npm run build`
6. Запустите сервер: `npm start`

## Мониторинг и логирование

- Логи сервера выводятся в консоль
- Ошибки WebSocket соединений логируются
- Мониторинг производительности через встроенные метрики

## Безопасность

- JWT токены для аутентификации
- Валидация всех входящих данных
- Защита от XSS и CSRF атак
- Ограничение размера загружаемых файлов
- Проверка прав доступа к чатам

## Поддержка и разработка

### Требования к разработке
- Node.js 16+
- MongoDB 5+
- Git

### Запуск тестов

```bash
# Серверные тесты
npm test

# Клиентские тесты
cd client
npm test
```

### Участие в разработке

1. Форкните репозиторий
2. Создайте ветку для новой функции
3. Внесите изменения
4. Добавьте тесты
5. Создайте Pull Request

## Лицензия

MIT License

## Контакты

Для вопросов и поддержки обращайтесь к команде разработки.