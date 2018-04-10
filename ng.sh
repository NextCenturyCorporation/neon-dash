#!/bin/bash
# This script runs the 'ng' tool with a memory limit of 4G
# There are issues with AOT/production builds and running out of memory
# See https://github.com/angular/angular-cli/issues/5618 for more details

node --max_old_space_size=4096 node_modules/@angular/cli/bin/ng "$@"