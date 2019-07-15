# Step-by-Step Instructions

## I. Prerequisites

### Install the following prerequisites (if not already installed):

1. Install Java 9+: https://www.oracle.com/technetwork/java/javase/downloads/jdk12-downloads-5295953.html
2. Install Elasticsearch 6.4+: https://www.elastic.co/downloads/past-releases/elasticsearch-6-8-1
3. Install Docker: https://docs.docker.com/v17.12/install/
4. Install Apache Tomcat: http://tomcat.apache.org/
5. Install Node and NPM: https://nodejs.org/en/
6. Install elasticdump with `npm install -g elasticdump`: https://www.npmjs.com/package/elasticdump

## II. Data

Download the sample data bundle that you were provided and follow its README instructions.

## III. Neon Server

### 1. Download and Build the Neon Server

Run the following commands to download the source code for the Neon Server and build the docker image:

```
git clone https://github.com/NextCenturyCorporation/neon-server.git
cd neon-server
./gradlew clean docker
```

Note: By default, the Neon Server runs on port `8090`.  If you want to use a different port:

- In `server/src/main/resources/application.properties`, change the line `server.port=8090` to use your port
- In `Dockerfile`, change the line `EXPOSE 8090` to use your port
- Rerun `./gradlew clean docker`

### 2. Run the Neon Server as a Docker Container

Run `docker images` to verify that you have created a docker image with the repository `com.ncc.neon/server` and tag `latest`.

Run the Neon Server docker container:

```
docker run -it --network=host --rm -d com.ncc.neon/server:latest
```

## IV. Neon Dashboard

### 1. Download the Neon Dashboard and Install its Dependencies

Run the following commands to download the source code for the Neon Dashboard and install dependencies:

```
git clone https://github.com/NextCenturyCorporation/neon-dash-internal.git
cd neon-dash-internal
cp sample.proxy.conf.json proxy.conf.json
npm install
```

Note: If you have changed the port of the Neon Server, you need to change the port in the `proxy.conf.json` file from `8090` to your specific port.

### 2. Update Dashboard Configuration File

Copy the `config.yaml` file from the sample data bundle into `src/app/config/config.yaml` (in the `neon-dash-internal` directory).

### 3. Build the Neon Dashboard

Run `npm run-script build neon_dashboard`. This will generate `target/neon_dashboard.war`.

Note: If you want, you can replace neon_dashboard with any other name.  Use the same name in step 4.

### 4. Deploy the Neon Dashboard to Your Apache Tomcat

Copy `target/neon_dashboard.war` into the `webapps` directory of your installation of Apache Tomcat.

Verify that the Neon Dashboard is deployed correctly by opening it in your internet browser. For example, if your Apache Tomcat is installed on localhost:8080, go to http://localhost:8080/neon_dashboard

## Links

Neon Server source code: https://github.com/NextCenturyCorporation/neon-server

Neon Dashboard source code: https://github.com/NextCenturyCorporation/neon-dash-internal
