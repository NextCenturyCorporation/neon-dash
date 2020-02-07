# Neon Dashboard

The Neon Dashboard is a big data exploration and visualization user interface that is used with [NUCLEUS](https://github.com/NextCenturyCorporation/nucleus) and the [NUCLEUS Data Server](https://github.com/NextCenturyCorporation/nucleus-data-server)

## Table of Content

* [Why Use the Neon Dashboard?](https://github.com/NextCenturyCorporation/neon-dash/blob/master/README.md#why-use-the-neon-dashboard)
* [Initial Setup Instructions](https://github.com/NextCenturyCorporation/neon-dash/blob/master/README.md#initial-setup-instructions)
* [Local Development Instructions](https://github.com/NextCenturyCorporation/neon-dash/blob/master/README.md#local-development-instructions)
* [Production Deployment Instructions](https://github.com/NextCenturyCorporation/neon-dash/blob/master/README.md#production-deployment-instructions)
* [Custom Dashboard Configuration](https://github.com/NextCenturyCorporation/neon-dash/blob/master/README.md#custom-dashboard-configuration)
* [Technical Stack](https://github.com/NextCenturyCorporation/neon-dash/blob/master/README.md#technical-stack)
* [Planned Efforts](https://github.com/NextCenturyCorporation/neon-dash/blob/master/README.md#planned-efforts)
* [Example Data](https://github.com/NextCenturyCorporation/neon-dash/blob/master/README.md#example-data)
* [License](https://github.com/NextCenturyCorporation/neon-dash/blob/master/README.md#apache-2-open-source-license)
* [References](https://github.com/NextCenturyCorporation/neon-dash/blob/master/README.md#references)
* [Contact Us](https://github.com/NextCenturyCorporation/neon-dash/blob/master/README.md#contact-us)

## Why Use the Neon Dashboard

The Neon Dashboard offers multiple benefits over other big data exploration and visualization applications:

* The Neon Dashboard is free and open-source
* The Neon Dashboard supports different types of datastores (see the full list [here](https://github.com/NextCenturyCorporation/nucleus-data-server#datastore-support))
* The Neon Dashboard allows you to **view and filter on data from separate datastores at the same time**
* The Neon Dashboard displays data from your own datastores; it doesn't need to load and save a copy of your data (though we have suggestions on how you should [configure your datastore](https://github.com/NextCenturyCorporation/nucleus-data-server#datastore-configuration) so you can make the best use out of the Neon Dashboard)

## Quick Install
* For a quick setup of the neon dashboard on docker, download and extract the [Neon Installer](https://portal.nextcentury.com/owncloud/index.php/s/z2UbU5ZATGXaTBh/download) package to a folder and follow the instruction in the README file.

## Initial Setup Instructions

### Install Dependencies

* [NUCLEUS Data Server](https://github.com/NextCenturyCorporation/nucleus-data-server) (previously called "Neon Server")
* [Node and NPM](https://nodejs.org/en/)
* (Optional) [Angular CLI](https://github.com/angular/angular-cli) with `npm install -g @angular/cli`

### Download Source Code

`git clone https://github.com/NextCenturyCorporation/neon-dash.git; cd neon-dash`

### Download NPM Packages

`npm install`

### Load Data

Please see the NUCLEUS Data Server's Initial Setup Instructions for more information on [loading data](https://github.com/NextCenturyCorporation/nucleus-data-server#load-data) into your datastore.

### Other Setup

Copy `sample.proxy.conf.json` to `./proxy.conf.json` and, if your NUCLEUS Data Server isn't running on `http://localhost:8090` (the default), change the hostname and/or port (under `target`) with a text editor.

### Dashboard Configuration

The Neon Dashboard configuration file contains the datastores and dashboards that will be loaded in the UI.

If you were given a sample data bundle, copy the `config.yaml` file from the sample data bundle into `<neon-dash>/src/app/config/config.yaml`.

If you were not given a sample data bundle and/or do not have a configuration file, please see the [dashboard configuration](https://github.com/NextCenturyCorporation/neon-dash/blob/master/README.md#datastore-configuration) for more information.

## Local Development Instructions

### Run Locally

To run the Neon Dashboard, first start the NUCLEUS Data Server, then run `npm start`

This will start the Neon Dashboard on http://localhost:4200 and should auto-reload the page whenever you modify a file.

To see anything useful, you will need to ingest data into your datastore(s).

### Unit Test and Lint

`npm test`

### Unit Test

`npm run-script unit-test`

The unit tests are run using a [Karma](https://karma-runner.github.io/latest/index.html) config file [karma.conf.js](./karma.conf.js).  The unit tests are written with [Jasmine](https://jasmine.github.io/).

### Lint

`npm run-script lint`

The linters use the following libraries:
- [ESLint](https://eslint.org/) and [TypeScript ESLint](https://github.com/typescript-eslint/typescript-eslint)
- [JS Beautify](https://github.com/beautify-web/js-beautify) (HTML only)
- [Sass Lint](https://github.com/sasstools/sass-lint) and [Sass Lint Auto Fix](https://github.com/srowhani/sass-lint-auto-fix)

The linters are run using the following files:
- [.eslintrc.yml](./.eslintrc.yml)
- [.jsbeautifyrc](./.jsbeautifyrc)
- [sass-lint.yaml](./sass-lint.yaml) and [sass-lint-auto-fix.yaml](./sass-lint-auto-fix.yaml)

### End-to-End Tests

`./e2e.sh`

Please see the documentation on [End-to-End Testing in the Neon Dashboard](./docs/END_TO_END_TESTING.md) for more information.

## Production Deployment Instructions

The Neon Dashboard can be deployed as either:

- A [single Docker container](https://github.com/NextCenturyCorporation/neon-dash/blob/master/README.md#deploy-the-dashboard-as-a-single-docker-container).  This is useful if you want to separately deploy both the NUCLEUS Data Server and a datastore.
- A [Docker container with the NUCLEUS Data Server, but not a datastore](https://github.com/NextCenturyCorporation/neon-dash/blob/master/README.md#deploy-the-dashboard-as-a-docker-container-with-the-server).  This is useful if you already have a datastore that you want to link to the Neon system.
- A [Docker container with the NUCLEUS Data Server and an Elasticsearch datastore](https://github.com/NextCenturyCorporation/neon-dash/blob/master/README.md#deploy-the-dashboard-as-a-docker-container-with-the-server-and-elasticsearch).  This is useful if you want to deploy the entire Neon system on a clean machine (like a new AWS EC2 instance).
- A [WAR in Apache Tomcat](https://github.com/NextCenturyCorporation/neon-dash/blob/master/README.md#deploy-the-dashboard-as-a-war-file-in-apache-tomcat).  This is useful if you want to deploy the Neon Dashboard alongside other applications in Tomcat.

### Deploy the Dashboard as a Single Docker Container

#### 1. Perform All Initial Setup

Follow the [Initial Setup Instructions](https://github.com/NextCenturyCorporation/neon-dash/blob/master/README.md#initial-setup-instructions) above.

#### 2. Build the Neon Dashboard

```
cd <neon-dash>
npm run-script build
```

This will generate the `<neon-dash>/dist` directory.

#### 3. Build the Neon Dashboard Docker Container

```
cd <neon-dash>
docker build -t neon-dash .
```

**Note**: By default, the Docker container runs the Neon Dashboard on port `4200`.  If you want to use a different port:

- In `<neon-dash>/nginx.dash-only.conf`, change the number `4200` in the line `listen 4200;` to your port.

**Note**: By default, the Docker container assumes the NUCLEUS Data Server is running with the hostname and port `http://localhost:8090`.  If you want to use a different port:

- In `<neon-dash>/nginx.dash-only.conf`, change the hostname and port `http://localhost:8090` in the line `proxy_pass http://localhost:8090/neon` to your hostname and port.

#### 4. Run the Neon Dashboard Docker Container

```
docker run --network=host neon-dash:latest -d
```

#### 5. Verify Deployment

Verify that the Neon Dashboard is deployed correctly by opening it in your internet browser by going to http://localhost:4200/ (if still using the default port)

### Deploy the Dashboard as a Docker Container with the Server

#### 1. Perform All Initial Setup

Follow the [Initial Setup Instructions](https://github.com/NextCenturyCorporation/neon-dash/blob/master/README.md#initial-setup-instructions) above.

#### 2. Install [Docker Compose](https://docs.docker.com/compose/install/)

#### 3. Update the Datastore Host in Your Neon Dashboard Configuration File

If you have a dashboard configuration file (`src/app/config/config.yaml` or `src/app/config/config.json`) containing a datastore with a `host` of `localhost`, you'll need to change `localhost` to your local IP address.  For example, if your local IP address is `1.2.3.4`, then your dashboard configuration file may look like:

```yaml
datastores:
    elasticsearch_datastore:
        host: 1.2.3.4
        type: elasticsearchrest
        databases:
            # etc.
```

Note that you may need to [bind the network host in the configuration of your Elasticsearch](https://www.elastic.co/guide/en/elasticsearch/reference/6.4/network.host.html) by adding the line `network.host: 0.0.0.0` to the `<elasticsearch>/config/elasticsearch.yml` file of your Elasticsearch deployment and restarting Elasticsearch.

#### 4. Build the Neon Dashboard

```
cd <neon-dash>
npm run-script build
```

This will generate the `<neon-dash>/dist` directory.

#### 5. Run the NUCLEUS Data Server and the Neon Dashboard Docker Containers with Docker Compose

This deployment option uses Docker Compose to deploy the Neon Dashboard within an Nginx docker image alongside your existing NUCLEUS Data Server docker image.

Run the following commands:

```
cd <neon-dash>
docker-compose -f docker-compose-neon-only.yml up -d
```

**Note**: By default, docker-compose runs the Neon Dashboard on port `80`.  If you want to use a different port:

- In `<neon-dash>/docker-compose-neon-only.yml`, change the first `80` in the line `- 80:80` to your port.

**Note**: By default, docker-compose runs the NUCLEUS Data Server on port `8090`.  If you want to use a different port:

- In `<neon-dash>/docker-compose-neon-only.yml`, change both of the `8090` in the line `- 8090:8090` to your port and change the `8090` in the line `SERVER_PORT: 8090` to your port.

#### 6. Verify Deployment

Verify that the Neon Dashboard is deployed correctly by opening it in your internet browser by going to http://localhost/ (if still using the default port)

### Deploy the Dashboard as a Docker Container with the Server and Elasticsearch

*Note: I tested this on an AWS EC2 instance with the "Amazon Linux 2 AMI"*

#### Assumptions

- The UI (Neon Dashboard) runs on port 80.
- The NUCLEUS Data Server runs on port 8090. You don't need to worry about this unless you have another application running on port 8090.
- Elasticsearch runs on port 9200.

*Note: If you need to change any of the above ports, update the `docker-compose.yml` and `nginx.conf` files in the `neon-dash` repository as needed.*

#### 1. Install Dependencies

- Java (v1.8+, preferably v1.11+)
- [Docker](https://docs.docker.com/v17.09/engine/installation/), and see note below
- [Docker Compose](https://docs.docker.com/compose/install/)
- [NPM](https://www.npmjs.com/get-npm)
- [Elasticdump](https://www.npmjs.com/package/elasticdump), installed globally by running `npm install -g elasticdump`

*Note: I followed [these steps](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/docker-basics.html) to install Docker on my AWS EC2 instance but had to logout and log back in again to make it work.*

#### 2. Build the NUCLEUS Data Server Docker Container

```
git clone https://github.com/NextCenturyCorporation/nucleus-data-server.git
cd nucleus-data-server
./gradlew clean docker
cd -
```

*Note: The above gradlew command failed in my testing unless I ran `sudo chmod 777 /var/run/docker.sock` first.*

#### 3. Build the Neon Dashboard

```
git clone https://github.com/NextCenturyCorporation/neon-dash.git
cd neon-dash
npm install
```

Next, copy the `config.yaml` file you were given by the Neon development team (specific to your data bundle) into `src/app/config/config.yaml` in the `neon-dash` repository.  Open the `src/app/config/config.yaml` file in a text editor to ensure that the `host` of each datastore in the `config.yaml` file (usually on line 3) is set to `neon-elasticsearch-container`, like so:

```yaml
datastores:
    elasticsearch_datastore:
        host: neon-elasticsearch-container
        type: elasticsearchrest
        databases:
            # etc.
```

Then, build the Neon Dashboard with:

```
npm run-script build
```

#### 4. Deploy All the Docker Containers with Docker Compose

```
docker-compose up -d
```

#### 5. Ingest Your Data into the Elasticsearch Docker Container

- Download and untar the data bundle you were given by the Neon development team.
- Inside the untarred folder, run the `ingest_data.sh` script. This script will use elasticdump to load all of the data into your Elasticsearch Docker container. (Note: If you changed the Elasticsearch port, add the host and port as a script argument, like: `./ingest_data.sh http://localhost:1234`)

*Note: If you remove the running Elasticsearch Docker container (for example, with `docker-compose down`), you'll need to rerun the `ingest_data.sh` script whenever you run the Docker container again.*

### Deploy the Dashboard as a WAR File in Apache Tomcat

**Note**:  These instructions assume that you've already installed the NUCLEUS Data Server and your datastores on your machine.

#### 1. Perform All Initial Setup

Follow the [Initial Setup Instructions](https://github.com/NextCenturyCorporation/neon-dash/blob/master/README.md#initial-setup-instructions) above.

#### 2. Install [Apache Tomcat](http://tomcat.apache.org/)

#### 3. Run the NUCLEUS Data Server as a Docker Container

While the Neon Dashboard can run in Apache Tomcat, the NUCLEUS Data Server cannot, so you need to deploy it as a separate docker container.

```
cd <nucleus-data-server>
docker run -it --network=host --rm -d com.ncc.neon/server:latest
```

#### 4. Build the Neon Dashboard for Apache Tomcat Deployment

```
cd <neon-dash>
npm run-script build-war neon_dashboard
```

This will generate `<neon-dash>/target/neon_dashboard.war`.

**Note**: If you want, you can replace `neon_dashboard` with any other name.  Use the same name in the following steps.

#### 5. Deploy the Neon Dashboard to Your Apache Tomcat

Copy `<neon-dash>/target/neon_dashboard.war` into your `<apache-tomcat>/webapps` directory.

#### 6. Verify Deployment

Verify that the Neon Dashboard is deployed correctly by opening it in your internet browser. For example, if your Apache Tomcat is installed on `localhost:8080`, go to http://localhost:8080/neon_dashboard

## Custom Dashboard Configuration

If you were not given a sample data bundle and/or do not have a configuration file, you can create your own at `src/app/config/config.yaml` or `src/app/config/config.json`.

Minimally, we recommend that you define the datastores you want to show in the Neon Dashboard (e.g. deployments of Elasticsearch).  For example, if you want to use a single Elasticsearch data index, you can copy the template below into a file and save it as `<neon-dash>/src/app/config/config.yaml`:

```yaml
datastores:
    mysql_datastore_id:
        host: <datastore_ip_address>
        type: mysql
        databases:
            <mysql_database_name>:
                tables:
                    <mysql_table_name>:
                        fields:
    postgresql_datastore_id:
        host: <datastore_ip_address>/<postgresql_database_name>
        type: postgresql
        databases:
            <postgresql_schema_name>:
                tables:
                    <postgresql_table_name>:
                        fields:
    elasticsearch_datastore_id:
        host: <datastore_ip_address>
        type: elasticsearchrest
        databases:
            <elasticsearch_index_name>:
                tables:
                    <elasticsearch_index_type>:
                        fields:

dashboards:
    choices:
        <dashboard_id>:
            name: <human_readable_dashboard_name>
            layout: custom

layouts:
    custom:
```

Remove sections under `datastores` for any unneeded datastores, or add sections for additional datastores.  Replace the values within the braces (`< >`) as needed.

You don't need to list each field in your datastore because Neon will automatically find them all and make them available to you in the UI.  However, if your data contains many (hundreds of) fields, we recommend that you add all the fields you want to show in the UI to the datastore configuration under `fields:`.  For example:

```yaml
                        fields:
                            - columnName: title
                            - columnName: content
                            - columnName: timestamp
                            - columnName: _id
```

If you define `datastores` in your configuration file but you do not define any `dashboards` or `layouts`, the default dashboard will be blank when you first load it.  However, you can easily add new widgets to your dashboard, configure the widgets to show your data sources, save your custom dashboards, and reload them in the future, all within the UI.  More documentation and a detailed user tutorial are coming soon.

For the full, detailed instructions, please see the [Neon Dashboard Configuration Guide](./docs/DASHBOARD_CONFIGURATION_GUIDE.md)

### Datastore Types

- `elasticsearch` or `elasticsearchrest` (both work the same)
- `mysql`
- `postgresql`

### Datastore Authentication

To add datastore authentication, you either:

- Add your username (or username and password) to your datastore's `host` property like this: `username@host` or `username:password@host`.  This will allow any users to see your password, though.
- Add authentication to your NUCLEUS Data Server as described [here](https://github.com/NextCenturyCorporation/nucleus-data-server/blob/master/README.md#datastore-authentication).  You will need to rebuild and redeploy your NUCLEUS Data Server afterward.

### Elasticsearch Notes

Elasticsearch does not have "databases" or "tables"; instead, it has "indexes" and "mapping types".  In Neon, we consider "indexes" to be the equivalent of "databases" and "mapping types" to be the equivalent of "tables".

### PostgreSQL Notes

PostgreSQL connections are always database-specific, so any `postgresql` datastore in your config file must have a `host` property that ends with a slash and the database name, like `host:port/database`.  In Neon, we consider PostgreSQL "schemas" to be the equivalent of "databases".  For example, if you have a PostgreSQL running at `http://my_host:1234` with a database `my_database` containing schema `my_schema`, the beginning of the definition of this datastore in your config file should look like:

```yaml
datastores:
    postgresql_id:
        host: "http://my_host:1234/my_database"
        type: postgresql
        databases:
            my_schema:
                tables:
```

### Custom Assets

Please put all custom assets in the `src/app/assets/custom` folder.

### Custom Requests

Neon's "custom requests" are a way to integrate the Neon Dashboard with your data processing modules, machine learning analytics, or other external software via [REST](https://en.wikipedia.org/wiki/Representational_state_transfer) endpoints.

Custom requests are accessible from the navbar menu.  Users can set or select values for one or more configurable properties to send in a request body to one or more specific endpoints.

To configure custom requests in your dashboard, please see our documentation on [dashboard object options configuration](./docs/DASHBOARD_CONFIGURATION_GUIDE.md#dashboard-options-object).

## Technical Stack

The Neon Dashboard is an [Angular](https://angular.io/) web application.

## Planned Efforts

### Data Tasks

* Additional datastore support:  Gremlin/TinkerPop
* Edit or annotate live data in your datastores
* "Join" on data across tables/databases/datastores if data denormalization isn't possible
* Make scripts to help users ingest their data

### UI Tasks

* Create a custom dataset and dashboard configuration wizard
* Show GeoJSON regions in the Map
* Design tabbed dashboard widgets
* Expand Selenium test suites
* Set data access restrictions
* Move visualizations into NUCLEUS

## Example Data

Access geospatial/temporal earthquake data [here](./e2e/docker/data) (source?)

## Apache 2 Open Source License

Neon is made available by [Next Century](http://www.nextcentury.com) under the [Apache 2 Open Source License](http://www.apache.org/licenses/LICENSE-2.0.txt). You may freely download, use, and modify, in whole or in part, the source code or release packages. Any restrictions or attribution requirements are spelled out in the license file. Neon attribution information can be found in the [LICENSE](./LICENSE) and [NOTICE](./NOTICE.md) files. For more information about the Apache license, please visit the [The Apache Software Foundation’s License FAQ](http://www.apache.org/foundation/license-faq.html).

## References

volume_up.svg : Material Design, Google, updated 12 November 2014, [*ic_volume_up_24px.svg*](https://github.com/google/material-design-icons/blob/master/av/svg/production/ic_volume_up_24px.svg)

youtube_logo.png : Brand Resources, YouTube, updated 2018, [*yt_logo_rgb_light.png*](https://www.youtube.com/yt/about/brand-resources/#logos-icons-colors)

## Contact Us

Email: [neon-support@nextcentury.com](mailto:neon-support@nextcentury.com)

Website: http://neonframework.org

Copyright 2019 Next Century Corporation

