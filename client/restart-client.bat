@echo off
setlocal

set "PID="
echo "Finding process listening on port 3001..."
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3001" ^| findstr "LISTENING"') do (
    set "PID=%%a"
)

if defined PID (
    echo "Process found with PID: %PID%"
    echo "Terminating process..."
    taskkill /F /PID %PID%
    echo "Process terminated."
) else (
    echo "No process found listening on port 3001."
)

echo "Starting client server..."
npm start

endlocal
