"""
Deploy Supabase Functions via Management API
"""
import requests
import os
import base64

PROJECT_REF = "ishzwulmiixtuouisdyw"
SUPABASE_ACCESS_TOKEN = os.getenv("SUPABASE_ACCESS_TOKEN", "")

if not SUPABASE_ACCESS_TOKEN:
    print("ERROR: SUPABASE_ACCESS_TOKEN environment variable not set!")
    print("Please get your access token from: https://supabase.com/dashboard/account/tokens")
    print("Then set it: $env:SUPABASE_ACCESS_TOKEN='your_token_here'")
    exit(1)

# Read function code
with open("supabase/functions/telegram-webhook/index.ts", "r", encoding="utf-8") as f:
    function_code = f.read()

# Deploy function
url = f"https://api.supabase.com/v1/projects/{PROJECT_REF}/functions/telegram-webhook"
headers = {
    "Authorization": f"Bearer {SUPABASE_ACCESS_TOKEN}",
    "Content-Type": "application/json"
}

payload = {
    "name": "telegram-webhook",
    "body": function_code,
    "verify_jwt": False
}

print("Deploying telegram-webhook function...")
response = requests.post(url, json=payload, headers=headers)

if response.status_code in [200, 201]:
    print("✅ Function deployed successfully!")
    print(f"URL: https://{PROJECT_REF}.supabase.co/functions/v1/telegram-webhook")
else:
    print(f"❌ Deployment failed: {response.status_code}")
    print(response.text)
