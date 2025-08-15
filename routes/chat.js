const express = require('express');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');
const { authenticateToken } = require('./auth');
const vitrocadService = require('../services/vitrocadService');
const router = express.Router();

// Получение списка чатов пользователя
router.get('/list', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const chats = await Chat.find({
      'members.user': userId,
      isActive: true
    })
    .populate('creator', 'name email avatar status')
    .populate('members.user', 'name email avatar status')
    .populate('lastMessage')
    .sort({ updatedAt: -1 });

    // Добавляем количество непрочитанных сообщений для каждого чата
    const chatsWithUnread = await Promise.all(
      chats.map(async (chat) => {
        const unreadCount = await Message.getUnreadCount(chat._id, userId);
        return {
          ...chat.toObject(),
          unreadCount
        };
      })
    );

    res.json({
      success: true,
      chats: chatsWithUnread
    });
  } catch (error) {
    console.error('Ошибка получения списка чатов:', error);
    res.status(500).json({ 
      error: 'Ошибка получения списка чатов' 
    });
  }
});

// Создание чата для файла
router.post('/create-file-chat', authenticateToken, async (req, res) => {
  try {
    const { fileId, fileName, listId, parentId } = req.body;
    const userId = req.user.userId;

    if (!fileId || !fileName) {
      return res.status(400).json({ 
        error: 'ID файла и имя файла обязательны' 
      });
    }

    // Проверяем, существует ли уже чат для этого файла
    const existingChat = await Chat.findOne({
      'vitrocadFile.fileId': fileId,
      isActive: true
    });

    if (existingChat) {
      // Добавляем пользователя в существующий чат, если он не участник
      if (!existingChat.isMember(userId)) {
        await existingChat.addMember(userId);
      }
      
      return res.json({
        success: true,
        chat: existingChat,
        message: 'Чат уже существует, вы добавлены как участник'
      });
    }

    // Создаем новый чат
    const newChat = new Chat({
      name: fileName,
      type: 'file',
      creator: userId,
      members: [{
        user: userId,
        role: 'admin'
      }],
      vitrocadFile: {
        fileId,
        fileName,
        listId,
        parentId
      }
    });

    await newChat.save();
    
    // Создаем системное сообщение о создании чата
    const systemMessage = new Message({
      chat: newChat._id,
      sender: userId,
      type: 'system',
      content: {
        systemData: {
          action: 'chat_created',
          data: {
            fileName,
            creator: userId
          }
        }
      }
    });

    await systemMessage.save();
    await newChat.updateLastMessage(systemMessage._id);

    // Получаем полную информацию о чате
    const populatedChat = await Chat.findById(newChat._id)
      .populate('creator', 'name email avatar status')
      .populate('members.user', 'name email avatar status');

    res.json({
      success: true,
      chat: populatedChat
    });
  } catch (error) {
    console.error('Ошибка создания чата для файла:', error);
    res.status(500).json({ 
      error: 'Ошибка создания чата' 
    });
  }
});

// Получение информации о чате
router.get('/:chatId', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.userId;

    const chat = await Chat.findById(chatId)
      .populate('creator', 'name email avatar status')
      .populate('members.user', 'name email avatar status')
      .populate('lastMessage');

    if (!chat) {
      return res.status(404).json({ 
        error: 'Чат не найден' 
      });
    }

    // Проверяем, является ли пользователь участником чата
    if (!chat.isMember(userId)) {
      return res.status(403).json({ 
        error: 'Доступ запрещен' 
      });
    }

    const unreadCount = await Message.getUnreadCount(chatId, userId);

    res.json({
      success: true,
      chat: {
        ...chat.toObject(),
        unreadCount
      }
    });
  } catch (error) {
    console.error('Ошибка получения чата:', error);
    res.status(500).json({ 
      error: 'Ошибка получения чата' 
    });
  }
});

