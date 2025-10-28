@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ====================================
echo   WB Cyber Club - Git Push
echo ====================================
echo.

REM Проверяем, инициализирован ли Git
if not exist ".git" (
    echo Инициализация Git репозитория...
    git init
    echo Добавление remote origin...
    git remote add origin https://github.com/andruhadancee/wb-cyber-club.git
    git branch -M main
    echo.
)

echo Добавление файлов...
git add .
echo.

set "commit_msg="
set /p commit_msg="Введите комментарий к коммиту (или нажмите Enter для 'Update'): "
if not defined commit_msg set commit_msg=Update

echo Создание коммита: %commit_msg%
git commit -m "%commit_msg%"
echo.

echo Отправка на GitHub...
git push -u origin main --force
echo.

echo ====================================
echo   Готово! Сайт обновится на Netlify через 30-60 сек
echo ====================================
pause

