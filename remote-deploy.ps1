# Remote deployment script for Sweet Style Saver
# Executes deployment on Ubuntu server via SSH

$serverIP = "85.198.67.7"
$username = "root"
$password = "Il1oH0BlZ*r4"

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "🚀 Remote Deployment to Server" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Server: $serverIP" -ForegroundColor Yellow
Write-Host "User: $username" -ForegroundColor Yellow
Write-Host ""

# Install plink if needed (PuTTY's command-line connection tool)
Write-Host "Checking if plink is available..." -ForegroundColor Cyan

# Create deployment script content
$deployScript = @'
#!/bin/bash
set -e
echo "🚀 Starting deployment..."

# Update system
echo "📦 Updating system packages..."
apt-get update -qq
DEBIAN_FRONTEND=noninteractive apt-get upgrade -y -qq

# Install dependencies
echo "📦 Installing dependencies..."
apt-get install -y -qq curl git ufw nginx certbot python3-certbot-nginx

# Install Node.js 20
echo "📦 Installing Node.js 20..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi
echo "Node version: $(node -v)"

# Install PM2
echo "📦 Installing PM2..."
npm install -g pm2 --silent

# Setup firewall
echo "🔒 Configuring firewall..."
ufw --force enable
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw allow 80/tcp
ufw allow 443/tcp

# Create deployer user
echo "👤 Creating deployer user..."
if ! id "deployer" &>/dev/null; then
    useradd -m -s /bin/bash deployer
    usermod -aG sudo deployer
    mkdir -p /etc/sudoers.d
    echo "deployer ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/deployer
    chmod 0440 /etc/sudoers.d/deployer
fi

# Create app directory
echo "📁 Creating app directory..."
mkdir -p /var/www/sweet-style-saver
chown -R deployer:deployer /var/www/sweet-style-saver

# Clone repository
echo "📥 Cloning repository..."
cd /var/www/sweet-style-saver
if [ -d ".git" ]; then
    sudo -u deployer git pull
else
    sudo -u deployer git clone https://github.com/Ayvazyan86/sweet-style-saver.git .
fi

# Install dependencies
echo "📦 Installing npm packages..."
cd /var/www/sweet-style-saver
sudo -u deployer npm install --silent

# Create .env
echo "⚙️ Creating environment file..."
cat > /var/www/sweet-style-saver/.env << 'ENVEOF'
VITE_SUPABASE_PROJECT_ID="ishzwulmiixtuouisdyw"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzaHp3dWxtaWl4dHVvdWlzZHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0OTgwMDIsImV4cCI6MjA4MjA3NDAwMn0.agRcpuSAsb6MaRgH4FG_VYF-U2cXJin3CiLtRvcRFPU"
VITE_SUPABASE_URL="https://ishzwulmiixtuouisdyw.supabase.co"
ENVEOF
chown deployer:deployer /var/www/sweet-style-saver/.env

# Build application
echo "🔨 Building application..."
cd /var/www/sweet-style-saver
sudo -u deployer npm run build

# Configure Nginx
echo "⚙️ Configuring Nginx..."
cat > /etc/nginx/sites-available/sweet-style-saver << 'NGINXEOF'
server {
    listen 80;
    listen [::]:80;
    server_name 85.198.67.7;
    root /var/www/sweet-style-saver/dist;
    index index.html;
    
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
NGINXEOF

ln -sf /etc/nginx/sites-available/sweet-style-saver /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
systemctl enable nginx

echo "✅ Deployment complete!"
echo ""
echo "🌐 Application URL: http://85.198.67.7"
echo "📊 Check status: systemctl status nginx"
echo ""
'@

Write-Host "📝 Deployment script created" -ForegroundColor Green
Write-Host ""
Write-Host "To deploy manually, run these commands:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Connect to server:" -ForegroundColor Cyan
Write-Host "   ssh root@85.198.67.7" -ForegroundColor White
Write-Host ""
Write-Host "2. Paste and run this command:" -ForegroundColor Cyan
Write-Host ""
Write-Host $deployScript -ForegroundColor Gray
Write-Host ""
Write-Host "Or use this one-liner:" -ForegroundColor Yellow
Write-Host ""

# Create one-liner command
$oneLiner = $deployScript -replace "`r`n", "; " -replace "`n", "; "
$base64Script = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($deployScript))

Write-Host "ssh root@85.198.67.7 'bash -s' << 'EOFSCRIPT'" -ForegroundColor White
Write-Host $deployScript -ForegroundColor Gray
Write-Host "EOFSCRIPT" -ForegroundColor White
Write-Host ""
