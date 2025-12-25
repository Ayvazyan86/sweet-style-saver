import paramiko

SERVER = "85.198.67.7"
USER = "root"
PASSWORD = "j8!RMiWztLw1"
DOMAIN = "ayvazyan-rekomenduet.ru"

print("Setting up SSL certificate for HTTPS...")

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(SERVER, username=USER, password=PASSWORD)

cmd = f'''
set -e

echo "Installing Certbot..."
apt-get update -qq
apt-get install -y certbot python3-certbot-nginx

echo "Obtaining SSL certificate..."
certbot --nginx -d {DOMAIN} -d www.{DOMAIN} --non-interactive --agree-tos --email admin@{DOMAIN} --redirect

echo "Testing auto-renewal..."
certbot renew --dry-run

echo "=== SSL SETUP COMPLETE ==="
echo "HTTPS URL: https://{DOMAIN}"
curl -I https://{DOMAIN} | head -5
'''

print("Running SSL setup...")
stdin, stdout, stderr = c.exec_command(cmd, get_pty=True)

for line in stdout:
    print(line, end='')

c.close()
print("\n\nDone! HTTPS should now work.")
print(f"Test: https://{DOMAIN}")
