#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
SOURCE=$1
NAME=`basename $SOURCE`
TESTS=`cat $SOURCE |\
  perl -pe 's/await driver\b.(get|setRect|close|executeScript[(]"window.scrollTo).*$//g' |\
  tr '\n' '~' |\
  tr '"' '%' |\
  perl -pe 's|.*?\bit|it|' | perl -pe 's|\}\)~*$||'`

cat $DIR/e2e-spec.template.ts |\
  perl -pe "s|/[*]TESTS[*]/|$TESTS|" |\
  perl -pe "s|/[*]NAME[*]/|$NAME|" |\
  perl -pe 's|(\s*~)+|~|g' |\
  tr '~' '\n' |\
  tr '%' '`' |\
  perl -pe 's|\bdriver\b|browser|g' |\
  perl -pe 's|browser[.]findElement[(]By.css[(]("[^"]+")[)][)]|\$($1)|g' |\
  tr '`' "'"
