# Lorelei Docker Build

## Setup

### Install Docker

You will first need to install Docker. Here is a detailed guide on installing Docker on Ubuntu: [How to install and Use Docker on Ubuntu 18.04](https://www.digitalocean.com/community/tutorials/how-to-install-and-use-docker-on-ubuntu-18-04)

### Setup Docker experimentals

This is an optional step, but is highly **recommended**. Docker has an experimental feature called squash. Squashing
your Docker image during the build process will significantly reduce the size of your Docker image. To be able
to use the `--squash` flag during the build process you must enable experimental docker functions. 

To enable, edit `/etc/docker/daemon.json` and insert the following:

```json
{
	"experimental": true
}
```

Save, restart Docker via `service docker restart` and confirm experimentals is now enablled on the **Server**
```
$ docker version
```

```bash
Client:
 Version:           18.06.1-ce
 API version:       1.38
 Go version:        go1.10.3
 Git commit:        e68fc7a
 Built:             Tue Aug 21 17:24:51 2018
 OS/Arch:           linux/amd64
 Experimental:      false

Server:
 Engine:
  Version:          18.06.1-ce
  API version:      1.38 (minimum version 1.12)
  Go version:       go1.10.3
  Git commit:       e68fc7a
  Built:            Tue Aug 21 17:23:15 2018
  OS/Arch:          linux/amd64
  Experimental:     true
```

### Download GeoTIFF data and create bind mount data directory

Lorelei Docker supports an offline tile server for the Lorelei map component via [Geoserver](http://geoserver.org/). If you require an offline WMS server you will need to download the appropraite GeoTIFF data and store it in a data directory. Currently this build supports [Nartual Earth II](https://www.naturalearthdata.com/downloads/10m-raster-data/10m-natural-earth-2/) and [Blue Marble data](https://neo.sci.gsfc.nasa.gov/view.php?datasetId=BlueMarbleNG-TB) GeoTIFF data.

##### Direct GeoTIFF (raster) Data Downloads: 
+ [Natrual Earth II with Shaded Relief, Water, and Drainages: 310.7MB](https://www.naturalearthdata.com/http//www.naturalearthdata.com/download/10m/raster/NE2_HR_LC_SR_W_DR.zip) 
+ [Blue Marble: 10.9MB](http://neo.sci.gsfc.nasa.gov/servlet/RenderData?si=526311&cs=rgb&format=TIFF&width=3600&height=1800)

##### Data directory creation
Once you have downloaded the data, extract it and create a directory that will act as the bind mount location for the Docker build. The root location of the directory does not matter, but the structure inside does. For our example directory we will name it *data*. Inside the data directory you will need to create a *BLUE_MARBLE* directory and/or a *NATURAL_EARTH_II* directory. Ensure the naming on these directories is exact. Lastly, put the extracted downloaded data files in their respective sub-directories. Your directory structure should look something like this:

```
/data
  |--BLUE_MARBLE
     |--BlueMarbleNG-TB_2004-12-01_rgb_3600x1800.TIFF
  |--NATURAL_EARTH_II
     |--NE2_HR_LC_SR_W_DR.tif
```

## Building Lorelei Docker image

| Build Arg          | Drescription  | 
| -------------------|:-------------| 
| CREDS              | NextCentury git credentials separated by a colon: **example**: *someuser:pa$$word* |       
| GIT_REPO           | Base hostname for your github/gitlab | 
| NEON_REPO          | Git group/name repository for Neon      |    
| NEON_BRANCH        | Neon git branch name      |  
| LORELEI_REPO       | Git group/name repository for Lorelei      |  
| LORELEI_BRANCH     | Lorelei git branch name      |  
| LORELEI_CONFIG     | Name of the config file to deploy with Lorelei from the /src/app/config folder |      |  
| THOR_DATA_REPO     | Git group/name repository for THOR_DATA       |  
| THOR_DATA_BRANCH   | THOR_DATA git branch name       |  
| ES_INDEX           | Elasticsearch index that will be created and store the data. This value must match the name of the data file and mapping file in THOR_DATA to be ingested |  
| ES_MAPPING         | Name used when creating the mapping in Elasticsearch |
| NATURAL_EARTH_DIR  | Directory where the Natural Earth II data is stored for the bind mount. `Do not change this value`      |  
| NATURAL_EARTH_FILE | Name of the Natural Earth II data file used. _Do not change this value_     |  
| NATURAL_EARTH_NS   | The namespace used for Natural Eearth II in Geoserver. `Do not change this value_`      |  
| BLUE_MARBLE_DIR    | Directory where the Blue Marble data is stored for the bind mount. `Do not change this value`      |  
| BLUE_MARBLE_FILE   | Name of the Blue Marble data file used. `Do not change this value`       |  
| BLUE_MARBLE_NS     | Directory where the Blue Marble data is stored for the bind mount. `Do not change this value`      |



## Useful Docker Commands

### List all images
docker images

### Remove images
docker rmi {image-id}

### Delete all images 
sdocker rmi $(docker images -a -q)

### List running containers
docker ps -a

### Get ID of last run container
docker ps -l -q

### Stop docker container
docker stop container-id

### Start docker container
docker start container-id

### Delete docker container
docker rm container-id

### Force delete container without stopping
docker rm -f container-id

### Delete all stopped containers
docker rm $(sudo docker ps -a -q)

### Open Container Bash Shell
docker exec -i -t container-id /bin/bash
