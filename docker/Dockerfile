FROM ubuntu:18.04
MAINTAINER patrick.sharkey@nextcentury.com

# Prevent dialog during apt install
ENV DEBIAN_FRONTEND noninteractive

# Replace shell with bash so we can source files
RUN rm /bin/sh && ln -s /bin/bash /bin/sh

# Update system packages and remove any downloaded files
RUN \
  rm -rf /var/lib/apt/lists/* \
  && apt-get clean \
  && apt-get -y update --fix-missing

# Install system packages
RUN apt-get -qqy install \
  curl \
  git \
  wget \
  vim \
  zip 

# Set the root install directory env variable
ENV INST_HOME /usr/local

#-------------------------------------------------------------
#  Install Java OpenJDK 8
#-------------------------------------------------------------
RUN \
  apt-get install -y --fix-missing openjdk-8-jdk

# Define JAVA_HOME variable
ENV JAVA_HOME /usr/lib/jvm/java-8-openjdk-amd64

#-------------------------------------------------------------
#  Install Maven
#-------------------------------------------------------------
#ENV M2_HOME=$INST_HOME/maven
#ENV PATH $M2_HOME/bin:$PATH
#ENV M2_VERSION=3.5.4
#ENV M2_TGZ_URL=https://apache.osuosl.org/maven/maven-3/${M2_VERSION}/binaries/apache-maven-${M2_VERSION}-bin.tar.gz 
#ENV M2_CONFIG $HOME/.m2
#
#RUN mkdir -p $M2_HOME

# Download and install maven
#RUN curl -fsSL -o /tmp/apache-maven.tar.gz $M2_TGZ_URL \
#  && tar -xzf /tmp/apache-maven.tar.gz -C $M2_HOME --strip-components=1 \
#  && rm -f /tmp/apache-maven.tar.gz 

#RUN mvn -verison
#-------------------------------------------------------------
#  Install Supervisor
#-------------------------------------------------------------
RUN \
  apt-get install -y --fix-missing supervisor 

# Create log directory
RUN mkdir -p /var/log/supervisor

# Define mountable directories.
VOLUME ["/etc/supervisor/conf.d"]

# Define working directory.
WORKDIR /etc/supervisor/conf.d

#------------------------------------------------------------
# Install OpenSSH Server
#------------------------------------------------------------
ENV SSHD_HOME /var/run/sshd
RUN \
  apt-get install -y openssh-server

# Configure OpenSSH
RUN mkdir $SSHD_HOME

# Set user/pass to root:lorelei
RUN echo 'root:lorelei' | chpasswd
RUN sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config

# SSH login fix. Otherwise user is kicked off after login
RUN sed 's@session\s*required\s*pam_loginuid.so@session optional pam_loginuid.so@g' -i /etc/pam.d/sshd

ENV NOTVISIBLE "in users profile"
RUN echo "export VISIBLE=now" >> /etc/profile

#------------------------------------------------------------
#  Install Tomcat 8.5.34 
#------------------------------------------------------------
ENV CATALINA_HOME $INST_HOME/tomcat
ENV PATH $CATALINA_HOME/bin:$PATH
RUN mkdir -p $CATALINA_HOME
WORKDIR $CATALINA_HOME

ENV TOMCAT_MAJOR 8
ENV TOMCAT_VERSION 8.5.34
ENV TOMCAT_TGZ_URL https://www.apache.org/dist/tomcat/tomcat-$TOMCAT_MAJOR/v$TOMCAT_VERSION/bin/apache-tomcat-$TOMCAT_VERSION.tar.gz

# Download and extract Tomcat archive
RUN set -x \
  && wget -q -O tomcat.tar.gz "$TOMCAT_TGZ_URL" \
  && tar -xvf tomcat.tar.gz --strip-components=1 \
  && rm tomcat.tar.gz* 

# Create Tomcat user and group
RUN groupadd tomcat
RUN useradd -s /bin/false -g tomcat -d $CATALINA_HOME tomcat

# Set sudoer for "tomcat"
RUN echo 'tomcat ALL=(ALL) NOPASSWD: ALL' >> /etc/sudoers

# Create user for Tomcat Web Management Interface
COPY ["scripts/tomcat/tomcat_setup.sh", "$CATALINA_HOME/"]
RUN chmod +x $CATALINA_HOME/tomcat_setup.sh
RUN $CATALINA_HOME/tomcat_setup.sh

# Enable CORS in tomcat for geoserver
RUN sed -i '$i<filter><filter-name>CorsFilter</filter-name><filter-class>org.apache.catalina.filters.CorsFilter</filter-class></filter><filter-mapping><filter-name>CorsFilter</filter-name><url-pattern>/*</url-pattern></filter-mapping>' $CATALINA_HOME/conf/web.xml

# Update Tomcat directory permissions
RUN chown -R tomcat:tomcat $CATALINA_HOME

#------------------------------------------------------------
# Install Elasticsearch 2.5.4
#------------------------------------------------------------
ENV ELASTICSEARCH_HOME $INST_HOME/elasticsearch
ENV PATH $ELASTICSEARCH_HOME/bin:$PATH
RUN mkdir -p $ELASTICSEARCH_HOME
WORKDIR $ELASTICSEARCH_HOME

ENV ELASTCSEARCH_MAJOR 2
ENV ELATICSEARCH_VERSION 2.5.4
ENV ELASTICSEARCH_TGZ_URL https://download.elastic.co/elasticsearch/release/org/elasticsearch/distribution/tar/elasticsearch/2.4.5/elasticsearch-2.4.5.tar.gz

# Set Elasticsearch environments variables passed in from build.sh or defaults
ARG ES_INDEX=index
ARG ES_MAPPING=mapping
ENV ES_INDEX $ES_INDEX
ENV ES_MAPPING $ES_MAPPING

# Download and extract Elasticesarch archive
RUN set -x \
  && wget -q -O elasticesarch.tar.gz "$ELASTICSEARCH_TGZ_URL" \
  && tar -xvf elasticesarch.tar.gz --strip-components=1 \
  && rm elasticesarch.tar.gz*

# Create Elasticsearch user and group
RUN groupadd elasticsearch
RUN useradd -s /bin/false -g elasticsearch -d $ELASTICSEARCH_HOME elasticsearch

# Set sudoer for "tomcat"
RUN echo 'elasticsearch ALL=(ALL) NOPASSWD: ALL' >> /etc/sudoers

# Update permissions on scripts
RUN \
  chmod +x $ELASTICSEARCH_HOME/bin/*.sh && \
  chmod +x $ELASTICSEARCH_HOME/bin/elasticsearch && \
  chmod +x $ELASTICSEARCH_HOME/bin/plugin

# Define mountable directories.
VOLUME ["${ELASTICEARCH_HOME}/data"]

# Update Elastcisearch permissions
RUN chown -R elasticsearch:elasticsearch $ELASTICSEARCH_HOME

# Copy elasticsearch.yml configuration file
COPY ["configs/elasticsearch/elasticsearch.yml", "$ELASTICSEARCH_HOME/config/"]

#-------------------------------------------------------------
# Install Elasticesarch-head 2.x
#-------------------------------------------------------------
WORKDIR $ELASTICSEARCH_HOME
RUN bin/plugin install mobz/elasticsearch-head

#-------------------------------------------------------------
# Install Node 8.12.0 via (NVM)
#-------------------------------------------------------------
ENV NVM_DIR $HOME/.nvm
RUN mkdir -p $NVM_DIR
ENV NODE_VERSION 8.12.0

# Install NMV
# https://github.com/creationix/nvm#install-script
RUN curl --silent -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash

# Update permissions on nvm.sh
RUN chmod +x $NVM_DIR/nvm.sh

# install node and npm
RUN \
 source $NVM_DIR/nvm.sh \
 && nvm install $NODE_VERSION \ 
 && nvm alias default $NODE_VERSION \
 && nvm use default

# Add node and npm to path so the commands are available
ENV NODE_PATH $NVM_DIR/$NODE_VERSION/lib/node_modules
ENV PATH $NVM_DIR/versions/node/v$NODE_VERSION/bin:$PATH

# Confirm Installation
RUN node -v
RUN npm -v

#-------------------------------------------------------------
# Install Elasticdump
#-------------------------------------------------------------
# install elasticdump to global repo
RUN \
  npm install elasticdump -g

#-------------------------------------------------------------
# Start Supervisor 
#-------------------------------------------------------------
RUN /usr/bin/supervisord -c /etc/supervisor/supervisord.conf

#-------------------------------------------------------------
# Populate Elasitcsearch with THOR_DATA 
#-------------------------------------------------------------
ENV ES_THOR_DATA $ELASTICSEARCH_HOME/thor_data
ENV THOR_DATA $INST_HOME/thor_data
RUN mkdir -p $ES_THOR_DATA
RUN mkdir -p $THOR_DATA
WORKDIR $INST_HOME

# Set default args or update from passed in --build-args
ARG CREDS=user:pass
ARG GIT_REPO=gitlab.nextcentury.com
ARG THOR_DATA_REPO=LORELEI.THOR/thor_data.git
ARG THOR_DATA_BRANCH=master

# Clone the THOR_DATA git repo
RUN git clone https://$CREDS@$GIT_REPO/$THOR_DATA_REPO -b master
WORKDIR $THOR_DATA

# Copy over Elasticsearch config files
COPY ["configs/elasticsearch/index-settings.json", "$ES_THOR_DATA/"] 

# Copy over the data and mapping files based on ES_INDEX --build-arg
RUN cp ${ES_INDEX}.json $ES_THOR_DATA/
RUN cp ${ES_INDEX}_mapping.json $ES_THOR_DATA/

# Clean up THOR_DATA git repo
RUN rm -rf $THOR_DATA

#-------------------------------------------------------------
# Install Neon
#------------------------------------------------------------- 
ENV NEON_HOME $INST_HOME/neon
RUN mkdir -p $NEON_HOME
WORKDIR $INST_HOME

#Define default arguments if nothing is supplied using --build-args
ARG CREDS=user:pass
ARG GIT_REPO=gitlab.nextcentury.com
ARG NEON_REPO=LORELEI.THOR/neon.git
ARG NEON_BRANCH=master

# Pull Neon Git Repo
#RUN git clone https://$CREDS@$NEON_REPO -b $NEON_BRANCH
RUN git clone https://$CREDS@$GIT_REPO/$NEON_REPO -b $NEON_BRANCH

# Run Neon Gradle Build
WORKDIR $NEON_HOME
RUN cp gradle.properties.sample gradle.properties
RUN ./gradlew war

# Copy Neon war into Tomcat webapps directory
RUN cp neon-server/build/libs/neon-*-SNAPSHOT.war $CATALINA_HOME/webapps/neon.war

# Clean up Neon git directory and Downloaded dependencies
RUN rm -rf ~/.gradle
RUN rm -rf $NEON_HOME

#-------------------------------------------------------------
# Install LORELEI-Demo
#-------------------------------------------------------------
ENV LORELEI_HOME $INST_HOME/Lorelei-demo
RUN mkdir -p $LORELEI_HOME
WORKDIR $INST_HOME

#Define default arguments if nothing is supplied using --build-args during build
ARG CREDS=user:pass
ARG GIT_REPO=gitlab.nextcentury.com
ARG LORELEI_REPO=LORELEI.THOR/Lorelei-demo.git
ARG LORELEI_BRANCH=master
ARG LORELEI_CONFIG=config.json

# Pull Lorelei-demo Git Repo
RUN git clone https://$CREDS@$GIT_REPO/$LORELEI_REPO -b $LORELEI_BRANCH

# Install Angualr and NPM Dependencies
WORKDIR $LORELEI_HOME
RUN npm install -g @angular/cli
RUN npm install

# Create config file
RUN cp src/app/config/$LORELEI_CONFIG src/app/config/config.json

# Build for Deployment
RUN npm run build

# Copy Neon war into Tomcat webapps directory
RUN cp target/lorelei.war $CATALINA_HOME/webapps/lorelei.war

# Clean up Lorelei git directory
RUN rm -rf $LORELEI_HOME

#-------------------------------------------------------------
# Install GeoServer 2.14.x
#-------------------------------------------------------------
ENV GEOSERVER_HOME $INST_HOME/geoserver
ENV PATH $GEOSERVER_HOME/bin:$PATH
RUN mkdir -p $GEOSERVER_HOME

ENV GEOSERVER_DATA $CATALINA_HOME/webapps/geoserver/data
RUN mkdir -p $GEOSERVER_DATA
WORKDIR $GEOSERVER_HOME

ENV GEOSERVER_VERSION=2.14.x

# Download Geoserver war into tomcat webapps 
RUN wget -c http://build.geonode.org/geoserver/latest/geoserver-${GEOSERVER_VERSION}.war \
    -O $CATALINA_HOME/webapps/geoserver.war 

# Download sample raster data
#RUN wget https://github.com/nvkelso/natural-earth-raster/raw/master/10m_rasters/NE2_HR_LC_SR_W_DR/NE2_HR_LC_SR_W_DR.tif -P $GEOSERVER_DATA
#RUN wget https://github.com/nvkelso/natural-earth-raster/raw/master/10m_rasters/NE2_HR_LC_SR_W_DR/NE2_HR_LC_SR_W_DR.prj -P $GEOSERVER_DATA
#RUN wget https://github.com/nvkelso/natural-earth-raster/raw/master/10m_rasters/NE2_HR_LC_SR_W_DR/NE2_HR_LC_SR_W_DR.tfw -P $GEOSERVER_DATA

#RUN wget https://www.naturalearthdata.com/http//www.naturalearthdata.com/download/10m/raster/NE1_HR_LC_SR_W_DR.zip -P $GEOSERVER_DATA
#-------------------------------------------------------------
# Clean up, Update Configurations and Start Supervisor
#-------------------------------------------------------------
RUN \
  rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

COPY ["configs/supervisor/supervisord.conf", "/etc/supervisor/conf.d/"]
COPY ["scripts/entrypoint.sh", "/usr/local/startup/"]
RUN chmod +x /usr/local/startup/entrypoint.sh

# Expose Ports
EXPOSE 22 8080 9200

ENTRYPOINT ["/usr/local/startup/entrypoint.sh"]
