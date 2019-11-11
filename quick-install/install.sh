#!/bin/sh
#neon installation on docker

scriptdir="$( cd "$( dirname "$0")" && pwd )"
echo 'loading neon-api image...'
docker load < "${scriptdir}"/neon-api.tar.gz
