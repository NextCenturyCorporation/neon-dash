#!/bin/bash

# If you have an @ symbol in your CREDS password you will need to escape it by replacing it with %40
sudo docker build \
	--build-arg CREDS=psharkey:Sh%40rkGit846 \
	--build-arg NEON_REPO=https://gitlab.nextcentury.com/LORELEI.THOR/neon.git \
        --build-arg NEON_BRANCH=master \
	--build-arg LORELEI_REPO=https://gitlab.nextcentury.com/LORELEI.THOR/Lorelei-demo.git \
	--build-arg LORELEI_BRANCH=feature/docker-build \
        --build-arg LORELEI_CONFIG=config.darpa-July2018.json \
	--squash \
	-t lorelei .
