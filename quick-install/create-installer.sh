#creates neon installer archive

#**************************IMPORTANT: do the following before executing this script****************************
#1. please make sure that the latest neon-server docker image (neon-api.tar.gz) is copied to the quick-install 
#   folder. This file is an archive of the neon-server image pulled from docker. Consult the neon-server 
#   documentation on how to create a docker image for neon-server. After creating this docker image, use the 
#   following command to save the image as a zip archive and copy the zip archive to the quick-install folder.
#       
#           docker save com.ncc.neon/server:latest | gzip > neon-api.tar.gz
#
#2. make sure that the dist folder under the neon-dashboard is upto date by running the neon-dahsboard build
#           
#           npm run build-prod
#***************************************************************************************************************

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
