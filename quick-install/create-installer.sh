# creates neon installer archive

# IMPORTANT: please see the README before executing this script

# temporarily bring required files to this folder. will be cleared once zip archive is created.
cp -r ../dist dist
cp -r ../e2e/docker/data data
cp -r ../e2e/docker/resources resources
cp -r ../e2e/docker/docker-compose.yml docker-compose.yml

#create a compressed archive containing everything on this folder excluding this script (create-install.sh)
zip -r neon.zip dist data resources docker-compose.yml neon-api.tar.gz README.md install.* start.* stop.*

# clear temp files
rm -r dist
rm -r data
rm -r resources
rm docker-compose.yml
