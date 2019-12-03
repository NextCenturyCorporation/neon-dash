#!/bin/sh
HOST="http://neon-es:9200"
DATA_SET="earthquakes"

until curl -s ${HOST} > /dev/null
do
  sleep .5
done

curl -X DELETE -s ${HOST}/*
curl -H 'Content-Type: application/json' \
     -XPUT -s \
     -d @/data/${DATA_SET}_mapping.json \
     ${HOST}/${DATA_SET}

npx elasticdump --input=/data/${DATA_SET}.json --output=${HOST} --limit=10000
