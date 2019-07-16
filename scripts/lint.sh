#!/bin/sh
BASEDIR=$(dirname "$0")

$BASEDIR/lint_ts.sh
$BASEDIR/lint_sass.sh
$BASEDIR/lint_html.sh