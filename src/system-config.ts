'use strict';

// SystemJS configuration file, see links for more information
// https://github.com/systemjs/systemjs
// https://github.com/systemjs/systemjs/blob/master/docs/config-api.md

/***********************************************************************************************
 * User Configuration.
 **********************************************************************************************/
/** Map relative paths to URLs. */
const map: any = {
  '@angular2-material': 'vendor/@angular2-material',
  'lodash': 'vendor/lodash',
  'rxjs': 'vendor/rxjs',
  'js-yaml': 'vendor/js-yaml',
  'hammerjs': 'vendor/hammerjs'
};

/** User packages configuration. */
const packages: any = {
  'lodash': {
    defaultExtension: 'js',
    format: 'cjs',
    main: 'lodash.js'
  },
  'js-yaml': {
    defaultExtension: 'js',
    format: 'cjs',
    main: 'index.js'
  }

};

/** Setup the angular material modules. */
const materialPkgs: string[] = [
  'button',
  'card',
  'checkbox',
  'core',
  'icon',
  'input',
  'list',
  'menu',
  'progress-circle',
  'radio',
  'sidenav',
  'tabs',
  'toolbar'
];

materialPkgs.forEach((pkg) => {
  packages[`@angular2-material/${pkg}`] = {main: `${pkg}.js`};
});

////////////////////////////////////////////////////////////////////////////////////////////////
/***********************************************************************************************
 * Everything underneath this line is managed by the CLI.
 **********************************************************************************************/
const barrels: string[] = [
  // Angular specific barrels.
  '@angular/core',
  '@angular/common',
  '@angular/compiler',
  '@angular/forms',
  '@angular/http',
  '@angular/router',
  '@angular/platform-browser',
  '@angular/platform-browser-dynamic',

  // Thirdparty barrels.
  'rxjs',

  // App specific barrels.
  'app',
  'app/shared',
  /** @cli-barrel */
];

const cliSystemConfigPackages: any = {};
barrels.forEach((barrelName: string) => {
  cliSystemConfigPackages[barrelName] = { main: 'index' };
});

/** Type declaration for ambient System. */
declare var System: any;

// Apply the CLI SystemJS configuration.
System.config({
  map: {
    '@angular': 'vendor/@angular',
    'rxjs': 'vendor/rxjs',
    'main': 'main.js'
  },
  packages: cliSystemConfigPackages
});

// Apply the user's configuration.
System.config({ map, packages });
