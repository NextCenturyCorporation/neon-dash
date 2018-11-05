#!/bin/bash

if [ ! -f NOTICE.md ]; then
    echo "NOTICE.md File not found! Please run npm run generate-attribution"
    exit 1
else
    result=$(git diff --name-only | grep NOTICE.md | wc -l)
    if [ $result -gt 0 ]; then
        echo "NOTICE.md needs to be staged for commit"
        exit 1
    fi
fi
