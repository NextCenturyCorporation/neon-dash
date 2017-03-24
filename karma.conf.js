// Karma configuration file, see link for more information
// https://karma-runner.github.io/0.13/config/configuration-file.html

module.exports = function (config) {
    config.set({
        basePath: '',
        frameworks: ['jasmine', '@angular/cli'],
        plugins: [
            require('phantomjs-prebuilt'),
            require('karma-jasmine'),
            require('karma-chrome-launcher'),
            require('karma-jasmine-html-reporter'),
            require('karma-phantomjs-launcher'),
            require('karma-coverage-istanbul-reporter'),
            require('karma-junit-reporter'),
            require('@angular/cli/plugins/karma')
        ],
        files: [
            // Include support libraries and angular material
            { pattern: './src/test.ts', watched: false },
            // Pull in the neon-gtd version file.  Do NOT include it in the test rig via a <script> tag.
            { pattern: './src/app/config/version.json', watched: false, included: false }
        ],
        preprocessors: {
            './src/test.ts': ['@angular/cli']
        },
        coverageIstanbulReporter: {
            reports: [ 'html', 'lcovonly', 'cobertura-coverage' ],
            fixWebpackSourcePaths: true
        },
        angularCli: {
            config: './angular-cli.json',
            environment: 'dev'
        },
        mime: {
	       'text/x-typescript': ['ts','tsx']
        },
        reporters: ['progress', 'coverage-istanbul', 'junit'],
        junitReporter: {
            outputDir: 'reports/tests'
        },
        port: 9876,
        colors: true,
        logLevel: config.LOG_INFO,
        autoWatch: true,
        browsers: ['Chrome', 'PhantomJS'],
        singleRun: false,
        client: {
            captureConsole: true,
            clearContext: false
        }
    });
};
