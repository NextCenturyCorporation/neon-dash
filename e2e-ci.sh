#!/bin/sh

set +e

ls node_modules/protractor/node_modules/webdriver-manager/selenium || npx webdriver-manager update

cp src/app/config/cicd/lorelei.config.yaml src/app/config/config.yaml
npm i --no-save express express-http-proxy ts-node
mv node_modules/ts-node node_modules/ts-node-2

node e2e/ci.server.js &

E2E_JUNIT=1 npx protractor e2e/protractor.conf.js

kill $(jobs -p) 0 2> /dev/null