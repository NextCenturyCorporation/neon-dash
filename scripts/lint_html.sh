#!/bin/sh

for FILE in `find src/app/ -name '*.html' | sort`; do 
  npx js-beautify -f $FILE --replace --type html --config .jsbeautifyrc;
done