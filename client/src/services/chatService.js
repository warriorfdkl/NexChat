import axios from 'axios';

class ChatService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || '/api';
    this.token = null;
    
    // Настройка axios
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Интерцептор для добавления токена к запросам
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('nexus_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
    
    // Интерцептор для обработки ответов
    this.api.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        // Если токен недействителен, перенаправляем на страницу входа
        if (error.response?.status === 401) {
          localStorage.removeItem('nexus_token');
          localStorage.removeItem('vitrocad_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }
  
  // Получение списка чатов
  async getChats() {
    try {
      const response = await this.api.get('/chat/list');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
  
  // Получение информации о чате
  async getChat(chatId) {
    try {
      const response = await this.api.get(`/chat/${chatId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
  
  // Создание чата для файла
  async createFileChat(fileData) {
    try {
      const response = await this.api.post('/chat/create-file-chat', fileData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
  
  // Получение сообщений чата
  async getMessages(chatId, page = 1, limit = 50) {
    try {
      const response = await this.api.get(`/chat/${chatId}/messages`, {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
  
  // Отметка сообщений как прочитанных
  async markAsRead(chatId) {
    try {
      const response = await this.api.post(`/chat/${chatId}/mark-read`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
  
  // Добавление участника в чат
  async addMember(chatId, userId) {
    try {
      const response = await this.api.post(`/chat/${chatId}/add-member`, {
        userId
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
  
  // Удаление участника из чата
  async removeMember(chatId, userId) {
    try {
      const response = await this.api.post(`/chat/${chatId}/remove-member`, {
        userId
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
  
  // Поиск пользователей
  async searchUsers(query, limit = 10) {
    try {
      const response = await this.api.get('/vitrocad/search-users', {
        params: { query, limit }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
  
  // Получение пользователей из VitroCAD
  async getVitroCADUsers(listId) {
    try {
      const response = await this.api.get(`/vitrocad/users/${listId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
  
  // Синхронизация пользователя с VitroCAD
  async syncVitroCADUser(vitrocadUserId) {
    try {
      const response = await this.api.post('/vitrocad/sync-user', {
        vitrocadUserId
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
  
  // Получение информации о файле из VitroCAD
  async getVitroCADFile(fileId) {
    try {
      const response = await this.api.get(`/vitrocad/file/${fileId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
  
  // Получение прав доступа к файлу
  async getFilePermissions(fileId) {
    try {
      const response = await this.api.get(`/vitrocad/file/${fileId}/permissions`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
  
  // Загрузка файла
  async uploadFile(chatId, file, onProgress = null) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('chatId', chatId);
      
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      };
      
      if (onProgress) {
        config.onUploadProgress = (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        };
      }
      
      const response = await this.api.post('/chat/upload-file', formData, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
  
  // Скачивание файла
  async downloadFile(fileId, fileName) {
    try {
      const response = await this.api.get(`/chat/download-file/${fileId}`, {
        responseType: 'blob'
      });
      
      // Создаем ссылку для скачивания
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      throw error;
    }
  }
  
  // Редактирование сообщения
  async editMessage(messageId, newContent) {
    try {
      const response = await this.api.put(`/chat/message/${messageId}`, {
        content: newContent
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
  
  // Удаление сообщения
  async deleteMessage(messageId) {
    try {
      const response = await this.api.delete(`/chat/message/${messageId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
  
  // Поиск сообщений в чате
  async searchMessages(chatId, query, page = 1, limit = 20) {
    try {
      const response = await this.api.get(`/chat/${chatId}/search`, {
        params: { query, page, limit }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
  
  // Получение статистики чата
  async getChatStats(chatId) {
    try {
      const response = await this.api.get(`/chat/${chatId}/stats`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
  
  // Экспорт чата
  async exportChat(chatId, format = 'json') {
    try {
      const response = await this.api.get(`/chat/${chatId}/export`, {
        params: { format },
        responseType: 'blob'
      });
      
      // Создаем ссылку для скачивания
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `chat_export_${chatId}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      throw error;
    }
  }
  
  // Получение истории активности
  async getActivityHistory(chatId, page = 1, limit = 20) {
    try {
      const response = await this.api.get(`/chat/${chatId}/activity`, {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
  
  // Настройки чата
  async updateChatSettings(chatId, settings) {
    try {
      const response = await this.api.put(`/chat/${chatId}/settings`, settings);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
  
  // Архивирование чата
  async archiveChat(chatId) {
    try {
      const response = await this.api.post(`/chat/${chatId}/archive`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
  
  // Разархивирование чата
  async unarchiveChat(chatId) {
    try {
      const response = await this.api.post(`/chat/${chatId}/unarchive`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
  
  // Закрепление сообщения
  async pinMessage(messageId) {
    try {
      const response = await this.api.post(`/chat/message/${messageId}/pin`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
  
  // Открепление сообщения
  async unpinMessage(messageId) {
    try {
      const response = await this.api.post(`/chat/message/${messageId}/unpin`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
  
  // Получение закрепленных сообщений
  async getPinnedMessages(chatId) {
    try {
      const response = await this.api.get(`/chat/${chatId}/pinned`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
  
  // Создание опроса
  async createPoll(chatId, question, options, settings = {}) {
    try {
      const response = await this.api.post(`/chat/${chatId}/poll`, {
        question,
        options,
        settings
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
  
  // Голосование в опросе
  async votePoll(pollId, optionId) {
    try {
      const response = await this.api.post(`/chat/poll/${pollId}/vote`, {
        optionId
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

// Создаем единственный экземпляр сервиса
const chatService = new ChatService();

export default chatService;