@echo off
:: Кодировка UTF-8, чтобы корректно отображался русский текст в консоли
chcp 65001 > nul

echo 🚀 Запуск автоматической отправки проекта на GitHub...
echo.

:: Запуск PowerShell внутри текущей папки проекта
powershell -NoProfile -ExecutionPolicy Bypass -Command "^
    Write-Host '1️⃣ Добавление изменений в индекс Git...' -ForegroundColor Cyan;^
    git add .;^
    ^
    Write-Host '2️⃣ Создание автоматического коммита...' -ForegroundColor Cyan;^
    $date = Get-Date -Format 'yyyy-MM-dd HH:mm';^
    git commit -m \"Авто-коммит от $date\";^
    ^
    Write-Host '3️⃣ Отправка изменений на GitHub...' -ForegroundColor Cyan;^
    git push;^
    ^
    Write-Host '🎉 Все файлы успешно улетели на GitHub!' -ForegroundColor Green;^
"

echo.
echo Нажмите любую клавишу, чтобы закрыть это окно...
pause > nul