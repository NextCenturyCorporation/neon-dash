#!/bin/sh
#installs and starts the neon system

scriptdir="$( cd "$( dirname "$0")" && pwd )"
"${scriptdir}"/install.sh

echo 'starting neon system...'
export NEON_DASH_DIST=./dist 
cd ${scriptdir}
docker-compose up -d

echo 'open your browser at http://localhost:4199'