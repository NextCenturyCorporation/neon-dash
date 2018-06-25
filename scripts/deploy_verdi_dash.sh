#!/bin/bash

set -x

timestamp=`date +%Y-%m-%d`

# copy verdi config into config.json
cp ../src/app/config/config.verdi.json ../src/app/config/config.json

# build VERDI-Dash
npm run aida

# move .war file to AWS Machine
scp -i ~/.ssh/AIDA-All.pem ../target/aida.war ubuntu@34.201.36.109:aida_$timestamp.war

# stop Tomcat; replace war file; start Tomcat
ssh -i ~/.ssh/AIDA-All.pem ubuntu@34.201.36.109 'sudo service tomcat7 stop'
ssh -i ~/.ssh/AIDA-All.pem ubuntu@34.201.36.109 'sudo rm /var/lib/tomcat7/webapps/aida.war'
ssh -i ~/.ssh/AIDA-All.pem ubuntu@34.201.36.109 'sudo rm -r /var/lib/tomcat7/webapps/aida'
ssh -i ~/.ssh/AIDA-All.pem ubuntu@34.201.36.109 'cd /var/lib/tomcat7/webapps; ls'
ssh -i ~/.ssh/AIDA-All.pem ubuntu@34.201.36.109 'cd /var/lib/tomcat7/webapps; sudo cp ~/aida_'$timestamp'.war ./aida.war'
ssh -i ~/.ssh/AIDA-All.pem ubuntu@34.201.36.109 'sudo service tomcat7 start'
