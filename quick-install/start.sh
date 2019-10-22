#installs and starts the neon system

./install.sh

echo 'starting neon system...'
export NEON_DASH_DIST=./dist 
docker-compose up -d

echo 'open your browser at http://localhost:4199'