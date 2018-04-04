The compressed file contains the earthquake example data in elasticdump format.

To load this data into your Elasticsearch instance:

1) Extract the data

2) Run the following commands: 
```bash
curl -XPOST localhost:9200/earthquakes

curl -XPOST localhost:9200/earthquakes/quakeData/_mapping -d @earthquakedata_mapping.json

elasticdump --input=earthquakes.json --output=http://localhost:9200/earthquakes --type=data