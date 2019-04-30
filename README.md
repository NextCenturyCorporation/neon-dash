# Neon Dashboard

The Neon Dashboard is a big data exploration and visualization user interface.

## Prerequisites

* Install [Node](https://nodejs.org/en/) and [NPM](https://www.npmjs.com/)
* Instal the [Angular CLI](https://github.com/angular/angular-cli) with `npm install -g @angular/cli`
* Install [Elasticsearch 6.4+](https://www.elastic.co/products/elasticsearch)
* Install [elasticdump](https://www.npmjs.com/package/elasticdump) with `npm install -g elasticdump`
* Install [Apache Tomcat](http://tomcat.apache.org/) if not deploying with Docker
* Install the [Neon Server][https://www.npmjs.com/package/elasticdump]

## Branches

* [**AIDA**](https://github.com/NextCenturyCorporation/neon-dash-internal/tree/verdi-master/)
* [**LORELEI**](https://github.com/NextCenturyCorporation/neon-dash-internal/tree/lorelei-master/)
* [**VMAP**](https://github.com/NextCenturyCorporation/neon-dash-internal/tree/vmap-master/)

## Next Century Internal Setup Guide

https://nextcentury.atlassian.net/wiki/spaces/THOR/pages/372244521/Neon+Local+Setup+Instructions

## Configure the Neon Dashboard

Create a Neon Dashboard config file at `src/app/config/config.json` or `src/app/config/config.yaml`.  See the [Neon Dashboard Configuration Guide](./DASHBOARD_CONFIGURATION_GUIDE.md) for more information.

## Build and Run the Neon Dashboard Locally

To build the Neon Dashboard: `npm install`

To start the Neon Dashboard, first start the Neon Server (if it's not running on port 8080, change the port in [proxy.conf.json](./proxy.conf.json)).  Then run: `npm start`

This will start the Neon Dashboard on http://localhost:4200 and should auto-reload the page whenever you modify a file.

To see anything useful, you will need to ingest data into your datastore(s).

## Unit Test

To start the unit tests, run: `npm test`

## Lint

To lint the code, run: `npm lint --fix`

## Deploy as WAR

To build the Neon Dashboard as a WAR:

        ng build --deployUrl=/dashboard_url/ --base-href /dashboard_url/ --aot

The `dashboard_url` should be your Apache Tomcat deployment URL:  for example, here you would access the Neon Dashboard at `http://hostname:port/dashboard_url`.  The `--aot` ("ahead-of-time") compiler option will improve runtime performance.

## Deploy as Docker Image

To build the Neon Dashboard as a Docker Image, see the [README in the docker folder](./docker/)

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
