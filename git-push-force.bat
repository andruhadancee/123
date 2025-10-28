@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ====================================
echo   WB Cyber Club - Force Git Push
echo ====================================
echo.

echo Добавление ВСЕХ файлов принудительно...
git add -A
git add css/style.css --force
git add index.html --force
git add teams.html --force
git add archive.html --force
git add admin.html --force
echo.

echo Создание коммита...
git commit -m "Fix: Static gradient + clickable logo"
echo.

echo Отправка на GitHub...
git push origin main
echo.

echo ====================================
echo   Готово! Проверяй через 1 минуту!
echo ====================================
pause

