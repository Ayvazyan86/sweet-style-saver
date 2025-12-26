# 🚀 Deployment Guide

## Workflow: Локально → GitHub → Production

### 📋 Предварительные требования

1. **Локальная разработка:**
   ```bash
   # Frontend dev server
   npm run dev

   # Backend dev server (в отдельном терминале)
   cd backend
   node server.js
   ```

2. **Environment files:**
   - Скопируйте `.env.example` → `.env` и заполните переменные
   - Скопируйте `backend/.env.example` → `backend/.env` и заполните

---

## 🔄 Процесс деплоя

### Вариант 1: Ручной деплой (текущий)

#### 1. Разработка локально
```bash
# Установка зависимостей
npm install

# Разработка
npm run dev
```

#### 2. Публикация на GitHub
```bash
# Коммит изменений
git add .
git commit -m "feat: your feature description"

# Push в main
git push origin main
```

**⚠️ Важно:** Для push нужен GitHub Personal Access Token:
- Settings → Developer settings → Personal access tokens → Tokens (classic)
- Generate new token с правами `repo`
- Используйте токен вместо пароля при push

#### 3. Деплой на Production

**Frontend:**
```bash
npm run deploy:frontend
# или вручную:
npm run build
python upload-dist.py
```

**Backend:**
```bash
npm run deploy:backend
# или вручную:
python deploy-backend.py
```

**Всё сразу:**
```bash
npm run deploy:all
```

---

### Вариант 2: Автоматический деплой через GitHub Actions

#### Настройка (один раз):

1. **GitHub Secrets:**
   Добавьте в Settings → Secrets and variables → Actions:
   ```
   SERVER_HOST=85.198.67.7
   SERVER_USER=root
   SERVER_PASSWORD=ваш_пароль
   VITE_API_URL=http://ayvazyan-rekomenduet.ru:3000/api
   ```

2. **Активация workflow:**
   - Файл `.github/workflows/deploy.yml` уже создан
   - При push в `main` автоматически:
     - Собирается frontend
     - Деплоится на сервер
     - Обновляется backend
     - Перезапускается PM2

#### Использование:
```bash
git push origin main
# → Автоматический деплой запустится
```

---

## 📁 Структура проекта

```
sweet-style-saver/
├── src/              # Frontend (React + TypeScript)
├── backend/          # Backend (Express.js + PostgreSQL)
├── dist/             # Frontend build (не в Git)
├── .env              # Локальные переменные (не в Git)
├── .env.example      # Шаблон переменных
└── deploy-*.py       # Скрипты деплоя
```

---

## 🔧 Полезные команды

```bash
# Development
npm run dev              # Frontend dev server
npm run lint             # Проверка кода

# Build
npm run build            # Production build
npm run build:dev        # Development build

# Deploy
npm run deploy:frontend  # Только frontend
npm run deploy:backend   # Только backend
npm run deploy:all       # Всё сразу

# Preview
npm run preview          # Локальный просмотр production build
```

---

## 🔒 Безопасность

### ❌ НЕ коммитьте в Git:
- `.env` файлы
- Пароли и токены
- `node_modules/`
- `dist/` (собранные файлы)

### ✅ Коммитьте:
- `.env.example` (шаблоны без секретов)
- Исходный код
- Конфигурационные файлы

---

## 🐛 Troubleshooting

### "Authentication failed" при git push
**Решение:** Используйте Personal Access Token вместо пароля

### "Module not found" на сервере
**Решение:** 
```bash
cd /var/www/backend
npm install --production
pm2 restart backend
```

### Frontend не обновляется
**Решение:**
```bash
npm run build
python upload-dist.py
# Проверьте в браузере Ctrl+F5 (hard refresh)
```

---

## 📊 Production URL

- **Frontend:** http://ayvazyan-rekomenduet.ru
- **Backend API:** http://ayvazyan-rekomenduet.ru:3000/api
- **Health check:** http://ayvazyan-rekomenduet.ru:3000/health

---

## 📝 Changelog

### 26.12.2024
- ✅ Миграция с Supabase на self-hosted backend
- ✅ Удалены все Supabase зависимости
- ✅ Настроен современный workflow разработки
- ✅ Добавлены deployment скрипты
- ✅ Создан GitHub Actions workflow
