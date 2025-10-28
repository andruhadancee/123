@echo off
chcp 65001 >nul
echo ============================================
echo 🚀 Push на GitHub - WB Cyber Club
echo ============================================
echo.

REM Проверка, инициализирован ли Git
if not exist .git (
    echo 📦 Git не инициализирован. Инициализируем...
    git init
    echo ✅ Git инициализирован
    echo.
)

REM Проверка, есть ли remote origin
git remote -v | find "origin" >nul
if errorlevel 1 (
    echo ⚠️  Remote origin не настроен!
    echo.
    echo Пожалуйста, создайте репозиторий на GitHub.com
    echo Затем выполните:
    echo git remote add origin https://github.com/ВАШ_USERNAME/ВАШ_РЕПОЗИТОРИЙ.git
    echo.
    pause
    exit /b
)

echo 📝 Добавляем все файлы...
git add .

echo.
echo 💬 Введите сообщение коммита (или нажмите Enter для дефолтного):
set /p commit_msg="Сообщение: "

if "%commit_msg%"=="" (
    set commit_msg=Update: WB Cyber Club - готов к деплою
)

echo.
echo 💾 Создаём коммит: "%commit_msg%"
git commit -m "%commit_msg%"

echo.
echo 🚀 Отправляем на GitHub...
git push -u origin main

if errorlevel 1 (
    echo.
    echo ⚠️  Не удалось отправить на main, пробуем master...
    git push -u origin master
)

echo.
echo ✅ Готово! Код отправлен на GitHub!
echo.
echo 📌 Следующий шаг: Деплой на Vercel
echo    Смотри инструкцию в DEPLOY_TO_VERCEL.md
echo.
pause

