#!/bin/sh
ls node_modules/protractor/node_modules/webdriver-manager/selenium || (npx webdriver-manager clean && npx webdriver-manager update --versions.chrome=75.0.3770.80)

cp src/app/config/cicd/lorelei.config.yaml src/app/config/config.yaml
npm i --no-save express express-http-proxy ts-node
mv node_modules/ts-node node_modules/ts-node-2

node e2e/ci.server.js &

E2E_JUNIT=1 npx protractor e2e/protractor.conf.js

exit 0
