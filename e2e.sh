#!/bin/bash

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
  kill %1 2> /dev/null
}

function build() {
  log "Building UI: $@"
  rm -rf dist/*
  ng build --delete-output-path=false --prod --source-map=false --build-optimizer=false $@ &
}

function find-newest() {
  find {$1,$2}/ -type f -printf '%T@ %p\n' | sort -n | tail -n1 | awk -F '[ /]' '{ print $'$3' }'
}

function protract() {
  log "Starting protractor"
  npx protractor protractor.conf.js
}

function wait-for-data() {
  log "Waiting for data to be available"
  until [[ $(curl -s 'localhost:9200/_search?size=0&q=*' | jq -r .hits.total) -gt 0 ]];
  do
    sleep .5
  done
}

function wait-for-dist() {
  log "Waiting for dist to be available"
  until ls dist/index.html 2> /dev/null > /dev/null;
  do
    sleep .5
  done
}

trap cleanup EXIT

WATCH="${1:-0}"

in-docker "docker-compose --no-ansi up -d" 

if [[ "$WATCH" == "0" ]]; then
  NEWEST_DIR=`find-newest src dist 2`
  if [[ "$NEWEST_DIR" == "src" ]]; then
    log "Re-Builiding UI"
    build  2> /dev/null > /dev/null
  fi
  wait-for-data
  wait-for-dist
  protract
else
  NEWEST_STAMP=`find-newest e2e dist 1`
  wait-for-data
  build --watch=true &
  wait-for-dist

  while true; do
    LATEST_STAMP=`find-newest e2e dist 1`
    if [[ ! "$NEWEST_STAMP" == "$LATEST_STAMP" ]]; then
      NEWEST_STAMP="$LATEST_STAMP"
      protract
    else 
      sleep 1
    fi 
  done
fi 