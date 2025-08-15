const express = require('express');
const Chat = require('../models/Chat');
const User = require('../models/User');
const Message = require('../models/Message');
const { authenticateToken } = require('./auth');
const vitrocadService = require('../services/vitrocadService');
const router = express.Router();

// Получение списка пользователей из VitroCAD
router.get('/users/:listId', authenticateToken, async (req, res) => {
  try {
    const { listId } = req.params;
    const { vitrocadToken } = req.user;

    if (!vitrocadToken) {
      return res.status(401).json({ 
        error: 'Токен VitroCAD отсутствует' 
      });
    }

    const result = await vitrocadService.getUsersList(listId, vitrocadToken);
    
    if (!result.success) {
      return res.status(400).json({ 
        error: result.error 
      });
    }

    // Синхронизируем пользователей с локальной БД
    const syncedUsers = [];
    
    for (const vitrocadUser of result.data) {
      if (vitrocadUser.fieldValueMap && vitrocadUser.fieldValueMap.name) {
        let localUser = await User.findOne({ vitrocadId: vitrocadUser.id });
        
        if (!localUser) {
          // Создаем нового пользователя
          localUser = new User({
            vitrocadId: vitrocadUser.id,
            name: vitrocadUser.fieldValueMap.name,
            email: vitrocadUser.fieldValueMap.email || '',
            login: vitrocadUser.fieldValueMap.login || '',
            isActive: vitrocadUser.status === 1
          });
          await localUser.save();
        }
        
        syncedUsers.push({
          id: localUser._id,
          vitrocadId: localUser.vitrocadId,
          name: localUser.name,
          email: localUser.email,
          login: localUser.login,
          avatar: localUser.avatar,
          status: localUser.status,
          isActive: localUser.isActive
        });
      }
    }

    res.json({
      success: true,
      users: syncedUsers
    });
  } catch (error) {
    console.error('Ошибка получения пользователей VitroCAD:', error);
    res.status(500).json({ 
      error: 'Ошибка получения пользователей' 
    });
  }
});

// Получение информации о файле из VitroCAD
router.get('/file/:fileId', authenticateToken, async (req, res) => {
  try {
    const { fileId } = req.params;
    const { vitrocadToken } = req.user;

    if (!vitrocadToken) {
      return res.status(401).json({ 
        error: 'Токен VitroCAD отсутствует' 
      });
    }

    const result = await vitrocadService.getItemById(fileId, vitrocadToken);
    
    if (!result.success) {
      return res.status(400).json({ 
        error: result.error 
      });
    }

    res.json({
      success: true,
      file: result.data
    });
  } catch (error) {
    console.error('Ошибка получения файла VitroCAD:', error);
    res.status(500).json({ 
      error: 'Ошибка получения файла' 
    });
  }
});

// Webhook для уведомления о загрузке файла
router.post('/webhook/file-uploaded', async (req, res) => {
  try {
    const fileData = req.body;
    
    // Валидация входных данных
    if (!fileData.fileId || !fileData.fileName || !fileData.uploaderId) {
      return res.status(400).json({ 
        error: 'Недостаточно данных для создания чата' 
      });
    }

    // Получаем сервис мониторинга файлов
    const fileMonitor = req.app.locals.fileMonitor;
    
    if (!fileMonitor) {
      console.error('Сервис мониторинга файлов не инициализирован');
      return res.status(500).json({ 
        error: 'Сервис недоступен' 
      });
    }

    // Обрабатываем загрузку файла через сервис
    const result = await fileMonitor.handleFileUpload(fileData);
    
    if (result.success) {
      res.json({
        success: true,
        chatId: result.chatId,
        action: result.action,
        message: result.action === 'created' ? 'Чат создан успешно' : 'Чат обновлен успешно'
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Ошибка обработки webhook:', error);
    res.status(500).json({ 
      error: 'Ошибка обработки webhook' 
    });
  }
});

// Webhook для массовой загрузки файлов
router.post('/webhook/bulk-file-uploaded', async (req, res) => {
  try {
    const { files } = req.body;
    
    if (!Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ 
        error: 'Список файлов обязателен' 
      });
    }

    const fileMonitor = req.app.locals.fileMonitor;
    
    if (!fileMonitor) {
      return res.status(500).json({ 
        error: 'Сервис недоступен' 
      });
    }

    const results = await fileMonitor.handleBulkFileUpload(files);
    
    res.json({
      success: true,
      results,
      processed: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    });
  } catch (error) {
    console.error('Ошибка обработки массовой загрузки:', error);
    res.status(500).json({ 
      error: 'Ошибка обработки массовой загрузки' 
    });
  }
});

// Получение статистики мониторинга
router.get('/monitoring/stats', authenticateToken, async (req, res) => {
  try {
    const fileMonitor = req.app.locals.fileMonitor;
    
    if (!fileMonitor) {
      return res.status(500).json({ 
        error: 'Сервис недоступен' 
      });
    }

    const stats = fileMonitor.getMonitoringStats();
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Ошибка получения статистики:', error);
    res.status(500).json({ 
      error: 'Ошибка получения статистики' 
    });
  }
});

// Управление мониторингом (только для администраторов)
router.post('/monitoring/control', authenticateToken, async (req, res) => {
  try {
    const { action, interval } = req.body;
    
    // Проверяем права администратора
    const user = await User.findById(req.user.userId);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ 
        error: 'Недостаточно прав' 
      });
    }

    const fileMonitor = req.app.locals.fileMonitor;
    
    if (!fileMonitor) {
      return res.status(500).json({ 
        error: 'Сервис недоступен' 
      });
    }

    switch (action) {
      case 'start':
        fileMonitor.startMonitoring(interval || 60000);
        res.json({ success: true, message: 'Мониторинг запущен' });
        break;
      
      case 'stop':
        fileMonitor.stopMonitoring();
        res.json({ success: true, message: 'Мониторинг остановлен' });
        break;
      
      default:
        res.status(400).json({ error: 'Неизвестное действие' });
    }
  } catch (error) {
    console.error('Ошибка управления мониторингом:', error);
    res.status(500).json({ 
      error: 'Ошибка управления мониторингом' 
    });
  }
});

