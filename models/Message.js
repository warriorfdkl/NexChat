const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  // Чат, к которому относится сообщение
  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
  },
  // Отправитель сообщения
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Тип сообщения
  type: {
    type: String,
    enum: ['text', 'file', 'image', 'system'],
    default: 'text'
  },
  // Содержимое сообщения
  content: {
    text: {
      type: String,
      maxlength: 4000
    },
    // Для файлов
    file: {
      originalName: String,
      fileName: String,
      filePath: String,
      fileSize: Number,
      mimeType: String
    },
    // Для системных сообщений
    systemData: {
      action: String, // 'user_joined', 'user_left', 'chat_created', etc.
      data: mongoose.Schema.Types.Mixed
    }
  },
  // Ответ на сообщение
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  // Статус сообщения
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent'
  },
  // Пользователи, прочитавшие сообщение
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Редактирование сообщения
  edited: {
    isEdited: {
      type: Boolean,
      default: false
    },
    editedAt: Date,
    originalContent: String
  },
  // Удаление сообщения
  deleted: {
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedAt: Date,
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  // Метаданные
  metadata: {
    ipAddress: String,
    userAgent: String,
    platform: String
  }
}, {
  timestamps: true
});

// Индексы для быстрого поиска
messageSchema.index({ chat: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ type: 1 });
messageSchema.index({ 'content.text': 'text' }); // Текстовый поиск

// Методы модели
messageSchema.methods.markAsRead = function(userId) {
  const existingRead = this.readBy.find(read => 
    read.user.toString() === userId.toString()
  );
  
  if (!existingRead) {
    this.readBy.push({
      user: userId,
      readAt: new Date()
    });
    return this.save();
  }
  return Promise.resolve(this);
};

messageSchema.methods.editMessage = function(newContent) {
  this.edited.originalContent = this.content.text;
  this.content.text = newContent;
  this.edited.isEdited = true;
  this.edited.editedAt = new Date();
  return this.save();
};

messageSchema.methods.deleteMessage = function(userId) {
  this.deleted.isDeleted = true;
  this.deleted.deletedAt = new Date();
  this.deleted.deletedBy = userId;
  return this.save();
};

messageSchema.methods.isReadBy = function(userId) {
  return this.readBy.some(read => 
    read.user.toString() === userId.toString()
  );
};

// Виртуальные поля
messageSchema.virtual('readCount').get(function() {
  return this.readBy.length;
});

// Статические методы
messageSchema.statics.getUnreadCount = function(chatId, userId) {
  return this.countDocuments({
    chat: chatId,
    sender: { $ne: userId },
    'readBy.user': { $ne: userId },
    'deleted.isDeleted': false
  });
};

messageSchema.statics.markChatAsRead = function(chatId, userId) {
  return this.updateMany(
    {
      chat: chatId,
      sender: { $ne: userId },
      'readBy.user': { $ne: userId },
      'deleted.isDeleted': false
    },
    {
      $push: {
        readBy: {
          user: userId,
          readAt: new Date()
        }
      }
    }
  );
};

module.exports = mongoose.model('Message', messageSchema);