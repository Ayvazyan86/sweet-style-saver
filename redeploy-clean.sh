#!/bin/bash
# Clean redeployment script - kills old processes and redeploys from scratch

set -e

echo "========================================"
echo "🔄 Clean Redeployment"
echo "========================================"
echo ""

# Kill any hanging npm/node processes
echo "🛑 Step 1: Stopping old processes..."
pkill -9 npm 2>/dev/null || true
pkill -9 node 2>/dev/null || true
sleep 2
echo "✓ Old processes stopped"
echo ""

# Clean up old installation if exists
echo "🧹 Step 2: Cleaning old installation..."
if [ -d "/var/www/sweet-style-saver" ]; then
    cd /var/www/sweet-style-saver
    rm -rf node_modules 2>/dev/null || true
    rm -rf dist 2>/dev/null || true
    rm -rf .next 2>/dev/null || true
    rm -f package-lock.json 2>/dev/null || true
    echo "✓ Old files cleaned"
else
    mkdir -p /var/www/sweet-style-saver
    echo "✓ Created fresh directory"
fi
echo ""

# System update
echo "📦 Step 3: Updating system..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq >/dev/null 2>&1
echo "✓ System updated"
echo ""

# Install dependencies
echo "📦 Step 4: Installing system dependencies..."
apt-get install -y -qq curl git ufw nginx certbot python3-certbot-nginx >/dev/null 2>&1
echo "✓ System dependencies installed"
echo ""

# Install Node.js
echo "📦 Step 5: Installing Node.js 20..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - >/dev/null 2>&1
    apt-get install -y nodejs >/dev/null 2>&1
fi
echo "✓ Node.js $(node -v) installed"
echo ""

# Install PM2
echo "📦 Step 6: Installing PM2..."
npm install -g pm2 --silent 2>/dev/null || true
echo "✓ PM2 installed"
echo ""

# Setup firewall
echo "🔒 Step 7: Configuring firewall..."
ufw --force enable >/dev/null 2>&1
ufw allow OpenSSH >/dev/null 2>&1
ufw allow 'Nginx Full' >/dev/null 2>&1
ufw allow 80/tcp >/dev/null 2>&1
ufw allow 443/tcp >/dev/null 2>&1
echo "✓ Firewall configured"
echo ""

# Create deployer user
echo "👤 Step 8: Setting up deployer user..."
if ! id "deployer" &>/dev/null; then
    useradd -m -s /bin/bash deployer
    usermod -aG sudo deployer
    mkdir -p /etc/sudoers.d
    echo "deployer ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/deployer
    chmod 0440 /etc/sudoers.d/deployer
fi
chown -R deployer:deployer /var/www/sweet-style-saver
echo "✓ Deployer user ready"
echo ""

# Clone/update repository
echo "📥 Step 9: Fetching latest code..."
cd /var/www/sweet-style-saver
if [ -d ".git" ]; then
    sudo -u deployer git fetch --all
    sudo -u deployer git reset --hard origin/main
    sudo -u deployer git pull origin main
else
    sudo -u deployer git clone https://github.com/Ayvazyan86/sweet-style-saver.git .
fi
echo "✓ Code updated"
echo ""

# Install npm packages
echo "📦 Step 10: Installing npm packages..."
echo "   (This may take 2-3 minutes, please wait...)"
cd /var/www/sweet-style-saver
sudo -u deployer npm install --loglevel=error
echo "✓ Packages installed"
echo ""

# Create .env
echo "⚙️  Step 11: Configuring environment..."
cat > /var/www/sweet-style-saver/.env << 'ENVEOF'
VITE_SUPABASE_PROJECT_ID="ishzwulmiixtuouisdyw"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzaHp3dWxtaWl4dHVvdWlzZHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0OTgwMDIsImV4cCI6MjA4MjA3NDAwMn0.agRcpuSAsb6MaRgH4FG_VYF-U2cXJin3CiLtRvcRFPU"
VITE_SUPABASE_URL="https://ishzwulmiixtuouisdyw.supabase.co"
ENVEOF
chown deployer:deployer /var/www/sweet-style-saver/.env
echo "✓ Environment configured"
echo ""

# Build application
echo "🔨 Step 12: Building application..."
echo "   (This may take 1-2 minutes...)"
cd /var/www/sweet-style-saver
sudo -u deployer npm run build
echo "✓ Application built"
echo ""

# Stop nginx temporarily
systemctl stop nginx 2>/dev/null || true

# Configure Nginx
echo "⚙️  Step 13: Configuring Nginx..."
cat > /etc/nginx/sites-available/sweet-style-saver << 'NGINXEOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    
    server_name 85.198.67.7 _;
    
    root /var/www/sweet-style-saver/dist;
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json image/svg+xml;
    
    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Access log
    access_log /var/log/nginx/sweet-style-saver.access.log;
    error_log /var/log/nginx/sweet-style-saver.error.log;
}
NGINXEOF

# Remove default site and enable ours
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/sweet-style-saver /etc/nginx/sites-enabled/

# Test nginx config
nginx -t
if [ $? -ne 0 ]; then
    echo "✗ Nginx configuration error"
    exit 1
fi

# Start nginx
systemctl enable nginx >/dev/null 2>&1
systemctl start nginx
echo "✓ Nginx configured and started"
echo ""

# Verify deployment
echo "✅ Step 14: Verifying deployment..."
sleep 2

# Check nginx
if systemctl is-active --quiet nginx; then
    echo "✓ Nginx is running"
else
    echo "✗ Nginx failed to start"
    systemctl status nginx
    exit 1
fi

# Check files
if [ -d "/var/www/sweet-style-saver/dist" ] && [ -f "/var/www/sweet-style-saver/dist/index.html" ]; then
    echo "✓ Application files present"
else
    echo "✗ Application files missing"
    exit 1
fi

# Test HTTP
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✓ HTTP server responding (200 OK)"
else
    echo "⚠ HTTP server returned: $HTTP_CODE"
fi

echo ""
echo "========================================"
echo "✅ DEPLOYMENT COMPLETE!"
echo "========================================"
echo ""
echo "🌐 Application URL: http://85.198.67.7"
echo ""
echo "📊 Service status:"
echo "   Nginx: $(systemctl is-active nginx)"
echo "   Files: $(ls -lh /var/www/sweet-style-saver/dist/index.html 2>/dev/null | awk '{print $5}' || echo 'N/A')"
echo ""
echo "📝 Useful commands:"
echo "   systemctl status nginx"
echo "   journalctl -u nginx -f"
echo "   ls -la /var/www/sweet-style-saver/dist/"
echo ""
echo "🔄 To update in future:"
echo "   cd /var/www/sweet-style-saver"
echo "   git pull"
echo "   npm install"
echo "   npm run build"
echo "   systemctl restart nginx"
echo ""
