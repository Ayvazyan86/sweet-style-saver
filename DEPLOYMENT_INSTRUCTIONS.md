# 🚀 Server Deployment Instructions

## Server Details
- **IP:** 85.198.67.7
- **OS:** Ubuntu 24.04
- **User:** root
- **Password:** Il1oH0BlZ*r4

## Quick Deployment

### Option 1: Automatic (Recommended)

Connect to server via SSH and run the deployment script:

```bash
ssh root@85.198.67.7
# Enter password: Il1oH0BlZ*r4

# Download and run deployment script
curl -fsSL https://raw.githubusercontent.com/Ayvazyan86/sweet-style-saver/main/deploy-to-server.sh | bash
```

### Option 2: Manual Step-by-Step

1. **Connect to server:**
   ```bash
   ssh root@85.198.67.7
   ```

2. **Update system:**
   ```bash
   apt-get update && apt-get upgrade -y
   ```

3. **Install Node.js 20:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
   apt-get install -y nodejs
   ```

4. **Install dependencies:**
   ```bash
   apt-get install -y git nginx certbot python3-certbot-nginx
   npm install -g pm2
   ```

5. **Setup firewall:**
   ```bash
   ufw --force enable
   ufw allow OpenSSH
   ufw allow 'Nginx Full'
   ```

6. **Clone project:**
   ```bash
   mkdir -p /var/www/sweet-style-saver
   cd /var/www/sweet-style-saver
   git clone https://github.com/Ayvazyan86/sweet-style-saver.git .
   ```

7. **Install npm packages:**
   ```bash
   npm install
   ```

8. **Create .env file:**
   ```bash
   cat > .env << 'EOF'
   VITE_SUPABASE_PROJECT_ID="ishzwulmiixtuouisdyw"
   VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzaHp3dWxtaWl4dHVvdWlzZHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0OTgwMDIsImV4cCI6MjA4MjA3NDAwMn0.agRcpuSAsb6MaRgH4FG_VYF-U2cXJin3CiLtRvcRFPU"
   VITE_SUPABASE_URL="https://ishzwulmiixtuouisdyw.supabase.co"
   EOF
   ```

9. **Build application:**
   ```bash
   npm run build
   ```

10. **Configure Nginx:**
    ```bash
    cat > /etc/nginx/sites-available/sweet-style-saver << 'EOF'
    server {
        listen 80;
        server_name 85.198.67.7;
        root /var/www/sweet-style-saver/dist;
        index index.html;
        
        gzip on;
        gzip_types text/plain text/css application/javascript;
        
        location / {
            try_files $uri $uri/ /index.html;
        }
    }
    EOF
    
    ln -s /etc/nginx/sites-available/sweet-style-saver /etc/nginx/sites-enabled/
    rm /etc/nginx/sites-enabled/default
    nginx -t
    systemctl restart nginx
    ```

## After Deployment

### Access Application
```
http://85.198.67.7
```

### Check Status
```bash
systemctl status nginx
```

### View Logs
```bash
journalctl -u nginx -f
```

### Update Application
```bash
cd /var/www/sweet-style-saver
git pull
npm install
npm run build
systemctl restart nginx
```

## Setup SSL (Optional)

If you have a domain pointed to 85.198.67.7:

```bash
certbot --nginx -d yourdomain.com
```

## Troubleshooting

### Nginx not starting
```bash
nginx -t  # Check config
systemctl status nginx
journalctl -u nginx -n 50
```

### Application not loading
```bash
# Check if dist folder exists
ls -la /var/www/sweet-style-saver/dist

# Rebuild
cd /var/www/sweet-style-saver
npm run build
```

### Update Telegram Bot Mini App URL

Don't forget to update the Mini App URL in Telegram webhook function to point to your server:

Edit `supabase/functions/telegram-webhook/index.ts`:
```typescript
function getMiniAppUrl(): string {
  return 'http://85.198.67.7';  // Change this
}
```

Then redeploy the function to Supabase.
