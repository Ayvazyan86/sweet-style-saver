# Айвазян рекомендует — Telegram Mini App

> Платформа для размещения и поиска проверенных специалистов через Telegram

## 🚀 Технологии

- **Frontend:** React + TypeScript + Vite
- **UI:** shadcn/ui + Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Edge Functions)
- **Deployment:** VPS (Nginx) + GitHub Actions
- **Telegram:** Mini App SDK

## 📦 Установка

```bash
# Клонировать репозиторий
git clone https://github.com/Ayvazyan86/sweet-style-saver.git
cd sweet-style-saver

# Установить зависимости
npm install

# Запустить dev сервер
npm run dev
```

## 🔧 Конфигурация

Создайте `.env` файл:

```env
VITE_SUPABASE_PROJECT_ID=your_project_id
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
VITE_SUPABASE_URL=https://your-project.supabase.co
```

## 🚀 Deployment

### Автоматический deployment

Проект настроен на автоматический deployment через GitHub Actions:

```bash
# Внесите изменения
git add .
git commit -m "описание изменений"
git push

# GitHub Actions автоматически:
# 1. Соберёт приложение (npm run build)
# 2. Загрузит на сервер
# 3. Перезапустит Nginx
```

### Ручной deployment

```bash
# Собрать приложение
npm run build

# Загрузить на сервер
python upload-dist.py
```

## 📁 Структура проекта

```
.
├── src/
│   ├── components/     # React компоненты
│   ├── pages/          # Страницы приложения
│   ├── hooks/          # Custom hooks
│   └── integrations/   # Supabase интеграция
├── supabase/
│   ├── functions/      # Edge Functions
│   └── migrations/     # Миграции БД
├── .github/
│   └── workflows/      # GitHub Actions
└── public/             # Статические файлы
```

## 🔗 Полезные ссылки

- **Сайт:** http://ayvazyan-rekomenduet.ru
- **Telegram канал:** [@av_rekomenduet](https://t.me/av_rekomenduet)
- **Telegram бот:** [@av_rekomenduet_bot](https://t.me/av_rekomenduet_bot)

## 📝 Лицензия

Private project
