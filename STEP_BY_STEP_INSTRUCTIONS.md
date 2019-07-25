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

If you were given a sample data bundle, copy the `config.yaml` file from the sample data bundle into `src/app/config/config.yaml` (in the `neon-dash-internal` directory).

If you do not have a configuration file, you may optionally create your own.  For more information, please see the [Neon Dashboard Configuration Guide](./DASHBOARD_CONFIGURATION_GUIDE.md)

You do not have to have your own configuration file.  Without a configuration file, the default dashboard will be blank, but you can easily add new widgets to the dashboard, configure them to look at your data sources, save your custom dashboards, and reload them in the future.  More documentation and tutorial coming soon.

## V. Neon Deployment

### Option A: Deploy the Neon Dashboard as a WAR in Apache Tomcat

**Prerequisite**: Install [Apache Tomcat](http://tomcat.apache.org/)

#### 1. Run the Neon Server as a Docker Container

```
cd <neon-server>
docker run -it --network=host --rm -d com.ncc.neon/server:latest
```

#### 2. Build the Neon Dashboard for Apache Tomcat Deployment

```
cd <neon-dash-internal>
npm run-script build neon_dashboard
```

This will generate `<neon-dash-internal>/target/neon_dashboard.war`.

**Note**: If you want, you can replace neon_dashboard with any other name.  Use the same name in the following steps.

#### 3. Deploy the Neon Dashboard to Your Apache Tomcat

Copy `<neon-dash-internal>/target/neon_dashboard.war` into your `<apache-tomcat>/webapps` directory.

#### 4. Verify Deployment

Verify that the Neon Dashboard is deployed correctly by opening it in your internet browser. For example, if your Apache Tomcat is installed on `localhost:8080`, go to http://localhost:8080/neon_dashboard

### Option B: Deploy the Neon Dashboard as a Docker Container

**Prerequisite**: Install [Docker Compose](https://docs.docker.com/compose/install/)

#### 1. Run the Neon Server and the Neon Dashboard Simultaneously with Docker Compose

This option uses Docker Compose to deploy the Neon Dashboard within an Nginx docker image alongside your existing Neon Server docker image.

Run the following commands:

```
cd <neon-dash-internal>
docker-compose up -d
```

**Note**: By default, docker-compose runs the Neon Dashboard on port `4100`.  If you want to use a different port:

- In `<neon-dash-internal>/docker-compose.yml`, change the `4100` in the line `- 4100:80` to your port.

#### 2. Verify Deployment

Verify that the Neon Dashboard is deployed correctly by opening it in your internet browser by going to http://localhost:4100/

## Troubleshooting

For questions, please email us at:  [neon-support@nextcentury.com](mailto:neon-support@nextcentury.com)
