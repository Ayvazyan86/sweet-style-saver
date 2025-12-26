import paramiko
import os

print("Uploading built files to server...")

# Connect
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('85.198.67.7', username='root', password='j8!RMiWztLw1')

# Setup server
print("Setting up server...")
stdin, stdout, stderr = c.exec_command('''
apt-get install -y nginx >/dev/null 2>&1
mkdir -p /var/www/app/dist
cat > /etc/nginx/sites-available/app << 'EOF'
server {
    listen 80;
    server_name ayvazyan-rekomenduet.ru www.ayvazyan-rekomenduet.ru;
    root /var/www/app/dist;
    index index.html;
    location / { try_files $uri $uri/ /index.html; }
}
EOF
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/app /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx
echo SETUP_DONE
''')
print(stdout.read().decode())

# Upload files via SFTP
print("Uploading files...")
sftp = c.open_sftp()

dist_dir = r'D:\PROJECT\sweet-style-saver\dist'
remote_dir = '/var/www/app/dist'

def upload_dir(local_dir, remote_dir):
    for item in os.listdir(local_dir):
        local_path = os.path.join(local_dir, item)
        remote_path = f"{remote_dir}/{item}"
        
        if os.path.isfile(local_path):
            print(f"  Uploading {item}...")
            sftp.put(local_path, remote_path)
        elif os.path.isdir(local_path):
            try:
                sftp.mkdir(remote_path)
            except:
                pass
            upload_dir(local_path, remote_path)

upload_dir(dist_dir, remote_dir)

sftp.close()
c.close()

print("\nDeployment COMPLETE!")
print("HTTP Check: http://ayvazyan-rekomenduet.ru")
print("\nNext step: Run 'python setup-ssl.py' to enable HTTPS")
