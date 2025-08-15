const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Подключение к MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nexuschat', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB подключена'))
.catch(err => console.log('Ошибка подключения к MongoDB:', err));

// Импорт маршрутов
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const vitrocadRoutes = require('./routes/vitrocad');

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: require('./package.json').version
  });
});

// Использование маршрутов
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/vitrocad', vitrocadRoutes);

// Обработка WebSocket соединений
const socketHandler = require('./socket/socketHandler');
socketHandler(io);

// Инициализация сервиса мониторинга файлов
const FileMonitorService = require('./services/fileMonitorService');
const fileMonitor = new FileMonitorService(io);

// Запуск мониторинга файлов в продакшене
if (process.env.NODE_ENV === 'production') {
  fileMonitor.startMonitoring(60000); // Проверка каждую минуту
} else {
  // В режиме разработки запускаем с большим интервалом
  fileMonitor.startMonitoring(300000); // Проверка каждые 5 минут
}

// Делаем сервис доступным для маршрутов
app.locals.fileMonitor = fileMonitor;

// Статические файлы для продакшена
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/build'));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});

// Обработка ошибок
process.on('unhandledRejection', (err) => {
  console.log('Необработанная ошибка:', err.message);
  server.close(() => {
    process.exit(1);
  });
});