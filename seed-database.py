#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Проверка и наполнение базы данных начальными данными
"""

import paramiko

SERVER = '85.198.67.7'
USER = 'root'
PASSWORD = 'j8!RMiWztLw1'

print("\n" + "="*70)
print("🔍 ПРОВЕРКА И НАПОЛНЕНИЕ БАЗЫ ДАННЫХ")
print("="*70)

try:
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print("\n🔌 Подключение к серверу...")
    ssh.connect(SERVER, username=USER, password=PASSWORD, timeout=30)
    print("   ✅ Подключено")

    # 1. Проверка текущего состояния базы
    print("\n1️⃣  Проверка таблиц в базе...")
    commands = """
sudo -u postgres psql -d sweet_style_saver -c "
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
"
"""
    stdin, stdout, stderr = ssh.exec_command(commands, timeout=30)
    stdout.channel.recv_exit_status()
    output = stdout.read().decode()
    print(output)

    # 2. Проверка данных в professions
    print("\n2️⃣  Проверка данных в professions...")
    commands = """
sudo -u postgres psql -d sweet_style_saver -c "SELECT COUNT(*) FROM professions;"
"""
    stdin, stdout, stderr = ssh.exec_command(commands, timeout=30)
    stdout.channel.recv_exit_status()
    output = stdout.read().decode()
    print(output)

    # 3. Добавление начальных данных
    print("\n3️⃣  Добавление начальных данных...")
    commands = """
sudo -u postgres psql -d sweet_style_saver << 'EOF'

-- Категории
INSERT INTO categories (id, name, description, icon, sort_order, is_active) VALUES
('22222222-2222-2222-2222-222222222201', 'Недвижимость', 'Услуги в сфере недвижимости', 'building', 1, true),
('22222222-2222-2222-2222-222222222202', 'Страхование', 'Страховые услуги', 'shield', 2, true),
('22222222-2222-2222-2222-222222222203', 'Юридические услуги', 'Юридическая помощь', 'scale', 3, true),
('22222222-2222-2222-2222-222222222204', 'Финансы', 'Финансовые услуги', 'wallet', 4, true),
('22222222-2222-2222-2222-222222222205', 'Ипотека', 'Ипотечное кредитование', 'home', 5, true),
('22222222-2222-2222-2222-222222222206', 'Оценка', 'Оценка имущества', 'clipboard', 6, true)
ON CONFLICT (id) DO NOTHING;

-- Профессии (с привязкой к категориям)
INSERT INTO professions (id, name, category_id, sort_order, is_active) VALUES
('11111111-1111-1111-1111-111111111101', 'Риэлтор', '22222222-2222-2222-2222-222222222201', 1, true),
('11111111-1111-1111-1111-111111111102', 'Страховой агент', '22222222-2222-2222-2222-222222222202', 2, true),
('11111111-1111-1111-1111-111111111103', 'Юрист', '22222222-2222-2222-2222-222222222203', 3, true),
('11111111-1111-1111-1111-111111111104', 'Бухгалтер', '22222222-2222-2222-2222-222222222204', 4, true),
('11111111-1111-1111-1111-111111111105', 'Финансовый консультант', '22222222-2222-2222-2222-222222222204', 5, true),
('11111111-1111-1111-1111-111111111106', 'Нотариус', '22222222-2222-2222-2222-222222222203', 6, true),
('11111111-1111-1111-1111-111111111107', 'Ипотечный брокер', '22222222-2222-2222-2222-222222222205', 7, true),
('11111111-1111-1111-1111-111111111108', 'Оценщик', '22222222-2222-2222-2222-222222222206', 8, true)
ON CONFLICT (id) DO NOTHING;

-- Шаблоны карточек
INSERT INTO card_templates (id, name, image_url, description, sort_order, is_active) VALUES
('33333333-3333-3333-3333-333333333301', 'Классический', '/templates/classic.png', 'Классический дизайн визитки', 1, true),
('33333333-3333-3333-3333-333333333302', 'Современный', '/templates/modern.png', 'Современный минималистичный стиль', 2, true),
('33333333-3333-3333-3333-333333333303', 'Минимализм', '/templates/minimalist.png', 'Простой и элегантный', 3, true)
ON CONFLICT (id) DO NOTHING;

-- Настройки приложения
INSERT INTO settings (id, key, value, description) VALUES
('44444444-4444-4444-4444-444444444401', 'site_name', 'Айвазян Рекомендует', 'Название сайта'),
('44444444-4444-4444-4444-444444444402', 'admin_email', 'admin@ayvazyan-rekomenduet.ru', 'Email администратора'),
('44444444-4444-4444-4444-444444444403', 'telegram_channel', '@av_rekomenduet', 'Telegram канал'),
('44444444-4444-4444-4444-444444444404', 'max_photos', '5', 'Максимум фото для партнера')
ON CONFLICT (key) DO NOTHING;

EOF
"""
    
    stdin, stdout, stderr = ssh.exec_command(commands, timeout=60)
    stdout.channel.recv_exit_status()
    output = stdout.read().decode()
    errors = stderr.read().decode()
    print(output)
    if errors:
        print(f"Stderr: {errors}")

    # 4. Проверка данных после вставки
    print("\n4️⃣  Проверка данных после вставки...")
    commands = """
sudo -u postgres psql -d sweet_style_saver -c "
SELECT 'professions' as table_name, COUNT(*) as count FROM professions
UNION ALL
SELECT 'categories', COUNT(*) FROM categories
UNION ALL
SELECT 'card_templates', COUNT(*) FROM card_templates
UNION ALL
SELECT 'app_settings', COUNT(*) FROM app_settings;
"
"""
    stdin, stdout, stderr = ssh.exec_command(commands, timeout=30)
    stdout.channel.recv_exit_status()
    output = stdout.read().decode()
    print(output)

    # 5. Тест API
    print("\n5️⃣  Тест API после наполнения данных...")
    commands = """
curl -s http://localhost:3000/api/professions | python3 -c "import sys, json; data=json.load(sys.stdin); print(f'Professions: {len(data.get(\"data\", []))} записей')"
curl -s http://localhost:3000/api/categories | python3 -c "import sys, json; data=json.load(sys.stdin); print(f'Categories: {len(data.get(\"data\", []))} записей')"
"""
    stdin, stdout, stderr = ssh.exec_command(commands, timeout=30)
    stdout.channel.recv_exit_status()
    output = stdout.read().decode()
    print(output)

    ssh.close()

    print("\n" + "="*70)
    print("✅ ПРОВЕРКА ЗАВЕРШЕНА!")
    print("="*70 + "\n")

except paramiko.SSHException as e:
    print(f"\n❌ Ошибка SSH: {e}")
except Exception as e:
    print(f"\n❌ Ошибка: {e}")
