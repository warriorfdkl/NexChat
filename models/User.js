const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // ID пользователя из VitroCAD
  vitrocadId: {
    type: String,
    required: true,
    unique: true
  },
  // Данные из VitroCAD
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  login: {
    type: String,
    required: true
  },
  // Дополнительные поля для мессенджера
  avatar: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['online', 'offline', 'away'],
    default: 'offline'
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  // Настройки пользователя
  settings: {
    notifications: {
      type: Boolean,
      default: true
    },
    soundEnabled: {
      type: Boolean,
      default: true
    },
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    }
  },
  // Группы пользователя из VitroCAD
  groupList: [{
    type: String
  }],
  // Права администратора
  isAdmin: {
    type: Boolean,
    default: false
  },
  // Активность пользователя
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Индексы для быстрого поиска
userSchema.index({ vitrocadId: 1 });
userSchema.index({ email: 1 });
userSchema.index({ login: 1 });

// Методы модели
userSchema.methods.updateLastSeen = function() {
  this.lastSeen = new Date();
  return this.save();
};

userSchema.methods.setOnlineStatus = function(status) {
  this.status = status;
  if (status === 'offline') {
    this.lastSeen = new Date();
  }
  return this.save();
};

module.exports = mongoose.model('User', userSchema);