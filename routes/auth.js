const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const vitrocadService = require('../services/vitrocadService');
const router = express.Router();

// Middleware для проверки токена
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Токен доступа отсутствует' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Недействительный токен' });
    }
    req.user = user;
    next();
  });
};

// Вход в систему через VitroCAD
router.post('/login', async (req, res) => {
  try {
    const { login, password } = req.body;

    if (!login || !password) {
      return res.status(400).json({ 
        error: 'Логин и пароль обязательны' 
      });
    }

    // Аутентификация в VitroCAD
    const vitrocadAuth = await vitrocadService.authenticateUser(login, password);
    
    if (!vitrocadAuth.success) {
      return res.status(401).json({ 
        error: vitrocadAuth.error 
      });
    }

    // Создание или обновление пользователя в локальной БД
    const userResult = await vitrocadService.createOrUpdateUser(vitrocadAuth.data);
    
    if (!userResult.success) {
      return res.status(500).json({ 
        error: userResult.error 
      });
    }

    // Создание JWT токена для мессенджера
    const jwtToken = jwt.sign(
      { 
        userId: userResult.user._id,
        vitrocadId: userResult.user.vitrocadId,
        vitrocadToken: vitrocadAuth.data.token
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    // Обновление статуса пользователя на "онлайн"
    await userResult.user.setOnlineStatus('online');

    res.json({
      success: true,
      token: jwtToken,
      user: {
        id: userResult.user._id,
        vitrocadId: userResult.user.vitrocadId,
        name: userResult.user.name,
        email: userResult.user.email,
        login: userResult.user.login,
        avatar: userResult.user.avatar,
        status: userResult.user.status,
        isAdmin: userResult.user.isAdmin,
        settings: userResult.user.settings
      },
      vitrocadToken: vitrocadAuth.data.token,
      vitrocadExpires: vitrocadAuth.data.expires
    });

  } catch (error) {
    console.error('Ошибка входа:', error);
    res.status(500).json({ 
      error: 'Внутренняя ошибка сервера' 
    });
  }
});

// Выход из системы
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (user) {
      await user.setOnlineStatus('offline');
    }

    res.json({ 
      success: true, 
      message: 'Выход выполнен успешно' 
    });
  } catch (error) {
    console.error('Ошибка выхода:', error);
    res.status(500).json({ 
      error: 'Ошибка при выходе из системы' 
    });
  }
});

// Получение информации о текущем пользователе
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-__v');
    
    if (!user) {
      return res.status(404).json({ 
        error: 'Пользователь не найден' 
      });
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
        status: user.status,
        lastSeen: user.lastSeen,
        isAdmin: user.isAdmin,
        settings: user.settings,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Ошибка получения пользователя:', error);
    res.status(500).json({ 
      error: 'Ошибка получения данных пользователя' 
    });
  }
});

// Обновление настроек пользователя
router.put('/settings', authenticateToken, async (req, res) => {
  try {
    const { notifications, soundEnabled, theme } = req.body;
    
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ 
        error: 'Пользователь не найден' 
      });
    }

    // Обновление настроек
    if (notifications !== undefined) {
      user.settings.notifications = notifications;
    }
    if (soundEnabled !== undefined) {
      user.settings.soundEnabled = soundEnabled;
    }
    if (theme !== undefined) {
      user.settings.theme = theme;
    }

    await user.save();

    res.json({
      success: true,
      settings: user.settings
    });
  } catch (error) {
    console.error('Ошибка обновления настроек:', error);
    res.status(500).json({ 
      error: 'Ошибка обновления настроек' 
    });
  }
});

// Обновление статуса пользователя
router.put('/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['online', 'offline', 'away'].includes(status)) {
      return res.status(400).json({ 
        error: 'Недопустимый статус' 
      });
    }

    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ 
        error: 'Пользователь не найден' 
      });
    }

    await user.setOnlineStatus(status);

    res.json({
      success: true,
      status: user.status,
      lastSeen: user.lastSeen
    });
  } catch (error) {
    console.error('Ошибка обновления статуса:', error);
    res.status(500).json({ 
      error: 'Ошибка обновления статуса' 
    });
  }
});

// Проверка токена VitroCAD
router.post('/validate-vitrocad-token', authenticateToken, async (req, res) => {
  try {
    const { vitrocadToken } = req.body;
    
    if (!vitrocadToken) {
      return res.status(400).json({ 
        error: 'Токен VitroCAD отсутствует' 
      });
    }

    const validation = await vitrocadService.validateToken(vitrocadToken);
    
    res.json({
      success: validation.success,
      valid: validation.success,
      error: validation.error
    });
  } catch (error) {
    console.error('Ошибка валидации токена VitroCAD:', error);
    res.status(500).json({ 
      error: 'Ошибка валидации токена' 
    });
  }
});

module.exports = { router, authenticateToken };