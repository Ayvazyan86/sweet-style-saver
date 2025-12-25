#!/bin/bash
# Universal Quick Deployment Script
# Works on: Ubuntu 22.04/24.04, Debian 11/12, CentOS/Rocky 8/9

set -e

echo "========================================="
echo "🚀 Sweet Style Saver Deployment"
echo "========================================="
echo ""

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    echo "✓ Detected OS: $PRETTY_NAME"
else
    echo "❌ Cannot detect OS"
    exit 1
fi

# Step 1: Update system
echo ""
echo "📦 Step 1/7: Updating system..."
export DEBIAN_FRONTEND=noninteractive
if [[ "$OS" == "ubuntu" ]] || [[ "$OS" == "debian" ]]; then
    apt-get update -qq
    apt-get install -y curl git nginx
elif [[ "$OS" == "centos" ]] || [[ "$OS" == "rocky" ]]; then
    yum install -y curl git nginx
fi
echo "✓ System updated"

# Step 2: Install Node.js 20 LTS
echo ""
echo "📦 Step 2/7: Installing Node.js 20..."
if [[ "$OS" == "ubuntu" ]] || [[ "$OS" == "debian" ]]; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
else
    curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
    yum install -y nodejs
fi
node --version
npm --version
echo "✓ Node.js installed"

# Step 3: Clone repository
echo ""
echo "📥 Step 3/7: Cloning repository..."
rm -rf /var/www/app
git clone https://github.com/Ayvazyan86/sweet-style-saver.git /var/www/app
cd /var/www/app
echo "✓ Code cloned"

# Step 4: Configure environment
echo ""
echo "⚙️ Step 4/7: Configuring environment..."
cat > /var/www/app/.env << 'ENVEOF'
VITE_SUPABASE_PROJECT_ID="ishzwulmiixtuouisdyw"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzaHp3dWxtaWl4dHVvdWlzZHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0OTgwMDIsImV4cCI6MjA4MjA3NDAwMn0.agRcpuSAsb6MaRgH4FG_VYF-U2cXJin3CiLtRvcRFPU"
VITE_SUPABASE_URL="https://ishzwulmiixtuouisdyw.supabase.co"
ENVEOF
echo "✓ Environment configured"

# Step 5: Install dependencies
echo ""
echo "📦 Step 5/7: Installing npm packages (2-3 minutes)..."
npm install --silent
echo "✓ Dependencies installed"

# Step 6: Build application
echo ""
echo "🔨 Step 6/7: Building application (1-2 minutes)..."
npm run build
echo "✓ Application built"

# Step 7: Configure Nginx
echo ""
echo "🌐 Step 7/7: Configuring Nginx..."

# Ubuntu/Debian style
if [[ "$OS" == "ubuntu" ]] || [[ "$OS" == "debian" ]]; then
    cat > /etc/nginx/sites-available/app << 'NGINXEOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    
    server_name _;
    root /var/www/app/dist;
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml+rss image/svg+xml;
    
    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Static files caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    access_log /var/log/nginx/app.access.log;
    error_log /var/log/nginx/app.error.log;
}
NGINXEOF
    
    rm -f /etc/nginx/sites-enabled/default
    ln -sf /etc/nginx/sites-available/app /etc/nginx/sites-enabled/
    
# CentOS/Rocky style  
else
    cat > /etc/nginx/conf.d/app.conf << 'NGINXEOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    
    server_name _;
    root /var/www/app/dist;
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml+rss image/svg+xml;
    
    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Static files caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    access_log /var/log/nginx/app.access.log;
    error_log /var/log/nginx/app.error.log;
}
NGINXEOF
    
    rm -f /etc/nginx/conf.d/default.conf
fi

# Test and start Nginx
nginx -t
systemctl enable nginx
systemctl restart nginx

echo ""
echo "========================================="
echo "✅ DEPLOYMENT COMPLETE!"
echo "========================================="
echo ""
echo "🌐 Application URL: http://$(hostname -I | awk '{print $1}')"
echo ""
echo "📊 Service Status:"
systemctl status nginx --no-pager | head -5
echo ""
echo "📁 Files:"
ls -lh /var/www/app/dist/index.html
echo ""
echo "🔍 Test deployment:"
echo "   curl -I http://localhost"
echo ""
