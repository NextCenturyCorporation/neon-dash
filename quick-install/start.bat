@echo off
REM installs and starts the neon system

call install.bat

echo 'starting neon system...'
docker-compose up -d

echo 'open your browser at http://localhost:4199'