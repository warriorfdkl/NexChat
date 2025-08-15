import axios from 'axios';

class AuthService {
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
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
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
        // Если токен недействителен, очищаем локальное хранилище
        if (error.response?.status === 401) {
          this.clearTokens();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }
  
  // Установка токена
  setToken(token) {
    this.token = token;
  }
  
  // Очистка токенов
  clearTokens() {
    this.token = null;
    localStorage.removeItem('nexus_token');
    localStorage.removeItem('vitrocad_token');
  }
  
  // Вход в систему
  async login(credentials) {
    try {
      const response = await this.api.post('/auth/login', credentials);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
  
  // Выход из системы
  async logout() {
    try {
      await this.api.post('/auth/logout');
      return { success: true };
    } catch (error) {
      console.error('Ошибка при выходе:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Получение информации о текущем пользователе
  async getCurrentUser() {
    try {
      const response = await this.api.get('/auth/me');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
  
  // Обновление настроек пользователя
  async updateSettings(settings) {
    try {
      const response = await this.api.put('/auth/settings', settings);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
  
  // Обновление статуса пользователя
  async updateStatus(status) {
    try {
      const response = await this.api.put('/auth/status', { status });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
  
  // Проверка токена VitroCAD
  async validateVitroCADToken(vitrocadToken) {
    try {
      const response = await this.api.post('/auth/validate-vitrocad-token', {
        vitrocadToken
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
  
  // Получение списка пользователей из VitroCAD
  async getVitroCADUsers(listId) {
    try {
      const response = await this.api.get(`/vitrocad/users/${listId}`);
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
}

// Создаем единственный экземпляр сервиса
const authService = new AuthService();

export default authService;