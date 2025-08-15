import React, { useState } from 'react';
import styled from 'styled-components';
import { useToasts } from 'react-toast-notifications';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../UI/LoadingSpinner';

const LoginContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: ${props => props.theme.spacing.md};
`;

const LoginCard = styled.div`
  background: ${props => props.theme.colors.background};
  border-radius: ${props => props.theme.borderRadius};
  box-shadow: ${props => props.theme.shadows.large};
  padding: ${props => props.theme.spacing.xl};
  width: 100%;
  max-width: 400px;
  text-align: center;
`;

const Logo = styled.div`
  margin-bottom: ${props => props.theme.spacing.xl};
`;

const LogoIcon = styled.div`
  width: 80px;
  height: 80px;
  background: ${props => props.theme.colors.primary};
  border-radius: 50%;
  margin: 0 auto ${props => props.theme.spacing.md};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  color: white;
  font-weight: bold;
`;

const Title = styled.h1`
  color: ${props => props.theme.colors.text};
  font-size: 28px;
  font-weight: 600;
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const Subtitle = styled.p`
  color: ${props => props.theme.colors.textSecondary};
  font-size: 16px;
  margin-bottom: ${props => props.theme.spacing.xl};
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  text-align: left;
`;

const Label = styled.label`
  color: ${props => props.theme.colors.text};
  font-size: 14px;
  font-weight: 500;
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const Input = styled.input`
  padding: ${props => props.theme.spacing.md};
  border: 2px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius};
  font-size: 16px;
  background: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.text};
  transition: border-color 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
  }
  
  &::placeholder {
    color: ${props => props.theme.colors.textSecondary};
  }
  
  &:disabled {
    background: ${props => props.theme.colors.secondary};
    cursor: not-allowed;
  }
`;

const LoginButton = styled.button`
  background: ${props => props.theme.colors.primary};
  color: white;
  border: none;
  padding: ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius};
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${props => props.theme.spacing.sm};
  
  &:hover:not(:disabled) {
    background: ${props => props.theme.colors.primaryHover};
  }
  
  &:disabled {
    background: ${props => props.theme.colors.textSecondary};
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  background: ${props => props.theme.colors.error};
  color: white;
  padding: ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius};
  font-size: 14px;
  margin-bottom: ${props => props.theme.spacing.md};
`;

const InfoBox = styled.div`
  background: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius};
  padding: ${props => props.theme.spacing.md};
  margin-top: ${props => props.theme.spacing.lg};
  text-align: left;
`;

const InfoTitle = styled.h3`
  color: ${props => props.theme.colors.text};
  font-size: 16px;
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const InfoText = styled.p`
  color: ${props => props.theme.colors.textSecondary};
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: ${props => props.theme.spacing.sm};
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const LoginPage = () => {
  const [formData, setFormData] = useState({
    login: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, error, clearError } = useAuth();
  const { addToast } = useToasts();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Очищаем ошибку при изменении полей
    if (error) {
      clearError();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.login.trim() || !formData.password.trim()) {
      addToast('Пожалуйста, заполните все поля', {
        appearance: 'error'
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await login(formData);
      
      if (result.success) {
        addToast('Вход выполнен успешно!', {
          appearance: 'success'
        });
      } else {
        addToast(result.error || 'Ошибка входа в систему', {
          appearance: 'error'
        });
      }
    } catch (err) {
      addToast('Произошла ошибка при входе в систему', {
        appearance: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LoginContainer>
      <LoginCard>
        <Logo>
          <LogoIcon>NC</LogoIcon>
          <Title>Nexus Chat</Title>
          <Subtitle>Мессенджер с интеграцией VitroCAD</Subtitle>
        </Logo>

        <Form onSubmit={handleSubmit}>
          {error && (
            <ErrorMessage>
              {error}
            </ErrorMessage>
          )}
          
          <InputGroup>
            <Label htmlFor="login">Логин VitroCAD</Label>
            <Input
              id="login"
              name="login"
              type="text"
              placeholder="Введите ваш логин"
              value={formData.login}
              onChange={handleInputChange}
              disabled={isLoading}
              autoComplete="username"
              required
            />
          </InputGroup>
          
          <InputGroup>
            <Label htmlFor="password">Пароль</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Введите ваш пароль"
              value={formData.password}
              onChange={handleInputChange}
              disabled={isLoading}
              autoComplete="current-password"
              required
            />
          </InputGroup>
          
          <LoginButton type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <LoadingSpinner size="small" />
                Вход в систему...
              </>
            ) : (
              'Войти'
            )}
          </LoginButton>
        </Form>
        
        <InfoBox>
          <InfoTitle>Информация о входе</InfoTitle>
          <InfoText>
            Используйте ваши учетные данные от VitroCAD для входа в мессенджер.
          </InfoText>
          <InfoText>
            После успешного входа вы автоматически получите доступ к чатам, 
            связанным с файлами, которые вы загружаете в VitroCAD.
          </InfoText>
          <InfoText>
            <strong>Возможности:</strong>
          </InfoText>
          <InfoText>
            • Автоматическое создание чатов при загрузке файлов<br/>
            • Добавление коллег в обсуждения<br/>
            • Обмен сообщениями в реальном времени<br/>
            • Синхронизация с вашей учетной записью VitroCAD
          </InfoText>
        </InfoBox>
      </LoginCard>
    </LoginContainer>
  );
};

export default LoginPage;