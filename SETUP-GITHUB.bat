@echo off
chcp 65001 >nul
echo ============================================
echo 📦 Настройка GitHub - WB Cyber Club
echo ============================================
echo.

REM Инициализация Git
if not exist .git (
    echo 🔧 Инициализируем Git...
    git init
    git branch -M main
    echo ✅ Git инициализирован (ветка: main)
    echo.
) else (
    echo ✅ Git уже инициализирован
    echo.
)

REM Запрос URL репозитория
echo 📝 Введите URL вашего GitHub репозитория
echo Пример: https://github.com/username/repository.git
echo.
set /p repo_url="URL репозитория: "

if "%repo_url%"=="" (
    echo ❌ URL не указан!
    pause
    exit /b
)

REM Проверка, есть ли уже remote origin
git remote -v | find "origin" >nul
if errorlevel 1 (
    echo 🔗 Добавляем remote origin...
    git remote add origin %repo_url%
    echo ✅ Remote origin добавлен
) else (
    echo ⚠️  Remote origin уже существует, обновляем...
    git remote remove origin
    git remote add origin %repo_url%
    echo ✅ Remote origin обновлён
)

echo.
echo 📝 Добавляем все файлы...
git add .

echo.
echo 💾 Создаём первый коммит...
git commit -m "Initial commit: WB Cyber Club with API and Database"

echo.
echo 🚀 Отправляем на GitHub...
git push -u origin main

if errorlevel 1 (
    echo.
    echo ⚠️  Возможно нужна авторизация в GitHub
    echo Или ветка называется master, пробуем...
    git push -u origin master
)

echo.
echo ============================================
echo ✅ ГОТОВО! Проект на GitHub!
echo ============================================
echo.
echo 📌 Следующие шаги:
echo 1. Проверьте репозиторий на github.com
echo 2. Переходите к деплою на Vercel
echo 3. Смотрите инструкцию: DEPLOY_TO_VERCEL.md
echo.
pause

