# 🗄️ База данных - Инструкция

## 📋 Что создано:

### Таблицы:
1. **tournaments** - турниры (активные и прошедшие)
2. **registration_links** - ссылки на формы регистрации
3. **social_links** - социальные ссылки (Twitch, Telegram, Contact)
4. **disciplines** - игровые дисциплины
5. **registered_teams** - зарегистрированные команды

---

## 🚀 Как инициализировать базу:

### Вариант 1: Автоматически (рекомендуется)

```bash
npm install
npm run db:init
```

### Вариант 2: Вручную через Neon Dashboard

1. Зайди в Neon Dashboard: https://console.neon.tech
2. Выбери свою базу `neon-green-flower`
3. SQL Editor
4. Скопируй содержимое `schema.sql`
5. Выполни запрос

---

## 🔄 Дополнительные миграции

### Добавление поля start_time (для новых функций времени):

```bash
# Выполни файл add-start-time.sql через Neon Dashboard SQL Editor
```

Или вручную:
```sql
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS start_time TIME;
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS start_time TIME;
```

---

## 🔧 Настройка Vercel

Переменные УЖЕ добавлены автоматически при подключении базы!

Проверь в Vercel:
- Settings → Environment Variables

Должны быть:
```
POSTGRES_URL
POSTGRES_USER
POSTGRES_HOST
POSTGRES_PASSWORD
POSTGRES_DATABASE
```

---

## 📊 Структура базы:

### tournaments
- id, title, discipline, date, prize
- teams, max_teams, registration_link, custom_link
- status ('active' | 'finished'), winner
- start_time TIME - время начала по МСК
- watch_url - ссылка на трансляцию
- created_at, updated_at

### registration_links
- id, discipline, link
- created_at, updated_at

### social_links
- id, platform, link
- created_at, updated_at

### disciplines
- id, name, created_at

### registered_teams
- id, tournament_id, name, captain
- players, registration_date
- created_at

---

## ✅ Проверка

После инициализации в базе будут:
- ✅ 5 дефолтных дисциплин
- ✅ Все таблицы созданы
- ✅ Индексы настроены

