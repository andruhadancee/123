# Скрипт для подготовки проекта к загрузке на GitHub
$ErrorActionPreference = "Stop"

# Получаем путь к текущему скрипту и переходим в эту директорию
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

Write-Host "Текущая директория: $(Get-Location)" -ForegroundColor Green

# Проверяем статус Git
Write-Host "`nПроверка статуса Git..." -ForegroundColor Yellow
git status --short

# Проверяем удаленный репозиторий
Write-Host "`nПроверка удаленного репозитория..." -ForegroundColor Yellow
$remote = git remote get-url origin 2>$null
if ($remote) {
    Write-Host "Найден удаленный репозиторий: $remote" -ForegroundColor Green
} else {
    Write-Host "Удаленный репозиторий не настроен" -ForegroundColor Yellow
}

Write-Host "`nДля настройки удаленного репозитория используйте:" -ForegroundColor Cyan
Write-Host "git remote add origin <URL_РЕПОЗИТОРИЯ>" -ForegroundColor White
Write-Host "`nИли если репозиторий уже существует:" -ForegroundColor Cyan
Write-Host "git remote set-url origin <URL_РЕПОЗИТОРИЯ>" -ForegroundColor White

