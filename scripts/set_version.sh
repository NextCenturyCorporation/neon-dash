#!/bin/bash

# Get the current directory (in a safe / consistent way)
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

cd $DIR/..
pwd

#assign variable
ngVersion=($(jq -r '.version' package.json | cut -c1-5))

gitId=$(git rev-parse HEAD | cut -c1-8)

curDate=`date +%Y-%m-%d` 

#concatenate variables
FULL="${ngVersion}-SNAPSHOT-${gitId}-${curDate}"
echo "{\"name\":\"neon-gtd\",\"version\":\""$FULL"\"}" > ./src/app/config/version.json


