#!/bin/bash

# Deployment script for Sweet Style Saver
# Server: 85.198.67.7 (Ubuntu 24.04)

set -e  # Exit on error

echo "======================================"
echo "🚀 Sweet Style Saver Deployment"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Step 1: System Update${NC}"
apt-get update
apt-get upgrade -y

echo -e "${GREEN}✓ System updated${NC}"
echo ""

echo -e "${YELLOW}Step 2: Installing dependencies${NC}"
apt-get install -y curl git ufw nginx certbot python3-certbot-nginx

echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

echo -e "${YELLOW}Step 3: Installing Node.js 20 LTS${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

echo -e "${GREEN}✓ Node.js installed: $(node -v)${NC}"
echo ""

echo -e "${YELLOW}Step 4: Installing PM2${NC}"
npm install -g pm2

echo -e "${GREEN}✓ PM2 installed${NC}"
echo ""

echo -e "${YELLOW}Step 5: Setting up firewall${NC}"
ufw --force enable
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw allow 80/tcp
ufw allow 443/tcp

echo -e "${GREEN}✓ Firewall configured${NC}"
echo ""

echo -e "${YELLOW}Step 6: Creating deployment user${NC}"
if ! id "deployer" &>/dev/null; then
    useradd -m -s /bin/bash deployer
    usermod -aG sudo deployer
    echo "deployer ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers.d/deployer
    echo -e "${GREEN}✓ User 'deployer' created${NC}"
else
    echo -e "${GREEN}✓ User 'deployer' already exists${NC}"
fi
echo ""

echo -e "${YELLOW}Step 7: Creating app directory${NC}"
mkdir -p /var/www/sweet-style-saver
chown -R deployer:deployer /var/www/sweet-style-saver

echo -e "${GREEN}✓ App directory created${NC}"
echo ""

echo -e "${YELLOW}Step 8: Cloning repository${NC}"
cd /var/www/sweet-style-saver

if [ -d ".git" ]; then
    echo "Repository exists, pulling latest changes..."
    sudo -u deployer git pull
else
    echo "Cloning repository..."
    sudo -u deployer git clone https://github.com/Ayvazyan86/sweet-style-saver.git .
fi

echo -e "${GREEN}✓ Repository cloned${NC}"
echo ""

echo -e "${YELLOW}Step 9: Installing Node modules${NC}"
cd /var/www/sweet-style-saver
sudo -u deployer npm install

echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

echo -e "${YELLOW}Step 10: Creating .env file${NC}"
cat > /var/www/sweet-style-saver/.env << 'EOF'
VITE_SUPABASE_PROJECT_ID="ishzwulmiixtuouisdyw"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzaHp3dWxtaWl4dHVvdWlzZHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0OTgwMDIsImV4cCI6MjA4MjA3NDAwMn0.agRcpuSAsb6MaRgH4FG_VYF-U2cXJin3CiLtRvcRFPU"
VITE_SUPABASE_URL="https://ishzwulmiixtuouisdyw.supabase.co"
EOF

chown deployer:deployer /var/www/sweet-style-saver/.env

echo -e "${GREEN}✓ Environment configured${NC}"
echo ""

echo -e "${YELLOW}Step 11: Building application${NC}"
cd /var/www/sweet-style-saver
sudo -u deployer npm run build

echo -e "${GREEN}✓ Application built${NC}"
echo ""

echo -e "${YELLOW}Step 12: Configuring Nginx${NC}"
cat > /etc/nginx/sites-available/sweet-style-saver << 'EOF'
server {
    listen 80;
    listen [::]:80;
    
    server_name 85.198.67.7;
    
    root /var/www/sweet-style-saver/dist;
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;
    
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
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/sweet-style-saver /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test nginx config
nginx -t

# Restart nginx
systemctl restart nginx
systemctl enable nginx

echo -e "${GREEN}✓ Nginx configured${NC}"
echo ""

echo -e "${YELLOW}Step 13: Setting up PM2 for preview server${NC}"
cd /var/www/sweet-style-saver
sudo -u deployer pm2 delete sweet-style-saver 2>/dev/null || true
sudo -u deployer PORT=8080 pm2 start npm --name "sweet-style-saver" -- run preview
sudo -u deployer pm2 save
pm2 startup systemd -u deployer --hp /home/deployer
sudo -u deployer pm2 save

echo -e "${GREEN}✓ PM2 configured${NC}"
echo ""

echo "======================================"
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo "======================================"
echo ""
echo "🌐 Application URL: http://85.198.67.7"
echo "📊 PM2 Status: pm2 status"
echo "📝 Nginx Status: systemctl status nginx"
echo "🔍 Logs: pm2 logs sweet-style-saver"
echo ""
echo "Next steps:"
echo "1. Point your domain to this IP: 85.198.67.7"
echo "2. Run SSL setup: certbot --nginx -d yourdomain.com"
echo ""
