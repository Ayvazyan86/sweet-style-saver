#!/usr/bin/env python3
"""
Interactive SSH Deployment Script
Connects to server and runs deployment step by step with live output
"""

import paramiko
import sys
import time

SERVER = "85.198.67.7"
USER = "root"
PASSWORD = "j8!RMiWztLw1"

def run_command(client, command, description):
    """Execute command and print output in real-time"""
    print(f"\n{'='*60}")
    print(f"📌 {description}")
    print(f"{'='*60}")
    print(f"$ {command}\n")
    
    stdin, stdout, stderr = client.exec_command(command, get_pty=True)
    
    # Read output line by line
    for line in stdout:
        print(line, end='')
        sys.stdout.flush()
    
    # Check errors
    errors = stderr.read().decode('utf-8')
    if errors:
        print(f"\n⚠️ Errors: {errors}")
    
    return stdout.channel.recv_exit_status()

def main():
    print("="*60)
    print("🚀 Starting Manual SSH Deployment")
    print("="*60)
    print(f"Server: {SERVER}")
    print(f"User: {USER}")
    
    try:
        # Connect
        print("\n🔐 Connecting to server...")
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        client.connect(SERVER, username=USER, password=PASSWORD, timeout=15)
        print("✅ Connected successfully!\n")
        
        # Step 1: Update system
        run_command(client, 
                   "apt-get update -qq && apt-get install -y curl git nginx",
                   "Step 1/7: Updating system and installing base packages")
        
        # Step 2: Install Node.js 20
        run_command(client,
                   "curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs",
                   "Step 2/7: Installing Node.js 20 LTS")
        
        # Step 3: Verify Node.js
        run_command(client,
                   "node --version && npm --version",
                   "Step 3/7: Verifying Node.js installation")
        
        # Step 4: Clone repository
        run_command(client,
                   "rm -rf /var/www/app && git clone https://github.com/Ayvazyan86/sweet-style-saver.git /var/www/app",
                   "Step 4/7: Cloning repository from GitHub")
        
        # Step 5: Create .env file
        env_content = '''VITE_SUPABASE_PROJECT_ID="ishzwulmiixtuouisdyw"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzaHp3dWxtaWl4dHVvdWlzZHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0OTgwMDIsImV4cCI6MjA4MjA3NDAwMn0.agRcpuSAsb6MaRgH4FG_VYF-U2cXJin3CiLtRvcRFPU"
VITE_SUPABASE_URL="https://ishzwulmiixtuouisdyw.supabase.co"'''
        
        run_command(client,
                   f"cd /var/www/app && cat > .env << 'EOF'\n{env_content}\nEOF\n&& cat .env",
                   "Step 5/7: Creating environment configuration")
        
        # Step 6: Install dependencies
        print("\n⏳ This step may take 2-3 minutes...")
        run_command(client,
                   "cd /var/www/app && npm install",
                   "Step 6/7: Installing npm packages")
        
        # Step 7: Build application
        print("\n⏳ This step may take 1-2 minutes...")
        run_command(client,
                   "cd /var/www/app && npm run build",
                   "Step 7/7: Building application")
        
        # Step 8: Configure Nginx
        nginx_config = '''server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
    root /var/www/app/dist;
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
}'''
        
        run_command(client,
                   f"cat > /etc/nginx/sites-available/app << 'EOF'\n{nginx_config}\nEOF",
                   "Step 8/7: Configuring Nginx")
        
        run_command(client,
                   "rm -f /etc/nginx/sites-enabled/default && ln -sf /etc/nginx/sites-available/app /etc/nginx/sites-enabled/ && nginx -t && systemctl enable nginx && systemctl restart nginx",
                   "Final: Starting Nginx web server")
        
        # Verify deployment
        run_command(client,
                   "curl -I http://localhost",
                   "Verification: Testing HTTP response")
        
        run_command(client,
                   "ls -lh /var/www/app/dist/index.html",
                   "Verification: Checking files")
        
        print("\n" + "="*60)
        print("✅ DEPLOYMENT COMPLETE!")
        print("="*60)
        print(f"\n🌐 Your application is now live at: http://{SERVER}")
        print("\n📊 Next steps:")
        print("   1. Open http://85.198.67.7 in your browser")
        print("   2. Test the Telegram Mini App")
        print("   3. Update telegram-webhook function with new URL")
        
        client.close()
        
    except paramiko.AuthenticationException:
        print("\n❌ Authentication failed! Check password.")
    except paramiko.SSHException as e:
        print(f"\n❌ SSH Error: {e}")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
