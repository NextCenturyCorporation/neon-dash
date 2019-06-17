#!/bin/bash
# A script to run build commands on custom arguements

BUILD=$1

# Done for all builds
rm -f target/*.war && mkdir -p target
ng build --deployUrl=/${BUILD}/  --base-href /${BUILD}/
cd dist && zip -r ${BUILD}.war * && cd .. && mv dist/${BUILD}.war target/${BUILD}.war