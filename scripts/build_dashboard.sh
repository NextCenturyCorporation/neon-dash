#!/bin/bash
# A script to run build commands on custom arguements and update build metadata

# Done for all builds
BUILD=${1:-dash}
rm -f target/*.war && mkdir -p target
ng build --aot --deployUrl=/${BUILD}/ --base-href /${BUILD}/ -c custom
cd dist && zip -r ${BUILD}.war * && cd .. && mv dist/${BUILD}.war target/${BUILD}.war
