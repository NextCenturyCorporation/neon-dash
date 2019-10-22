- install docker for your platform: https://docs.docker.com/v17.09/engine/installation/
- use the bash scripts on unix based systems and the batch files on windows
    - start.sh/start.bat: installs the docker images required by neon and starts the neon container
    - install.sh/install.bat: just installs the docker images without starting the container
    - stop.sh/stop.bat: stops an already running neon container
- open your browser at http://localhost:4199
- IMPORTANT: on windows systems, you might be prompted to allow docker to mount valumes on your local drive.
  This happens because the docker container needs to mount the valumes in order to access files within the neon folder.
  please allow the mounting otherwise some of the docker services will not start successfully.