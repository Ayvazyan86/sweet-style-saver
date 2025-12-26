#!/usr/bin/env python3
"""Check and fix nginx HTTPS config"""
import paramiko

SERVER = '85.198.67.7'
USER = 'root'
PASSWORD = 'j8!RMiWztLw1'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(SERVER, username=USER, password=PASSWORD, timeout=30)

# Check current nginx config
print("Current nginx config:")
cmd = "cat /etc/nginx/sites-enabled/app"
stdin, stdout, stderr = ssh.exec_command(cmd, timeout=10)
stdout.channel.recv_exit_status()
print(stdout.read().decode())

# Test internal API
print("\n\nTest internal API:")
cmd = "curl -s http://localhost:3000/health"
stdin, stdout, stderr = ssh.exec_command(cmd, timeout=10)
stdout.channel.recv_exit_status()
print(stdout.read().decode())

# Test HTTPS via nginx
print("\n\nTest HTTPS via nginx (localhost):")
cmd = "curl -s https://localhost/api/health --insecure"
stdin, stdout, stderr = ssh.exec_command(cmd, timeout=10)
stdout.channel.recv_exit_status()
output = stdout.read().decode()
errors = stderr.read().decode()
print(output or errors or "(no output)")

ssh.close()
