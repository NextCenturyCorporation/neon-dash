@echo off
REM stops the neon system

pushd %~dp0

echo 'stopping neon system...'
docker-compose down

popd