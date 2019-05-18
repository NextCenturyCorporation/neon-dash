// Karma configuration file, see link for more information
// https://karma-runner.github.io/0.13/config/configuration-file.html

module.exports = function (config) {
    config.set({
        basePath: '',
        frameworks: ['jasmine', '@angular/cli'],
        plugins: [
            require('karma-jasmine'),
            require('karma-chrome-launcher'),
            require('karma-firefox-launcher'),
            require('karma-jasmine-html-reporter'),
            require('karma-remap-istanbul'),
            require('karma-junit-reporter'),
            require('@angular/cli/plugins/karma')
        ],
        files: [
            // Include support libraries and angular material
            { pattern: './src/test.ts', watched: false },
            // Required by Angular
            'node_modules/@angular/material/prebuilt-themes/purple-green.css'
        ],
        preprocessors: {
            './src/test.ts': ['@angular/cli']
        },
        angularCli: {
            config: './angular-cli.json',
            environment: 'dev'
        },
        mime: {
            'text/x-typescript': ['ts','tsx']
        },
        junitReporter: {
            outputDir: 'reports/tests'
        },
        remapIstanbulReporter: {
            reports: {
                html: 'reports/coverage',
                lcovonly: './reports/coverage/coverage.lcov',
                // Include cobertura reports for Jenkins
                cobertura: './reports/coverage/cobertura-coverage.xml'
            }
        },
        reporters: ['progress', 'karma-remap-istanbul', 'junit'],
        browserDisconnectTimeout: 60000,
        browserDisconnectTolerance: 3,
        browserNoActivityTimeout: 100000,
        port: 9876,
        colors: true,
        logLevel: config.LOG_INFO,
        autoWatch: false,
        browsers: ['ChromeHeadless', 'FirefoxHeadless'],
        customLaunchers: {
            FirefoxHeadless: {
                base: 'Firefox',
                flags: [ '-headless' ],
              },
        },
        singleRun: true,
        client: {
            captureConsole: true,
            clearContext: false
        }
    });
};
