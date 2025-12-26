#!/usr/bin/env python3
"""Fix nginx HTTPS config with API proxy"""
import paramiko

SERVER = '85.198.67.7'
USER = 'root'
PASSWORD = 'j8!RMiWztLw1'
DOMAIN = 'ayvazyan-rekomenduet.ru'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(SERVER, username=USER, password=PASSWORD, timeout=30)

print("1️⃣ Checking existing SSL files...")
cmd = "ls -la /etc/letsencrypt/live/"
stdin, stdout, stderr = ssh.exec_command(cmd, timeout=10)
stdout.channel.recv_exit_status()
print(stdout.read().decode())

print("\n2️⃣ Creating full nginx config with HTTPS and API proxy...")
nginx_config = f'''
server {{
    listen 80;
    listen [::]:80;
    server_name {DOMAIN} www.{DOMAIN};
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}}

server {{
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name {DOMAIN} www.{DOMAIN};

    ssl_certificate /etc/letsencrypt/live/{DOMAIN}-0002/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/{DOMAIN}-0002/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    root /var/www/app/dist;
    index index.html;

    # Frontend
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
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
    }}
}}
'''

# Write config
cmd = f'''cat > /etc/nginx/sites-available/app << 'EOFNGINX'
{nginx_config}
EOFNGINX
'''
stdin, stdout, stderr = ssh.exec_command(cmd, timeout=10)
stdout.channel.recv_exit_status()

# Test and reload
print("\n3️⃣ Testing nginx config...")
cmd = "nginx -t"
stdin, stdout, stderr = ssh.exec_command(cmd, timeout=10)
stdout.channel.recv_exit_status()
print(stdout.read().decode())
print(stderr.read().decode())

print("\n4️⃣ Reloading nginx...")
cmd = "nginx -s reload"
stdin, stdout, stderr = ssh.exec_command(cmd, timeout=10)
stdout.channel.recv_exit_status()
print(stdout.read().decode() or "Reloaded")

print("\n5️⃣ Testing HTTPS API...")
cmd = f"curl -s https://{DOMAIN}/api/health"
stdin, stdout, stderr = ssh.exec_command(cmd, timeout=10)
stdout.channel.recv_exit_status()
print(stdout.read().decode() or "(no output)")

ssh.close()
print("\n✅ Done!")
