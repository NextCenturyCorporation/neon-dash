#!/bin/bash

BUILD_DATE=$(date +"%B %d, %Y at %H:%M")
GIT_HASH=$(git log --format="%H" -n 1)

# Replacing stubs of Environment variables
for FILE in src/environments/*.prod.ts; do
  npx replace-in-file /[{]build-date[}]/ "${BUILD_DATE}" $FILE --isRegex
  npx replace-in-file /[{]git-hash[}] "${GIT_HASH}" $FILE --isRegex
done