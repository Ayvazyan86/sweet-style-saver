@echo off
echo ============================================
echo Automatic Server Deployment
echo ============================================
echo.
echo Server: 85.198.67.7
echo User: root
echo.
echo Connecting to server and deploying...
echo.

REM Download deployment script and execute on server
ssh root@85.198.67.7 "curl -fsSL https://raw.githubusercontent.com/Ayvazyan86/sweet-style-saver/main/deploy-to-server.sh | bash"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================
    echo Deployment Complete!
    echo ============================================
    echo.
    echo Application URL: http://85.198.67.7
    echo.
) else (
    echo.
    echo Deployment failed or SSH not available
    echo.
    echo Please run manually:
    echo 1. ssh root@85.198.67.7
    echo 2. Password: Il1oH0BlZ*r4
    echo 3. curl -fsSL https://raw.githubusercontent.com/Ayvazyan86/sweet-style-saver/main/deploy-to-server.sh ^| bash
    echo.
)

pause
