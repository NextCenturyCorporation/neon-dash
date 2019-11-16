#!/bin/sh
#stops the neon system

scriptdir="$( cd "$( dirname "$0")" && pwd )"

echo 'stopping neon system...'
cd ${scriptdir}
docker-compose down