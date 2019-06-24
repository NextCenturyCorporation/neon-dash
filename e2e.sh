#!/bin/bash

NEWEST_DIR=`find {src,dist}/ -type f -printf '%T@ %p\n' | sort -n | tail -n1 | awk -F '[ /]' '{ print $2 }'`

function log() {
  echo "$(date --iso-8601=seconds)" $1 > /dev/stderr
}

function in-docker() {
  pushd ./e2e/docker > /dev/null
  log "Running $1" 
  /bin/bash -c "$1" 2> /dev/null > /dev/null
  popd > /dev/null
}

function cleanup() {
  in-docker "docker-compose --no-ansi down"
}

trap cleanup EXIT

if [[ "$NEWEST_DIR" == "src" ]]; then
  log "Re-Builiding UI"
  npm run build-e2e 2> /dev/null > /dev/null
fi

in-docker "docker-compose --no-ansi up -d" 

log "Waiting for data to be avallble"
until [[ $(curl -s 'localhost:9200/_search?size=0&q=*' | jq -r .hits.total) -gt 0 ]];
do
  sleep .5
done

log "Starting protractor"
npx protractor protractor.conf.js