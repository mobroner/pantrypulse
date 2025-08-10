@echo off
cd server
call npm install
cd ..
taskkill /F /IM node.exe /T
cd client
call npm install
start npm start
cd ..
cd server
start npm run dev
