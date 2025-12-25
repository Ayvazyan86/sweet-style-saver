#!/usr/bin/env python3
"""
Automatic deployment script for Sweet Style Saver
Connects to server via SSH and deploys the application
"""

import subprocess
import sys
import time

SERVER = "85.198.67.7"
USER = "root"
PASSWORD = "Il1oH0BlZ*r4"

DEPLOYMENT_COMMANDS = """
set -e
echo "🚀 Starting automated deployment..."

# Update system
echo "📦 Step 1/13: Updating system..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq > /dev/null 2>&1
apt-get upgrade -y -qq > /dev/null 2>&1
echo "✓ System updated"

# Install basic dependencies
echo "📦 Step 2/13: Installing dependencies..."
apt-get install -y -qq curl git ufw nginx certbot python3-certbot-nginx > /dev/null 2>&1
echo "✓ Dependencies installed"

# Install Node.js 20
echo "📦 Step 3/13: Installing Node.js 20..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
    apt-get install -y nodejs > /dev/null 2>&1
fi
NODE_VERSION=$(node -v)
echo "✓ Node.js installed: $NODE_VERSION"

# Install PM2
echo "📦 Step 4/13: Installing PM2..."
npm install -g pm2 > /dev/null 2>&1
echo "✓ PM2 installed"

# Setup firewall
echo "🔒 Step 5/13: Configuring firewall..."
ufw --force enable > /dev/null 2>&1
ufw allow OpenSSH > /dev/null 2>&1
ufw allow 'Nginx Full' > /dev/null 2>&1
ufw allow 80/tcp > /dev/null 2>&1
ufw allow 443/tcp > /dev/null 2>&1
echo "✓ Firewall configured"

# Create deployer user
echo "👤 Step 6/13: Creating deployer user..."
if ! id "deployer" &>/dev/null; then
    useradd -m -s /bin/bash deployer
    usermod -aG sudo deployer
    mkdir -p /etc/sudoers.d
    echo "deployer ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/deployer
    chmod 0440 /etc/sudoers.d/deployer
fi
echo "✓ Deployer user ready"

# Create app directory
echo "📁 Step 7/13: Creating app directory..."
mkdir -p /var/www/sweet-style-saver
chown -R deployer:deployer /var/www/sweet-style-saver
echo "✓ Directory created"

# Clone repository
echo "📥 Step 8/13: Cloning repository..."
cd /var/www/sweet-style-saver
if [ -d ".git" ]; then
    sudo -u deployer git pull > /dev/null 2>&1
else
    sudo -u deployer git clone https://github.com/Ayvazyan86/sweet-style-saver.git . > /dev/null 2>&1
fi
echo "✓ Repository cloned"

# Install npm packages
echo "📦 Step 9/13: Installing npm packages (this may take a while)..."
cd /var/www/sweet-style-saver
sudo -u deployer npm install --loglevel=error > /dev/null 2>&1
echo "✓ Packages installed"

# Create .env file
echo "⚙️  Step 10/13: Configuring environment..."
cat > /var/www/sweet-style-saver/.env << 'ENVEOF'
VITE_SUPABASE_PROJECT_ID="ishzwulmiixtuouisdyw"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzaHp3dWxtaWl4dHVvdWlzZHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0OTgwMDIsImV4cCI6MjA4MjA3NDAwMn0.agRcpuSAsb6MaRgH4FG_VYF-U2cXJin3CiLtRvcRFPU"
VITE_SUPABASE_URL="https://ishzwulmiixtuouisdyw.supabase.co"
ENVEOF
chown deployer:deployer /var/www/sweet-style-saver/.env
echo "✓ Environment configured"

# Build application
echo "🔨 Step 11/13: Building application..."
cd /var/www/sweet-style-saver
sudo -u deployer npm run build > /dev/null 2>&1
echo "✓ Application built"

# Configure Nginx
echo "⚙️  Step 12/13: Configuring Nginx..."
cat > /etc/nginx/sites-available/sweet-style-saver << 'NGINXEOF'
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
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;
    
    # SPA routing
    location / {
        try_files \\$uri \\$uri/ /index.html;
    }
    
    # Cache static assets
    location ~* \\.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
NGINXEOF

ln -sf /etc/nginx/sites-available/sweet-style-saver /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t > /dev/null 2>&1
systemctl restart nginx
systemctl enable nginx > /dev/null 2>&1
echo "✓ Nginx configured and started"

# Final check
echo "✅ Step 13/13: Verifying deployment..."
if systemctl is-active --quiet nginx; then
    echo "✓ Nginx is running"
else
    echo "⚠ Nginx failed to start"
    systemctl status nginx
    exit 1
fi

if [ -d "/var/www/sweet-style-saver/dist" ]; then
    echo "✓ Application files are present"
else
    echo "⚠ Dist folder not found"
    exit 1
fi

echo ""
echo "======================================"
echo "✅ DEPLOYMENT SUCCESSFUL!"
echo "======================================"
echo ""
echo "🌐 Application URL: http://85.198.67.7"
echo "📊 Nginx status: systemctl status nginx"
echo "📝 Nginx logs: journalctl -u nginx -f"
echo ""
echo "Next steps:"
echo "1. Open http://85.198.67.7 in your browser"
echo "2. Update Telegram Mini App URL to: http://85.198.67.7"
echo "3. (Optional) Setup domain and SSL certificate"
echo ""
"""

