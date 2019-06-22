#!/bin/sh
HOST="http://e2e_es:9200"
DATA_SET="ldc_uyg_jul_18"

until curl -s ${HOST} > /dev/null
do
  sleep .5
done

curl -X DELETE -s ${HOST}/${DATA_SET}
curl -H 'Content-Type: application/json' \
     -XPUT -s \
     -d @/data/${DATA_SET}_mapping.json \
     ${HOST}/${DATA_SET}

npx elasticdump --input=/data/${DATA_SET}.json --output=${HOST}
