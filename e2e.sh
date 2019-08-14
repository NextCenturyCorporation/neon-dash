#!/bin/bash
MODE="${1}"

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
  if [[ ! -d "dist" ]]; then
    mkdir dist > /dev/null
  fi
  if [[ ! -d "node_modules/ts-node-2" ]]; then
    npm i --no-save ts-node
    mv node_modules/ts-node node_modules/ts-node-2
  fi
  if [[ ! -d "node_modules/protractor/node_modules/webdriver-manager/selenium" ]]; then
    npx webdriver-manager update
  fi
  in-docker "docker-compose --no-ansi up -d" 
  in-docker "(docker-compose --no-ansi logs -f > run.logs) &"
}

function teardown() {
  in-docker "docker-compose --no-ansi down"
  kill %1 2> /dev/null
  kill %2 2> /dev/null
}

function build() {
  log "Building UI: $@"
  rm dist/*.{html,css,js}
  ng build --delete-output-path=false --build-optimizer=false  $@ &
}

function find-newest() {
  find {$1,$2}/ -type f -printf '%T@ %p\n' | sort -n | tail -n1 | awk -F '[ /]' '{ print $'$3' }'
}

function protract() {
  log "Starting protractor"
  if [[ "$1" == "debug" ]]; then
    node --inspect-brk node_modules/.bin/protractor e2e/protractor.conf.debug.js
  else
    npx protractor e2e/protractor.conf.js
  fi
}

function wait-for-data() {
  log "Waiting for data to be available"
  until [[ $(curl -s "localhost:9199/_search?size=0&q=*" | jq -r .hits.total) -gt 0 ]];
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

function check-pre-reqs() {
  if ! (docker images | grep 'com.ncc.neon/server' > /dev/null); then
    echo 
    echo "  Please build the neon-server docker containers."
    echo "  run './gradlew docker' in the server root to install"
    echo 
    exit 1
  fi

  if (node --version |  grep '^v8.' > /dev/null); then
    echo 
    echo "  Please upgrade your node to version 10 or higher"
    echo 
    exit 1
  fi
}

check-pre-reqs

trap teardown EXIT

setup

if [[ -z "$MODE" ]]; then
  NEWEST_DIR=`find-newest src dist 2`
  if [[ "$NEWEST_DIR" == "src" ]]; then
    log "Re-Builiding UI"
    build --source-map=false --prod 2> /dev/null > /dev/null
  fi
  wait-for-data
  wait-for-dist

  protract
elif [[ "$MODE" == "watch" ]]; then 
  NEWEST_STAMP=`find-newest e2e dist 1`
  build --prod --watch=true
  wait-for-data
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
elif [[ "$MODE" == "debug" ]]; then 
  build
  wait-for-data
  wait-for-dist

  protract $MODE
fi