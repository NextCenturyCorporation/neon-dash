#!/bin/bash
ES_PORT=9199
UI_PORT=4199
SB_PORT=8089

function log() {
  echo "$(date --iso-8601=seconds)" $1 > /dev/stderr
}

function in-docker() {
  pushd ./e2e/docker > /dev/null
  log "Running $1" 
  /bin/bash -c "$1" 2> /dev/null > /dev/null
  popd > /dev/null
}

function setup() {
  if [[ ! -d "node_modules/ts-node-2" ]]; then
    npm i --no-save ts-node
    mv node_modules/ts-ndoe node_modules/ts-node-2
  fi
  in-docker "docker-compose --no-ansi up -d" 
}

function teardown() {
  in-docker "docker-compose --no-ansi down"
  rm -rf node_modules/ts-node
  kill %1 2> /dev/null
}

function build() {
  log "Building UI: $@"
  rm -rf dist/*
  ng build --delete-output-path=false --build-optimizer=false --source-map=false $@ &
}

function find-newest() {
  find {$1,$2}/ -type f -printf '%T@ %p\n' | sort -n | tail -n1 | awk -F '[ /]' '{ print $'$3' }'
}

function protract() {
  log "Starting protractor"
  npx protractor e2e/protractor.conf.js
}

function wait-for-data() {
  log "Waiting for data to be available"
  until [[ $(curl -s "localhost:${ES_PORT}/_search?size=0&q=*" | jq -r .hits.total) -gt 0 ]];
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

trap teardown EXIT

WATCH="${1:-0}"

setup

if [[ "$WATCH" == "0" ]]; then
  NEWEST_DIR=`find-newest src dist 2`
  if [[ "$NEWEST_DIR" == "src" ]]; then
    log "Re-Builiding UI"
    build --prod  2> /dev/null > /dev/null
  fi
  wait-for-data
  wait-for-dist
  protract
else
  NEWEST_STAMP=`find-newest e2e dist 1`
  wait-for-data
  build --prod --watch=true &
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