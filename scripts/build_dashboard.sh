#!/bin/bash
# A script to run build commands on custom arguements and update build metadata
DATE=$(date +"%b-%d,%Y--%H:%M%P")
BUILD_DATE="buildDate:'${DATE}',"
RECENT_GIT=$(git log --format="%H" -n 1)
RECENT_GIT_STRING="recentGit:'${RECENT_GIT}'"
npx replace-in-file /buildDate.*/ ${BUILD_DATE} src/environments/environment.ts,src/environments/environment.prod.ts --isRegex
npx replace-in-file /recentGit.*/ ${RECENT_GIT_STRING} src/environments/environment.ts,src/environments/environment.prod.ts --isRegex
BUILD=${1:-dash}

# Done for all builds
rm -f target/*.war && mkdir -p target
ng build --deployUrl=/${BUILD}/ --base-href /${BUILD}/ --aot
cd dist && zip -r ${BUILD}.war * && cd .. && mv dist/${BUILD}.war target/${BUILD}.war
