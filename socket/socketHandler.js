const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Chat = require('../models/Chat');
const Message = require('../models/Message');

// Хранилище активных соединений
const activeConnections = new Map();

// Middleware для аутентификации WebSocket
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Токен аутентификации отсутствует'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return next(new Error('Пользователь не найден'));
    }

    socket.userId = user._id.toString();
    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Недействительный токен'));
  }
};

module.exports = (io) => {
  // Применяем middleware аутентификации
  io.use(authenticateSocket);

  io.on('connection', async (socket) => {
    console.log(`Пользователь подключен: ${socket.user.name} (${socket.userId})`);
    
    // Сохраняем соединение
    activeConnections.set(socket.userId, socket);
    
    // Обновляем статус пользователя на "онлайн"
    await socket.user.setOnlineStatus('online');
    
    // Уведомляем других пользователей о том, что пользователь онлайн
    socket.broadcast.emit('user_status_changed', {
      userId: socket.userId,
      status: 'online',
      lastSeen: socket.user.lastSeen
    });

    // Присоединение к комнатам чатов
    socket.on('join_chats', async () => {
      try {
        const userChats = await Chat.find({
          'members.user': socket.userId,
          isActive: true
        }).select('_id');

        userChats.forEach(chat => {
          socket.join(`chat_${chat._id}`);
        });

        console.log(`Пользователь ${socket.user.name} присоединился к ${userChats.length} чатам`);
      } catch (error) {
        console.error('Ошибка присоединения к чатам:', error);
      }
    });

    // Присоединение к конкретному чату
    socket.on('join_chat', async (chatId) => {
      try {
        const chat = await Chat.findById(chatId);
        
        if (!chat || !chat.isMember(socket.userId)) {
          socket.emit('error', { message: 'Доступ к чату запрещен' });
          return;
        }

        socket.join(`chat_${chatId}`);
        
        // Отмечаем сообщения как прочитанные
        await Message.markChatAsRead(chatId, socket.userId);
        
        // Уведомляем других участников о прочтении
        socket.to(`chat_${chatId}`).emit('messages_read', {
          chatId,
          userId: socket.userId
        });

        console.log(`Пользователь ${socket.user.name} присоединился к чату ${chatId}`);
      } catch (error) {
        console.error('Ошибка присоединения к чату:', error);
        socket.emit('error', { message: 'Ошибка присоединения к чату' });
      }
    });

    // Покидание чата
    socket.on('leave_chat', (chatId) => {
      socket.leave(`chat_${chatId}`);
      console.log(`Пользователь ${socket.user.name} покинул чат ${chatId}`);
    });

    // Отправка сообщения
    socket.on('send_message', async (data) => {
      try {
        const { chatId, content, type = 'text', replyTo } = data;

        // Проверяем доступ к чату
        const chat = await Chat.findById(chatId);
        
        if (!chat || !chat.isMember(socket.userId)) {
          socket.emit('error', { message: 'Доступ к чату запрещен' });
          return;
        }

        // Создаем сообщение
        const message = new Message({
          chat: chatId,
          sender: socket.userId,
          type,
          content: {
            text: content
          },
          replyTo: replyTo || null,
          metadata: {
            ipAddress: socket.handshake.address,
            userAgent: socket.handshake.headers['user-agent']
          }
        });

        await message.save();
        
        // Обновляем последнее сообщение в чате
        await chat.updateLastMessage(message._id);

        // Получаем полную информацию о сообщении
        const populatedMessage = await Message.findById(message._id)
          .populate('sender', 'name email avatar')
          .populate('replyTo');

        // Отправляем сообщение всем участникам чата
        io.to(`chat_${chatId}`).emit('new_message', {
          message: populatedMessage,
          chatId
        });

        // Отправляем уведомления офлайн пользователям
        const offlineMembers = await User.find({
          _id: { $in: chat.members.map(m => m.user) },
          status: 'offline',
          'settings.notifications': true
        });

        // Здесь можно добавить логику отправки push-уведомлений
        
        console.log(`Сообщение отправлено в чат ${chatId} от ${socket.user.name}`);
      } catch (error) {
        console.error('Ошибка отправки сообщения:', error);
        socket.emit('error', { message: 'Ошибка отправки сообщения' });
      }
    });

    // Редактирование сообщения
    socket.on('edit_message', async (data) => {
      try {
        const { messageId, newContent } = data;

        const message = await Message.findById(messageId);
        
        if (!message) {
          socket.emit('error', { message: 'Сообщение не найдено' });
          return;
        }

        // Проверяем, что пользователь является автором сообщения
        if (message.sender.toString() !== socket.userId) {
          socket.emit('error', { message: 'Нет прав для редактирования' });
          return;
        }

        await message.editMessage(newContent);

        const populatedMessage = await Message.findById(messageId)
          .populate('sender', 'name email avatar');

        // Уведомляем всех участников чата об изменении
        io.to(`chat_${message.chat}`).emit('message_edited', {
          message: populatedMessage
        });

        console.log(`Сообщение ${messageId} отредактировано пользователем ${socket.user.name}`);
      } catch (error) {
        console.error('Ошибка редактирования сообщения:', error);
        socket.emit('error', { message: 'Ошибка редактирования сообщения' });
      }
    });

    // Удаление сообщения
    socket.on('delete_message', async (data) => {
      try {
        const { messageId } = data;

        const message = await Message.findById(messageId);
        
        if (!message) {
          socket.emit('error', { message: 'Сообщение не найдено' });
          return;
        }

        // Проверяем права на удаление
        const chat = await Chat.findById(message.chat);
        const userRole = chat.getMemberRole(socket.userId);
        
        if (message.sender.toString() !== socket.userId && userRole !== 'admin') {
          socket.emit('error', { message: 'Нет прав для удаления' });
          return;
        }

        await message.deleteMessage(socket.userId);

        // Уведомляем всех участников чата об удалении
        io.to(`chat_${message.chat}`).emit('message_deleted', {
          messageId,
          deletedBy: socket.userId
        });

        console.log(`Сообщение ${messageId} удалено пользователем ${socket.user.name}`);
      } catch (error) {
        console.error('Ошибка удаления сообщения:', error);
        socket.emit('error', { message: 'Ошибка удаления сообщения' });
      }
    });

    // Индикатор набора текста
    socket.on('typing_start', (data) => {
      const { chatId } = data;
      socket.to(`chat_${chatId}`).emit('user_typing', {
        userId: socket.userId,
        userName: socket.user.name,
        chatId
      });
    });

    socket.on('typing_stop', (data) => {
      const { chatId } = data;
      socket.to(`chat_${chatId}`).emit('user_stopped_typing', {
        userId: socket.userId,
        chatId
      });
    });

    // Обновление статуса пользователя
    socket.on('update_status', async (status) => {
      try {
        if (['online', 'away', 'offline'].includes(status)) {
          await socket.user.setOnlineStatus(status);
          
          // Уведомляем других пользователей
          socket.broadcast.emit('user_status_changed', {
            userId: socket.userId,
            status,
            lastSeen: socket.user.lastSeen
          });
        }
      } catch (error) {
        console.error('Ошибка обновления статуса:', error);
      }
    });

    // Отключение пользователя
    socket.on('disconnect', async () => {
      console.log(`Пользователь отключен: ${socket.user.name} (${socket.userId})`);
      
      // Удаляем соединение
      activeConnections.delete(socket.userId);
      
      // Обновляем статус на "офлайн"
      await socket.user.setOnlineStatus('offline');
      
      // Уведомляем других пользователей
      socket.broadcast.emit('user_status_changed', {
        userId: socket.userId,
        status: 'offline',
        lastSeen: socket.user.lastSeen
      });
    });

    // Обработка ошибок
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  // Функция для отправки уведомлений конкретному пользователю
  const sendNotificationToUser = (userId, notification) => {
    const userSocket = activeConnections.get(userId.toString());
    if (userSocket) {
      userSocket.emit('notification', notification);
    }
  };

  // Функция для отправки уведомлений всем участникам чата
  const sendNotificationToChat = (chatId, notification, excludeUserId = null) => {
    const socketData = {
      ...notification,
      chatId
    };
    
    if (excludeUserId) {
      activeConnections.forEach((socket, userId) => {
        if (userId !== excludeUserId.toString()) {
          socket.to(`chat_${chatId}`).emit('notification', socketData);
        }
      });
    } else {
      io.to(`chat_${chatId}`).emit('notification', socketData);
    }
  };

  // Экспортируем функции для использования в других модулях
  io.sendNotificationToUser = sendNotificationToUser;
  io.sendNotificationToChat = sendNotificationToChat;
  io.getActiveConnections = () => activeConnections;
};