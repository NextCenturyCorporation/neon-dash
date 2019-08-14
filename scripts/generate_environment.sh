#!/bin/bash

cp src/environments/environment_config.ts src/environments/environment.prod.ts

BUILD_DATE=$(date +"%B %d, %Y at %H:%M")
BUILD_DATE_STRING="buildDate: '${BUILD_DATE}',"
RECENT_GIT=$(git log --format="%H" -n 1)
RECENT_GIT_STRING="recentGit: '${RECENT_GIT}',"

npx replace-in-file /buildDate.*/ "${BUILD_DATE_STRING}" src/environments/environment.prod.ts --isRegex
npx replace-in-file /recentGit.*/ "${RECENT_GIT_STRING}" src/environments/environment.prod.ts --isRegex

