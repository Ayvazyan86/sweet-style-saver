import paramiko
import sys

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
print('Connecting to 85.198.67.7...')
c.connect('85.198.67.7', username='root', password='j8!RMiWztLw1', timeout=15)
print('Connected!\n')

cmd = '''
set -e
apt-get install -y curl nginx >/dev/null 2>&1
curl -fsSL https://deb.nodesource.com/setup_20.x | bash - >/dev/null 2>&1
apt-get install -y nodejs >/dev/null 2>&1
echo "Node: $(node --version), npm: $(npm --version)"
cd /var/www && rm -rf app && mkdir app && cd app
echo "Downloading from GitHub..."
wget --no-check-certificate https://github.com/Ayvazyan86/sweet-style-saver/archive/refs/heads/main.tar.gz -O app.tar.gz 2>&1 || curl -kL https://github.com/Ayvazyan86/sweet-style-saver/archive/refs/heads/main.tar.gz -o app.tar.gz
tar xzf app.tar.gz --strip=1
rm app.tar.gz
echo "Files downloaded!"
cd /var/www/app
cat > .env << EOF
VITE_SUPABASE_PROJECT_ID=ishzwulmiixtuouisdyw
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzaHp3dWxtaWl4dHVvdWlzZHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0OTgwMDIsImV4cCI6MjA4MjA3NDAwMn0.agRcpuSAsb6MaRgH4FG_VYF-U2cXJin3CiLtRvcRFPU
VITE_SUPABASE_URL=https://ishzwulmiixtuouisdyw.supabase.co
EOF
echo "Installing packages..."
npm install
echo "Building app..."
npm run build
cat > /etc/nginx/sites-available/app << 'NGXEOF'
server {
    listen 80 default_server;
    server_name _;
    root /var/www/app/dist;
    index index.html;
    location / { try_files $uri $uri/ /index.html; }
}
NGXEOF
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/app /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx
echo "=== DEPLOYMENT COMPLETE ==="
curl -I http://localhost | head -5
ls -lh /var/www/app/dist/index.html
'''

stdin, stdout, stderr = c.exec_command(cmd, get_pty=True)
for line in stdout:
    print(line, end='')
    sys.stdout.flush()

c.close()
print('\n\nDeployment finished!')