// Добавление участника в чат
router.post('/:chatId/add-member', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { userId: newMemberId } = req.body;
    const currentUserId = req.user.userId;

    if (!newMemberId) {
      return res.status(400).json({ 
        error: 'ID пользователя обязателен' 
      });
    }

    const chat = await Chat.findById(chatId);
    
    if (!chat) {
      return res.status(404).json({ 
        error: 'Чат не найден' 
      });
    }

    // Проверяем права текущего пользователя
    const currentUserRole = chat.getMemberRole(currentUserId);
    if (!currentUserRole || currentUserRole !== 'admin') {
      return res.status(403).json({ 
        error: 'Недостаточно прав для добавления участников' 
      });
    }

    // Проверяем, существует ли пользователь
    const newMember = await User.findById(newMemberId);
    if (!newMember) {
      return res.status(404).json({ 
        error: 'Пользователь не найден' 
      });
    }

    // Добавляем участника
    await chat.addMember(newMemberId);

    // Создаем системное сообщение
    const systemMessage = new Message({
      chat: chatId,
      sender: currentUserId,
      type: 'system',
      content: {
        systemData: {
          action: 'user_joined',
          data: {
            userId: newMemberId,
            userName: newMember.name,
            addedBy: currentUserId
          }
        }
      }
    });

    await systemMessage.save();
    await chat.updateLastMessage(systemMessage._id);

    res.json({
      success: true,
      message: 'Участник добавлен в чат'
    });
  } catch (error) {
    console.error('Ошибка добавления участника:', error);
    res.status(500).json({ 
      error: 'Ошибка добавления участника' 
    });
  }
});

// Удаление участника из чата
router.post('/:chatId/remove-member', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { userId: memberToRemove } = req.body;
    const currentUserId = req.user.userId;

    const chat = await Chat.findById(chatId);
    
    if (!chat) {
      return res.status(404).json({ 
        error: 'Чат не найден' 
      });
    }

    // Проверяем права (админ или сам пользователь)
    const currentUserRole = chat.getMemberRole(currentUserId);
    if (currentUserRole !== 'admin' && currentUserId !== memberToRemove) {
      return res.status(403).json({ 
        error: 'Недостаточно прав' 
      });
    }

    await chat.removeMember(memberToRemove);

    // Создаем системное сообщение
    const systemMessage = new Message({
      chat: chatId,
      sender: currentUserId,
      type: 'system',
      content: {
        systemData: {
          action: 'user_left',
          data: {
            userId: memberToRemove,
            removedBy: currentUserId
          }
        }
      }
    });

    await systemMessage.save();
    await chat.updateLastMessage(systemMessage._id);

    res.json({
      success: true,
      message: 'Участник удален из чата'
    });
  } catch (error) {
    console.error('Ошибка удаления участника:', error);
    res.status(500).json({ 
      error: 'Ошибка удаления участника' 
    });
  }
});

// Получение сообщений чата
router.get('/:chatId/messages', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user.userId;

    const chat = await Chat.findById(chatId);
    
    if (!chat) {
      return res.status(404).json({ 
        error: 'Чат не найден' 
      });
    }

    if (!chat.isMember(userId)) {
      return res.status(403).json({ 
        error: 'Доступ запрещен' 
      });
    }

    const messages = await Message.find({
      chat: chatId,
      'deleted.isDeleted': false
    })
    .populate('sender', 'name email avatar')
    .populate('replyTo')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    res.json({
      success: true,
      messages: messages.reverse(), // Возвращаем в хронологическом порядке
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: messages.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Ошибка получения сообщений:', error);
    res.status(500).json({ 
      error: 'Ошибка получения сообщений' 
    });
  }
});

// Отметка сообщений как прочитанных
router.post('/:chatId/mark-read', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.userId;

    const chat = await Chat.findById(chatId);
    
    if (!chat) {
      return res.status(404).json({ 
        error: 'Чат не найден' 
      });
    }

    if (!chat.isMember(userId)) {
      return res.status(403).json({ 
        error: 'Доступ запрещен' 
      });
    }

    await Message.markChatAsRead(chatId, userId);

    res.json({
      success: true,
      message: 'Сообщения отмечены как прочитанные'
    });
  } catch (error) {
    console.error('Ошибка отметки сообщений:', error);
    res.status(500).json({ 
      error: 'Ошибка отметки сообщений' 
    });
  }
});

module.exports = router;