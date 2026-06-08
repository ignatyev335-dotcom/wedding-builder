# Vowly Wedding Builder

Mobile-first конструктор свадебных сайтов на Next.js, Prisma и SQLite.

## Структура

```text
prisma/                 схема и локальная база SQLite
src/app/                страницы и API Next.js App Router
src/entities/           доменные типы
src/features/           продуктовые сценарии
src/lib/                инфраструктурные клиенты
```

## Запуск

```powershell
npm install
npm run db:push
npm run dev
```

Если на Windows отладчик Next.js падает внутри `segmentExplorerNodeAdd`,
очистите кэш и запустите стабильный режим без DevTools:

```powershell
Remove-Item -Recurse -Force .next
npm run dev:stable
```

Проблема особенно воспроизводима, когда абсолютный путь проекта содержит
кириллицу. Для полноценного hot reload также подойдет копия проекта в пути
только с латинскими символами, например `C:\projects\wedding-builder`.

Команда `npm run db:push` создает автономную базу `prisma/dev.db`. Пароли,
PostgreSQL и отдельный сервер базы данных не требуются.

Основной сценарий:

```text
/quiz → POST /api/wedding-sites → /constructor?siteId=...
```

API одной транзакцией создает пользователя, свадебный сайт, контент и модули,
после чего возвращает `{ id, slug }`.
