#!/bin/sh
#
set -e
npm run build-prod
docker build -t neon/ui:latest .
