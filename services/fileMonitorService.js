const Chat = require('../models/Chat');
const User = require('../models/User');
const Message = require('../models/Message');
const vitrocadService = require('./vitrocadService');

class FileMonitorService {
  constructor(io) {
    this.io = io;
    this.monitoringInterval = null;
    this.lastCheckTime = new Date();
    this.isMonitoring = false;
  }

  // Запуск мониторинга файлов
  startMonitoring(intervalMs = 30000) { // Проверка каждые 30 секунд
    if (this.isMonitoring) {
      console.log('Мониторинг файлов уже запущен');
      return;
    }

    console.log('Запуск мониторинга файлов VitroCAD...');
    this.isMonitoring = true;
    
    this.monitoringInterval = setInterval(async () => {
      await this.checkForNewFiles();
    }, intervalMs);

    // Первоначальная проверка
    this.checkForNewFiles();
  }

  // Остановка мониторинга
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    console.log('Мониторинг файлов остановлен');
  }

  // Проверка новых файлов
  async checkForNewFiles() {
    try {
      // Здесь должна быть логика получения списка недавно загруженных файлов
      // Поскольку в API VitroCAD нет прямого метода для этого,
      // мы полагаемся на webhook или можем реализовать периодический опрос
      
      console.log('Проверка новых файлов...', new Date().toISOString());
      
      // Обновляем время последней проверки
      this.lastCheckTime = new Date();
    } catch (error) {
      console.error('Ошибка при проверке новых файлов:', error);
    }
  }

  // Обработка загрузки файла (вызывается из webhook)
  async handleFileUpload(fileData) {
    try {
      const {
        fileId,
        fileName,
        uploaderId,
        listId,
        parentId,
        vitrocadToken
      } = fileData;

      console.log(`Обработка загрузки файла: ${fileName} (ID: ${fileId})`);

      // Находим или создаем пользователя
      let uploader = await this.findOrCreateUser(uploaderId, vitrocadToken);
      
      if (!uploader) {
        throw new Error('Не удалось найти или создать пользователя');
      }

      // Проверяем, существует ли уже чат для этого файла
      let chat = await Chat.findOne({
        'vitrocadFile.fileId': fileId,
        isActive: true
      });

      if (chat) {
        // Если чат существует, добавляем пользователя как участника (если он не участник)
        if (!chat.isMember(uploader._id)) {
          await chat.addMember(uploader._id, 'admin');
          
          // Создаем системное сообщение об обновлении файла
          await this.createSystemMessage(chat._id, uploader._id, 'file_updated', {
            fileName,
            fileId,
            updatedBy: uploader._id
          });

          // Уведомляем участников чата
          this.notifyChatMembers(chat._id, {
            type: 'file_updated',
            message: `${uploader.name} обновил файл ${fileName}`,
            fileId,
            fileName
          }, uploader._id);
        }

        console.log(`Файл ${fileName} обновлен в существующем чате`);
        return { success: true, chatId: chat._id, action: 'updated' };
      }

      // Создаем новый чат
      chat = new Chat({
        name: fileName,
        type: 'file',
        creator: uploader._id,
        members: [{
          user: uploader._id,
          role: 'admin'
        }],
        vitrocadFile: {
          fileId,
          fileName,
          listId,
          parentId
        }
      });

      await chat.save();

      // Создаем системное сообщение о создании чата
      const systemMessage = await this.createSystemMessage(
        chat._id, 
        uploader._id, 
        'chat_created', 
        {
          fileName,
          fileId,
          creator: uploader._id
        }
      );

      await chat.updateLastMessage(systemMessage._id);

      // Автоматически добавляем пользователей с правами доступа к файлу
      await this.addUsersWithFileAccess(chat, fileId, vitrocadToken);

      // Уведомляем о создании нового чата
      this.notifyNewChat(chat, uploader);

      console.log(`Создан новый чат для файла: ${fileName} (ID чата: ${chat._id})`);
      
      return { 
        success: true, 
        chatId: chat._id, 
        action: 'created',
        chat: chat
      };
    } catch (error) {
      console.error('Ошибка при обработке загрузки файла:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  // Поиск или создание пользователя
  async findOrCreateUser(uploaderId, vitrocadToken) {
    try {
      // Сначала ищем в локальной базе
      let user = await User.findOne({ vitrocadId: uploaderId });
      
      if (user) {
        return user;
      }

      // Если пользователь не найден, получаем данные из VitroCAD
      if (vitrocadToken) {
        const userResult = await vitrocadService.getItemById(uploaderId, vitrocadToken);
        
        if (userResult.success && userResult.data.fieldValueMap) {
          user = new User({
            vitrocadId: uploaderId,
            name: userResult.data.fieldValueMap.name || 'Неизвестный пользователь',
            email: userResult.data.fieldValueMap.email || '',
            login: userResult.data.fieldValueMap.login || '',
            isActive: userResult.data.status === 1
          });
          
          await user.save();
          console.log(`Создан новый пользователь: ${user.name} (${user.vitrocadId})`);
          return user;
        }
      }

      // Если не удалось получить данные, создаем пользователя с минимальной информацией
      user = new User({
        vitrocadId: uploaderId,
        name: `Пользователь ${uploaderId.substring(0, 8)}`,
        email: '',
        login: ''
      });
      
      await user.save();
      return user;
    } catch (error) {
      console.error('Ошибка при поиске/создании пользователя:', error);
      return null;
    }
  }

  // Создание системного сообщения
  async createSystemMessage(chatId, senderId, action, data) {
    const message = new Message({
      chat: chatId,
      sender: senderId,
      type: 'system',
      content: {
        systemData: {
          action,
          data
        }
      }
    });

    await message.save();
    return message;
  }

  // Автоматическое добавление пользователей с правами доступа
  async addUsersWithFileAccess(chat, fileId, vitrocadToken) {
    try {
      if (!vitrocadToken) {
        return;
      }

      // Получаем права доступа к файлу
      const permissionsResult = await vitrocadService.getItemPermissions(fileId, vitrocadToken);
      
      if (!permissionsResult.success || !permissionsResult.data) {
        return;
      }

      // Обрабатываем список пользователей с правами доступа
      for (const permission of permissionsResult.data) {
        if (permission.principalId && permission.principalId !== chat.creator.toString()) {
          const user = await this.findOrCreateUser(permission.principalId, vitrocadToken);
          
          if (user && !chat.isMember(user._id)) {
            await chat.addMember(user._id, 'member');
            
            // Создаем системное сообщение о добавлении пользователя
            await this.createSystemMessage(chat._id, chat.creator, 'user_auto_added', {
              userId: user._id,
              userName: user.name,
              reason: 'file_access_rights'
            });

            console.log(`Автоматически добавлен пользователь ${user.name} в чат ${chat.name}`);
          }
        }
      }
    } catch (error) {
      console.error('Ошибка при автоматическом добавлении пользователей:', error);
    }
  }

  // Уведомление участников чата
  notifyChatMembers(chatId, notification, excludeUserId = null) {
    if (this.io && this.io.sendNotificationToChat) {
      this.io.sendNotificationToChat(chatId, notification, excludeUserId);
    }
  }

  // Уведомление о новом чате
  notifyNewChat(chat, creator) {
    if (this.io) {
      // Уведомляем всех участников о новом чате
      chat.members.forEach(member => {
        if (this.io.sendNotificationToUser) {
          this.io.sendNotificationToUser(member.user, {
            type: 'new_chat_created',
            message: `Создан новый чат: ${chat.name}`,
            chatId: chat._id,
            creatorName: creator.name
          });
        }
      });
    }
  }

  // Получение статистики мониторинга
  getMonitoringStats() {
    return {
      isMonitoring: this.isMonitoring,
      lastCheckTime: this.lastCheckTime,
      intervalActive: !!this.monitoringInterval
    };
  }

  // Обработка массовой загрузки файлов
  async handleBulkFileUpload(filesData) {
    const results = [];
    
    for (const fileData of filesData) {
      try {
        const result = await this.handleFileUpload(fileData);
        results.push({
          fileId: fileData.fileId,
          fileName: fileData.fileName,
          ...result
        });
      } catch (error) {
        results.push({
          fileId: fileData.fileId,
          fileName: fileData.fileName,
          success: false,
          error: error.message
        });
      }
    }
    
    return results;
  }
}

module.exports = FileMonitorService;