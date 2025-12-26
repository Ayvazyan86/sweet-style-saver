#!/usr/bin/env python3
"""Fix backend .env and restart"""
import paramiko

SERVER = '85.198.67.7'
USER = 'root'
PASSWORD = 'j8!RMiWztLw1'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(SERVER, username=USER, password=PASSWORD, timeout=30)

# Update .env with correct password
commands = """
cat > /var/www/backend/.env << 'EOF'
PORT=3000
NODE_ENV=production

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sweet_style_saver
DB_USER=app_user
DB_PASSWORD=app_password_2024

# JWT
JWT_SECRET=ayvazyan_jwt_secret_2024_super_secure_key_change_in_production

# Telegram
TELEGRAM_BOT_TOKEN=8423349734:AAGaTfgF7GhikunPZ9VwnngPKSrRqz5hcLI
TELEGRAM_CHANNEL_ID=@av_rekomenduet

# Storage
UPLOAD_DIR=/var/www/backend/uploads
PUBLIC_URL=http://ayvazyan-rekomenduet.ru
EOF

pm2 restart backend
echo 'Backend restarted'
"""

print("Updating .env and restarting backend...")
stdin, stdout, stderr = ssh.exec_command(commands, timeout=30)
stdout.channel.recv_exit_status()
print(stdout.read().decode())

# Test API
import time
time.sleep(2)
stdin, stdout, stderr = ssh.exec_command('curl -s http://localhost:3000/health')
stdout.channel.recv_exit_status()
print("Health check:", stdout.read().decode())

ssh.close()
print("Done!")
