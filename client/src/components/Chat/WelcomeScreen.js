import React from 'react';
import styled from 'styled-components';
import { FiMenu, FiMessageCircle, FiFile, FiUsers, FiZap } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

const WelcomeContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: ${props => props.theme.colors.background};
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  padding: ${props => props.theme.spacing.md};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  background: ${props => props.theme.colors.surface};
  
  @media (min-width: 769px) {
    display: none;
  }
`;

const MenuButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.colors.text};
  font-size: 20px;
  cursor: pointer;
  padding: ${props => props.theme.spacing.xs};
  border-radius: ${props => props.theme.borderRadius};
  transition: background-color 0.2s ease;
  
  &:hover {
    background: ${props => props.theme.colors.secondary};
  }
`;

const HeaderTitle = styled.h2`
  margin: 0;
  margin-left: ${props => props.theme.spacing.md};
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
`;

const Content = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${props => props.theme.spacing.xl};
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
`;

const Logo = styled.div`
  width: 120px;
  height: 120px;
  background: linear-gradient(135deg, ${props => props.theme.colors.primary}, ${props => props.theme.colors.primaryHover});
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  color: white;
  font-weight: bold;
  margin-bottom: ${props => props.theme.spacing.xl};
  box-shadow: ${props => props.theme.shadows.large};
`;

const WelcomeTitle = styled.h1`
  font-size: 32px;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
  margin: 0 0 ${props => props.theme.spacing.md} 0;
  
  @media (max-width: 768px) {
    font-size: 28px;
  }
`;

const WelcomeSubtitle = styled.p`
  font-size: 18px;
  color: ${props => props.theme.colors.textSecondary};
  margin: 0 0 ${props => props.theme.spacing.xl} 0;
  line-height: 1.6;
  
  @media (max-width: 768px) {
    font-size: 16px;
  }
`;

const UserGreeting = styled.div`
  background: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius};
  padding: ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.xl};
  width: 100%;
  max-width: 400px;
`;

const GreetingText = styled.p`
  font-size: 16px;
  color: ${props => props.theme.colors.text};
  margin: 0 0 ${props => props.theme.spacing.sm} 0;
`;

const UserName = styled.span`
  font-weight: 600;
  color: ${props => props.theme.colors.primary};
`;

const UserEmail = styled.p`
  font-size: 14px;
  color: ${props => props.theme.colors.textSecondary};
  margin: 0;
`;

const FeaturesList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: ${props => props.theme.spacing.lg};
  width: 100%;
  margin-bottom: ${props => props.theme.spacing.xl};
`;

const FeatureCard = styled.div`
  background: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius};
  padding: ${props => props.theme.spacing.lg};
  text-align: center;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => props.theme.shadows.medium};
    border-color: ${props => props.theme.colors.primary};
  }
`;

const FeatureIcon = styled.div`
  width: 60px;
  height: 60px;
  background: ${props => props.theme.colors.primary}15;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: ${props => props.theme.colors.primary};
  margin: 0 auto ${props => props.theme.spacing.md};
`;

const FeatureTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  margin: 0 0 ${props => props.theme.spacing.sm} 0;
`;

const FeatureDescription = styled.p`
  font-size: 14px;
  color: ${props => props.theme.colors.textSecondary};
  margin: 0;
  line-height: 1.5;
`;

const InstructionBox = styled.div`
  background: ${props => props.theme.colors.primary}10;
  border: 1px solid ${props => props.theme.colors.primary}30;
  border-radius: ${props => props.theme.borderRadius};
  padding: ${props => props.theme.spacing.lg};
  width: 100%;
  max-width: 500px;
`;

const InstructionTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.theme.colors.primary};
  margin: 0 0 ${props => props.theme.spacing.md} 0;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const InstructionText = styled.p`
  font-size: 14px;
  color: ${props => props.theme.colors.text};
  margin: 0;
  line-height: 1.6;
`;

const WelcomeScreen = ({ onToggleSidebar, isMobile }) => {
  const { user } = useAuth();

  const features = [
    {
      icon: <FiFile />,
      title: 'Автоматические чаты',
      description: 'Чаты создаются автоматически при загрузке файлов в VitroCAD'
    },
    {
      icon: <FiUsers />,
      title: 'Командная работа',
      description: 'Добавляйте коллег в обсуждения и работайте вместе над проектами'
    },
    {
      icon: <FiZap />,
      title: 'Мгновенные сообщения',
      description: 'Обменивайтесь сообщениями в реальном времени'
    },
    {
      icon: <FiMessageCircle />,
      title: 'Интеграция с VitroCAD',
      description: 'Полная синхронизация с вашей учетной записью VitroCAD'
    }
  ];

  return (
    <WelcomeContainer>
      {isMobile && (
        <Header>
          <MenuButton onClick={onToggleSidebar}>
            <FiMenu />
          </MenuButton>
          <HeaderTitle>Добро пожаловать</HeaderTitle>
        </Header>
      )}
      
      <Content>
        <Logo>NC</Logo>
        
        <WelcomeTitle>Добро пожаловать в Nexus Chat!</WelcomeTitle>
        
        <WelcomeSubtitle>
          Современный мессенджер для командной работы с интеграцией VitroCAD
        </WelcomeSubtitle>
        
        {user && (
          <UserGreeting>
            <GreetingText>
              Привет, <UserName>{user.name}</UserName>!
            </GreetingText>
            <UserEmail>{user.email}</UserEmail>
          </UserGreeting>
        )}
        
        <FeaturesList>
          {features.map((feature, index) => (
            <FeatureCard key={index}>
              <FeatureIcon>
                {feature.icon}
              </FeatureIcon>
              <FeatureTitle>{feature.title}</FeatureTitle>
              <FeatureDescription>{feature.description}</FeatureDescription>
            </FeatureCard>
          ))}
        </FeaturesList>
        
        <InstructionBox>
          <InstructionTitle>
            <FiZap />
            Как начать?
          </InstructionTitle>
          <InstructionText>
            Загрузите файл в VitroCAD, и для него автоматически создастся чат. 
            Вы также можете найти коллег через поиск и начать общение.
          </InstructionText>
        </InstructionBox>
      </Content>
    </WelcomeContainer>
  );
};

export default WelcomeScreen;