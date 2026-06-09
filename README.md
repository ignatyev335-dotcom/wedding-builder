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

На Windows команда `npm run dev` по умолчанию запускает стабильный локальный
режим без Next.js DevTools. Он использует отдельный кэш `.next-stable`, поэтому
ошибка `segmentExplorerNodeAdd` не влияет на приложение:

```powershell
npm run dev
```

Экспериментальный режим с hot reload доступен командой `npm run dev:hot`, но
Next.js 16.2.7 может ронять в нем внутренний Segment Explorer на Windows.

Команда `npm run db:push` создает автономную базу `prisma/dev.db`. Пароли,
PostgreSQL и отдельный сервер базы данных не требуются.

Основной сценарий:

```text
/quiz → POST /api/wedding-sites → /constructor?siteId=...
```

API одной транзакцией создает пользователя, свадебный сайт, контент и модули,
после чего возвращает `{ id, slug }`.
