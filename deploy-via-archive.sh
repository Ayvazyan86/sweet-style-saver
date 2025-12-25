#!/bin/bash
# Deploy via GitHub archive (faster than git clone)

set -e

echo "================================"
echo "Quick Deployment via Archive"
echo "================================"

cd /var/www/sweet-style-saver

# Download and extract
echo "Step 1/5: Downloading code..."
curl -L https://github.com/Ayvazyan86/sweet-style-saver/archive/refs/heads/main.zip -o /tmp/app.zip
unzip -q -o /tmp/app.zip -d /tmp/
rm -rf /var/www/sweet-style-saver/*
mv /tmp/sweet-style-saver-main/* /var/www/sweet-style-saver/
rm -rf /tmp/app.zip /tmp/sweet-style-saver-main
echo "✓ Code extracted"

# Install Node.js
echo "Step 2/5: Checking Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi
echo "✓ Node.js $(node -v)"

# Install packages
echo "Step 3/5: Installing packages (2-3 min)..."
npm install
echo "✓ Packages installed"

# Create .env
echo "Step 4/5: Configuring..."
cat > .env << 'EOF'
VITE_SUPABASE_PROJECT_ID="ishzwulmiixtuouisdyw"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzaHp3dWxtaWl4dHVvdWlzZHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0OTgwMDIsImV4cCI6MjA4MjA3NDAwMn0.agRcpuSAsb6MaRgH4FG_VYF-U2cXJin3CiLtRvcRFPU"
VITE_SUPABASE_URL="https://ishzwulmiixtuouisdyw.supabase.co"
EOF
echo "✓ Environment configured"

# Build
echo "Step 5/5: Building (1-2 min)..."
npm run build
echo "✓ Built"

# Configure Nginx
cat > /etc/nginx/sites-available/sweet-style-saver << 'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name 85.198.67.7 _;
    root /var/www/sweet-style-saver/dist;
    index index.html;
    gzip on;
    gzip_types text/plain text/css application/javascript;
    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/sweet-style-saver /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

echo ""
echo "✅ DEPLOYMENT COMPLETE!"
echo "URL: http://85.198.67.7"
