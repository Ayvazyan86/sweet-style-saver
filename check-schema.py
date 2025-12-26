#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Проверка схемы базы данных
"""

import paramiko

SERVER = '85.198.67.7'
USER = 'root'
PASSWORD = 'j8!RMiWztLw1'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(SERVER, username=USER, password=PASSWORD, timeout=30)

# Проверяем структуру таблиц
tables = ['professions', 'categories', 'card_templates', 'settings']

for table in tables:
    print(f"\n=== {table} ===")
    commands = f"""
sudo -u postgres psql -d sweet_style_saver -c "\\d {table}"
"""
    stdin, stdout, stderr = ssh.exec_command(commands, timeout=30)
    stdout.channel.recv_exit_status()
    output = stdout.read().decode()
    print(output)

ssh.close()
