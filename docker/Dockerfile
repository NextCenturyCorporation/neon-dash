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
  vim

# ------------------------------------------------------------
#  Install Java OpenJDK 8
# ------------------------------------------------------------
RUN \
  apt-get install -y --fix-missing openjdk-8-jdk

# Define JAVA_HOME variable
ENV JAVA_HOME /usr/lib/jvm/java-8-openjdk-amd64

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
ENV CATALINA_HOME /usr/local/tomcat
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

# Update Tomcat directory permissions
RUN chown -R tomcat:tomcat $CATALINA_HOME

#------------------------------------------------------------
# Install Elasticsearch 2.5.4
#------------------------------------------------------------
ENV ELASTICSEARCH_HOME /usr/local/elasticsearch
ENV PATH $ELASTICSEARCH_HOME/bin:$PATH
RUN mkdir -p $ELASTICSEARCH_HOME
WORKDIR $ELASTICSEARCH_HOME

ENV ELASTCSEARCH_MAJOR 2
ENV ELATICSEARCH_VERSION 2.5.4
ENV ELASTICSEARCH_TGZ_URL https://download.elastic.co/elasticsearch/release/org/elasticsearch/distribution/tar/elasticsearch/2.4.5/elasticsearch-2.4.5.tar.gz

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
ENV THOR_DATA $ELASTICSEARCH_HOME/thor_data
RUN mkdir -p $THOR_DATA
WORKDIR $THOR_DATA

# //TODO Update with Gitclone
# Copy over the data and mapping files
COPY ["data/ldc_uyg_jul_18.json", \
      "data/ldc_uyg_jul_18_mapping.json", "$THOR_DATA/"]

# Copy over Elasticsearch configs files
COPY ["configs/elasticsearch/index-settings.json", "$THOR_DATA/"] 

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
