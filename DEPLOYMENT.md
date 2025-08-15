# 🚀 Быстрое развертывание Nexus Chat на сервере

## Вариант 1: Docker (Рекомендуется) ⚡

### Предварительные требования:
- Ubuntu/CentOS/Debian сервер
- Docker и Docker Compose
- Доступ по SSH

### Шаги развертывания:

1. **Подключитесь к серверу:**
   ```bash
   ssh user@your-server-ip
   ```

2. **Установите Docker (если не установлен):**
   ```bash
   # Ubuntu/Debian
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker $USER
   
   # Установка Docker Compose
   sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

3. **Загрузите проект на сервер:**
   ```bash
   # Вариант A: Через Git
   git clone <your-repository-url>
   cd NexusChat1
   
   # Вариант B: Загрузка архива
   wget <archive-url>
   unzip nexuschat.zip
   cd NexusChat1
   ```

4. **Настройте переменные окружения:**
   ```bash
   cp .env .env.production
   nano .env.production
   ```
   
   Отредактируйте важные параметры:
   ```env
   # Замените на ваш домен
   CLIENT_URL=https://your-domain.com
   
   # Настройки VitroCAD
   VITROCAD_BASE_URL=https://your-vitrocad-server.com
   
   # Смените секретный ключ!
   JWT_SECRET=your-super-secret-production-key-here
   
   # Продакшен режим
   NODE_ENV=production
   ```

5. **Запустите приложение:**
   ```bash
   docker-compose up -d
   ```

6. **Проверьте статус:**
   ```bash
   docker-compose ps
   docker-compose logs nexuschat
   ```

7. **Настройте Nginx (опционально):**
   ```bash
   # Создайте конфигурацию Nginx
   sudo nano /etc/nginx/sites-available/nexuschat
   ```
   
   Добавьте конфигурацию:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:8765;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
   
   ```bash
   sudo ln -s /etc/nginx/sites-available/nexuschat /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

## Вариант 2: Традиционное развертывание 🔧

### Предварительные требования:
- Node.js 18+
- MongoDB 5+
- PM2 (для управления процессами)

### Шаги развертывания:

1. **Установите зависимости:**
   ```bash
   # Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # MongoDB
   wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
   echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
   sudo apt-get update
   sudo apt-get install -y mongodb-org
   
   # PM2
   sudo npm install -g pm2
   ```

2. **Загрузите и настройте проект:**
   ```bash
   git clone <your-repository-url>
   cd NexusChat1
   
   # Установите зависимости
   npm install
   cd client
   npm install
   npm run build
   cd ..
   ```

3. **Настройте переменные окружения:**
   ```bash
   cp .env .env.production
   nano .env.production
   ```

4. **Запустите MongoDB:**
   ```bash
   sudo systemctl start mongod
   sudo systemctl enable mongod
   ```

5. **Запустите приложение с PM2:**
   ```bash
   pm2 start server.js --name "nexuschat"
   pm2 startup
   pm2 save
   ```

## Вариант 3: Облачные платформы ☁️

### Heroku:

1. **Установите Heroku CLI**
2. **Создайте приложение:**
   ```bash
   heroku create your-app-name
   heroku addons:create mongolab:sandbox
   ```
3. **Настройте переменные:**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=your-secret-key
   heroku config:set VITROCAD_BASE_URL=https://your-vitrocad.com
   ```
4. **Деплой:**
   ```bash
   git push heroku main
   ```

### DigitalOcean App Platform:

1. Подключите GitHub репозиторий
2. Выберите Node.js
3. Добавьте MongoDB как компонент
4. Настройте переменные окружения
5. Деплой автоматический

### AWS/Google Cloud:

1. Используйте Docker образ
2. Настройте Load Balancer
3. Подключите управляемую MongoDB
4. Настройте автомасштабирование

## 🔧 Настройка VitroCAD интеграции

1. **В VitroCAD настройте webhook:**
   - URL: `https://your-domain.com/api/vitrocad/webhook/file-uploaded`
   - Метод: POST
   - События: Загрузка файлов

2. **Проверьте подключение:**
   ```bash
   curl -X POST https://your-domain.com/api/vitrocad/webhook/file-uploaded \
     -H "Content-Type: application/json" \
     -d '{"fileId":"test","fileName":"test.pdf","uploaderId":"test"}'
   ```

## 🔒 Безопасность

1. **Настройте HTTPS:**
   ```bash
   # Certbot для Let's Encrypt
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

2. **Настройте файрвол:**
   ```bash
   sudo ufw allow 22
   sudo ufw allow 80
   sudo ufw allow 443
   sudo ufw enable
   ```

3. **Обновите пароли:**
   - Смените JWT_SECRET
   - Настройте сложные пароли для MongoDB
   - Ограничьте доступ к базе данных

## 📊 Мониторинг

1. **Проверка статуса:**
   ```bash
   # Docker
   docker-compose ps
   docker-compose logs -f nexuschat
   
   # PM2
   pm2 status
   pm2 logs nexuschat
   ```

2. **Health check:**
   ```bash
   curl https://your-domain.com/health
   ```

3. **Мониторинг ресурсов:**
   ```bash
   # Использование памяти и CPU
   htop
   
   # Логи системы
   journalctl -u docker
   ```

## 🚨 Решение проблем

### Проблема: Приложение не запускается
```bash
# Проверьте логи
docker-compose logs nexuschat

# Проверьте порты
sudo netstat -tlnp | grep :8765

# Проверьте переменные окружения
docker-compose exec nexuschat env
```

### Проблема: Ошибка подключения к MongoDB
```bash
# Проверьте статус MongoDB
docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')"

# Проверьте строку подключения
echo $MONGODB_URI
```

### Проблема: VitroCAD webhook не работает
```bash
# Проверьте доступность endpoint
curl -X POST https://your-domain.com/api/vitrocad/webhook/file-uploaded

# Проверьте логи webhook
docker-compose logs nexuschat | grep webhook
```

## 🔄 Обновление

```bash
# Остановите приложение
docker-compose down

# Обновите код
git pull origin main

# Пересоберите и запустите
docker-compose up -d --build
```

## 📞 Поддержка

После развертывания:
1. Проверьте https://your-domain.com/health (или http://your-server-ip:8765/health)
2. Войдите с учетными данными VitroCAD
3. Загрузите тестовый файл в VitroCAD
4. Убедитесь, что чат создался автоматически

---

**🎉 Готово!** Ваш Nexus Chat развернут и готов к использованию!