// Поиск пользователей для добавления в чат
router.get('/search-users', authenticateToken, async (req, res) => {
  try {
    const { query, limit = 10 } = req.query;
    
    if (!query || query.length < 2) {
      return res.status(400).json({ 
        error: 'Запрос должен содержать минимум 2 символа' 
      });
    }

    const users = await User.find({
      $and: [
        { isActive: true },
        {
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } },
            { login: { $regex: query, $options: 'i' } }
          ]
        }
      ]
    })
    .select('name email login avatar status')
    .limit(parseInt(limit));

    res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Ошибка поиска пользователей:', error);
    res.status(500).json({ 
      error: 'Ошибка поиска пользователей' 
    });
  }
});

// Получение прав доступа к файлу
router.get('/file/:fileId/permissions', authenticateToken, async (req, res) => {
  try {
    const { fileId } = req.params;
    const { vitrocadToken } = req.user;

    if (!vitrocadToken) {
      return res.status(401).json({ 
        error: 'Токен VitroCAD отсутствует' 
      });
    }

    const result = await vitrocadService.getItemPermissions(fileId, vitrocadToken);
    
    if (!result.success) {
      return res.status(400).json({ 
        error: result.error 
      });
    }

    res.json({
      success: true,
      permissions: result.data
    });
  } catch (error) {
    console.error('Ошибка получения прав доступа:', error);
    res.status(500).json({ 
      error: 'Ошибка получения прав доступа' 
    });
  }
});

// Синхронизация пользователя с VitroCAD
router.post('/sync-user', authenticateToken, async (req, res) => {
  try {
    const { vitrocadUserId } = req.body;
    const { vitrocadToken } = req.user;

    if (!vitrocadToken) {
      return res.status(401).json({ 
        error: 'Токен VitroCAD отсутствует' 
      });
    }

    if (!vitrocadUserId) {
      return res.status(400).json({ 
        error: 'ID пользователя VitroCAD обязателен' 
      });
    }

    // Получаем данные пользователя из VitroCAD
    const userResult = await vitrocadService.getItemById(vitrocadUserId, vitrocadToken);
    
    if (!userResult.success) {
      return res.status(400).json({ 
        error: userResult.error 
      });
    }

    // Создаем или обновляем пользователя
    let user = await User.findOne({ vitrocadId: vitrocadUserId });
    
    if (user) {
      // Обновляем существующего пользователя
      user.name = userResult.data.fieldValueMap?.name || user.name;
      user.email = userResult.data.fieldValueMap?.email || user.email;
      user.login = userResult.data.fieldValueMap?.login || user.login;
      await user.save();
    } else {
      // Создаем нового пользователя
      user = new User({
        vitrocadId: vitrocadUserId,
        name: userResult.data.fieldValueMap?.name || 'Неизвестный пользователь',
        email: userResult.data.fieldValueMap?.email || '',
        login: userResult.data.fieldValueMap?.login || ''
      });
      await user.save();
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        vitrocadId: user.vitrocadId,
        name: user.name,
        email: user.email,
        login: user.login,
        avatar: user.avatar,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Ошибка синхронизации пользователя:', error);
    res.status(500).json({ 
      error: 'Ошибка синхронизации пользователя' 
    });
  }
});

module.exports = router;