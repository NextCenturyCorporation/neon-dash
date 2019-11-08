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