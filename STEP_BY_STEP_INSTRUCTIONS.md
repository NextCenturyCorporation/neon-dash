# Step-by-Step Instructions

## I. Prerequisites

### Install the following prerequisites (if not already installed):

1. Install [Java 9+](https://www.oracle.com/technetwork/java/javase/downloads/jdk12-downloads-5295953.html)
2. Install [Elasticsearch 6.4+](https://www.elastic.co/downloads/past-releases/elasticsearch-6-8-1)
3. Install [Docker](https://docs.docker.com/v17.12/install/)
4. Install [Node and NP](https://nodejs.org/en/)
5. Install [elasticdump](https://www.npmjs.com/package/elasticdump) with `npm install -g elasticdump`

## II. Data

If you were given a sample data bundle, please download it and follow its README instructions.

If you want to use your own data, please see the [Neon Data Support Guide](https://github.com/NextCenturyCorporation/neon-server/blob/master/DATA_SUPPORT_GUIDE.md) for more information.

## III. Neon Server

The Neon Server is a REST server that provides datastore adapters, runs datastore queries, transforms query results, and performs data processing for applications like the Neon Dashboard (UI).  For more information, please see the [Neon Server GitHub Repository](https://github.com/NextCenturyCorporation/neon-server)

#### 1. Download and Build the Neon Server as a Docker Image

```
git clone https://github.com/NextCenturyCorporation/neon-server.git
cd neon-server
./gradlew clean docker
```

Run `docker images` to verify that you have created a docker image with the repository `com.ncc.neon/server` and tag `latest`.

**Note**: By default, the Neon Server runs on port `8090`.  If you want to use a different port:

- In `<neon-server>/server/src/main/resources/application.properties`, change the line `server.port=8090` to use your port
- In `Dockerfile`, change the line `EXPOSE 8090` to use your port
- Rerun `./gradlew clean docker`

## IV. Neon Dashboard

The Neon Dashboard is a big data exploration and visualization user interface.  For more information, please see the [Neon Dashboard GitHub Repository](https://github.com/NextCenturyCorporation/neon-dash-internal)

#### 1. Download the Neon Dashboard and Install its Dependencies

```
git clone https://github.com/NextCenturyCorporation/neon-dash-internal.git
cd neon-dash-internal
cp sample.proxy.conf.json proxy.conf.json
npm install
```

**Note**: If you have changed the port of the Neon Server, you need to change the port in the `proxy.conf.json` file from `8090` to your specific port.

#### 2. Update the Neon Dashboard Configuration File

The Neon Dashboard configuration file contains the datastores and dashboards that will be loaded in the UI.

If you were given a sample data bundle, copy the `config.yaml` file from the sample data bundle into `<neon-dash-internal>/src/app/config/config.yaml`.

If you were not given a sample data bundle and/or do not have a configuration file, please see the section on [Custom Neon Dashboard Configuration](#custom-neon-dashboard-configuration) below.

## V. Neon Deployment

### Option A: Deploy the Neon Dashboard as a WAR in Apache Tomcat

#### 1. Install [Apache Tomcat](http://tomcat.apache.org/)

#### 2. Run the Neon Server as a Docker Container

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

### Option B: Deploy the Neon Dashboard as a Docker Container

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

## Custom Neon Dashboard Configuration

If you were not given a sample data bundle and/or do not have a configuration file, you can create your own.  Minimally, we recommend that you define the datastores you want to show in the Neon Dashboard (e.g. deployments of Elasticsearch).  For example, if you want to use a single Elasticsearch data index, you can copy the template below into a file and save it as `<neon-dash-internal>/src/app/config/config.yaml`:

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

For the full, detailed instructions, please see the [Neon Dashboard Configuration Guide](./DASHBOARD_CONFIGURATION_GUIDE.md)

## Troubleshooting

For questions, please email us at:  [neon-support@nextcentury.com](mailto:neon-support@nextcentury.com)
