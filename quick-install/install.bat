@echo off
REM neon installation on docker

pushd %~dp0

echo 'loading neon-api image...'
docker load < neon-api.tar.gz

popd