@echo off
REM installs and starts the neon system

pushd %~dp0

call install.bat

echo 'starting neon system...'
set NEON_DASH_DIST=./dist 
docker-compose up -d

popd

echo 'open your browser at http://localhost:4199'