def main():
    print("=" * 50)
    print("🚀 Automatic Server Deployment")
    print("=" * 50)
    print(f"\n📡 Server: {SERVER}")
    print(f"👤 User: {USER}")
    print("\n⚠️  This will deploy the application to the server")
    print("   Estimated time: 3-5 minutes\n")
    
    # Create SSH command with password authentication using sshpass
    print("🔐 Connecting to server...")
    
    # Try using plink (PuTTY) if available on Windows
    try:
        # Save script to temp file
        import tempfile
        import os
        
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.sh') as f:
            f.write(DEPLOYMENT_COMMANDS)
            script_path = f.name
        
        # Try different SSH methods
        methods = [
            # Method 1: Using plink (PuTTY)
            ['plink', '-batch', '-pw', PASSWORD, f'{USER}@{SERVER}', f'bash -s < {script_path}'],
            # Method 2: Using ssh with sshpass
            ['sshpass', '-p', PASSWORD, 'ssh', '-o', 'StrictHostKeyChecking=no', f'{USER}@{SERVER}', 'bash -s'],
        ]
        
        success = False
        for i, cmd in enumerate(methods, 1):
            try:
                print(f"Trying connection method {i}...")
                if i == 2:
                    # For sshpass, pipe the script
                    process = subprocess.Popen(
                        cmd,
                        stdin=subprocess.PIPE,
                        stdout=subprocess.PIPE,
                        stderr=subprocess.PIPE,
                        text=True
                    )
                    stdout, stderr = process.communicate(input=DEPLOYMENT_COMMANDS)
                else:
                    process = subprocess.run(
                        cmd,
                        capture_output=True,
                        text=True,
                        timeout=600  # 10 minutes timeout
                    )
                    stdout = process.stdout
                    stderr = process.stderr
                
                if process.returncode == 0 or "DEPLOYMENT SUCCESSFUL" in stdout:
                    print("\n" + stdout)
                    success = True
                    break
                    
            except FileNotFoundError:
                continue
            except Exception as e:
                print(f"Method {i} failed: {e}")
                continue
        
        # Cleanup
        try:
            os.unlink(script_path)
        except:
            pass
            
        if not success:
            print("\n⚠️  Automatic SSH connection failed.")
            print("\n📋 Please run these commands manually:\n")
            print(f"1. Connect to server:")
            print(f"   ssh {USER}@{SERVER}")
            print(f"   Password: {PASSWORD}\n")
            print(f"2. Run deployment:")
            print(f"   curl -fsSL https://raw.githubusercontent.com/Ayvazyan86/sweet-style-saver/main/deploy-to-server.sh | bash\n")
            return 1
            
        return 0
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("\n📋 Manual deployment instructions:")
        print(f"\n1. Open terminal and connect:")
        print(f"   ssh {USER}@{SERVER}")
        print(f"   Password: {PASSWORD}")
        print(f"\n2. Run this command:")
        print(f"   curl -fsSL https://raw.githubusercontent.com/Ayvazyan86/sweet-style-saver/main/deploy-to-server.sh | bash")
        return 1

if __name__ == "__main__":
    sys.exit(main())
