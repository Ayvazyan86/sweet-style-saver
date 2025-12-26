#!/usr/bin/env python3
"""Setup HTTPS with Let's Encrypt Certbot"""
import paramiko

SERVER = '85.198.67.7'
USER = 'root'
PASSWORD = 'j8!RMiWztLw1'
DOMAIN = 'ayvazyan-rekomenduet.ru'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(SERVER, username=USER, password=PASSWORD, timeout=30)

print("="*60)
print("🔒 НАСТРОЙКА HTTPS С LET'S ENCRYPT")
print("="*60)

# Step 1: Install Certbot
print("\n1️⃣ Установка Certbot...")
cmd = """
apt-get update -qq
apt-get install -y certbot python3-certbot-nginx -qq
certbot --version
"""
stdin, stdout, stderr = ssh.exec_command(cmd, timeout=120)
stdout.channel.recv_exit_status()
print(stdout.read().decode())

# Step 2: Update Nginx config for SSL
print("\n2️⃣ Обновление Nginx конфигурации...")
cmd = f"""
cat > /etc/nginx/sites-available/default << 'EOF'
server {{
    listen 80;
    listen [::]:80;
    server_name {DOMAIN} www.{DOMAIN};
    
    root /var/www/app/dist;
    index index.html;

    # For Let's Encrypt verification
    location /.well-known/acme-challenge/ {{
        root /var/www/html;
    }}

    location / {{
        try_files $uri $uri/ /index.html;
    }}

    # API proxy
    location /api/ {{
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }}
}}
EOF
nginx -t && nginx -s reload
echo "Nginx configured"
"""
stdin, stdout, stderr = ssh.exec_command(cmd, timeout=30)
stdout.channel.recv_exit_status()
print(stdout.read().decode())
print(stderr.read().decode())

# Step 3: Get SSL certificate
print("\n3️⃣ Получение SSL сертификата...")
cmd = f"""
mkdir -p /var/www/html/.well-known/acme-challenge
certbot --nginx -d {DOMAIN} --non-interactive --agree-tos --email admin@{DOMAIN} --redirect
"""
stdin, stdout, stderr = ssh.exec_command(cmd, timeout=180)
stdout.channel.recv_exit_status()
output = stdout.read().decode()
errors = stderr.read().decode()
print(output)
if errors:
    print("Stderr:", errors)

# Step 4: Verify HTTPS
print("\n4️⃣ Проверка HTTPS...")
cmd = f"""
curl -I https://{DOMAIN} 2>/dev/null | head -5
echo "---"
openssl s_client -connect {DOMAIN}:443 -servername {DOMAIN} 2>/dev/null | openssl x509 -noout -dates 2>/dev/null || echo "SSL check failed"
"""
stdin, stdout, stderr = ssh.exec_command(cmd, timeout=30)
stdout.channel.recv_exit_status()
print(stdout.read().decode())

# Step 5: Setup auto-renewal
print("\n5️⃣ Настройка автообновления сертификата...")
cmd = """
systemctl enable certbot.timer
systemctl start certbot.timer
systemctl status certbot.timer --no-pager
"""
stdin, stdout, stderr = ssh.exec_command(cmd, timeout=30)
stdout.channel.recv_exit_status()
print(stdout.read().decode())

ssh.close()

print("\n" + "="*60)
print("✅ НАСТРОЙКА HTTPS ЗАВЕРШЕНА!")
print("="*60)
print(f"\n🌐 HTTPS URL: https://{DOMAIN}")
print(f"🔧 API URL: https://{DOMAIN}/api")
print("\n⚠️ Обновите .env на локальной машине:")
print(f'   VITE_API_URL="https://{DOMAIN}/api"')
