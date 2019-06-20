// Karma configuration file, see link for more information
// https://karma-runner.github.io/0.13/config/configuration-file.html

module.exports = function (config) {
    config.set({
        basePath: '',
        frameworks: ['jasmine', '@angular-devkit/build-angular'],
        plugins: [
            require('karma-jasmine'),
	    require('karma-verbose-reporter'),
            require('karma-chrome-launcher'),
            require('karma-firefox-launcher'),
            require('karma-jasmine-html-reporter'),
            require('@angular-devkit/build-angular/plugins/karma')
        ],
        files: [
            // Include support libraries and angular material
            
            // Required by Angular
            'node_modules/@angular/material/prebuilt-themes/purple-green.css'
        ],
        preprocessors: {
            
        },
        
        mime: {
            'text/x-typescript': ['ts','tsx']
        },
        reporters: ['progress'],
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
