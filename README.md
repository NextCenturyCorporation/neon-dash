# Neon Dashboard

The Neon Dashboard is a big data exploration and visualization user interface that is used with the [Neon Server](https://github.com/NextCenturyCorporation/neon-server) and [Neon Middleware](https://github.com/NextCenturyCorporation/neon-framework).

## Table of Content

* [Initial Setup Instructions](https://github.com/NextCenturyCorporation/neon-dash-internal/blob/master/README.md#initial-setup-instructions)
* [Local Development Instructions](https://github.com/NextCenturyCorporation/neon-dash-internal/blob/master/README.md#local-development-instructions)
* [Production Deployment Instructions](https://github.com/NextCenturyCorporation/neon-dash-internal/blob/master/README.md#production-deployment-instructions)
* [Dashboard Configuration](https://github.com/NextCenturyCorporation/neon-dash-internal/blob/master/README.md#datastore-configuration)
* [Technical Stack](https://github.com/NextCenturyCorporation/neon-dash-internal/blob/master/README.md#technical-stack)
* [License](https://github.com/NextCenturyCorporation/neon-dash-internal/blob/master/README.md#apache-2-open-source-license)
* [References](https://github.com/NextCenturyCorporation/neon-dash-internal/blob/master/README.md#references)
* [Contact Us](https://github.com/NextCenturyCorporation/neon-dash-internal/blob/master/README.md#contact-us)

## Initial Setup Instructions

### Install Dependencies

* [Neon Server](https://github.com/NextCenturyCorporation/neon-server)
* [Node and NPM](https://nodejs.org/en/)
* (Optional) [Angular CLI](https://github.com/angular/angular-cli) with `npm install -g @angular/cli`

### Download Source Code

`git clone https://github.com/NextCenturyCorporation/neon-dash-internal.git; cd neon-dash-internal`

### Download NPM Packages

`npm install`

### Load Data

Please see the Neon Server's Initial Setup Instructions for more information on [loading data](https://github.com/NextCenturyCorporation/neon-server#load-data) into your datastore.

### Other Setup

Copy the [sample proxy config file](./sample.proxy.conf.json) to `./proxy.conf.json` and, if your Neon Server will not run on `http://localhost:8090` (the default), change the hostname and/or port (under `target`) with a text editor.

### Dashboard Configuration

The Neon Dashboard configuration file contains the datastores and dashboards that will be loaded in the UI.

If you were given a sample data bundle, copy the `config.yaml` file from the sample data bundle into `<neon-dash-internal>/src/app/config/config.yaml`.

If you were not given a sample data bundle and/or do not have a configuration file, please see the [dashboard configuration](https://github.com/NextCenturyCorporation/neon-dash-internal/blob/master/README.md#datastore-configuration) for more information.

## Local Development

### Run Locally

To run the Neon Dashboard, first start the Neon Server, then do `npm start`

This will start the Neon Dashboard on http://localhost:4200 and should auto-reload the page whenever you modify a file.

To see anything useful, you will need to ingest data into your datastore(s).

### Unit Test and Lint

To run the unit tests and linters: `npm test`

### Unit Test

To run just the unit tests: `npm run-script unit-test`

The unit tests are run using a [Karma config file](./karma.conf.js).  The unit tests are written with [Jasmine](https://jasmine.github.io/).

### Lint

To run just the linters: `npm run-script lint`

The linters use the following libraries:
- [ESLint](https://eslint.org/) and [TypeScript ESLint](https://github.com/typescript-eslint/typescript-eslint)
- [JS Beautify](https://github.com/beautify-web/js-beautify) (HTML only)
- [Sass Lint](https://github.com/sasstools/sass-lint) and [Sass Lint Auto Fix](https://github.com/srowhani/sass-lint-auto-fix)

The linters are run using the following files:
- [.eslintrc.yml](./.eslintrc.yml)
- [.jsbeautifyrc](./.jsbeautifyrc)
- [sass-lint.yaml](./sass-lint.yaml) and [sass-lint-auto-fix.yaml](./sass-lint-auto-fix.yaml)

## Production Deployment

The Neon Dashboard is deployed as either a docker container (together with the Neon Server) or a WAR in Apache Tomcat (independently from the Neon Server).

### Deploy as Docker Container

#### 1. Install [Docker Compose](https://docs.docker.com/compose/install/)

#### 2. Update the Datastore Host in Your Neon Dashboard Configuration File

If you have a dashboard configuration file (`src/app/config/config.yaml` or `src/app/config/config.json`) containing a datastore with a `host` of `localhost`, you'll need to change `localhost` to your local IP address.  For example, if your local IP address is `1.2.3.4`, then your dashboard configuration file may look like:

```yaml
datastores:
    elasticsearch_primary_datastore:
        host: 1.2.3.4
        type: elasticsearchrest
        databases:
            # etc.
```

Note that you may need to [bind the network host in the configuration of your Elasticsearch](https://www.elastic.co/guide/en/elasticsearch/reference/6.4/network.host.html) by adding the line `network.host: 0.0.0.0` to the `<elasticsearch>/config/elasticsearch.yml` file of your Elasticsearch deployment and restarting Elasticsearch.

#### 3. Build the Neon Dashboard

```
cd <neon-dash-internal>
npm run-script build
```

This will generate the `<neon-dash-internal>/dist` directory.

#### 4. Run the Neon Server and the Neon Dashboard Simultaneously with Docker Compose

This option uses Docker Compose to deploy the Neon Dashboard within an Nginx docker image alongside your existing Neon Server docker image.

Run the following commands:

```
cd <neon-dash-internal>
docker-compose up -d
```

**Note**: By default, docker-compose runs the Neon Dashboard on port `4100`.  If you want to use a different port:

- In `<neon-dash-internal>/docker-compose.yml`, change the `4100` in the line `- 4100:80` to your port.

#### 5. Verify Deployment

Verify that the Neon Dashboard is deployed correctly by opening it in your internet browser by going to http://localhost:4100/

### Deploy as WAR in Apache Tomcat

#### 1. Install [Apache Tomcat](http://tomcat.apache.org/)

#### 2. Run the Neon Server as a Docker Container

While the Neon Dashboard can run in Apache Tomcat, the Neon Server can't, so you need to deploy it as a docker container.

```
cd <neon-server>
docker run -it --network=host --rm -d com.ncc.neon/server:latest
```

#### 3. Build the Neon Dashboard for Apache Tomcat Deployment

```
cd <neon-dash-internal>
npm run-script build neon_dashboard
```

This will generate `<neon-dash-internal>/target/neon_dashboard.war`.

**Note**: If you want, you can replace neon_dashboard with any other name.  Use the same name in the following steps.

#### 4. Deploy the Neon Dashboard to Your Apache Tomcat

Copy `<neon-dash-internal>/target/neon_dashboard.war` into your `<apache-tomcat>/webapps` directory.

#### 5. Verify Deployment

Verify that the Neon Dashboard is deployed correctly by opening it in your internet browser. For example, if your Apache Tomcat is installed on `localhost:8080`, go to http://localhost:8080/neon_dashboard

## Dashboard Configuration

If you were not given a sample data bundle and/or do not have a configuration file, you can create your own at `src/app/config/config.yaml` or `src/app/config/config.json`.

Minimally, we recommend that you define the datastores you want to show in the Neon Dashboard (e.g. deployments of Elasticsearch).  For example, if you want to use a single Elasticsearch data index, you can copy the template below into a file and save it as `<neon-dash-internal>/src/app/config/config.yaml`:

```yaml
datastores:
    es:
        host: <ip_address>
        type: elasticsearchrest
        databases:
            <elasticsearch_index_name>:
                tables:
                    <elasticsearch_index_type>:
                        fields:
```

Replace `<ip_address>`, `<elasticsearch_index_name>`, and `<elasticsearch_index_type>` with the appropriate values.

Additionally, if your data contains many (hundreds of) fields, we recommend that you add all the fields you want to show in the UI to the datastore configuration under `fields:`.  For example:

```yaml
                        fields:
                            - columnName: title
                            - columnName: content
                            - columnName: timestamp
                            - columnName: _id
```

If you define `datastores` in your configuration file but you do not define any `dashboards` or `layouts`, the default dashboard will be blank when you first load it.  However, you can easily add new widgets to your dashboard, configure the widgets to show your data sources, save your custom dashboards, and reload them in the future, all within the UI.  More documentation and a detailed user tutorial are coming soon.

For the full, detailed instructions, please see the [Neon Dashboard Configuration Guide](./docs/DASHBOARD_CONFIGURATION_GUIDE.md)

## Technical Stack

The Neon Dashboard is an [Angular](https://angular.io/) web application.

## Apache 2 Open Source License

Neon is made available by [Next Century](http://www.nextcentury.com) under the [Apache 2 Open Source License](http://www.apache.org/licenses/LICENSE-2.0.txt). You may freely download, use, and modify, in whole or in part, the source code or release packages. Any restrictions or attribution requirements are spelled out in the license file. Neon attribution information can be found in the [LICENSE](./LICENSE) and [NOTICE](./NOTICE.md) files. For more information about the Apache license, please visit the [The Apache Software Foundation’s License FAQ](http://www.apache.org/foundation/license-faq.html).

## References

verdi-favicon.icon : ArtsyBee, CC0 Creative Commons, uploaded 7 February 2016, [*lion-1181521_960_720.png*](https://pixabay.com/en/lion-egyptian-ancient-egypt-1181521/)

volume_up.svg : Material Design, Google, updated 12 November 2014, [*ic_volume_up_24px.svg*](https://github.com/google/material-design-icons/blob/master/av/svg/production/ic_volume_up_24px.svg)

youtube_logo.png : Brand Resources, YouTube, updated 2018, [*yt_logo_rgb_light.png*](https://www.youtube.com/yt/about/brand-resources/#logos-icons-colors)

## Contact Us

Email: [neon-support@nextcentury.com](mailto:neon-support@nextcentury.com)

Website: http://neonframework.org

Copyright 2019 Next Century Corporation

