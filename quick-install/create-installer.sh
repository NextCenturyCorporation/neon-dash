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

#create a compressed archive containing everything on this folder excluding this script (create-install.sh)
tar -czvf neon.tar.gz --exclude='create-installer.sh' --exclude='neon.tar.gz' ./ -C .. dist
