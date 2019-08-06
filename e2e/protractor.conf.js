/**
 * Copyright 2019 Next Century Corporation
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const {SpecReporter} = require('jasmine-spec-reporter');
const {JUnitXmlReporter} = require('jasmine-reporters');
const path = require('path');

exports.config = {
    allScriptsTimeout: 11000,
    specs: [
        '**/*.e2e-spec.ts'
    ],
    capabilities: {
        browserName: 'chrome',
        chromeOptions: {
            args: [
                '--disable-dev-shm-usage',
                '--headless',
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-gpu',
                '--disable-translate',
                '--disable-extensions',
                '--disable-background-timer-throttling',
                '--disable-renderer-backgrounding',
                '--remote-debugging-port=9222',
                '--proxy-server=\'direct://\'',
                '--proxy-bypass-list=*',
                '--window-size=1920x1080'
            ]
        }
    },
    directConnect: true,
    baseUrl: 'http://localhost:4199/',
    framework: 'jasmine',
    jasmineNodeOpts: {
        showColors: true,
        defaultTimeoutInterval: 30000,
        print: function () {}
    },
    skipSourceMapSupport: true,
    beforeLaunch: function () {
        require('ts-node-2').register({
            project: path.resolve(__dirname, 'tsconfig.e2e.json')
        });
    },
    onPrepare() {
        if (process.env.E2E_JUNIT) {
            let junitReporter = new JUnitXmlReporter({
                savePath: path.resolve(__dirname, '../reports/e2e'),
                consolidateAll: true
            });
            jasmine.getEnv().addReporter(junitReporter);
        } else {
            jasmine.getEnv().addReporter(new SpecReporter({spec: {displayStacktrace: true}}));
        }
    }
};
