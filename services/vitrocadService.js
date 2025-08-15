const axios = require('axios');
const User = require('../models/User');

class VitroCADService {
  constructor() {
    this.baseURL = process.env.VITROCAD_BASE_URL;
    this.apiPath = process.env.VITROCAD_API_PATH || '/api';
    this.fullURL = `${this.baseURL}${this.apiPath}`;
  }

  // Аутентификация пользователя в VitroCAD
  async authenticateUser(login, password) {
    try {
      const response = await axios.post(`${this.fullURL}/security/login`, {
        login,
        password
      });

      if (response.data && response.data.token) {
        return {
          success: true,
          data: response.data
        };
      }

      return {
        success: false,
        error: 'Неверные учетные данные'
      };
    } catch (error) {
      console.error('Ошибка аутентификации VitroCAD:', error.message);
      return {
        success: false,
        error: 'Ошибка подключения к VitroCAD'
      };
    }
  }

  // Создание или обновление пользователя в локальной БД
  async createOrUpdateUser(vitrocadUserData) {
    try {
      const userData = vitrocadUserData.user;
      
      let user = await User.findOne({ vitrocadId: userData.id });
      
      if (user) {
        // Обновляем существующего пользователя
        user.name = userData.name;
        user.email = userData.email;
        user.login = userData.item.fieldValueMap.login;
        user.groupList = userData.groupList;
        user.isAdmin = userData.isAdmin;
        user.isActive = userData.isActive;
        await user.save();
      } else {
        // Создаем нового пользователя
        user = new User({
          vitrocadId: userData.id,
          name: userData.name,
          email: userData.email,
          login: userData.item.fieldValueMap.login,
          groupList: userData.groupList,
          isAdmin: userData.isAdmin,
          isActive: userData.isActive
        });
        await user.save();
      }

      return {
        success: true,
        user: user
      };
    } catch (error) {
      console.error('Ошибка создания/обновления пользователя:', error.message);
      return {
        success: false,
        error: 'Ошибка сохранения пользователя'
      };
    }
  }

  // Получение информации об элементе (файле) по ID
  async getItemById(itemId, token) {
    try {
      const response = await axios.post(`${this.fullURL}/item/get/${itemId}`, {}, {
        headers: {
          'Authorization': token
        }
      });

      if (response.data) {
        return {
          success: true,
          data: response.data
        };
      }

      return {
        success: false,
        error: 'Элемент не найден'
      };
    } catch (error) {
      console.error('Ошибка получения элемента:', error.message);
      return {
        success: false,
        error: 'Ошибка получения данных элемента'
      };
    }
  }

  // Получение списка пользователей из VitroCAD
  async getUsersList(listId, token) {
    try {
      const response = await axios.post(`${this.fullURL}/item/getList/${listId}`, {}, {
        headers: {
          'Authorization': token
        }
      });

      if (response.data) {
        return {
          success: true,
          data: response.data
        };
      }

      return {
        success: false,
        error: 'Список пользователей не найден'
      };
    } catch (error) {
      console.error('Ошибка получения списка пользователей:', error.message);
      return {
        success: false,
        error: 'Ошибка получения списка пользователей'
      };
    }
  }

  // Проверка токена VitroCAD
  async validateToken(token) {
    try {
      // Попробуем получить информацию о текущем пользователе
      const response = await axios.post(`${this.fullURL}/security/getCurrentUser`, {}, {
        headers: {
          'Authorization': token
        }
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Ошибка валидации токена:', error.message);
      return {
        success: false,
        error: 'Недействительный токен'
      };
    }
  }

  // Получение прав пользователя на элемент
  async getItemPermissions(itemId, token) {
    try {
      const response = await axios.post(`${this.fullURL}/security/getItemPermissionList/${itemId}`, {}, {
        headers: {
          'Authorization': token
        }
      });

      if (response.data) {
        return {
          success: true,
          data: response.data
        };
      }

      return {
        success: false,
        error: 'Права доступа не найдены'
      };
    } catch (error) {
      console.error('Ошибка получения прав доступа:', error.message);
      return {
        success: false,
        error: 'Ошибка получения прав доступа'
      };
    }
  }

  // Мониторинг загрузки файлов (webhook или polling)
  async monitorFileUploads(token) {
    // Этот метод будет использоваться для отслеживания новых файлов
    // Может быть реализован через webhook или периодический опрос
    try {
      // Здесь можно реализовать логику мониторинга
      // Например, получение последних загруженных файлов
      console.log('Мониторинг загрузки файлов активен');
      return {
        success: true
      };
    } catch (error) {
      console.error('Ошибка мониторинга файлов:', error.message);
      return {
        success: false,
        error: 'Ошибка мониторинга файлов'
      };
    }
  }
}

module.exports = new VitroCADService();