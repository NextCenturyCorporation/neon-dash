FROM alpine:latest
MAINTAINER patrick.sharkey@nextcentury.com

# Install system packages
RUN apk add --update --no-cache \
  bash \
  curl \
  git \
  wget \
  vim

# ------------------------------------------------------------
#  Install Java OpenJDK 8
# ------------------------------------------------------------
RUN \
  apk add --update --no-cache openjdk8

# Define JAVA_HOME variable
ENV JAVA_HOME /usr/lib/jvm/java-8-openjdk-amd64

#-------------------------------------------------------------
#  Install Supervisor
#-------------------------------------------------------------
RUN \
  apk add --update --no-cache supervisor 

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
  apk add --update --no-cache openssh

# Configure OpenSSH
RUN mkdir $SSHD_HOME

# Set user/pass to root:lorelei
RUN echo 'root:lorelei' | chpasswd
RUN sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config

# SSH login fix. Otherwise user is kicked off after login
#RUN sed 's@session\s*required\s*pam_loginuid.so@session optional pam_loginuid.so@g' -i /etc/pam.d/sshd

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
RUN addgroup -S tomcat
RUN adduser -s /bin/false -S -G tomcat -h $CATALINA_HOME tomcat

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
RUN addgroup -S  elasticsearch
RUN adduser -s /bin/false -S -G elasticsearch -h $ELASTICSEARCH_HOME elasticesarch

# Set sudoer for "elasticsearch"
RUN echo 'elasticsearch ALL=(ALL) NOPASSWD: ALL' >> /etc/sudoers

# Update Elastcisearch permissions
#RUN chown -R elasticsearch:elasticsearch $ELASTICSEARCH_HOME

# Update permissions on scripts
#RUN \
#  chmod +x $ELASTICSEARCH_HOME/bin/*.sh && \
#  chmod +x $ELASTICSEARCH_HOME/bin/elasticsearch && \
#  chmod +x $ELASTICSEARCH_HOME/bin/plugin

# Define mountable directories.
VOLUME ["${ELASTICEARCH_HOME}/data"]

# Copy elasticsearch.yml configuration file
COPY ["configs/elasticsearch/elasticsearch.yml", "$ELASTICSEARCH_HOME/config/"]

#-------------------------------------------------------------
# Install Elasticesarch-head 2.x
#-------------------------------------------------------------
#WORKDIR $ELASTICSEARCH_HOME
#RUN bin/plugin install mobz/elasticsearch-head

#-------------------------------------------------------------
# Install Node 8.12.0 via (NVM)
#-------------------------------------------------------------
#ENV NVM_DIR $HOME/.nvm
#RUN mkdir -p $NVM_DIR
#ENV NODE_VERSION 8.12.0

# Install NMV
# https://github.com/creationix/nvm#install-script
#RUN curl --silent -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash

# Update permissions on nvm.sh
#RUN chmod +x $NVM_DIR/nvm.sh

# install node and npm
#RUN \
# source $NVM_DIR/nvm.sh \
# && nvm install $NODE_VERSION \ 
# && nvm alias default $NODE_VERSION \
# && nvm use default

# Add node and npm to path so the commands are available
#ENV NODE_PATH $NVM_DIR/v$NODE_VERSION/lib/node_modules
#ENV PATH $NVM_DIR/versions/node/v$NODE_VERSION/bin:$PATH

# Confirm Installation
#RUN node -v
#RUN npm -v

#-------------------------------------------------------------
# Install Elasticdump
#-------------------------------------------------------------
# install elasticdump to global repo
#RUN \
#  npm install elasticdump -g

#-------------------------------------------------------------
# Clean up, Update Configurations and Start Supervisor
#-------------------------------------------------------------
RUN \
  rm -rf /var/cache/apk/* /tmp/* /var/tmp/*

COPY ["configs/supervisor/supervisord.conf", "/etc/supervisor/conf.d/"]

# Expose Ports
EXPOSE 22 8080 9200

# Define default command.
CMD ["/usr/bin/supervisord"]
