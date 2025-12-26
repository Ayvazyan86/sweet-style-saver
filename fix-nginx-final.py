#!/usr/bin/env python3
"""Fix nginx config - health is at root, not /api"""
import paramiko

SERVER = '85.198.67.7'
USER = 'root'
PASSWORD = 'j8!RMiWztLw1'
DOMAIN = 'ayvazyan-rekomenduet.ru'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(SERVER, username=USER, password=PASSWORD, timeout=30)

print("Testing endpoints on backend...")
endpoints = [
    ("health", "curl -s http://localhost:3000/health"),
    ("api/health", "curl -s http://localhost:3000/api/health"),
    ("api/categories", "curl -s http://localhost:3000/api/categories | head -c 200"),
]

for name, cmd in endpoints:
    print(f"\n{name}: ", end="")
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=10)
    stdout.channel.recv_exit_status()
    print(stdout.read().decode()[:100])

# Fix nginx config - add health endpoint
print("\n\nUpdating nginx config...")
nginx_config = f'''
server {{
    listen 80;
    listen [::]:80;
    server_name {DOMAIN} www.{DOMAIN};
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

    # Health check (at root level on backend)
    location = /health {{
        proxy_pass http://localhost:3000/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
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
    }}

    # Frontend
    location / {{
        try_files $uri $uri/ /index.html;
    }}
}}
'''

cmd = f'''cat > /etc/nginx/sites-available/app << 'EOFNGINX'
{nginx_config}
EOFNGINX
'''
stdin, stdout, stderr = ssh.exec_command(cmd, timeout=10)
stdout.channel.recv_exit_status()

cmd = "nginx -t && nginx -s reload"
stdin, stdout, stderr = ssh.exec_command(cmd, timeout=10)
stdout.channel.recv_exit_status()
print(stderr.read().decode())

# Test
print("\nTesting HTTPS endpoints...")
for path in ["/health", "/api/categories"]:
    cmd = f"curl -s https://{DOMAIN}{path} | head -c 100"
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=10)
    stdout.channel.recv_exit_status()
    print(f"{path}: {stdout.read().decode()}")

ssh.close()
print("\n✅ Done!")
