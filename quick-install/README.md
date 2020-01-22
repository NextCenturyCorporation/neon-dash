# Neon Quick Installer

## Running the Quick Installer

- Download here: https://portal.nextcentury.com/owncloud/index.php/s/yiSDvbHQKFyQHCH

- Install docker for your platform: https://docs.docker.com/v17.09/engine/installation/. If you 
  are installing docker on windows you will be asked to choose the type of containers to use 
  (windows vs Linux containers). Please choose Linux containers.

- For neon docker containers to run properly on Windows, volume mounting should be enabled in docker
  settings. To do this, right click on the docker icon in the windows system tray located at the bottom 
  right section of the taskbar. Select settings from the popup menu. A settings window opens with menu 
  items showing on the left side of the window.  Select "shared drives" from the menu and choose the 
  drive you want to share and then click on the "Apply" button. If prompted to enter you local admin 
  credential, please do so.

- Use the bash scripts on unix based systems and the batch files on windows
    - start.sh/start.bat: installs the docker images required by neon and starts the neon container
    - install.sh/install.bat: just installs the docker images without starting the container
    - stop.sh/stop.bat: stops an already running neon container

- Open your browser at http://localhost:4199

## Rebuilding the Quick Installer

1. Please make sure that the latest neon-server docker image (neon-api.tar.gz) is copied to the quick-install 
   folder. This file is an archive of the neon-server image pulled from docker. Consult the neon-server 
   documentation on how to create a docker image for neon-server. After creating this docker image, use the 
   following command to save the image as a zip archive and copy the zip archive to the quick-install folder.
       
           docker save com.ncc.neon/server:latest | gzip > neon-api.tar.gz

2. Make sure that the dist folder under the neon-dashboard is upto date by running the neon-dahsboard build
        
           npm run build-prod

3. Run create-installer.sh

4. Upload neon.zip to a file server and update the download link in this README

