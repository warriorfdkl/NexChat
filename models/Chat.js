const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  // Название чата (имя файла из VitroCAD)
  name: {
    type: String,
    required: true
  },
  // Тип чата
  type: {
    type: String,
    enum: ['file', 'group', 'private'],
    default: 'file'
  },
  // Описание чата
  description: {
    type: String,
    default: ''
  },
  // Создатель чата (пользователь, загрузивший файл)
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Участники чата
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    lastReadMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    }
  }],
  // Связанный файл из VitroCAD
  vitrocadFile: {
    fileId: {
      type: String, // ID файла в VitroCAD
      required: function() {
        return this.type === 'file';
      }
    },
    fileName: {
      type: String
    },
    listId: {
      type: String // ID списка в VitroCAD
    },
    parentId: {
      type: String // ID родительской папки в VitroCAD
    }
  },
  // Настройки чата
  settings: {
    isPrivate: {
      type: Boolean,
      default: false
    },
    allowFileSharing: {
      type: Boolean,
      default: true
    },
    maxMembers: {
      type: Number,
      default: 100
    }
  },
  // Последнее сообщение
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  // Активность чата
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Индексы
chatSchema.index({ 'vitrocadFile.fileId': 1 });
chatSchema.index({ creator: 1 });
chatSchema.index({ 'members.user': 1 });
chatSchema.index({ type: 1 });

// Методы модели
chatSchema.methods.addMember = function(userId, role = 'member') {
  const existingMember = this.members.find(member => 
    member.user.toString() === userId.toString()
  );
  
  if (!existingMember) {
    this.members.push({
      user: userId,
      role: role,
      joinedAt: new Date()
    });
    return this.save();
  }
  return Promise.resolve(this);
};

chatSchema.methods.removeMember = function(userId) {
  this.members = this.members.filter(member => 
    member.user.toString() !== userId.toString()
  );
  return this.save();
};

chatSchema.methods.updateLastMessage = function(messageId) {
  this.lastMessage = messageId;
  return this.save();
};

chatSchema.methods.isMember = function(userId) {
  return this.members.some(member => 
    member.user.toString() === userId.toString()
  );
};

chatSchema.methods.getMemberRole = function(userId) {
  const member = this.members.find(member => 
    member.user.toString() === userId.toString()
  );
  return member ? member.role : null;
};

module.exports = mongoose.model('Chat', chatSchema);