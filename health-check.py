#!/usr/bin/env python3
"""Full system health check"""
import paramiko
import json

SERVER = '85.198.67.7'
USER = 'root'
PASSWORD = 'j8!RMiWztLw1'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(SERVER, username=USER, password=PASSWORD, timeout=30)

checks = [
    ("1. Nginx Status", "systemctl is-active nginx"),
    ("2. PM2 Status", "pm2 list"),
    ("3. PostgreSQL Status", "systemctl is-active postgresql"),
    ("4. Backend Logs (last 10)", "pm2 logs backend --lines 10 --nostream"),
    ("5. Disk Space", "df -h /"),
    ("6. Memory", "free -m"),
    ("7. API Health", "curl -s http://localhost:3000/health"),
    ("8. API Professions Count", "curl -s http://localhost:3000/api/professions | python3 -c \"import sys,json; d=json.load(sys.stdin); print(f'{len(d.get(\\\"data\\\",[]))} professions')\""),
    ("9. API Categories Count", "curl -s http://localhost:3000/api/categories | python3 -c \"import sys,json; d=json.load(sys.stdin); print(f'{len(d.get(\\\"data\\\",[]))} categories')\""),
    ("10. SSL Cert (if exists)", "openssl s_client -connect ayvazyan-rekomenduet.ru:443 -servername ayvazyan-rekomenduet.ru 2>/dev/null | openssl x509 -noout -dates 2>/dev/null || echo 'No HTTPS configured'"),
]

for name, cmd in checks:
    print(f"\n{'='*60}")
    print(f"📋 {name}")
    print('='*60)
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=15)
    stdout.channel.recv_exit_status()
    output = stdout.read().decode().strip()
    errors = stderr.read().decode().strip()
    print(output or errors or "(no output)")

ssh.close()
print("\n" + "="*60)
print("✅ HEALTH CHECK COMPLETE")
print("="*60)
