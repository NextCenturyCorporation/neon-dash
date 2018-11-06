#!/bin/bash -x

# Start Supervisor if not already running
if ! ps aux | grep -q "[s]upervisor"; then
  echo "Starting supervisor service"
  /usr/bin/supervisord -nc /etc/supervisor/supervisord.conf &
else
  echo "Supervisor is currently running"
fi

# Elasticsearch variables
ES_DATA=$ES_DATA
ES_URL=$ES_URL
ES_DATA_MAPPING_TUPLE=$ES_DATA_MAPPING_TUPLE

# Wait until Elasticsearch is up and running
until curl -s --output /dev/null -XGET $ES_URL/; do
  echo "Elasticsearch is unavailable - sleeping 2 seconds "
  sleep 2
done

# Verify if elasticsearch was already setup
if [ ! -f /.es_created ]; then
  echo "Setting up Elasticsearch index and ingesting data"

  # Create Elasticsearch indexs and mappings
  IFS=',' read -ra listArr <<< "$ES_DATA_MAPPING_TUPLE"

  #loop through the list of elements
  for item in "${listArr[@]}"
  do
     IFS=':' read -ra elements <<< "$item"
     echo "*****Creating and loading data for index: ${elements[0]}*****"
     curl -XPUT "$ES_URL/${elements[0]}/" -d @"$ES_DATA/index-settings.json"
     curl -XPUT "$ES_URL/${elements[0]}/${elements[1]}/_mapping" -d @"$ES_DATA/${elements[0]}_mapping.json"

  	# Insert Elasticsearch data
  	elasticdump \
    	  --bulk=true \
    	  --input="$ES_DATA/${elements[0]}.json" \
    	  --output="$ES_URL/${elements[0]}"
  done

  echo "creating /.es_created"
  touch /.es_created
else 
  echo "Elasticsearch has already been setup"
fi

# Tomcat variables
TOMCAT_URL=$TOMCAT_URL
CATALINA_HOME=$CATALINA_HOME

# Wait until Tomcat is up and running
until curl --output /dev/null --silent --head --fail $TOMCAT_URL; do
 echo "Tomcat is unavailable - sleeping 5 seconds "
 sleep 5
done

# Geoserver variables
GEOSERVER_URL=$GEOSERVER_URL
GEOSERVER_HOME_DATA=$GEOSERVER_HOME_DATA
GEOSERVER_DATA=$GEOSERVER_DATA
GEOSERVER_XML=$GEOSERVER_XML
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

  # Remove all default workpsaces
  curl -u admin:geoserver -X DELETE $GEOSERVER_URL/rest/workspaces/tiger?recurse=true
  curl -u admin:geoserver -X DELETE $GEOSERVER_URL/rest/workspaces/nurc?recurse=true
  curl -u admin:geoserver -X DELETE $GEOSERVER_URL/rest/workspaces/topp?recurse=true
  curl -u admin:geoserver -X DELETE $GEOSERVER_URL/rest/workspaces/sf?recurse=true
  curl -u admin:geoserver -X DELETE $GEOSERVER_URL/rest/workspaces/cite?recurse=true
  # //TODO it.geosolutions is truncated at the '.', not sure how to programmatically delete this. 
  curl -u admin:geoserver -X DELETE $GEOSERVER_URL/rest/workspaces/it.geosolutions?recurse=true
  curl -u admin:geoserver -X DELETE $GEOSERVER_URL/rest/workspaces/sde?recurse=true


  # Check for Natural Earth Data Directory and TIF exist
  if [ -d "$GEOSERVER_XML/$NATURAL_EARTH_DIR" -a -f "$GEOSERVER_DATA/$NATURAL_EARTH_DIR/$NATURAL_EARTH_FILE" ]; then

     echo "Natural Earth data found"
     
     # Copy the data to the tomcat geoserver data dir
     mkdir -p $GEOSERVER_HOME_DATA/$NATURAL_EARTH_DIR
     cp "$GEOSERVER_DATA/$NATURAL_EARTH_DIR/$NATURAL_EARTH_FILE" $GEOSERVER_HOME_DATA/$NATURAL_EARTH_DIR
     
     # Create the Natural Earth namespace
     curl -u admin:geoserver -v -XPOST -H "Content-type: text/xml" -d @$GEOSERVER_XML/$NATURAL_EARTH_DIR/namespace.xml $GEOSERVER_URL/rest/namespaces

     # Create the Natural Earth coverage store
     curl -u admin:geoserver -v -XPOST -H "Content-type: text/xml" -d @$GEOSERVER_XML/$NATURAL_EARTH_DIR/$NATURAL_EARTH_DIR/coveragestore.xml $GEOSERVER_URL/rest/workspaces/$NATURAL_EARTH_NS/coveragestores

     # Create the Natural Earth coverage
     curl -u admin:geoserver -v -XPOST -H "Content-type: text/xml" -d @$GEOSERVER_XML/$NATURAL_EARTH_DIR/$NATURAL_EARTH_DIR/$NATURAL_EARTH_DIR/coverage.xml $GEOSERVER_URL/rest/workspaces/$NATURAL_EARTH_NS/coveragestores/$NATURAL_EARTH_DIR/coverages
  fi

  # Check for Blue Earth Data Directory and if TIF files exist
  if [ -d "$GEOSERVER_XML/$BLUE_MARBLE_DIR" -a -f "$GEOSERVER_DATA/$BLUE_MARBLE_DIR/$BLUE_MARBLE_FILE" ]; then

     echo "Blue Marble data found"

     # Copy the data to the tomcat geoserver data dir
     mkdir -p $GEOSERVER_HOME_DATA/$BLUE_MARBLE_DIR
     cp "$GEOSERVER_DATA/$BLUE_MARBLE_DIR/$BLUE_MARBLE_FILE" $GEOSERVER_HOME_DATA/$BLUE_MARBLE_DIR

     # Create the Natural Earth namespace
     curl -u admin:geoserver -v -XPOST -H "Content-type: text/xml" -d @$GEOSERVER_XML/$BLUE_MARBLE_DIR/namespace.xml $GEOSERVER_URL/rest/namespaces

     # Create the Natural Earth coverage store
     curl -u admin:geoserver -v -XPOST -H "Content-type: text/xml" -d @$GEOSERVER_XML/$BLUE_MARBLE_DIR/$BLUE_MARBLE_DIR/coveragestore.xml $GEOSERVER_URL/rest/workspaces/$BLUE_MARBLE_NS/coveragestores

     # Create the Natural Earth coverage
     curl -u admin:geoserver -v -XPOST -H "Content-type: text/xml" -d @$GEOSERVER_XML/$BLUE_MARBLE_DIR/$BLUE_MARBLE_DIR/$BLUE_MARBLE_DIR/coverage.xml $GEOSERVER_URL/rest/workspaces/$BLUE_MARBLE_NS/coveragestores/$BLUE_MARBLE_DIR/coverages
  fi	 

  echo "creating /.geoserver_created"
  touch /.geoserver_created
fi

# We are breaking convention and standing everything up in a single container. Because of this
# we need to end the script with a single process that continues to run forever to keep the 
# container alive.
tail -f /dev/null
