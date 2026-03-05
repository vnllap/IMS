@echo off
echo ========================================
echo Supply Office Inventory System
echo ========================================
echo.

REM Check if node_modules exists
if not exist "node_modules\" (
    echo Installing dependencies...
    echo This will take a few minutes on first run.
    echo.
    call npm install
    echo.
    echo Installation complete!
    echo.
)

echo Starting Supply Office Inventory System...
echo.
call npm start
