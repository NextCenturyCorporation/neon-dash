FROM ubuntu:18.04
MAINTAINER patrick.sharkey@nextcentury.com

# Update system packages and remove any downloaded files
RUN \
  rm -rf /var/lib/apt/lists/* && \
  apt-get clean && \
  apt-get -y update

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
  apt-get install -y openjdk-8-jdk

# Define JAVA_HOME variable
ENV JAVA_HOME /usr/lib/jvm/java-8-openjdk-amd64

#-------------------------------------------------------------
#  Install Supervisor
#-------------------------------------------------------------
RUN \
  apt-get install -y supervisor 

# Create log directory
RUN mkdir -p /var/log/supervisor

# Define mountable directories.
VOLUME ["/etc/supervisor/conf.d"]

# Define working directory.
WORKDIR /etc/supervisor/conf.d

#------------------------------------------------------------
# Install OpenSSH Server
#------------------------------------------------------------
RUN \
  apt-get install -y openssh-server

# Configure OpenSSH
RUN mkdir /var/run/sshd

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
RUN mkdir -p "$CATALINA_HOME"
WORKDIR $CATALINA_HOME

ENV TOMCAT_MAJOR 8
ENV TOMCAT_VERSION 8.5.34
ENV TOMCAT_TGZ_URL https://www.apache.org/dist/tomcat/tomcat-$TOMCAT_MAJOR/v$TOMCAT_VERSION/bin/apache-tomcat-$TOMCAT_VERSION.tar.gz

# Download and extract Tomcat archive
RUN set -x \
	\
	&& wget -O tomcat.tar.gz "$TOMCAT_TGZ_URL" \
	&& tar -xvf tomcat.tar.gz --strip-components=1 \
	&& rm tomcat.tar.gz* 

# Create user for Tomcat Web Management Interface
COPY ["scripts/tomcat/create_tomcat_admin_user.sh", "$CATALINA_HOME/"]
RUN chmod +x $CATALINA_HOME/create_tomcat_admin_user.sh
RUN $CATALINA_HOME/create_tomcat_admin_user.sh



#-------------------------------------------------------------
# Update Configurations and Start Supervisor
#-------------------------------------------------------------
COPY ["configs/supervisord.conf", "/etc/supervisor/conf.d/"]

# Expose Ports
EXPOSE 22 8080

# Define default command.
CMD ["supervisord", "-c", "/etc/supervisor/supervisord.conf"]
