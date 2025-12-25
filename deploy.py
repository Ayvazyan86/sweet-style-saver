import paramiko

SERVER = "85.198.67.7"
USER = "root"
PASSWORD = "Il1oH0BlZ*r4"

commands = [
    "export DEBIAN_FRONTEND=noninteractive",
    "apt-get update -qq",
    "apt-get install -y nodejs npm git unzip",
    "npm install -g n",
    "n 20",
    "hash -r",
    "node --version",
    "mkdir -p /var/www/sweet-style-saver",
    "cd /var/www/sweet-style-saver",
    "pkill -9 git || true",
    "rm -rf /var/www/sweet-style-saver/*",
    "rm -rf /var/www/sweet-style-saver/.git",
    "git clone https://github.com/Ayvazyan86/sweet-style-saver.git /var/www/sweet-style-saver",
    "cd /var/www/sweet-style-saver",
    'cat > /var/www/sweet-style-saver/.env << EOF\nVITE_SUPABASE_PROJECT_ID="ishzwulmiixtuouisdyw"\nVITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzaHp3dWxtaWl4dHVvdWlzZHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0OTgwMDIsImV4cCI6MjA4MjA3NDAwMn0.agRcpuSAsb6MaRgH4FG_VYF-U2cXJin3CiLtRvcRFPU"\nVITE_SUPABASE_URL="https://ishzwulmiixtuouisdyw.supabase.co"\nEOF',
    "cd /var/www/sweet-style-saver && npm install",
    "cd /var/www/sweet-style-saver && npm run build",
]

nginx_config = '''cat > /etc/nginx/sites-available/sweet-style-saver << 'NGXEOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name 85.198.67.7 _;
    root /var/www/sweet-style-saver/dist;
    index index.html;
    gzip on;
    location / {
        try_files $uri $uri/ /index.html;
    }
}
NGXEOF'''

commands.append(nginx_config)
commands.append("rm -f /etc/nginx/sites-enabled/default")
commands.append("ln -sf /etc/nginx/sites-available/sweet-style-saver /etc/nginx/sites-enabled/")
commands.append("nginx -t && systemctl reload nginx")
commands.append("echo '✅ DEPLOYMENT COMPLETE! URL: http://85.198.67.7'")

print("🚀 Starting deployment...")
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SERVER, username=USER, password=PASSWORD)

# Execute all commands in one session
full_script = " && ".join(commands)
print(f"\n🔄 Executing deployment script...\n")
stdin, stdout, stderr = client.exec_command(full_script, get_pty=True)
for line in stdout:
    print(line, end='')

client.close()
print("\n\n✅ Done!")
