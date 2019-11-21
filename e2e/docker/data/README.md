# Sample Data Load Instructions 

## Elasticsearch

Replace `http://localhost:9200` as needed.  Requires [`elasticdump`](https://www.npmjs.com/package/elasticdump).

```
curl -s -XDELETE http://localhost:9200/earthquakes
elasticdump --type=mapping --input=earthquakes_mapping.json --output=http://localhost:9200/earthquakes
elasticdump --type=data --input=earthquakes.json --output=http://localhost:9200/earthquakes --limit=5000
```

## MySQL

```
mysql < mysql.earthquakes.sql
```

## PostgreSQL

Replace `user` and `host` as needed.

```
createdb -h host -U user -W earthquakes
psql -h host -U user -W -W -d earthquakes < postgresql.earthquakes.sql
```

