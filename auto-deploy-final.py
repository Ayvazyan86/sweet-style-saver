#!/usr/bin/env python3
"""
Final automatic deployment with password automation
"""
import subprocess
import sys
import time

SERVER = "85.198.67.7"
USER = "root"
PASSWORD = "Il1oH0BlZ*r4"
DEPLOY_URL = "https://raw.githubusercontent.com/Ayvazyan86/sweet-style-saver/main/redeploy-clean.sh"

print("=" * 50)
print("🚀 Automatic Clean Deployment")
print("=" * 50)
print(f"\n📡 Server: {SERVER}")
print(f"👤 User: {USER}\n")
print("⏳ Starting deployment (5-7 minutes)...\n")

# Try using pexpect if available
try:
    import pexpect
    
    cmd = f'ssh -o StrictHostKeyChecking=no {USER}@{SERVER} "curl -fsSL {DEPLOY_URL} | bash"'
    child = pexpect.spawn(cmd, encoding='utf-8')
    
    # Wait for password prompt
    i = child.expect(['password:', pexpect.EOF, pexpect.TIMEOUT], timeout=10)
    if i == 0:
        child.sendline(PASSWORD)
        
        # Monitor output
        while True:
            try:
                line = child.readline()
                if not line:
                    break
                print(line, end='')
                sys.stdout.flush()
            except:
                break
        
        child.wait()
        
        if child.exitstatus == 0:
            print("\n" + "=" * 50)
            print("✅ DEPLOYMENT SUCCESSFUL!")
            print("=" * 50)
            print(f"\n🌐 Application: http://{SERVER}\n")
            sys.exit(0)
        else:
            print("\n⚠️ Deployment may have issues")
            sys.exit(1)
    else:
        print("❌ Could not connect to server")
        sys.exit(1)
        
except ImportError:
    print("⚠️ pexpect not available, trying paramiko...")
    
    try:
        import paramiko
        
        # Create SSH client
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        
        print("🔐 Connecting to server...")
        client.connect(SERVER, username=USER, password=PASSWORD, timeout=10)
        
        print("✓ Connected")
        print("📥 Running deployment script...\n")
        
        # Execute deployment
        stdin, stdout, stderr = client.exec_command(
            f'curl -fsSL {DEPLOY_URL} | bash',
            get_pty=True
        )
        
        # Stream output
        for line in stdout:
            print(line, end='')
            sys.stdout.flush()
        
        # Check errors
        errors = stderr.read().decode()
        if errors and 'error' in errors.lower():
            print(f"\n⚠️ Errors: {errors}")
        
        client.close()
        
        print("\n" + "=" * 50)
        print("✅ DEPLOYMENT COMPLETE!")
        print("=" * 50)
        print(f"\n🌐 Application: http://{SERVER}")
        print("\nPlease verify by opening the URL in browser.\n")
        sys.exit(0)
        
    except ImportError:
        print("\n❌ Neither pexpect nor paramiko available")
        print("\n📋 Please install one:")
        print("   pip install pexpect")
        print("   OR")
        print("   pip install paramiko")
        print("\n Or run manually:")
        print(f'   ssh {USER}@{SERVER} "curl -fsSL {DEPLOY_URL} | bash"')
        print(f"   Password: {PASSWORD}\n")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("\n📋 Manual deployment:")
        print(f'   ssh {USER}@{SERVER}')
        print(f"   Password: {PASSWORD}")
        print(f'   curl -fsSL {DEPLOY_URL} | bash\n')
        sys.exit(1)
