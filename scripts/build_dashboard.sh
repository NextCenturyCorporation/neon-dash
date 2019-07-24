#!/bin/bash
# A script to run build commands on custom arguements and update build metadata

# Done for all builds
rm -f target/*.war && mkdir -p target
if [ -z ${1} ]; then
    ng build --aot
else
    ng build --deployUrl=/${1}/ --base-href /${1}/ --aot
    cd dist && zip -r ${1}.war * && cd .. && mv dist/${1}.war target/${1}.war
fi
