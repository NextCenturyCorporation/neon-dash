# Lorelei Docker Build

## Setup

### Install Docker

You will first need to install Docker. Here is a detailed guide on installing Docker on Ubuntu: [How to install and Use Docker on Ubuntu 18.04](https://www.digitalocean.com/community/tutorials/how-to-install-and-use-docker-on-ubuntu-18-04)

### Setup Docker experimentals

This is an optional step, but is highly **recommended**. Docker has an experimental feature called squash. Squashing
your Docker image during the build process will significantly reduce the size of your final Docker image. To levage
the `--squash` flag during the build process you must enable experimental docker functions. 

To enable, edit `/etc/docker/daemon.json` and insert the following:

```json
{
	"experimental": true
}
```

Save, restart Docker via `service docker restart` and confirm experimentals is enabled on the **Server**
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

Lorelei Docker supports an offline tile server for the Lorelei map component via [Geoserver](http://geoserver.org/). If you require an offline WMS server you will need to download the appropraite GeoTIFF data and store it in a data directory. Currently this build supports [Nartual Earth II](https://www.naturalearthdata.com/downloads/10m-raster-data/10m-natural-earth-2/) and/or [Blue Marble](https://neo.sci.gsfc.nasa.gov/view.php?datasetId=BlueMarbleNG-TB) GeoTIFF data.

##### Direct GeoTIFF (raster) Data Downloads: 
+ [Natrual Earth II with Shaded Relief, Water, and Drainages: 310.7MB](https://www.naturalearthdata.com/http//www.naturalearthdata.com/download/10m/raster/NE2_HR_LC_SR_W_DR.zip) 
+ [Blue Marble: 10.9MB](http://neo.sci.gsfc.nasa.gov/servlet/RenderData?si=526311&cs=rgb&format=TIFF&width=3600&height=1800)

##### Data directory creation
Once you have downloaded the data, extract it and create a directory that will act as the bind mount location for the Docker build. The root location of the directory does not matter, but the structure inside does. For our example directory we will name it *data*. Inside the data directory you will need to create a *BLUE_MARBLE* directory and/or a *NATURAL_EARTH_II* directory. Ensure the naming on these directories is exact. Lastly, put the extracted downloaded data files in their respective sub-directories. Your directory structure should look something like this:

```
/data
  |--/BLUE_MARBLE
     |--BlueMarbleNG-TB_2004-12-01_rgb_3600x1800.TIFF
  |--/NATURAL_EARTH_II
     |--NE2_HR_LC_SR_W_DR.tif
```

Note* You only need to create the sub-directories for the data you plan on using in Geoserver. 

## Building Lorelei Docker image

To build the docker image you will want to copy the `build.sh.example` file provided into `build.sh`. This script is made up of a docker build command with many `--build-arg` build arguments. These arguments should be configured to meet your needs for your particular Docker Lorelei build. Each argument with an example  value is described in the table below. 

| Build Arg          |Example Value       | Drescription  | 
| -------------------|:-------------------|:-------------| 
| CREDS              | _johndoe:pa$$word_ | NextCentury git credentials separated by a colon `If you have an @ symbol in your CREDS password you will need to escape it by replacing it with %40` |       
| GIT_REPO           | _gitlab.nextcentury.com_ | Base hostname for your github/gitlab | 
| NEON_REPO          | _LORELEI.THOR/neon.git_ | Git group/name repository for Neon      |    
| NEON_BRANCH        | _master_ | Neon git branch name      |  
| LORELEI_REPO       | _LORELEI.THOR/Lorelei-demo.git_ | Git group/name repository for Lorelei      |  
| LORELEI_BRANCH     | _feature/docker-build_ | Lorelei git branch name      |  
| LORELEI_CONFIG     | _config.darpa-July2018-docker.json_ | Name of the config file to deploy with Lorelei from the /src/app/config folder |      |  
| THOR_DATA_REPO     | _LORELEI.THOR/thor_data.git_ | Git group/name repository for THOR_DATA       |  
| THOR_DATA_BRANCH   | _master_ | THOR_DATA git branch name       |  
| ES_DATA_MAPPING_TUPLE           | _ldc_uyg_jul_18_:_ui_out_,_ll_nepal_07_11_3_:_annotations_ | List of tuple values separated by a semicolon, comma delimiated. Each tuple grouping is the data file name followed by the name of the mapping. The data file name will become the name of the index in elasticsearch and help the entrypoint script in locating the .json files for the data and the mapping files. This requires the mapping file to always have the prefix of the data file name followed by \_mapping |  
| NATURAL_EARTH_DIR  | _NATURAL_EARTH_II_ | Directory name where Natural Earth II data is store locally for the bind mount. `Do not change this value`      |  
| NATURAL_EARTH_FILE | _NE2_HR_LC_SR_W_DR.tif_ | Name of the Natural Earth II data file used. `Do not change this value`     |  
| NATURAL_EARTH_NS   | _ne2_ | The namespace used for Natural Eearth II in Geoserver. `Do not change this value`      |  
| BLUE_MARBLE_DIR    | _BLUE_MARBLE_ | Directory name where the Blue Marble data is locally stored for the bind mount. `Do not change this value`      |  
| BLUE_MARBLE_FILE   | _BlueMarbleNG-TB_2004-12-01_rgb_3600x1800.TIFF_ | Name of the Blue Marble data file used. `Do not change this value`       |  
| BLUE_MARBLE_NS     | _bm_ | Directory where the Blue Marble data is stored for the bind mount. `Do not change this value`      |

In addition do the build arguments there is also a `--squash` flag at the end. This is optional. You must enable Docker experimental on the server if you would like to use this. See [Setup Docker experimentals](#Setup-Docker-experimentals)

#### Execute the build

Once you have updated all the build arguments with your appropriate values, execute the script with `./build.sh`
If you have any issues during the build, please refer to the [Known Issues](#Known-Issues) section.

## Starting the container

After building the image, you can start the lorelei Docker container. A `run.sh.example` script is provided for you in the docker directory. Copy this over to a new file `run.sh` and open it up to inspect. 

```bash
docker run -v ~/Desktop/data:/usr/local/data/geoserver/data --name lorelei -d -p 2222:22 -p 8080:8080 -p 8888:8888 -p 9200:9200 --name lorelei lorelei
```

Upon starting the Docker container, an entrypoint script is run that handles all configuration of elasticsearch, tomcat and geoserver, as well as ingesting all data. This script can take up to a minute to complete depending on how many data sets you are ingesting via the ES_DATA_MAPPING_TUPLE build argument. If you are having trouble loading the lorelei application, give it some time or check the status of the entrypoint script by checking out the docker logs for the container:

```bash
docker logs lorelei
```

#### Update bind mount location
You will need to update the first configuration after the `-v`. This is the bind mount location. Update the path before the `:` to reflect the path of your data directory created in the [Data directory creation](#Data-directory-creation) section above.

#### Detached vs STDIN mode

The default command in this script will run the Docker image in detached `-d` mode. If you experience issues and would like to see the logs as the Docker container is spinning up, comment this line out and uncomment the Docker run command that keeps STDIN open and allocates a pseudo-tty. This comamnd has `-it` in it.

#### Container services

Running the Lorelei Docker image will stand up the following services on the following ports. The table below also has any login information necessary for each service. *Note* Tomcat and Geoserver must run on port 8888 and 8080 repsectively. At this point these are not configurable. 

| Serivce       |Port       | Username  | Password  | 
| --------------|:----------|:----------|:----------| 
| **SSHD**          | 2222      | root      | lorelei   |
| **Geoserver**     | 8080      | admin     | geoserver |
| **Tomcat**       | 8888      | admin     | password  |
| **Elasticsearch** | 9200      | n/a       | n/a       |

## Vaidating the container

It is a good idea to valid everything is working properly after starting the container. It is a good idea to check that Elasticsearch and the Lorelei UI are functioning properly. You can also verify all the other services by clicking the link in the [Other validation](#Other-validation) section below. 

#### Verify Elasitcsearch data

You can verify that all the appropriate indexes, mappings and data made it into Elasticsearch by navigating to [Elasticsearch-head](https://github.com/mobz/elasticsearch-head) at `http://localhost:9200/_plugin/head` You should see something similar to this:

![Elasticsearch Data](https://i.imgur.com/9bNURiU.jpg)

#### Verify Lorelei UI

Navigate to `http://localhost:8888/lorelei` and verify that Lorelei UI is properly working.

#### Other validation

 - Neon Index: `http://localhost:8888/neon`
 - Geoserver:  `http://localhost:8080/geoserver`
 - sshd     :  `ssh root@localhost -p2222`

## Commit new Docker image

After verification we need to commit the working container into a new image. This ensures that all the data copied from the bind mount and all configurations set during entrypoint will persist when the customer starts the delivered Docker image. To commit the image execute the following command:

```bash
docker commit <container-id> nextcentury/lorelei:latest
```
A new `nextcentury/lorelei:latest` image will be created. This example is using `nextcentury/lorelei:latest` for the name of the Docker image. This value should be updated per your requirements. You can test this image by starting it with the following command:

```bash
docker run -d -p 2222:22 -p 8080:8080 -p 8888:8888 -p 9200:9200 --name lorelei nextcenturylorelei:latest
```

## Known Issues

#### Build Issues

The Lorelei Docker build has a few known issues that for the most part usually due to network latency. This build will take an average of **15 minutes**. If at any time the build fails during execution, just restart the build by calling the `./build.sh` script and Docker will resume at the point of the last failure. It is not necessary to remove the image and rebuild from scratch. 

Below are some example issues that you may see during the build that can be resolved by re-running the build.sh script.

```bash
E: Failed to fetch http://archive.ubuntu.com/ubuntu/pool/main/l/llvm-toolchain-6.0/libllvm6.0_6.0-1ubuntu2_amd64.deb  Hash Sum mismatch
   Hashes of expected file:
    - SHA256:62608aa70d922c8502d72d3f11a5c9d66f4bb680695cf9c7d6ff9acf9632a8a5
    - SHA1:4aa4e931221c16bd119cb613ebbf0a0308cf95b7 [weak]
    - MD5Sum:b102f58543ec09cef3cea3c888a812f1 [weak]
    - Filesize:14540872 [weak]
   Hashes of received file:
    - SHA256:5ade8380f73eb76937d75341935de44fa1890cbcab1768f3218170f5169c920c
    - SHA1:cefb423658548020d3fb691f5409a5fe8328fd77 [weak]
    - MD5Sum:85cf78000944fb1740f2c1e66cd89fb9 [weak]
    - Filesize:14540872 [weak]
   Last modification reported: Fri, 06 Apr 2018 18:56:11 +0000
E: Aborting install.
```

```bash
Cloning into 'Lorelei-demo'...
error: RPC failed; curl 56 GnuTLS recv error (-24): Decryption has failed.
fatal: The remote end hung up unexpectedly
fatal: early EOF
fatal: index-pack failed
```

```bash
Cloning into 'thor_data'...
error: RPC failed; curl 56 GnuTLS recv error (-24): Decryption has failed.
fatal: The remote end hung up unexpectedly
fatal: early EOF
fatal: unpack-objects failed
```

```bash
Exception in thread "main" javax.net.ssl.SSLException: Connection has been shutdown: javax.net.ssl.SSLException: Tag mismatch!
  at sun.security.ssl.SSLSocketImpl.checkEOF(SSLSocketImpl.java:1551)
  at sun.security.ssl.AppInputStream.available(AppInputStream.java:60)
  at java.io.BufferedInputStream.available(BufferedInputStream.java:410)
  at sun.net.www.MeteredStream.available(MeteredStream.java:170)
  at sun.net.www.http.KeepAliveStream.close(KeepAliveStream.java:85)
  at java.io.FilterInputStream.close(FilterInputStream.java:181)
  at sun.net.www.protocol.http.HttpURLConnection$HttpInputStream.close(HttpURLConnection.java:3466)
  at org.gradle.wrapper.Download.downloadInternal(Download.java:77)
  at org.gradle.wrapper.Download.download(Download.java:44)
  at org.gradle.wrapper.Install$1.call(Install.java:61)
  at org.gradle.wrapper.Install$1.call(Install.java:48)
  at org.gradle.wrapper.ExclusiveFileAccessManager.access(ExclusiveFileAccessManager.java:65)
  at org.gradle.wrapper.Install.createDist(Install.java:48)
  at org.gradle.wrapper.WrapperExecutor.execute(WrapperExecutor.java:128)
  at org.gradle.wrapper.GradleWrapperMain.main(GradleWrapperMain.java:61)
```

#### SSHD Issues

##### Remote Host ID has changed
If you are having issues when ssh-ing into your docker container via `ssh root@localhost -p2222` and you see a similar message:

```bash
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@    WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED!     @
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
IT IS POSSIBLE THAT SOMEONE IS DOING SOMETHING NASTY!
Someone could be eavesdropping on you right now (man-in-the-middle attack)!
It is also possible that a host key has just been changed.
The fingerprint for the ECDSA key sent by the remote host is
SHA256:FlXWQmr0m7uIebmCD3dVyCInl/zW3MpBGeDArzX5gMs.
Please contact your system administrator.
Add correct host key in /home/HQ/psharkey/.ssh/known_hosts to get rid of this message.
Offending ECDSA key in /home/HQ/psharkey/.ssh/known_hosts:1
  remove with:
  ssh-keygen -f "/home/HQ/psharkey/.ssh/known_hosts" -R "[localhost]:2222"
ECDSA host key for [localhost]:2222 has changed and you have requested strict checking.
Host key verification failed.
```

fix this issue by removing your `~/.ssh/known_hosts` file. 

## Useful Docker Commands
```bash
docker images # list all images

docker rmi <image-id> # remove images

docker rmi $(docker images -a -q) # delete all images 

docker ps -a # list running containers

docker ps -l -q # get ID of last run container
 
docker stop <container-id> # stop docker container

docker start <container-id> # start docker container

docker rm <container-id> # delete docker container

docker rm -f <container-id> # force delete container without stopping

docker rm $(sudo docker ps -a -q) # delete all stopped containers

docker exec -i -t container-id /bin/bash # open Container Bash Shell
```
