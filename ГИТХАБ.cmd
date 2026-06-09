@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

echo Vowly: публикация свежих изменений на GitHub
echo.

git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 (
  echo Ошибка: папка не является Git-репозиторием.
  pause
  exit /b 1
)

git remote get-url origin >nul 2>&1
if errorlevel 1 (
  echo Ошибка: не настроен GitHub remote с именем origin.
  pause
  exit /b 1
)

git add -A
git diff --cached --quiet
if errorlevel 1 (
  git commit -m "Update Vowly"
  if errorlevel 1 (
    echo Ошибка при создании коммита.
    pause
    exit /b 1
  )
) else (
  echo Новых изменений для коммита нет.
)

git push origin HEAD
if errorlevel 1 (
  echo.
  echo Не удалось отправить изменения. Проверьте вход в GitHub и подключение к интернету.
  pause
  exit /b 1
)

echo.
echo Готово: свежие изменения опубликованы на GitHub.
pause
