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
ES_INDEX="ldc_uyg_jul_18"
ES_MAPPING="ui_out"
PORT=9200
URL="http://localhost:$PORT"

# Wait until Elasticsearch is up and running
until curl -s --output /dev/null -XGET $URL/; do
  echo "Elasticsearch is unavailable - sleeping 2s"
  sleep 2
done

# Verify if elasticsearch was already setup
if [ ! -f /.es_created ]; then
  echo "Setting up Elasticsearch index and ingesting data"

  # Create Elasticsearch index and mapping
  curl -XPUT "$URL/$ES_INDEX/" -d @"$ES_DATA/index-settings.json"
  curl -XPUT "$URL/$ES_INDEX/$ES_MAPPING/_mapping" -d @"$ES_DATA/${ES_INDEX}_mapping.json"

  # Insert Elasticsearch data
  elasticdump \
    --bulk=true \
    --input="$ES_DATA/${ES_INDEX}.json" \
    --output="$URL/$ES_INDEX"

  echo "creating /.es_created"
  touch /.es_created
else 
  echo "Elasticsearch has already been setup"
fi

# We are breaking convention and standing everything up in a single container. Because of this
# we need to end the script with a single process that continues to run forever to keep the 
# container alive.
tail -f /dev/null
