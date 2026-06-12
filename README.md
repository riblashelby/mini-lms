# 📚 mini-LMS — Онлайн-школа

Минималистичная система управления обучением для 2–4 учеников.
Стек: React + Vite + TypeScript + Supabase + GitHub Pages.

---

## 🏗 Архитектура

```
┌─────────────────────────────────────────────────────┐
│                   GitHub Pages                       │
│   React SPA (Vite + TypeScript)                     │
│   ┌──────────┐  ┌──────────────┐  ┌──────────────┐ │
│   │ LoginPage│  │ StudentDash  │  │ AdminDash    │ │
│   └──────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────┬───────────────────────────────┘
                      │ supabase-js (HTTPS)
┌─────────────────────▼───────────────────────────────┐
│                   Supabase                           │
│  ┌────────────────────────────────────────────────┐ │
│  │ PostgreSQL                                     │ │
│  │  users: id, name, role, access_code,           │ │
│  │         penalty_days                           │ │
│  │  lessons: id, student_id, title, video_url,    │ │
│  │           description, available_from          │ │
│  │  submissions: id, lesson_id, student_id,       │ │
│  │              student_name, file_url,           │ │
│  │              uploaded_at                       │ │
│  └────────────────────────────────────────────────┘ │
│  ┌────────────────┐                                 │
│  │ Storage bucket │  homework/ (public, 10MB limit) │
│  │ student_id/    │                                 │
│  │   lesson_id/   │                                 │
│  │     file.jpg   │                                 │
│  └────────────────┘                                 │
└─────────────────────────────────────────────────────┘
```

### Схема ролей

| Роль    | Что видит / делает                                              |
|---------|-----------------------------------------------------------------|
| student | Свои уроки (только доступные сегодня), загружает ДЗ            |
| admin   | Все уроки всех учеников, добавляет/удаляет, управляет штрафами |

### Авторизация

Используется **код доступа** (короткая фраза) без Supabase Auth.
Фраза хранится только в таблице `users` — на фронтенде её нет.

> **Безопасность MVP vs продакшн:**
> В MVP коды хранятся как plain text в базе. Это достаточно для школы на 4 ученика.
> Для повышения безопасности можно захэшировать коды через `pgcrypto` или перейти на
> Supabase Auth (email + пароль). Инструкция по миграции — в конце документа.

---

## 📦 Структура проекта

```
mini-lms/
├── src/
│   ├── components/
│   │   ├── Navbar.tsx           # Шапка с именем пользователя
│   │   ├── UploadHomework.tsx   # Компонент загрузки файла
│   │   └── AddLessonModal.tsx   # Модалка создания урока (админ)
│   ├── lib/
│   │   ├── supabase.ts          # Клиент Supabase
│   │   ├── auth.tsx             # AuthContext, login/logout
│   │   ├── lessons.ts           # CRUD уроков
│   │   ├── submissions.ts       # Загрузка ДЗ, валидация файлов
│   │   └── users.ts             # Список учеников, штрафные дни
│   ├── pages/
│   │   ├── LoginPage.tsx        # Страница входа
│   │   ├── StudentDashboard.tsx # Дашборд ученика
│   │   └── AdminDashboard.tsx   # Дашборд администратора
│   ├── types/index.ts           # TypeScript типы
│   ├── App.tsx                  # Роутер
│   ├── main.tsx                 # Точка входа
│   └── index.css                # Глобальные стили
├── public/
│   └── 404.html                 # SPA-редирект для GitHub Pages
├── .github/
│   └── workflows/deploy.yml     # Авто-деплой на пуш в main
├── supabase_schema.sql          # SQL схема (запустить один раз)
├── .env.example                 # Шаблон переменных окружения
├── vite.config.ts
└── package.json
```

---

## 🗄 Структура таблиц

### `users`
| Поле          | Тип        | Описание                          |
|---------------|------------|-----------------------------------|
| id            | UUID PK    | Уникальный ID                     |
| name          | TEXT       | Имя (Иван, Мария)                 |
| role          | TEXT       | 'admin' или 'student'             |
| access_code   | TEXT UNIQUE| Фраза для входа (только в DB)     |
| penalty_days  | INT        | Счётчик пропущенных дней          |
| created_at    | TIMESTAMPTZ| Дата создания                     |

### `lessons`
| Поле           | Тип     | Описание                          |
|----------------|---------|-----------------------------------|
| id             | UUID PK | Уникальный ID                     |
| student_id     | UUID FK | Ссылка на users.id                |
| title          | TEXT    | Название урока                    |
| video_url      | TEXT    | Ссылка на видео                   |
| description    | TEXT    | Описание задания (опционально)    |
| available_from | DATE    | С какой даты урок виден ученику   |
| created_at     | TIMESTAMPTZ| Дата создания                  |

