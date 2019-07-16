#!/bin/sh
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

$DIR/lint_ts.sh
$DIR/lint_sass.sh
$DIR/lint_html.sh