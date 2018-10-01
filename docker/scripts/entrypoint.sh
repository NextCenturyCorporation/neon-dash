#!/bin/bash -x

# Start Supervisor if not already running
if ! ps aux | grep -q "[s]upervisor"; then
  echo "Starting supervisor service"
  /usr/bin/supervisord -nc /etc/supervisor/supervisord.conf &
else
  echo "Supervisor is currently running"
fi

# Elasticsearch variables
ES_DATA="/usr/local/elasticsearch/thor_data"
ES_URL="http://localhost:9200"
ES_INDEX=$ES_INDEX
ES_MAPPING=$ES_MAPPING

# Wait until Elasticsearch is up and running
until curl -s --output /dev/null -XGET $ES_URL/; do
  echo "Elasticsearch is unavailable - sleeping 2 seconds "
  sleep 2
done

# Verify if elasticsearch was already setup
if [ ! -f /.es_created ]; then
  echo "Setting up Elasticsearch index and ingesting data"

  # Create Elasticsearch index and mapping
  curl -XPUT "$ES_URL/$ES_INDEX/" -d @"$ES_DATA/index-settings.json"
  curl -XPUT "$ES_URL/$ES_INDEX/$ES_MAPPING/_mapping" -d @"$ES_DATA/${ES_INDEX}_mapping.json"

  # Insert Elasticsearch data
  elasticdump \
    --bulk=true \
    --input="$ES_DATA/${ES_INDEX}.json" \
    --output="$ES_URL/$ES_INDEX"

  echo "creating /.es_created"
  touch /.es_created
else 
  echo "Elasticsearch has already been setup"
fi

# Tomcat variables
TOMCAT_URL="http://localhost:8080"
CATALINA_HOME=$CATALINA_HOME

# Wait until Tomcat is up and running
until curl --output /dev/null --silent --head --fail $TOMCAT_URL; do
 echo "Tomcat is unavailable - sleeping 5 seconds "
 sleep 5
done

# Geoserver variables
GEOSERVER_URL="http://localhost:8080/geoserver"
GEOSERVER_DATA="/usr/local/geoserver/data"
GEOSERVER_XML="/usr/local/geoserver/xml"
NATURAL_EARTH_DIR=$NATURAL_EARTH_DIR
NATURAL_EARTH_FILE=$NATURAL_EARTH_FILE
NATURAL_EARTH_NS=$NATURAL_EARTH_NS
BLUE_MARBLE_DIR=$BLUE_MARBLE_DIR
BLUE_MARBLE_FILE=$BLUE_MARBLE_FILE
BLUE_MARBLE_NS=$BLUE_MARBLE_NS

# Wait until Geoserver is up and running
until $(curl --output /dev/null --silent --head --fail $GEOSERVER_URL); do
  echo "Geoserver is unavailable - sleeping 5 seconds"
  sleep 5
done

# Verfiy if geoserver was already setup
if [ ! -f /.geoserver_created ]; then

  # Check for Natural Earth Data Directory and TIF exist
  if [ -d "$GEOSERVER_XML/$NATURAL_EARTH_DIR" -a -f "$GEOSERVER_DATA/$NATURAL_EARTH_DIR/$NATURAL_EARTH_FILE" ]; then

     echo "Natural Earth data found"
     
     # Copy the data to the tomcat geoserver data dir
     mkdir -p $CATALINA_HOME/webapps/geoserver/data/$NATURAL_EARTH_DIR
     cp "$GEOSERVER_DATA/$NATURAL_EARTH_DIR/$NATURAL_EARTH_FILE" $CATALINA_HOME/webapps/geoserver/data/$NATURAL_EARTH_DIR
     chown -R tomcat:tomcat $CATALINA_HOME

     # Create the Natural Earth namespace
     curl -u admin:geoserver -v -XPOST -H "Content-type: text/xml" -d @/usr/local/geoserver/xml/$NATURAL_EARTH_DIR/namespace.xml $GEOSERVER_URL/rest/namespaces

     # Create the Natural Earth workspace
     curl -u admin:geoserver -v -XPOST -H "Content-type: text/xml" -d @/usr/local/geoserver/xml/$NATURAL_EARTH_DIR/workspace.xml $GEOSERVER_URL/rest/workspaces
  
     # Create the Natural Earth coverage store
     curl -u admin:geoserver -v -XPOST -H "Content-type: text/xml" -d @/usr/local/geoserver/xml/$NATURAL_EARTH_DIR/$NATURAL_EARTH_DIR/coveragestore.xml $GEOSERVER_URL/rest/workspaces/$NATURAL_EARTH_NS/coveragestores

     # Create the Natural Earth coverage
     curl -u admin:geoserver -v -XPOST -H "Content-type: text/xml" -d @/usr/local/geoserver/xml/$NATURAL_EARTH_DIR/$NATURAL_EARTH_DIR/$NATURAL_EARTH_DIR/coverage.xml $GEOSERVER_URL/rest/workspaces/$NATURAL_EARTH_NS/coveragestores/$NATURAL_EARTH_DIR/coverages
  fi

  # Check for Blue Earth Data Directory and if TIF files exist
  if [ -f "$GEOSERVER_DATA/$BLUE_MARBLE_DIR/$BLUE_MARBLE_FILE" ]; then

     echo "Blue Marble data found"

     # Copy the data to the tomcat geoserver data dir
     mkdir -p $CATALINA_HOME/webapps/geoserver/data/$BLUE_MARBLE_DIR
     cp "$GEOSERVER_DATA/$BLUE_MARBLE_DIR/$BLUE_MARBLE_FILE" $CATALINA_HOME/webapps/geoserver/data/$BLUE_MARBLE_DIR
     chown -R tomcat:tomcat $CATALINA_HOME

     # Create the Natural Earth namespace
     curl -u admin:geoserver -v -XPOST -H "Content-type: text/xml" -d @/usr/local/geoserver/xml/$BLUE_MARBLE_DIR/namespace.xml $GEOSERVER_URL/rest/namespaces

     # Create the Natural Earth workspace
     curl -u admin:geoserver -v -XPOST -H "Content-type: text/xml" -d @/usr/local/geoserver/xml/$BLUE_MARBLE_DIR/workspace.xml $GEOSERVER_URL/rest/workspaces

     # Create the Natural Earth coverage store
     curl -u admin:geoserver -v -XPOST -H "Content-type: text/xml" -d @/usr/local/geoserver/xml/$BLUE_MARBLE_DIR/$BLUE_MARBLE_DIR/coveragestore.xml $GEOSERVER_URL/rest/workspaces/$BLUE_MARBLE_NS/coveragestores

     # Create the Natural Earth coverage
     curl -u admin:geoserver -v -XPOST -H "Content-type: text/xml" -d @/usr/local/geoserver/xml/$BLUE_MARBLE_DIR/$BLUE_MARBLE_DIR/$BLUE_MARBLE_DIR/coverage.xml $GEOSERVER_URL/rest/workspaces/$BLUE_MARBLE_NS/coveragestores/$BLUE_MARBLE_DIR/coverages
  fi	 

  echo "creating /.geoserver_created"
  touch /.geoserver_created
fi

# We are breaking convention and standing everything up in a single container. Because of this
# we need to end the script with a single process that continues to run forever to keep the 
# container alive.
tail -f /dev/null
