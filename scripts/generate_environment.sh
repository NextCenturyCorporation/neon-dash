#!/bin/bash

# Creation of environment files
if [[ ! -e src/environments/environment.ts || ! -e src/environments/environment.prod.ts ]] ; then
  cp src/environments/environment_config.ts src/environments/environment.ts
  cp src/environments/environment_config.ts src/environments/environment.prod.ts
fi
DATE=$(date +"%b-%d,%Y--%H:%M%P")
BUILD_DATE="buildDate:'${DATE}',"
RECENT_GIT=$(git log --format="%H" -n 1)
RECENT_GIT_STRING="recentGit:'${RECENT_GIT}'"

# Replacing stubs of Environment variables
# Development Environment:
npx replace-in-file /buildDate.*/ ${BUILD_DATE} src/environments/environment.ts --isRegex
npx replace-in-file /recentGit.*/ ${RECENT_GIT_STRING} src/environments/environment.ts --isRegex
# Production Environemnt:
npx replace-in-file /production.*/ production:true, src/environments/environment.prod.ts --isRegex
npx replace-in-file /buildDate.*/ ${BUILD_DATE} src/environments/environment.prod.ts --isRegex
npx replace-in-file /recentGit.*/ ${RECENT_GIT_STRING} src/environments/environment.prod.ts --isRegex
