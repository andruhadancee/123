@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ====================================
echo   FORCE UPDATE - Принудительное обновление
echo ====================================
echo.

echo Удаление старых git индексов...
git rm --cached -r .
echo.

echo Добавление всех файлов заново...
git add .
echo.

echo Коммит...
git commit -m "FORCE: Remove animation, fix logo link"
echo.

echo Push...
git push origin main --force
echo.

echo ====================================
echo   ГОТОВО! Подожди 1 минуту!
echo ====================================
pause

