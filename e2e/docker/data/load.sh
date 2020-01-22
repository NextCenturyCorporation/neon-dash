#!/bin/sh
HOST="http://neon-es:9200"

npm i -g elasticdump

until curl -s ${HOST} > /dev/null
do
  sleep .5
done

declare -a DATASETS=("earthquakes")

for i in "${DATASETS[@]}"
do
    if curl -s -XDELETE ${HOST}/${i} > /dev/null; then
        elasticdump --type=mapping --input=/data/${i}_mapping.json --output=${HOST}/${i}
        elasticdump --type=data --input=/data/${i}.json --output=${HOST}/${i} --limit=5000
    fi
done