### `submissions`
| Поле          | Тип        | Описание                          |
|---------------|------------|-----------------------------------|
| id            | UUID PK    | Уникальный ID                     |
| lesson_id     | UUID FK    | Ссылка на lessons.id              |
| student_id    | UUID FK    | Ссылка на users.id                |
| student_name  | TEXT       | Имя (денормализовано для скорости)|
| file_url      | TEXT       | Публичный URL в Supabase Storage  |
| uploaded_at   | TIMESTAMPTZ| Время загрузки                    |

---

## ⚙️ Переменные окружения

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

Оба значения берутся в Supabase → Project Settings → API.

- **VITE_SUPABASE_URL** — безопасно выносить в публичный код
- **VITE_SUPABASE_ANON_KEY** — это публичный anon ключ (не service_role!), тоже безопасен
- Секреты учеников хранятся только в таблице `users` в базе данных

---

## 🚀 Запуск локально

### 1. Клонировать репозиторий

```bash
git clone https://github.com/your-username/mini-lms.git
cd mini-lms
npm install
```

### 2. Настроить Supabase

1. Зайди на [supabase.com](https://supabase.com) → Create new project
2. Подожди пока проект поднимется (~2 мин)
3. Перейди в **SQL Editor** → **New query**
4. Вставь содержимое файла `supabase_schema.sql` и нажми **Run**
5. Перейди в **Settings → API**, скопируй:
   - Project URL
   - anon public key

### 3. Создать `.env`

```bash
cp .env.example .env
```

Заполни значениями из Supabase:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Запустить

```bash
npm run dev
```

Открой [http://localhost:5173/mini-lms/](http://localhost:5173/mini-lms/)

Тестовые коды из схемы:
- Ученик: `рыжая-лиса-прыгает`
- Ученица: `синяя-волна-123`
- Админ: `admin-secret-2024`

---

## 🌐 Деплой на GitHub Pages

### Автоматический (рекомендуется)

1. Создай репозиторий на GitHub с именем `mini-lms` (или своим)
2. Обнови `base` в `vite.config.ts` — замени `'mini-lms'` на имя своего репозитория
3. Добавь секреты в GitHub: **Settings → Secrets and variables → Actions**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Включи GitHub Pages: **Settings → Pages → Source: GitHub Actions**
5. Запушь в ветку `main`:

```bash
git remote add origin https://github.com/your-username/mini-lms.git
git branch -M main
git push -u origin main
```

Деплой запустится автоматически. Через 1–2 минуты сайт будет доступен по адресу:
`https://your-username.github.io/mini-lms/`

### Ручной деплой

```bash
npm install -g gh-pages
npm run build
npx gh-pages -d dist
```

---

## 🔧 Что можно упростить в v1

### Оставь как есть (не трогай):
- RLS на уровне Supabase — защита от прямых запросов в обход фронтенда
- Разделение ролей admin/student
- Проверка типов файлов и размера на клиенте
- Хранение кодов только в базе, не в коде

### Можно упростить/отложить:
- **Штрафные дни** — логика автопроверки вчерашнего дня упрощена намеренно.
  Если нужна точность — перенеси в Supabase Edge Function по расписанию (cron).
- **Пагинация** — при 4 учениках не нужна
- **Email-уведомления** — добавь Supabase Edge Function + Resend/Sendgrid когда понадобится
- **Хэширование кодов** — для MVP plain text в базе достаточно,
  для публичного проекта используй `pgcrypto.crypt()`

---

## 🔐 Миграция на более безопасную авторизацию (если понадобится)

Если захочешь перейти на email + пароль через Supabase Auth:

1. Создай пользователей через Supabase Dashboard → Authentication → Users
2. В таблице `users` добавь поле `auth_id UUID REFERENCES auth.users(id)`
3. В `lib/auth.tsx` замени логику на `supabase.auth.signInWithPassword()`
4. В RLS-политиках используй `auth.uid()` вместо `true`

Это займёт ~2 часа работы и даст полноценную JWT-авторизацию.

---

## 📋 Чеклист перед запуском в продакшн

- [ ] Поменять тестовые коды на реальные (или перейти на Supabase Auth)
- [ ] Удалить тестовые данные из schema.sql
- [ ] Проверить, что `base` в vite.config.ts совпадает с именем репозитория
- [ ] Добавить секреты GitHub
- [ ] Создать Storage bucket `homework` (или запустить SQL из schema)
- [ ] Протестировать вход, загрузку файла, создание урока
