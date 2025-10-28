@echo off
chcp 65001 >nul
echo ============================================
echo 🔧 Исправление Git и Push на GitHub
echo ============================================
echo.

REM Переходим в папку проекта
cd /d "%~dp0"

echo 📍 Текущая папка: %CD%
echo.

REM Удаляем старый .git если есть в домашней папке
if exist "%USERPROFILE%\.git" (
    echo ⚠️  Найден Git в домашней папке, удаляем...
    rmdir /s /q "%USERPROFILE%\.git"
    echo ✅ Очищено
    echo.
)

REM Проверяем есть ли .git в папке проекта
if not exist ".git" (
    echo 📦 Инициализируем Git в папке проекта...
    git init
    git branch -M main
    echo ✅ Git инициализирован
    echo.
) else (
    echo ✅ Git уже инициализирован в папке проекта
    echo.
)

REM Проверяем remote
git remote -v | find "origin" >nul
if errorlevel 1 (
    echo ⚠️  Remote origin не настроен!
    echo.
    echo 📝 Введите URL вашего GitHub репозитория:
    echo Пример: https://github.com/username/wb-cyber-club.git
    echo.
    set /p repo_url="URL репозитория: "
    
    if "!repo_url!"=="" (
        echo ❌ URL не указан!
        pause
        exit /b
    )
    
    git remote add origin !repo_url!
    echo ✅ Remote добавлен
    echo.
)

echo 📝 Добавляем все файлы...
git add .

echo.
echo 💾 Создаём коммит...
git commit -m "WB Cyber Club - полная версия с API и базой данных"

echo.
echo 🚀 Отправляем на GitHub...
git push -u origin main

if errorlevel 1 (
    echo.
    echo ⚠️  Пробуем с принудительным push...
    git push -u origin main --force
    
    if errorlevel 1 (
        echo.
        echo ⚠️  Не удалось на main, пробуем master...
        git push -u origin master --force
    )
)

echo.
echo ============================================
echo ✅ ГОТОВО!
echo ============================================
echo.
echo 📌 Проект загружен на GitHub!
echo.
echo Проверьте репозиторий на github.com
echo.
pause

