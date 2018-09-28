#!/bin/bash



#sudo docker run -v ~/Desktop/data:/usr/local/geoserver/data/NE2_HR_LC_SR_W_DR -it -p 2222:22 -p 8888:8080 -p 9999:9200 lorelei
sudo docker run -v ~/Desktop/data:/usr/local/geoserver/data/NE2_HR_LC_SR_W_DR -d -p 2222:22 -p 8888:8080 -p 9999:9200 lorelei

