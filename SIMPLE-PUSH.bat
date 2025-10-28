@echo off
chcp 65001 >nul
echo ============================================
echo 🚀 Быстрый Push на GitHub
echo ============================================
echo.

REM Переходим в папку проекта
cd /d "%~dp0"

echo 📝 Добавляем файлы...
git add .

echo 💾 Коммит...
git commit -m "Update: %date% %time%"

echo 🚀 Push на GitHub...
git push

echo.
echo ✅ Готово!
echo.
pause

