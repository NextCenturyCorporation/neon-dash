#!/bin/bash
# A script to run build commands on custom arguements

BUILD=${1:-dash}

# Done for all builds
rm -f target/*.war && mkdir -p target
ng build --deployUrl=/${BUILD}/ --base-href /${BUILD}/ --aot
cd dist && zip -r ${BUILD}.war * && cd .. && mv dist/${BUILD}.war target/${BUILD}.war
