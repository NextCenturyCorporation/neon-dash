#!/bin/sh
BASEDIR=$(dirname "$0")

EXIT_STATUS=0
$BASEDIR/lint_ts.sh || EXIT_STATUS=$?
$BASEDIR/lint_sass.sh || EXIT_STATUS=$?
$BASEDIR/lint_html.sh || EXIT_STATUS=$?

exit $EXIT_STATUS
