# Sample Data Load Instructions 

1. Load the sample data into your favorite datastore. Follow the instructions below.

2. Copy the corresponding `sample.config.yaml` file into `<neon_dash_repository>/src/app/config/config.yaml`

## Elasticsearch (v7+)

Replace `http://localhost:9200` as needed.  Requires [`elasticdump`](https://www.npmjs.com/package/elasticdump).

```
curl -s -XDELETE http://localhost:9200/earthquakes
elasticdump --type=mapping --input=es7.earthquakes_mapping.json --output=http://localhost:9200/earthquakes
elasticdump --type=data --input=es7.earthquakes.json --output=http://localhost:9200/earthquakes --limit=5000
```

## Elasticsearch (v6)

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

Open the `mysql.config.yaml` file and change the `user` to the username of your MySQL earthquakes database.

## PostgreSQL

Replace `user` and `host` as needed.

```
createdb -h host -U user -W earthquakes
psql -h host -U user -W -d earthquakes -c "CREATE SCHEMA earthquakes"
psql -h host -U user -W -d earthquakes < postgresql.earthquakes.sql
```

Open the `postgresql.config.yaml` file and change the `user` and `password` to the username and password of your PostgreSQL earthquakes database. (To keep your password safe, remove the `user:password@` from the `postgresql.config.yaml` file and add it to the build settings of your NUCLEUS Data Server instead; see the instructions [here](https://github.com/NextCenturyCorporation/nucleus-data-server#datastore-authentication).)

