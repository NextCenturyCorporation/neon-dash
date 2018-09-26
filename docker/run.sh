#!/bin/bash

sudo docker run -d --env-file ./run.env -p 2222:22 -p 8888:8080 -p 9999:9200 lorelei
