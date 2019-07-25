# Neon Dashboard

The Neon Dashboard is a big data exploration and visualization user interface.

## Prerequisites

* Install [Node and NPM](https://nodejs.org/en/)
* Install [Elasticsearch 6.4+](https://www.elastic.co/products/elasticsearch)
* Install [elasticdump](https://www.npmjs.com/package/elasticdump) with `npm install -g elasticdump`
* Install [Apache Tomcat](http://tomcat.apache.org/) if not deploying with Docker
* Install the [Neon Server](https://github.com/NextCenturyCorporation/neon-server)
* (Optional) Install the [Angular CLI](https://github.com/angular/angular-cli) with `npm install -g @angular/cli`

## Step-by-Step Production Installation Documentation

See the page [here](./STEP_BY_STEP_INSTALLATION.md).  Requires a sample data bundle provided by the development team.

## Configure the Neon Dashboard

Create a Neon Dashboard config file at `src/app/config/config.json` or `src/app/config/config.yaml`.  See the [Neon Dashboard Configuration Guide](./DASHBOARD_CONFIGURATION_GUIDE.md) for more information.

## Build and Run the Neon Dashboard Locally

To build the Neon Dashboard: `npm install`

Copy the [sample proxy config file](./sample.proxy.conf.json) to `./proxy.conf.json` and change the port if your Neon Server will not run on port 8080 (the default).

To start the Neon Dashboard, first start the Neon Server, then run: `npm start`

This will start the Neon Dashboard on http://localhost:4200 and should auto-reload the page whenever you modify a file.

To see anything useful, you will need to ingest data into your datastore(s).

## Unit Test and Lint

To start the unit tests and linters, run: `npm test`

## Unit Test

To start just the unit tests, run: `npm run-script unit-test`

The unit tests are run using a [Karma config file](./karma.conf.js).  The unit tests are written with [Jasmine](https://jasmine.github.io/).

## Lint

To start just the linters, run: `npm run-script lint`

The linters use the following libraries:
- [ESLint](https://eslint.org/) and [TypeScript ESLint](https://github.com/typescript-eslint/typescript-eslint)
- [JS Beautify](https://github.com/beautify-web/js-beautify) (HTML only)
- [Sass Lint](https://github.com/sasstools/sass-lint) and [Sass Lint Auto Fix](https://github.com/srowhani/sass-lint-auto-fix)

The linters are run using the following files:
- [.eslintrc.yml](./.eslintrc.yml)
- [.jsbeautifyrc](./.jsbeautifyrc)
- [sass-lint.yaml](./sass-lint.yaml) and [sass-lint-auto-fix.yaml](./sass-lint-auto-fix.yaml)

## Deploy as WAR

To build the Neon Dashboard as a WAR (replacing "whatever" with your custom WAR name):

        npm run-script build whatever

Your WAR name should also be your Apache Tomcat deployment URL.  For example, the command above would generate `target/whatever.war` for you to copy into your Apache Tomcat `webapps` directory and access the Neon Dashboard at `http://hostname:port/whatever`.

Note:  This command will build the dashboard for a production environment (`--prod`) and using the ahead-of-time compiler option (`--aot`) to improve runtime performance.

## Deploy as Docker Image

To build the Neon Dashboard and run it as a Docker Image:

        npm run-script build
        docker-compose up

Now you can view the Neon Dashboard at http://localhost:4100

## Apache 2 Open Source License

Neon and  are made available by [Next Century](http://www.nextcentury.com) under the [Apache 2 Open Source License](http://www.apache.org/licenses/LICENSE-2.0.txt). You may freely download, use, and modify, in whole or in part, the source code or release packages. Any restrictions or attribution requirements are spelled out in the license file. Neon and  attribution information can be found in the [LICENSE](./LICENSE) and [NOTICE](./NOTICE.md) files. For more information about the Apache license, please visit the [The Apache Software Foundation’s License FAQ](http://www.apache.org/foundation/license-faq.html).

## References

verdi-favicon.icon : ArtsyBee, CC0 Creative Commons, uploaded 7 February 2016, [*lion-1181521_960_720.png*](https://pixabay.com/en/lion-egyptian-ancient-egypt-1181521/)

volume_up.svg : Material Design, Google, updated 12 November 2014, [*ic_volume_up_24px.svg*](https://github.com/google/material-design-icons/blob/master/av/svg/production/ic_volume_up_24px.svg)

youtube_logo.png : Brand Resources, YouTube, updated 2018, [*yt_logo_rgb_light.png*](https://www.youtube.com/yt/about/brand-resources/#logos-icons-colors)

## Contact Us

Email: neon-support@nextcentury.com

Website: http://neonframework.org

Copyright 2019 Next Century Corporation
