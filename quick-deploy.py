#!/usr/bin/env python3
"""Quick deploy of specific backend files"""
import paramiko
from scp import SCPClient

SERVER = '85.198.67.7'
USER = 'root'
PASSWORD = 'j8!RMiWztLw1'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(SERVER, username=USER, password=PASSWORD, timeout=30)

files = [
    ('backend/routes/professions.js', '/var/www/backend/routes/professions.js'),
    ('backend/routes/settings.js', '/var/www/backend/routes/settings.js'),
    ('backend/routes/card-templates.js', '/var/www/backend/routes/card-templates.js'),
]

with SCPClient(ssh.get_transport()) as scp:
    for local, remote in files:
        print(f"Uploading {local}...")
        scp.put(local, remote)

print("Restarting PM2...")
stdin, stdout, stderr = ssh.exec_command('pm2 restart backend')
stdout.channel.recv_exit_status()
print(stdout.read().decode())

ssh.close()
print("Done!")
