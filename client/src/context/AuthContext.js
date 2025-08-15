import React, { createContext, useContext, useReducer, useEffect } from 'react';
import authService from '../services/authService';

// Начальное состояние
const initialState = {
  user: null,
  token: null,
  vitrocadToken: null,
  loading: true,
  error: null,
  theme: 'light'
};

// Типы действий
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  SET_LOADING: 'SET_LOADING',
  SET_USER: 'SET_USER',
  SET_THEME: 'SET_THEME',
  CLEAR_ERROR: 'CLEAR_ERROR',
  UPDATE_USER_SETTINGS: 'UPDATE_USER_SETTINGS',
  UPDATE_USER_STATUS: 'UPDATE_USER_STATUS'
};

// Редьюсер для управления состоянием
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
      return {
        ...state,
        loading: true,
        error: null
      };
    
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        vitrocadToken: action.payload.vitrocadToken,
        loading: false,
        error: null,
        theme: action.payload.user.settings?.theme || 'light'
      };
    
    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        vitrocadToken: null,
        loading: false,
        error: action.payload
      };
    
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...initialState,
        loading: false
      };
    
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };
    
    case AUTH_ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload,
        loading: false
      };
    
    case AUTH_ACTIONS.SET_THEME:
      return {
        ...state,
        theme: action.payload
      };
    
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
    
    case AUTH_ACTIONS.UPDATE_USER_SETTINGS:
      return {
        ...state,
        user: {
          ...state.user,
          settings: {
            ...state.user.settings,
            ...action.payload
          }
        },
        theme: action.payload.theme || state.theme
      };
    
    case AUTH_ACTIONS.UPDATE_USER_STATUS:
      return {
        ...state,
        user: {
          ...state.user,
          status: action.payload.status,
          lastSeen: action.payload.lastSeen
        }
      };
    
    default:
      return state;
  }
};

// Создание контекста
const AuthContext = createContext();

// Провайдер контекста
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Проверка токена при загрузке приложения
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('nexus_token');
        const vitrocadToken = localStorage.getItem('vitrocad_token');
        
        if (token) {
          // Устанавливаем токен в сервис
          authService.setToken(token);
          
          // Получаем информацию о пользователе
          const response = await authService.getCurrentUser();
          
          if (response.success) {
            dispatch({
              type: AUTH_ACTIONS.LOGIN_SUCCESS,
              payload: {
                user: response.user,
                token,
                vitrocadToken
              }
            });
          } else {
            // Токен недействителен
            localStorage.removeItem('nexus_token');
            localStorage.removeItem('vitrocad_token');
            dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
          }
        } else {
          dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
        }
      } catch (error) {
        console.error('Ошибка инициализации аутентификации:', error);
        localStorage.removeItem('nexus_token');
        localStorage.removeItem('vitrocad_token');
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      }
    };

    initializeAuth();
  }, []);

  // Функция входа
  const login = async (credentials) => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });
      
      const response = await authService.login(credentials);
      
      if (response.success) {
        // Сохраняем токены
        localStorage.setItem('nexus_token', response.token);
        localStorage.setItem('vitrocad_token', response.vitrocadToken);
        
        // Устанавливаем токен в сервис
        authService.setToken(response.token);
        
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: {
            user: response.user,
            token: response.token,
            vitrocadToken: response.vitrocadToken
          }
        });
        
        return { success: true };
      } else {
        dispatch({
          type: AUTH_ACTIONS.LOGIN_FAILURE,
          payload: response.error
        });
        return { success: false, error: response.error };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Ошибка входа в систему';
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: errorMessage
      });
      return { success: false, error: errorMessage };
    }
  };

  // Функция выхода
  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Ошибка при выходе:', error);
    } finally {
      // Очищаем локальное хранилище
      localStorage.removeItem('nexus_token');
      localStorage.removeItem('vitrocad_token');
      
      // Очищаем токен в сервисе
      authService.setToken(null);
      
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  // Обновление настроек пользователя
  const updateUserSettings = async (settings) => {
    try {
      const response = await authService.updateSettings(settings);
      
      if (response.success) {
        dispatch({
          type: AUTH_ACTIONS.UPDATE_USER_SETTINGS,
          payload: response.settings
        });
        return { success: true };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Ошибка обновления настроек';
      return { success: false, error: errorMessage };
    }
  };

  // Обновление статуса пользователя
  const updateUserStatus = async (status) => {
    try {
      const response = await authService.updateStatus(status);
      
      if (response.success) {
        dispatch({
          type: AUTH_ACTIONS.UPDATE_USER_STATUS,
          payload: {
            status: response.status,
            lastSeen: response.lastSeen
          }
        });
        return { success: true };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Ошибка обновления статуса';
      return { success: false, error: errorMessage };
    }
  };

  // Смена темы
  const setTheme = (theme) => {
    dispatch({ type: AUTH_ACTIONS.SET_THEME, payload: theme });
    // Сохраняем тему в настройках пользователя
    if (state.user) {
      updateUserSettings({ theme });
    }
  };

  // Очистка ошибки
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Проверка токена VitroCAD
  const validateVitroCADToken = async () => {
    try {
      if (!state.vitrocadToken) {
        return { valid: false, error: 'Токен VitroCAD отсутствует' };
      }
      
      const response = await authService.validateVitroCADToken(state.vitrocadToken);
      return response;
    } catch (error) {
      return { valid: false, error: 'Ошибка проверки токена VitroCAD' };
    }
  };

  // Значение контекста
  const value = {
    // Состояние
    user: state.user,
    token: state.token,
    vitrocadToken: state.vitrocadToken,
    loading: state.loading,
    error: state.error,
    theme: state.theme,
    
    // Функции
    login,
    logout,
    updateUserSettings,
    updateUserStatus,
    setTheme,
    clearError,
    validateVitroCADToken,
    
    // Вспомогательные функции
    isAuthenticated: !!state.user,
    isAdmin: state.user?.isAdmin || false
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Хук для использования контекста
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth должен использоваться внутри AuthProvider');
  }
  
  return context;
};

export default AuthContext;