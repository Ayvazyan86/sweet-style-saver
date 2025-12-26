#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Деплой backend API на сервер
"""

import paramiko
import os
from scp import SCPClient

SERVER = '85.198.67.7'
USER = 'root'
PASSWORD = 'j8!RMiWztLw1'

print("\n" + "="*70)
print("🚀 ДЕПЛОЙ BACKEND API НА СЕРВЕР")
print("="*70)

try:
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print("\n🔌 Подключение к серверу...")
    ssh.connect(SERVER, username=USER, password=PASSWORD, timeout=30)
    print("   ✅ Подключено")

    # 1. Установка Node.js (если ещё не установлен)
    print("\n1️⃣  Проверка/установка Node.js...")
    commands = """
node --version 2>/dev/null || {
    echo "Установка Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
}
node --version
npm --version
"""
    
    stdin, stdout, stderr = ssh.exec_command(commands, timeout=180)
    stdout.channel.recv_exit_status()
    output = stdout.read().decode()
    print(f"   {output}")

    # 2. Создание структуры директорий
    print("\n2️⃣  Создание структуры директорий...")
    commands = """
mkdir -p /var/www/backend/routes
mkdir -p /var/www/backend/services
mkdir -p /var/www/backend/db
mkdir -p /var/www/backend/uploads
chmod 755 /var/www/backend/uploads
echo "Директории созданы"
"""
    
    stdin, stdout, stderr = ssh.exec_command(commands, timeout=30)
    stdout.channel.recv_exit_status()
    print("   ✅ Директории созданы")

    # 3. Загрузка файлов backend
    print("\n3️⃣  Загрузка файлов backend...")
    
    files_to_upload = [
        ('backend/server.js', '/var/www/backend/server.js'),
        ('backend/package.json', '/var/www/backend/package.json'),
        ('backend/routes/partners.js', '/var/www/backend/routes/partners.js'),
        ('backend/routes/applications.js', '/var/www/backend/routes/applications.js'),
        ('backend/routes/orders.js', '/var/www/backend/routes/orders.js'),
        ('backend/routes/questions.js', '/var/www/backend/routes/questions.js'),
        ('backend/routes/categories.js', '/var/www/backend/routes/categories.js'),
        ('backend/routes/admin.js', '/var/www/backend/routes/admin.js'),
        ('backend/routes/upload.js', '/var/www/backend/routes/upload.js'),
        ('backend/routes/telegram.js', '/var/www/backend/routes/telegram.js'),
        ('backend/services/telegram.js', '/var/www/backend/services/telegram.js'),
    ]
    
    with SCPClient(ssh.get_transport()) as scp:
        for local_path, remote_path in files_to_upload:
            if os.path.exists(local_path):
                print(f"   📤 {local_path} → {remote_path}")
                scp.put(local_path, remote_path)
            else:
                print(f"   ⚠️  Файл не найден: {local_path}")
    
    print("   ✅ Файлы загружены")

    # 4. Создание .env файла на сервере
    print("\n4️⃣  Создание .env файла...")
    commands = """
cat > /var/www/backend/.env << 'EOF'
PORT=3000
NODE_ENV=production

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sweet_style_saver
DB_USER=app_user
DB_PASSWORD=SecurePass_2024!Sweet

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_12345678

# Telegram
TELEGRAM_BOT_TOKEN=8423349734:AAGaTfgF7GhikunPZ9VwnngPKSrRqz5hcLI
TELEGRAM_CHANNEL_ID=@av_rekomenduet

# Storage
UPLOAD_DIR=/var/www/backend/uploads
PUBLIC_URL=https://ayvazyan-rekomenduet.ru
EOF
echo ".env создан"
"""
    
    stdin, stdout, stderr = ssh.exec_command(commands, timeout=30)
    stdout.channel.recv_exit_status()
    print("   ✅ .env создан")

    # 5. Установка dependencies
    print("\n5️⃣  Установка npm dependencies...")
    commands = """
cd /var/www/backend
npm install 2>&1 | tail -20
echo "Dependencies установлены"
"""
    
    stdin, stdout, stderr = ssh.exec_command(commands, timeout=300)
    stdout.channel.recv_exit_status()
    output = stdout.read().decode()
    print(f"   {output}")

    # 6. Установка PM2 (process manager)
    print("\n6️⃣  Установка PM2...")
    commands = """
npm install -g pm2 2>&1 | tail -5
pm2 --version
"""
    
    stdin, stdout, stderr = ssh.exec_command(commands, timeout=120)
    stdout.channel.recv_exit_status()
    output = stdout.read().decode()
    print(f"   {output}")

    # 7. Запуск backend через PM2
    print("\n7️⃣  Запуск backend API...")
    commands = """
cd /var/www/backend
pm2 stop backend 2>/dev/null || true
pm2 delete backend 2>/dev/null || true
pm2 start server.js --name backend --node-args="--experimental-modules"
pm2 save
pm2 startup | tail -1 > /tmp/pm2-startup.sh
bash /tmp/pm2-startup.sh
pm2 list
"""
    
    stdin, stdout, stderr = ssh.exec_command(commands, timeout=60)
    stdout.channel.recv_exit_status()
    output = stdout.read().decode()
    print(f"   {output}")

    # 8. Настройка Nginx reverse proxy
    print("\n8️⃣  Настройка Nginx reverse proxy...")
    commands = """
cat > /etc/nginx/sites-available/api << 'EOF'
server {
    listen 80;
    server_name api.ayvazyan-rekomenduet.ru;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

ln -sf /etc/nginx/sites-available/api /etc/nginx/sites-enabled/ 2>/dev/null || true
nginx -t && nginx -s reload
echo "Nginx настроен"
"""
    
    stdin, stdout, stderr = ssh.exec_command(commands, timeout=30)
    stdout.channel.recv_exit_status()
    output = stdout.read().decode()
    print(f"   {output}")

    # 9. Тест API
    print("\n9️⃣  Тест API...")
    commands = """
sleep 2
curl -s http://localhost:3000/health | head -5
"""
    
    stdin, stdout, stderr = ssh.exec_command(commands, timeout=10)
    stdout.channel.recv_exit_status()
    output = stdout.read().decode()
    
    if "ok" in output:
        print("   ✅ API работает!")
        print(f"   {output}")
    else:
        print("   ⚠️  API может быть недоступен")
        print(f"   {output}")

    ssh.close()

    print("\n" + "="*70)
    print("✅ ДЕПЛОЙ ЗАВЕРШЁН!")
    print("="*70)
    print("\n📊 Backend API:")
    print("   Local: http://localhost:3000")
    print("   Server: http://85.198.67.7:3000")
    print("   Health: http://localhost:3000/health")
    print("\n🔜 Следующий шаг: Обновление frontend для использования нового API")
    print("="*70 + "\n")

except paramiko.SSHException as e:
    print(f"\n❌ Ошибка SSH: {e}")
except Exception as e:
    print(f"\n❌ Ошибка: {e}")
