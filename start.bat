@echo off
echo ========================================
echo    Nexus Chat - Установка и запуск
echo ========================================
echo.

:: Проверка наличия Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ОШИБКА: Node.js не установлен!
    echo Пожалуйста, установите Node.js с https://nodejs.org/
    pause
    exit /b 1
)

:: Проверка наличия MongoDB
echo Проверка MongoDB...
mongod --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ПРЕДУПРЕЖДЕНИЕ: MongoDB не найден в PATH
    echo Убедитесь, что MongoDB запущен на localhost:27017
    echo.
)

:: Установка серверных зависимостей
echo Установка серверных зависимостей...
npm install
if %errorlevel% neq 0 (
    echo ОШИБКА: Не удалось установить серверные зависимости
    pause
    exit /b 1
)

:: Установка клиентских зависимостей
echo.
echo Установка клиентских зависимостей...
cd client
npm install
if %errorlevel% neq 0 (
    echo ОШИБКА: Не удалось установить клиентские зависимости
    pause
    exit /b 1
)
cd ..

:: Проверка файла .env
if not exist ".env" (
    echo.
    echo ВНИМАНИЕ: Файл .env не найден!
    echo Создайте файл .env на основе .env.example
    echo и настройте параметры подключения к VitroCAD
    echo.
    pause
)

:: Запуск приложения
echo.
echo ========================================
echo       Запуск Nexus Chat
echo ========================================
echo.
echo Сервер будет доступен по адресу: http://localhost:5000
echo Клиент будет доступен по адресу: http://localhost:3000
echo.
echo Для остановки нажмите Ctrl+C
echo.

:: Запуск в режиме разработки
start "Nexus Chat Client" cmd /k "cd client && npm start"
start "Nexus Chat Server" cmd /k "npm run dev"

echo Приложение запущено!
echo Откройте браузер и перейдите по адресу http://localhost:3000
pause