#!/bin/bash
# Quick app deployment - Nginx already running

set -e

echo "================================"
echo "Quick App Deployment"
echo "================================"
echo ""

# Step 1: Clone/update repository
echo "Step 1/6: Fetching code..."
mkdir -p /var/www/sweet-style-saver
cd /var/www/sweet-style-saver

if [ -d ".git" ]; then
    git fetch --all
    git reset --hard origin/main
    git pull origin main
else
    git clone https://github.com/Ayvazyan86/sweet-style-saver.git .
fi
echo "✓ Code updated"

# Step 2: Install Node.js if needed
echo "Step 2/6: Checking Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi
echo "✓ Node.js $(node -v)"

# Step 3: Install dependencies
echo "Step 3/6: Installing packages..."
npm install --loglevel=error
echo "✓ Packages installed"

# Step 4: Create .env
echo "Step 4/6: Configuring environment..."
cat > .env << 'ENVEOF'
VITE_SUPABASE_PROJECT_ID="ishzwulmiixtuouisdyw"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzaHp3dWxtaWl4dHVvdWlzZHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0OTgwMDIsImV4cCI6MjA4MjA3NDAwMn0.agRcpuSAsb6MaRgH4FG_VYF-U2cXJin3CiLtRvcRFPU"
VITE_SUPABASE_URL="https://ishzwulmiixtuouisdyw.supabase.co"
ENVEOF
echo "✓ Environment configured"

# Step 5: Build app
echo "Step 5/6: Building application..."
npm run build
echo "✓ Application built"

# Step 6: Configure Nginx
echo "Step 6/6: Updating Nginx config..."
cat > /etc/nginx/sites-available/sweet-style-saver << 'NGINXEOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    
    server_name 85.198.67.7 _;
    
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
}
NGINXEOF

rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/sweet-style-saver /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

echo ""
echo "================================"
echo "✅ DEPLOYMENT COMPLETE!"
echo "================================"
echo ""
echo "URL: http://85.198.67.7"
echo ""
