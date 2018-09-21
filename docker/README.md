# Build Docker Image
sudo docker build -t lorelei .

# List All Images
sudo docker images

# Remove Images
sudo docker rmi <image_id>

# Delete All Images 
sudo docker rmi $(sudo docker images -q)

# Prune All Dangling Images
sudo docker image prune

# Start Docker Container
sudo docker run -d -p 2222:22 lorelei

# List Running Containers
sudo docker ps -a

# Stop Docker Container
sudo docker stop <container_id>

# Kill All Running Containers
sudo docker kill $(sudo docker ps -q)

# Delete All Stopped Containers
sudo docker rm $(sudo docker ps -a -q)

# Open Container Bash Shell
sudo docker exec -i -t <container_id> /bin/bash
